const { mapKeys, camelCase, omit } = require("lodash");
const { dbV3, dbV4, isSQLITE } = require("../config/database");
const { BATCH_SIZE } = require("./helpers/constants");
const { apiTokenEntry } = require("./helpers/coreStoreHelpers");
const { resetTableSequence } = require("./helpers/migrate");
const { migrateItems } = require("./helpers/migrateFields");
const { migrateUids, migrateItemValues } = require("./helpers/migrateValues");

const source = "core_store";
const destination = "strapi_core_store_settings";

const processedTables = [source];

async function migrateTables() {
  console.log("Migrating Core Store", "TBA");
  const sourceSelect = dbV3(source).whereNot("key", "like", "model_def%");
  const count =
    (await sourceSelect.clone().count().first()).count ||
    (await sourceSelect.clone().count().first())["count(*)"];

  const countTotal =
    (await dbV3(source).count().first()).count ||
    (await dbV3(source).count().first())["count(*)"];
  console.log(
    `Migrating ${count}/${countTotal} items from ${source} to ${destination}`
  );

  const { id: _id1, ...apiTokenEntry } = await dbV4(destination)
    .where(
      "key",
      "plugin_content_manager_configuration_content_types::admin::api-token"
    )
    .first();

  const { id: _id2, ...strapiContentTypesSchema } = await dbV4(destination)
    .where("key", "strapi_content_types_schema")
    .first();
  await dbV4(destination).del();
  for (var page = 0; page * BATCH_SIZE < count; page++) {
    console.log(`${source} batch #${page + 1}`);
    const items = await sourceSelect
      .clone()
      .limit(BATCH_SIZE)
      .offset(page * BATCH_SIZE);
    const migratedItems = migrateItems(items, (item) => {
      const replacedValue = item.value
        .replace(/"defaultSortBy":"type"/g, `"defaultSortBy":"action"`)
        .replace(/"mainField":"type"/g, `"mainField":"action"`);
      const value = migrateItemValues(JSON.parse(replacedValue));

      if (value.layouts) {
        value.layouts.list = value.layouts.list.map((item) => camelCase(item));
        value.layouts.edit = value.layouts.edit.map((row) =>
          row.map((column) => ({ ...column, name: camelCase(column.name) }))
        );
      }

      const valueToSave = value.metadatas
        ? {
            ...value,
            metadatas: mapKeys(
              omit(value.metadatas, [
                "type",
                "controller",
                "policy",
                "enabled",
              ]),
              (_, m) => camelCase(m)
            ),
          }
        : value;

      return {
        key: migrateUids(item.key),
        value: JSON.stringify(valueToSave),
        type: item.type,
        environment: item.environment ? item.environment : null,
        tag: item.tag ? item.tag : null,
      };
    });

    await dbV4(destination).insert(migratedItems);
  }

  await resetTableSequence(destination);
  await dbV4(destination).insert(apiTokenEntry);
  await dbV4(destination).insert(strapiContentTypesSchema);
}

const migrateCoreStore = {
  processedTables,
  migrateTables,
};

module.exports = {
  migrateCoreStore,
};
