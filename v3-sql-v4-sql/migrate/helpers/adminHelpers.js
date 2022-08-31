const {
  dbV3,
  dbV4,
  isPGSQL,
  isSQLITE,
  isMYSQL,
} = require("../../config/database");
const { BATCH_SIZE, SUPER_ADMIN } = require("./constants");
const { resetTableSequence } = require("./migrate");
const { migrateItems } = require("./migrateFields");
const { migrateUids } = require("./migrateValues");
const pluralize = require("pluralize");
const { camelCase } = require("lodash");

const extraV4Permissions = [
  { action: "admin::api-tokens.create", properties: {}, conditions: [] },
  { action: "admin::api-tokens.delete", properties: {}, conditions: [] },
  { action: "admin::api-tokens.read", properties: {}, conditions: [] },
  { action: "admin::api-tokens.update", properties: {}, conditions: [] },
];

function migrateSubject(subject) {
  if (subject) {
    return subject
      .split(".")
      .map((s) => migrateUids(pluralize(s, 1)))
      .join(".");
  }
  return subject;
}

function migrateProperties(properties) {
  if (properties && properties.fields) {
    properties.fields = properties.fields.map((p) => camelCase(p));
    return properties;
  }
  return properties;
}

async function migrateAdminPermissions() {
  const source = "strapi_permission";
  const destination = "admin_permissions";
  const destinationLinks = "admin_permissions_role_links";
  const count =
    (await dbV3(source).count().first()).count ||
    (await dbV3(source).count().first())["count(*)"];
  console.log(`Migrating ${count} items from ${source} to ${destination}`);
  await dbV4(destinationLinks).del();
  await dbV4(destination).del();
  for (var page = 0; page * BATCH_SIZE < count; page++) {
    console.log(`${source} batch #${page + 1}`);
    const items = await dbV3(source)
      .limit(BATCH_SIZE)
      .offset(page * BATCH_SIZE);
    const migratedItems = migrateItems(items, ({ role, ...item }) => ({
      ...item,
      action: migrateUids(item.action),
      subject: migrateSubject(item.subject),
      properties: migrateProperties(item.properties),
      conditions: item.conditions,
    }));
    const roleLinks = items.map((item) => ({
      permission_id: item.id,
      role_id: item.role,
    }));
    await dbV4(destination).insert(migratedItems);
    await dbV4(destinationLinks).insert(roleLinks);
  }
  await resetTableSequence(destination);

  let ids = [];

  if (isPGSQL) {
    ids = await dbV4(destination).insert(extraV4Permissions).returning("id");
  }

  if (isSQLITE) {
    ids = await dbV4(destination).insert(
      extraV4Permissions.map((item) => ({
        ...item,
        properties: JSON.stringify(item.properties),
        conditions: JSON.stringify(item.conditions),
      }))
    );
  }

  if (isMYSQL) {
    ids = await dbV4(destination).insert(
      extraV4Permissions.map((item) => ({
        ...item,
        properties: JSON.stringify(item.properties),
        conditions: JSON.stringify(item.conditions),
      }))
    );
  }

  await dbV4(destinationLinks).insert(
    ids.map((id) => ({ permission_id: id.id, role_id: SUPER_ADMIN }))
  );
}

module.exports = {
  migrateAdminPermissions,
};
