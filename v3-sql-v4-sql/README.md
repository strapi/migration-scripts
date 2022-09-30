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

## (Optional) Custom migrations

**Note:** This is an advanced feature and should only be used if you know what you are doing

**Note 2:** Migration files are read sequentially based on the file name, so if you want to run a migration file after another migration file, you should name it accordingly

1. Create a new file in the `customMigrations` folder
2. Create your migrations as you want you have to return function migrateTables and array processedTables with processed tables
3. Databases are imported from config/database.js and using knex

## Troubleshooting

- If you get an error around setting `session_replication_role` to `replica` you likely do not have the permissions to do so. You will likely need to do the data migration locally. Also please see [this example]() from one of our community members Sintex on doing this with docker.
- It is extremely likely that you will have orphaned entities in your database as Strapi v3 did not have cascading deletes. You will need to manually delete these entities from your database. We do not plan to handle this via this migration script as it requires a deep understanding of your data model and the data in your database.
