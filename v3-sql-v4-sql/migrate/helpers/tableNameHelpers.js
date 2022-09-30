const { isPGSQL } = require('../../config/database');

const resolveSourceTableName = (name) => {
  if (isPGSQL) {
    return process.env.DATABASE_V3_SCHEMA + '.' + name;
  }

  return name;
};

const resolveDestTableName = (name) => {
  if (isPGSQL) {
    return process.env.DATABASE_V4_SCHEMA + '.' + name;
  }

  return name;
};

module.exports = {
  resolveDestTableName,
  resolveSourceTableName,
};
