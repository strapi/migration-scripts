const log = (...msg) => {
  console.log(...msg);
};

const verboseLog = (...msg) => {
  if (process.env.VERBOSE_LOG) {
    console.log(...msg);
  }
};

module.exports = {
  log,
  verboseLog,
};
