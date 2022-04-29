# Migration script from Strapi v3 on SQL to Strapi v4 on SQL

## Preparation steps

- Preform a backup of your database you wish to migrate and store that backup somewhere secure

## Install

### Requirements

- Nodejs v14/v16
- Yarn

### Installation

```sh
yarn
```

## Configuration

1. Choose which database you are migrating from/to (currently this script only supports migrating to the same database type as the source)
2. Copy the corresponding `.env.DBTYPE.example` file to `.env` using something like `cp .env.pg.example .env`
3. Modify the configuration in the `.env` to match your v3 source and your v4 target databases

## Migration

1. Migrate your Strapi Code before running this script, see the following [documentation](https://docs.strapi.io/developer-docs/latest/update-migration-guides/migration-guides/v4/code-migration.html)
2. Run Strapi v4 in `develop` mode with empty DB to generate the DB structure
3. Turn off / kill the running Strapi v4 server
4. Run migration script using `yarn start`

<!-- ## (Optional) Custom migrations

1. Open customMigrations.js
2. Create your migrations as you want you have to return function migrateTables and array processedTables with processed tables
3. Databases are imported from config/database.js and using knex -->
