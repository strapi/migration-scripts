const { migrateAdminPermissions } = require("./helpers/adminHelpers");
const { migrate } = require("./helpers/migrate");

const processedTables = [
  "strapi_role",
  "strapi_administrator",
  "strapi_users_roles",
  "strapi_permission",
];

async function migrateTables() {
  console.log("Migrating Admin");
  await migrate("strapi_role", "admin_roles");
  await migrate("strapi_administrator", "admin_users");
  await migrate("strapi_users_roles", "admin_users_roles_links", (role) => ({
    role_id: role.role_id,
    user_id: role.user_id,
  }));
  await migrateAdminPermissions();
}

const migrateAdmin = {
  processedTables,
  migrateTables,
};

module.exports = {
  migrateAdmin,
};
