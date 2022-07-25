require("dotenv").config();

const { migrateTables } = require("./customMigrations/01-category_groups");

async function f() {
  await migrateTables();

  process.exit();
}

f();
