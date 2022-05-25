const {
  dbV3,
  isPGSQL,
  isSQLITE,
  isMYSQL,
  dbV4,
} = require("../config/database");
const { omit } = require("lodash");
const { migrate } = require("./helpers/migrate");
const { singular } = require("pluralize");
const { migrateUids } = require("./helpers/migrateValues");
const { migrateItem } = require("./helpers/migrateFields");
const pluralize = require("pluralize");
const { snakeCase } = require("lodash/fp");

var relations = [];
const skipAttributes = ["created_by", "updated_by"];

function addRelation(
  componentName,
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
    componentName,
  });
}

function processRelation(key, value, collectionName, componentName) {
  if (value.model) {
    addRelation(
      componentName,
      collectionName,
      key,
      "oneToOne",
      value.model,
      value.via
    );
  } else if (value.collection) {
    if (value.column) {
      addRelation(
        collectionName,
        collectionName,
        key,
        "manyToMany", // not true but in linking table
        value.collection,
        value.attribute
      );
    } else {
      addRelation(
        collectionName,
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
      [makeRelationModelId(relation.componentName)]: id,
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

  console.log(tables);

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

const processedTables = [];
async function migrateTables() {
  console.log("Migrating components");

  const modelsDefs = await dbV3("core_store").where(
    "key",
    "like",
    "model_def_%"
  );

  const componentsToMigrate = modelsDefs
    .filter((item) => {
      if (item.key.includes("::")) {
        return false;
      }

      const jsonData = JSON.parse(item.value);

      return !jsonData.kind;
    })
    .map((item) => {
      const data = JSON.parse(item.value);

      return data.collectionName;
    });

  let componentRelationsTables = [];

  if (isPGSQL) {
    componentRelationsTables = (
      await dbV3("information_schema.tables")
        .select("table_name")
        .where("table_schema", "public")
        .where("table_name", "like", "%_components")
    )
      .map((row) => row.table_name)
      .filter((item) => !componentsToMigrate.includes(item));
  }

  if (isSQLITE) {
    componentRelationsTables = (
      await dbV3("sqlite_master")
        .select("name")
        .where("name", "like", "%_components")
    )
      .map((row) => row.name)
      .filter((item) => !componentsToMigrate.includes(item));
  }

  if (isMYSQL) {
    componentRelationsTables = (
      await dbV3("information_schema.tables")
        .select("table_name")
        .where("table_name", "like", "%_components")
    )
      .map((row) => row.table_name)
      .filter((item) => !componentsToMigrate.includes(item));
  }

  for (const table of componentsToMigrate) {
    const componentDefinition = modelsDefs.find(
      (item) => JSON.parse(item.value).collectionName === table
    );

    const componentDefinitionObject = JSON.parse(componentDefinition.value);

    const compUid = componentDefinitionObject.uid.split(".");

    const compName = snakeCase(compUid[compUid.length - 1]);

    // console.log();

    const omitAttributes = [];
    for (const [key, value] of Object.entries(
      componentDefinitionObject.attributes
    )) {
      if (skipAttributes.includes(key)) {
        continue;
      }
      if (value.model || value.collection) {
        processRelation(
          key,
          value,
          componentDefinitionObject.collectionName,
          compName
        );
        omitAttributes.push(key);
      }
    }

    await migrate(table, table, (data) => {
      const omitedData = omit(data, omitAttributes);

      return migrateItem(omitedData);
    });
    processedTables.push(table);
  }

  await migrateRelations(componentsToMigrate);

  const componentsMap = modelsDefs
    .map((item) => JSON.parse(item.value))
    .reduce(
      (acc, item) => ({
        ...acc,
        [item.collectionName]: migrateUids(item.uid),
      }),
      {}
    );

  for (const table of componentRelationsTables) {
    const tableName = table.replace(/_components$/, "");

    const tableIdColumn = singular(tableName);

    await migrate(table, table, (item) => {
      const itemNew = {
        ...item,
        entity_id: item[`${tableIdColumn}_id`],
        component_type:
          componentsMap[item.component_type] ?? item.component_type,
      };

      return omit(itemNew, [`${tableIdColumn}_id`]);
    });
    processedTables.push(table);
  }
}

const migrateComponents = {
  processedTables,
  migrateTables,
};
module.exports = {
  migrateComponents,
};
