const file = require('file');

const someVar = { name: 'paul' };

module.exports = (
  {
    strapi
  }
) => {
  const foo = () => {
    console.log(strapi);
  };

  function bar() {
    console.log(strapi);
  }

  return {
    foo,
    bar,

    plop() {
      console.log(strapi);
    },

    plunk() {
      console.log(strapi);
    }
  };
};
