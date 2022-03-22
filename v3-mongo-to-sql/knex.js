const knex = require("knex");

const connection = knex({
  client: "sqlite3",
  connection: {
    filename: "./data.db",
  },
  useNullAsDefault: true,
});

module.exports = connection;
