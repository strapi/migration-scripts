const { dbV3, dbV4 } = require("../config/database");
const { BATCH_SIZE } = require("./helpers/constants");
const { migrate, resetTableSequence } = require("./helpers/migrate");
const { migrateItems, migrateItem } = require("./helpers/migrateFields");
const { migrateUserPermissionAction } = require("./helpers/usersHelpers");

const processedTables = [
  "users-permissions_role",
  "users-permissions_permission",
  "users-permissions_user",
];

async function migrateUserPermissions() {
  const source = "users-permissions_permission";
  const destination = "up_permissions";
  const destinationLinks = "up_permissions_role_links";

  const sourceSelect = dbV3(source).where("enabled", true);
  const count =
    (await sourceSelect.clone().count().first()).count ||
    (await sourceSelect.clone().count().first())["count(*)"];
  const countTotal =
    (await dbV3(source).count().first()).count ||
    (await dbV3(source).count().first())["count(*)"];

  console.log(
    `Migrating ${count}/${countTotal} items from ${source} to ${destination}`
  );
  await dbV4(destinationLinks).del();
  await dbV4(destination).del();
  for (var page = 0; page * BATCH_SIZE < count; page++) {
    console.log(`${source} batch #${page + 1}`);
    const items = await sourceSelect
      .clone()
      .limit(BATCH_SIZE)
      .offset(page * BATCH_SIZE);

    const migratedItems = migrateItems(
      items,
      ({ type, controller, action, enabled, policy, role, ...item }) => ({
        ...migrateItem(item),
        action: migrateUserPermissionAction(type, controller, action),
      })
    );
    const roleLinks = items.map((item) => ({
      permission_id: item.id,
      role_id: item.role,
    }));
    await dbV4(destination).insert(migratedItems);
    await dbV4(destinationLinks).insert(roleLinks);
  }
  await resetTableSequence(destination);
}

async function migrateUsersData() {
  const source = "users-permissions_user";
  const destination = "users-permissions_user";
  const destinationLinks = "users_permissions_user_role_links";

  const count =
    (await dbV3(source).count().first()).count ||
    (await dbV3(source).clone().count().first())["count(*)"];
  console.log(`Migrating ${count} items from ${source} to ${destination}`);
  await dbV4(destinationLinks).del();
  await dbV4(destination).del();
  for (var page = 0; page * BATCH_SIZE < count; page++) {
    console.log(`${source} batch #${page + 1}`);
    const items = await dbV3(source)
      .limit(BATCH_SIZE)
      .offset(page * BATCH_SIZE);
    const migratedItems = migrateItems(items, ({ role, ...item }) =>
      migrateItem(item)
    );
    const roleLinks = items.map((item) => ({
      user_id: item.id,
      role_id: item.role,
    }));
    await dbV4(destination).insert(migratedItems);
    await dbV4(destinationLinks).insert(roleLinks);
  }
  await resetTableSequence(destination);
}

async function migrateTables() {
  console.log("Migrating Users");
  await migrate("users-permissions_role", "up_roles");
  await migrateUserPermissions();
  await migrateUsersData();
}

const migrateUsers = {
  processedTables,
  migrateTables,
};

module.exports = {
  migrateUsers,
};
