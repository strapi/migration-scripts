const { dbV3, isPGSQL, isSQLITE, isMYSQL, dbV4 } = require('../config/database');
const { omit } = require('lodash');
const { migrate } = require('./helpers/migrate');
const { singular } = require('pluralize');
const { migrateUids } = require('./helpers/migrateValues');
const { migrateItem } = require('./helpers/migrateFields');

const { processRelation, migrateRelations } = require('./helpers/relationHelpers');
const { resolveSourceTableName } = require('./helpers/tableNameHelpers');

var relations = [];
const skipAttributes = ['created_by', 'updated_by'];

const processedTables = [];
async function migrateTables(tables) {
  console.log('Migrating components');

  const modelsDefs = await dbV3(resolveSourceTableName('core_store')).where(
    'key',
    'like',
    'model_def_%'
  );

  const componentsToMigrate = modelsDefs
    .filter((item) => {
      if (item.key.includes('::')) {
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
      await dbV3('information_schema.tables')
        .select('table_name')
        .where('table_schema', process.env.DATABASE_V3_SCHEMA)
        .where('table_name', 'like', '%_components')
    )
      .map((row) => row.table_name)
      .filter((item) => !componentsToMigrate.includes(item));
  }

  if (isSQLITE) {
    componentRelationsTables = (
      await dbV3('sqlite_master').select('name').where('name', 'like', '%_components')
    )
      .map((row) => row.name)
      .filter((item) => !componentsToMigrate.includes(item));
  }

  if (isMYSQL) {
    componentRelationsTables = (
      await dbV3('information_schema.tables')
        .select('table_name')
        .where('table_name', 'like', '%_components')
    )
      .map((row) => row.table_name || row.TABLE_NAME)
      .filter((item) => !componentsToMigrate.includes(item));
  }

  for (const table of componentsToMigrate) {
    const componentDefinition = modelsDefs.find(
      (item) => JSON.parse(item.value).collectionName === table
    );

    const componentDefinitionObject = JSON.parse(componentDefinition.value);

    const omitAttributes = [];
    for (const [key, value] of Object.entries(componentDefinitionObject.attributes)) {
      if (skipAttributes.includes(key)) {
        continue;
      }
      if (value.model || value.collection) {
        processRelation(
          {
            key,
            value,
            collectionName: componentDefinitionObject.collectionName,
            uid: componentDefinitionObject.uid,
            isComponent: true
          },
          relations
        );
        omitAttributes.push(key);
      }
    }

    await migrate(table, table.toLowerCase(), (data) => {
      const omitedData = omit(data, omitAttributes);

      return migrateItem(omitedData);
    });
    processedTables.push(table);
  }

  await migrateRelations([...componentsToMigrate, ...tables], relations);

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
    const tableName = table.replace(/_components$/, '');

    const tableIdColumn = singular(tableName);

    await migrate(table, table.toLowerCase(), (item) => {
      const itemNew = {
        ...item,
        entity_id: item[`${tableIdColumn}_id`],
        component_type: componentsMap[item.component_type] ?? item.component_type,
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
