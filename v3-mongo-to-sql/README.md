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


## Migration

1. Start by following this guide https://www.notion.so/strapi/Mongo-to-SQL-migration-2c47f80114bb48b298edd386a47138c1 and migrate the app and generate the new DB
2. Configure the DB connections by copying `.env.example` to `.env` and updating the vars
3. Run the script

```sh
node index.js
```
