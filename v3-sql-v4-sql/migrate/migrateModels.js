const { omit } = require('lodash');
const { dbV3 } = require('../config/database');
const { migrate } = require('./helpers/migrate');
const { migrateItem } = require('./helpers/migrateFields');

const { processRelation, migrateRelations } = require('./helpers/relationHelpers');
const { resolveSourceTableName } = require('./helpers/tableNameHelpers');

var relations = [];
const skipAttributes = ['created_by', 'updated_by'];

async function migrateModels(tables) {
  console.log('Migrating Models');
  const modelsDefs = await dbV3(resolveSourceTableName('core_store')).where(
    'key',
    'like',
    'model_def_application::%'
  );

  for (const modelDefEntry of modelsDefs) {
    const modelDef = JSON.parse(modelDefEntry.value);

    const omitAttributes = [];
    for (const [key, value] of Object.entries(modelDef.attributes)) {
      if (skipAttributes.includes(key)) {
        continue;
      }
      if (value.model || value.collection) {
        processRelation(
          {
            key,
            value,
            collectionName: modelDef.collectionName,
            uid: modelDef.uid,
          },
          relations
        );
        omitAttributes.push(key);
      }
    }
    await migrate(modelDef.collectionName, modelDef.collectionName.toLowerCase(), (item) => {
      if (modelDef.options.timestamps === false) {
        return migrateItem(item);
      } else {
        // v3-mongo->v3-sql already rename them to these snake case, but kept the customized field, then in v4-sql custom createdAt will be covered.
        const newItem = {
          ...item,
          created_at: item['created_at'],
          updated_at: item['updated_at'],
        };

        return migrateItem(omit(newItem, omitAttributes));
      }
    });
  }
  await migrateRelations(tables, relations);
}

module.exports = {
  migrateModels,
};
