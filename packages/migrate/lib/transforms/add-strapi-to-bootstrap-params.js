module.exports = function addStrapiToBootStrapParams(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const moduleExports = root.find(j.AssignmentExpression, {
    left: {
      object: {
        name: 'module',
      },
      property: {
        name: 'exports',
      },
    },
    right: {
      type: 'ArrowFunctionExpression',
    },
  });

  const strapiArg = j.property('init', j.identifier('strapi'), j.identifier('strapi'));
  moduleExports.get().value.right.params = [
    j.objectPattern([{ ...strapiArg, shorthand: true, loc: { indent: 0 } }]),
  ];

  return root.toSource({ quote: 'single' });
};
