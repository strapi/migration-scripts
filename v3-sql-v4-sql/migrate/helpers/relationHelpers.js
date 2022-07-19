const { snakeCase } = require("lodash/fp");
const {
  dbV3,
  isPGSQL,
  isSQLITE,
  isMYSQL,
  dbV4,
} = require("../../config/database");
const pluralize = require("pluralize");
const { migrate } = require("./migrate");
const { migrateItem } = require("./migrateFields");
const { omit } = require("lodash");

function addRelation(
  { uid, model, attribute, type, modelF = undefined, attributeF = undefined },
  relations
) {
  const entitUid = uid.split(".");

  const entityName = snakeCase(entitUid[entitUid.length - 1]);

  relations.push({
    model,
    attribute,
    type,
    modelF,
    attributeF,
    table: `${model}_${snakeCase(attribute)}_links`,
    entityName,
  });
}

function processRelation({ key, value, collectionName, uid }, relations) {
  if (value.model) {
    addRelation(
      {
        uid,
        model: collectionName,
        attribute: key,
        type: "oneToOne",
        modelF: value.model,
        attributeF: value.via,
      },
      relations
    );
  } else if (value.collection) {
    if (value.column) {
      addRelation(
        {
          uid,
          model: collectionName,
          attribute: key,
          type: "manyToMany",
          modelF: value.collection,
          attributeF: value.attribute,
        },
        relations
      );
    } else {
      addRelation(
        {
          uid,
          model: collectionName,
          attribute: key,
          type: "oneToMany",
          modelF: value.collection,
          attributeF: value.via,
        },
        relations
      );
    }
  }
}

function makeRelationModelId(model) {
  return `${snakeCase(pluralize(model, 1))}_id`;
}

function oneToOneRelationMapper(relation, item) {
  const id = item.id;
  const idF = item[relation.attribute];

  if (id && idF) {
    return {
      [makeRelationModelId(relation.entityName)]: id,
      [makeRelationModelId(relation.modelF)]: idF,
    };
  }
  return undefined;
}

function oneToOneCirvleRelationMapper(relation, item) {
  const id = item.id;
  const invId = item[relation.attribute];
  if (id && invId) {
    return {
      [makeRelationModelId(relation.model)]: id,
      [`inv_${makeRelationModelId(relation.model)}`]: invId,
    };
  }
  return undefined;
}

async function migrateOneToOneRelation(relation) {
  if (pluralize(relation.model, 1) === relation.modelF) {
    await migrate(relation.model, relation.table, (item) =>
      oneToOneCirvleRelationMapper(relation, item)
    );
  } else {
    await migrate(relation.model, relation.table, (item) =>
      oneToOneRelationMapper(relation, item)
    );
  }
}

async function migrateManyToManyRelation(relation, sourceTable) {
  if (pluralize(relation.model, 1) === relation.modelF) {
    await migrate(sourceTable, relation.table, ({ id, ...item }) => ({
      [makeRelationModelId(relation.model)]: item[`${relation.modelF}_id`],
      [`inv_${makeRelationModelId(relation.model)}`]:
        item[`${relation.attributeF}_id`],
    }));
  } else {
    const fromModelRelation = makeRelationModelId(relation.model);
    const fromNameRelation = makeRelationModelId(relation.entityName);

    await migrate(sourceTable, relation.table, ({ id, ...item }) => {
      if (fromModelRelation === fromNameRelation) {
        return migrateItem(item);
      }

      const newRelationObject = {
        ...item,
        [fromNameRelation]: item[fromModelRelation],
      };

      return migrateItem(omit(newRelationObject, [fromModelRelation]));
    });
  }
}

async function migrateRelations(tables, relations) {
  let v4Tables = [];

  if (isPGSQL) {
    v4Tables = (
      await dbV4("information_schema.tables")
        .select("table_name")
        .where("table_schema", "public")
    ).map((row) => row.table_name);
  }

  if (isSQLITE) {
    v4Tables = (await dbV4("sqlite_master").select("name")).map(
      (row) => row.name
    );
  }

  if (isMYSQL) {
    v4Tables = (
      await dbV4("information_schema.tables").select("table_name")
    ).map((row) => row.table_name);
  }

  relations = relations.filter((r) => v4Tables.includes(r.table));

  const v3RelationTables = tables.filter((t) => t.includes("__"));

  for (const relation of relations) {
    if (relation.type === "oneToOne") {
      await migrateOneToOneRelation(relation);
    } else if (relation.type === "manyToMany") {
      var sourceTable = v3RelationTables.find(
        (t) =>
          t === `${relation.model}__${relation.attribute}` ||
          t.startsWith(
            `${relation.model}_${relation.attribute}__${relation.modelF}`
          ) ||
          (t.startsWith(`${relation.modelF}`) &&
            t.endsWith(`__${relation.model}_${relation.attribute}`))
      );

      if (sourceTable) {
        await migrateManyToManyRelation(relation, sourceTable);
      }
    }
  }
}

module.exports = {
  processRelation,
  migrateRelations,
};
