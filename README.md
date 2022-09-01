# Strapi Migration Scripts

This repository contains notes and scripts to run data migrations between Strapi versions

## Supported Databases

When referring to `SQL` databases we mean officially supported databases by Strapi:

- MySQL >= 5.7.8
- MariaDB >= 10.2.7
- PostgreSQL >= 10
- SQLite >= 3

For more information on supported databases, please see the [deployment guidelines](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/deployment.html#general-guidelines) in the Strapi documentation.

## Script Status

Some scripts may be in various states, *you should pay careful attention to what state the script is in as it may not have had significant testing for all use-cases*! Current script states are as follows:

- **Alpha**: We have not tested this with any "real world" like applications, only in limited environments
- **Beta**: We have tested this in a small number of "real world" like applications and/or we have had some actual users do closed beta testing on it
- **Stable**: We have had large scale testing and it is believed to be in a stable state
- **Legacy**: This script is considered EOL and will no longer be updated

## Scripts

- [Migration from v3 MongoDB to v3 SQL](./v3-mongodb-v3-sql/README.md) - **Currently in Beta Testing**
- [Migration from v3 SQL to v4 SQL](./v3-sql-v4-sql/README.md) - **Currently in Beta Testing**

## Callouts

Huge thank you to the following people, teams, or companies that helped build the content of this repo:

- [Notum Technologies](https://notum.cz/en/) for their incredible help building the v3 to v4 SQL data migration script
