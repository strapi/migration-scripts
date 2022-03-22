require("dotenv").config();

const knex = require("./knex");
const mongo = require("./mongo");
const { transformEntry } = require("./transform");
const idMap = require("./id-map");

async function getModelDefs(db) {
  const coreStore = db.collection("core_store");

  const cursor = coreStore.find({
    key: { $regex: /^model_def/ },
  });

  const res = (await cursor.toArray()).map((item) => JSON.parse(item.value));

  await cursor.close();

  return res;
}

async function run() {
  try {
    await mongo.connect();

    const db = mongo.db("strapi");

    const models = await getModelDefs(db);

    for (const model of models) {
      console.log(`Migration ${model.uid}`);
      const cursor = db.collection(model.collectionName).find();

      await knex(model.collectionName).del();

      while (await cursor.hasNext()) {
        const entry = await cursor.next();
        const row = transformEntry(entry, model);

        row.id = idMap.next(entry._id, model.collectionName);

        await knex(model.collectionName).insert(row);
      }

      await cursor.close();
    }
  } finally {
    await mongo.close();
    await knex.destroy();
  }

  console.log("Done");
}

run().catch(console.dir);
