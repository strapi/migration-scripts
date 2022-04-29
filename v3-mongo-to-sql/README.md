# Migration script from Strapi v3 on MongoDB to Strapi v3 on SQL

> For now this works for sqlite only and can then be used to dump into pg or mysql (will automate the other two soon)

## Preparation steps

1. Preform a backup of your database you wish to migrate and store that backup somewhere secure

## Install

### Requirements

- Nodejs v14/v16
- Yarn

### Installation

```sh
yarn
```

## Configuration

WIP

## Migration

1. Start by following the ["prepare the migration locally"](https://docs.strapi.io/developer-docs/latest/update-migration-guides/migration-guides/v4/data/mongo.html#prepare-the-migration-locally) guide on our documentation to do any needed code changes
2. Run your SQL Strapi v3 in `develop` mode with an empty DB to generate the DB structure
3. Turn off / kill the running Strapi v4 server
4. Run migration script using `yarn start`
