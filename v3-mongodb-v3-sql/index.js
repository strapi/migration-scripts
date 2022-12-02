require('dotenv').config();

const _ = require('lodash');
const pluralize = require('pluralize');
const { singular } = pluralize;

const knex = require('./knex');
const schemaInspector = require('knex-schema-inspector').default;
const inspector = schemaInspector(knex);
const mongo = require('./mongo');
const { transformEntry } = require('./transform');
const idMap = require('./id-map');

const getGlobalId = (model, modelName, prefix) => {
  let globalId = prefix ? `${prefix}-${modelName}` : modelName;

  return model.globalId || _.upperFirst(_.camelCase(globalId));
};

const getCollectionName = (associationA, associationB) => {
  if (associationA.dominant && _.has(associationA, 'collectionName')) {
    return associationA.collectionName;
  }

  if (associationB.dominant && _.has(associationB, 'collectionName')) {
    return associationB.collectionName;
  }

  return [associationA, associationB]
    .sort((a, b) => {
      if (a.collection === b.collection) {
        if (a.dominant) return 1;
        else return -1;
      }
      return a.collection < b.collection ? -1 : 1;
    })
    .map((table) => {
      return _.snakeCase(`${pluralize.plural(table.collection)}_${pluralize.plural(table.via)}`);
    })
    .join('__');
};

async function getModelDefs(db) {
  const coreStore = db.collection('core_store');

  const cursor = coreStore.find({
    key: { $regex: /^model_def/ },
  });

  const res = (await cursor.toArray())
    .map((item) => JSON.parse(item.value))
    .map((model) => {
      const { uid } = model;

      if (!model.uid.includes('::')) {
        return {
          ...model,
          modelName: uid.split('.')[1],
          globalId: _.upperFirst(_.camelCase(`component_${uid}`)),
        };
      }

      let plugin;
      let apiName;
      let modelName;

      if (uid.startsWith('strapi::')) {
        plugin = 'admin';
        modelName = uid.split('::')[1];
      } else if (uid.startsWith('plugins')) {
        plugin = uid.split('::')[1].split('.')[0];
        modelName = uid.split('::')[1].split('.')[1];
      } else if (uid.startsWith('application')) {
        apiName = uid.split('::')[1].split('.')[0];
        modelName = uid.split('::')[1].split('.')[1];
      }

      return {
        ...model,
        plugin,
        apiName,
        modelName,
        globalId: getGlobalId(model, modelName, plugin),
      };
    });

  await cursor.close();

  return res;
}

async function run() {
  try {
    await mongo.connect();

    const db = mongo.db();

    const models = await getModelDefs(db);

    const modelMap = models.reduce((acc, model) => {
      acc[model.uid] = model;
      return acc;
    }, {});

    const dialect = require(`./dialects/${knex.client.config.client}`)(knex, inspector);
    await dialect.delAllTables(knex);
    await dialect.beforeMigration?.(knex);

    // 1st pass: for each document create a new row and store id in a map
    for (const model of models) {
      const cursor = db.collection(model.collectionName).find();

      while (await cursor.hasNext()) {
        const entry = await cursor.next();
        const row = transformEntry(entry, model);

        row.id = idMap.next(entry._id, model.collectionName);

        await knex(model.collectionName).insert(row);
      }

      await cursor.close();
    }

    // 2nd pass: for each document's components & relations create the links in the right tables

    for (const model of models) {
      const cursor = db.collection(model.collectionName).find();

      while (await cursor.hasNext()) {
        const entry = await cursor.next();

        for (const key of Object.keys(entry)) {
          const attribute = model.attributes[key];

          if (!attribute) {
            continue;
          }

          if (attribute.type === 'component') {
            // create compo links
            const componentModel = modelMap[attribute.component];
            const linkTableName = `${model.collectionName}_components`;

            const rows = entry[key].map((mongoLink, idx) => {
              return {
                id: idMap.next(mongoLink._id, linkTableName),
                field: key,
                order: idx + 1,
                component_type: componentModel.collectionName,
                component_id: idMap.get(mongoLink.ref),
                [`${singular(model.collectionName)}_id`]: idMap.get(entry._id),
              };
            });

            if (rows.length > 0) {
              await knex(linkTableName).insert(rows);
            }

            continue;
          }

          if (attribute.type === 'dynamiczone') {
            // create compo links
            const linkTableName = `${model.collectionName}_components`;

            const rows = entry[key].map((mongoLink, idx) => {
              const componentModel = models.find((m) => m.globalId === mongoLink.kind);

              return {
                id: idMap.next(mongoLink._id, linkTableName),
                field: key,
                order: idx + 1,
                component_type: componentModel.collectionName,
                component_id: idMap.get(mongoLink.ref),
                [`${singular(model.collectionName)}_id`]: idMap.get(entry._id),
              };
            });

            if (rows.length > 0) {
              await knex(linkTableName).insert(rows);
            }

            continue;
          }

          if (attribute.model === 'file' && attribute.plugin === 'upload') {
            if (!entry[key]) {
              continue;
            }

            const row = {
              upload_file_id: idMap.get(entry[key]),
              related_id: idMap.get(entry._id),
              related_type: model.collectionName,
              field: key,
              order: 1,
            };

            await knex('upload_file_morph').insert(row);
          }

          if (attribute.collection === 'file' && attribute.plugin === 'upload') {
            const rows = entry[key].map((e, idx) => ({
              upload_file_id: idMap.get(e),
              related_id: idMap.get(entry._id),
              related_type: model.collectionName,
              field: key,
              order: idx + 1,
            }));

            if (rows.length > 0) {
              await knex('upload_file_morph').insert(rows);
            }
          }

          if (attribute.model || attribute.collection) {
            // create relation links

            const targetModel = models.find((m) => {
              return (
                [attribute.model, attribute.collection].includes(m.modelName) &&
                (!attribute.plugin || (attribute.plugin && attribute.plugin === m.plugin))
              );
            });

            const targetAttribute = targetModel?.attributes?.[attribute.via];

            const isOneWay = attribute.model && !attribute.via && attribute.model !== '*';
            const isOneToOne =
              attribute.model &&
              attribute.via &&
              targetAttribute?.model &&
              targetAttribute?.model !== '*';
            const isManyToOne =
              attribute.model &&
              attribute.via &&
              targetAttribute?.collection &&
              targetAttribute?.collection !== '*';
            const isOneToMany =
              attribute.collection &&
              attribute.via &&
              targetAttribute?.model &&
              targetAttribute?.model !== '*';
            const isManyWay =
              attribute.collection && !attribute.via && attribute.collection !== '*';
            const isMorph = attribute.model === '*' || attribute.collection === '*';

            // TODO: check dominant side
            const isManyToMany =
              attribute.collection &&
              attribute.via &&
              targetAttribute?.collection &&
              targetAttribute?.collection !== '*';

            if (isOneWay || isOneToOne || isManyToOne) {
              // TODO: optimize with one updata at the end

              if (!entry[key]) {
                continue;
              }

              await knex(model.collectionName)
                .update({
                  [key]: idMap.get(entry[key]),
                })
                .where('id', idMap.get(entry._id));

              continue;
            }

            if (isOneToMany) {
              // nothing to do
              continue;
            }

            if (isManyWay) {
              const joinTableName =
                attribute.collectionName || `${model.collectionName}__${_.snakeCase(key)}`;

              const fk = `${singular(model.collectionName)}_id`;
              let otherFk = `${singular(attribute.collection)}_id`;

              if (otherFk === fk) {
                otherFk = `related_${otherFk}`;
              }

              const rows = entry[key].map((id) => {
                return {
                  [otherFk]: idMap.get(id),
                  [fk]: idMap.get(entry._id),
                };
              });

              if (rows.length > 0) {
                await knex(joinTableName).insert(rows);
              }

              continue;
            }

            if (isManyToMany) {
              if (attribute.dominant) {
                const joinTableName = getCollectionName(attribute, targetAttribute);

                let fk = `${singular(targetAttribute.collection)}_id`;
                let otherFk = `${singular(attribute.collection)}_id`;

                if (otherFk === fk) {
                  fk = `${singular(attribute.via)}_id`;
                }

                const rows = entry[key].map((id) => {
                  return {
                    [otherFk]: idMap.get(id),
                    [fk]: idMap.get(entry._id),
                  };
                });

                if (rows.length > 0) {
                  await knex(joinTableName).insert(rows);
                }
              }

              continue;
            }

            continue;
          }

          // get relations
        }
      }

      await cursor.close();

      await dialect.afterMigration?.(knex);
    }
  } finally {
    await mongo.close();
    await knex.destroy();
  }

  console.log('Done');
}

run().catch(console.dir);
