require("dotenv").config();

const { migrate } = require("./migrate");

async function f() {
  await migrate();

  process.exit();
}

f();
