const { MongoClient } = require('mongodb');
const mongoUriBuilder = require('mongo-uri-builder');

const uri = mongoUriBuilder({
  username: process.env.MONGO_USER,
  password: process.env.MONGO_PASSWORD,
  host: process.env.MONGO_HOST,
  port: process.env.MONGO_PORT,
  database: process.env.MONGO_DB,
  replicas: process.env.MONGO_REPLICAS,
  options: process.env.MONGO_OPTIONS,
});

const client = new MongoClient(uri);

module.exports = client;
