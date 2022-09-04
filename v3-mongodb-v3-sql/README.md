# Migration script from Strapi v3 on MongoDB to Strapi v3 on SQL

## Preparation steps

- Preform a backup of your database you wish to migrate and store that backup somewhere secure
- Create a new database on your choice of database engine (mysql or pg, sqlite will be created automatically)

## Install

### Requirements

- Nodejs v14/v16
- Yarn

### Installation

```sh
yarn
```

## Configuration

1. Choose which database you are migrating to (sqlite, mysql, pg)
2. Copy the corresponding `.env.DBTYPE.example` file to `.env` using something like `cp .env.pg.example .env`
3. Modify the configuration in the `.env` to match your MongoDB source and your SQL destination

## Migration

1. Start by following the ["prepare the migration locally"](https://docs.strapi.io/developer-docs/latest/update-migration-guides/migration-guides/v4/data/mongo.html#prepare-the-migration-locally) guide on our documentation to do any needed code changes
2. Run your SQL Strapi v3 in `develop` mode with an empty DB to generate the DB structure
3. Turn off / kill the running SQL Strapi v3 server
4. Run migration script using `yarn start`
5. Run your SQL Strapi v3 using `yarn develop` mode with the migrated DB to test the migration
