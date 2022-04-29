const knex = require("knex");

const connection = knex({
  client: process.env.SQL_CLIENT,
  connection: {
    filename: process.env.SQL_FILENAME,
  },
  useNullAsDefault: true,
});

module.exports = connection;
