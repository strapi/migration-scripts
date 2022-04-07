# Migration script from Strapi v3 on mongo to Strapi v3 on SQL

> For now this works for sqlite only and can then be used to dump into pg or mysql (will automate the other two soon)

## Install

Requirements

- Nodejs v16
- Yarn


Installation

```sh
yarn
```

## Configuration
## Instructions

1. Start by following this guide https://www.notion.so/strapi/Mongo-to-SQL-migration-2c47f80114bb48b298edd386a47138c1 and migrate the app and generate the new DB
2. Configure the DB connections by copying `.env.example` to `.env` and updating the vars
2. Run the script

```sh
node index.js
```