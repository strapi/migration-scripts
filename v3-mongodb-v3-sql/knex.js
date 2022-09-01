const knex = require('knex');

let knexConnection;

if (process.env.SQL_CLIENT === 'postgres') {
  knexConnection = {
    client: 'postgres',
    connection: {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
      schema: process.env.DATABASE_SCHEMA,
    },
  };
} else if (process.env.SQL_CLIENT === 'mysql') {
  knexConnection = {
    client: 'mysql',
    connection: {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,
    },
  };
} else if (process.env.SQL_CLIENT === 'sqlite3') {
  knexConnection = {
    client: process.env.SQL_CLIENT,
    connection: {
      filename: process.env.SQL_FILENAME,
    },
    useNullAsDefault: true,
  };
} else {
  throw new Error(
    "SQL_CLIENT environment variable is not set or is invalid. Valid values are 'postgres', 'mysql', and 'sqlite3'"
  );
}

const connection = knex(knexConnection);

module.exports = connection;
