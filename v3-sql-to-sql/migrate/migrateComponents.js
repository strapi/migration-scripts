const { dbV3, isPGSQL, isSQLITE, isMYSQL } = require("../config/database");
const { omit } = require("lodash");
const { migrate } = require("./helpers/migrate");
const { singular } = require("pluralize");
const { migrateUids } = require("./helpers/migrateValues");

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
    await migrate(table, table);
    processedTables.push(table);
  }

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
