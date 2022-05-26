const { omit } = require("lodash");
const { dbV3 } = require("../config/database");
const { migrate } = require("./helpers/migrate");
const { migrateItem } = require("./helpers/migrateFields");

const {
  processRelation,
  migrateRelations,
} = require("./helpers/relationHelpers");

var relations = [];
const skipAttributes = ["created_by", "updated_by"];

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
    await migrate(modelDef.collectionName, modelDef.collectionName, (item) => {
      if (modelDef.options.timestamps === false) {
        return migrateItem(item);
      } else {
        const timestamps =
          modelDef.options.timestamps === true
            ? ["created_at", "updated_at"]
            : modelDef.options.timestamps;
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
  await migrateRelations(tables, relations);
}

module.exports = {
  migrateModels,
};
