const knex = require("knex");

let additionalConfigV3 = {};
let additionalConfigV4 = {};

if (process.env.DATABASE_CLIENT === "sqlite") {
  additionalConfigV3 = {
    useNullAsDefault: true,
    connection: {
      filename: process.env.DATABASE_V3_PATH,
    },
  };

  additionalConfigV4 = {
    useNullAsDefault: true,
    connection: {
      filename: process.env.DATABASE_V4_PATH,
    },
  };
}

if (process.env.DATABASE_CLIENT === "pg") {
  additionalConfigV3 = {
    connection: {
      host: process.env.DATABASE_V3_HOST,
      port: process.env.DATABASE_V3_PORT,
      user: process.env.DATABASE_V3_USER,
      password: process.env.DATABASE_V3_PASSWORD,
      database: process.env.DATABASE_V3_DATABASE,
      schema: process.env.DATABASE_V3_SCHEMA
    },
  };

  additionalConfigV4 = {
    useNullAsDefault: true,
    connection: {
      host: process.env.DATABASE_V4_HOST,
      port: process.env.DATABASE_V4_PORT,
      user: process.env.DATABASE_V4_USER,
      password: process.env.DATABASE_V4_PASSWORD,
      database: process.env.DATABASE_V4_DATABASE,
      schema: process.env.DATABASE_V4_SCHEMA
    },
  };
}

if (process.env.DATABASE_CLIENT === "mysql") {
  additionalConfigV3 = {
    connection: {
      host: process.env.DATABASE_V3_HOST,
      port: process.env.DATABASE_V3_PORT,
      user: process.env.DATABASE_V3_USER,
      password: process.env.DATABASE_V3_PASSWORD,
      database: process.env.DATABASE_V3_DATABASE
    },
  };

  additionalConfigV4 = {
    useNullAsDefault: true,
    connection: {
      host: process.env.DATABASE_V4_HOST,
      port: process.env.DATABASE_V4_PORT,
      user: process.env.DATABASE_V4_USER,
      password: process.env.DATABASE_V4_PASSWORD,
      database: process.env.DATABASE_V4_DATABASE
    },
  };
}

const dbV3 = knex({
  client: process.env.DATABASE_CLIENT,
  ...additionalConfigV3,
});

const dbV4 = knex({
  client: process.env.DATABASE_CLIENT,
  ...additionalConfigV4,
});

const isPGSQL = dbV3.client.config.client === "pg";
const isSQLITE = dbV3.client.config.client === "sqlite";
const isMYSQL = dbV3.client.config.client === "mysql";

module.exports = {
  dbV3,
  dbV4,
  isPGSQL,
  isSQLITE,
  isMYSQL,
};
