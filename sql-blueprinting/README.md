# SQL Blueprinting

Compare two databases and drop the tables that are not common in both.
We run our strapi project in a new sql db so it creates its clean structure.
This db can be used as a blueprint since it is created by our strapi current state and doesnt have old entries etc.

## Usage example

- DB1 is a blueprint db that contains only a schema, we will use this db as a structure referance.
- DB2 is a production db that contains the data and a schema.
- We want to drop from the DB2 (prod) the tables that does not appear in the structure of DB1
- After cleaning our prod db according to blueprint we can migrate it to v4

## Description

Since we have to cleanup by order keys, columns and finally the tables, the db sets foreign key checks to 0 and after running back to 1.

## Run

- npm i
- npm run start

## Important Notes

- Please use this script on clone of your production db.
- This script drops all columns, collections and tables that does not exist in blueprint database, so use it carefully.
