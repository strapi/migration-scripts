const { omit, create } = require("lodash");
const {
  dbV3,
  dbV4,
  isPGSQL,
  isSQLITE,
  isMYSQL,
} = require("../config/database");
const { migrate } = require("./helpers/migrate");
const { migrateItem } = require("./helpers/migrateFields");
const pluralize = require("pluralize");
const { snakeCase } = require("lodash/fp");

var relations = [];
const skipAttributes = ["created_by", "updated_by"];

function addRelation(
  model,
  attribute,
  type,
  modelF = undefined,
  attributeF = undefined
) {
  relations.push({
    model,
    attribute,
    type,
    modelF,
    attributeF,
    table: `${model}_${snakeCase(attribute)}_links`,
  });
}

function processRelation(key, value, collectionName) {
  if (value.model) {
    addRelation(collectionName, key, "oneToOne", value.model, value.via);
  } else if (value.collection) {
    if (value.column) {
      addRelation(
        collectionName,
        key,
        "manyToMany", // not true but in linking table
        value.collection,
        value.attribute
      );
    } else {
      addRelation(
        collectionName,
        key,
        "oneToMany",
        value.collection,
        value.via
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
      [makeRelationModelId(relation.model)]: id,
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
    await migrate(sourceTable, relation.table, ({ id, ...item }) =>
      migrateItem(item)
    );
  }
}

async function migrateRelations(tables) {
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
      await dbV3("information_schema.tables").select("table_name")
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

async function migrateModels(tables) {
  console.log("Migrating Models");
  const modelsDefs = await dbV3("core_store").where(
    "key",
    "like",
    "model_def_application::%"
  );

  for (const modelDefEntry of modelsDefs) {
    const modelDef = JSON.parse(modelDefEntry.value);

    const omitAttributes = [];
    for (const [key, value] of Object.entries(modelDef.attributes)) {
      if (skipAttributes.includes(key)) {
        continue;
      }
      if (value.model || value.collection) {
        processRelation(key, value, modelDef.collectionName);
        omitAttributes.push(key);
      }
    }
    await migrate(modelDef.collectionName, modelDef.collectionName, (item) => {
      
      if (modelDef.options.timestamps === false) {
        return migrateItem(item);
      }
      else {
        const timestamps = modelDef.options.timestamps === true ? ["created_at", "updated_at"] : modelDef.options.timestamps;
        const [createdAt, updatedAt] = timestamps;

        const newItem = {
          ...item,
          created_at: item[createdAt],
          updated_at: item[updatedAt],
        };

        return migrateItem(
          omit(newItem, [...omitAttributes, createdAt, updatedAt])
        );
      }
    });
  }

  await migrateRelations(tables);
}

module.exports = {
  migrateModels,
};
