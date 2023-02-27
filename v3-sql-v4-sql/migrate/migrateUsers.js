const { dbV3, dbV4 } = require('../config/database');
const { BATCH_SIZE } = require('./helpers/constants');
const { migrate, resetTableSequence } = require('./helpers/migrate');
const { migrateItems, migrateItem } = require('./helpers/migrateFields');
const { resolveDestTableName, resolveSourceTableName } = require('./helpers/tableNameHelpers');
const { migrateUserPermissionAction } = require('./helpers/usersHelpers');
const { processRelation, migrateRelations } = require('./helpers/relationHelpers');
const { omit } = require('lodash');

const processedTables = [
  'users-permissions_role',
  'users-permissions_permission',
  'users-permissions_user',
];

const relations = [];
const skipAttributes = ['created_by', 'updated_by'];

async function migrateUserPermissions() {
  const source = 'users-permissions_permission';
  const destination = 'up_permissions';
  const destinationLinks = 'up_permissions_role_links';

  const sourceSelect = dbV3(resolveSourceTableName(source)).where('enabled', true);
  const count =
    (await sourceSelect.clone().count().first()).count ||
    (await sourceSelect.clone().count().first())['count(*)'];
  const countTotal =
    (await dbV3(resolveSourceTableName(source)).count().first()).count ||
    (await dbV3(resolveSourceTableName(source)).count().first())['count(*)'];

  console.log(`Migrating ${count}/${countTotal} items from ${source} to ${destination}`);
  await dbV4(resolveDestTableName(destinationLinks)).del();
  await dbV4(resolveDestTableName(destination)).del();
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
    await dbV4(resolveDestTableName(destination)).insert(migratedItems);
    await dbV4(resolveDestTableName(destinationLinks)).insert(roleLinks);
  }
  await resetTableSequence(destination);
}

async function migrateUsersData() {
  const source = 'users-permissions_user';
  const destination = 'up_users';
  const destinationLinks = 'up_users_role_links';

  const modelsDefs = await dbV3(resolveSourceTableName('core_store')).where(
    'key',
    'like',
    'model_def_plugins::users-permissions.user'
  );

  const modelDefEntry = modelsDefs[0];
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

  await migrateRelations([source], relations);

  const count =
    (await dbV3(resolveSourceTableName(source)).count().first()).count ||
    (await dbV3(resolveSourceTableName(source)).clone().count().first())['count(*)'];
  console.log(`Migrating ${count} items from ${source} to ${destination}`);
  await dbV4(resolveDestTableName(destinationLinks)).del();
  await dbV4(resolveDestTableName(destination)).del();
  for (var page = 0; page * BATCH_SIZE < count; page++) {
    console.log(`${source} batch #${page + 1}`);
    const items = await dbV3(resolveSourceTableName(source))
      .limit(BATCH_SIZE)
      .offset(page * BATCH_SIZE);
    const migratedItems = migrateItems(items, ({ role, ...item }) =>
      migrateItem(omit(item, omitAttributes))
    );
    const roleLinks = items.map((item) => ({
      user_id: item.id,
      role_id: item.role,
    }));
    await dbV4(resolveDestTableName(destination)).insert(migratedItems);
    await dbV4(resolveDestTableName(destinationLinks)).insert(roleLinks);
  }
  await resetTableSequence(destination);
}

async function migrateTables() {
  if (process.env.DISABLE_UP_MIGRATION === 'true') {
    console.log('UP MIGRATIONS WERE SKIPPED DUE TO DISABLING IT IN CONFIG');
    return false;
  }

  console.log('Migrating Users');
  await migrate('users-permissions_role', 'up_roles');
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
