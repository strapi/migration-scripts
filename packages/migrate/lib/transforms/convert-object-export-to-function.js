module.exports = function convertObjectExportToFunction(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const remainingBody = [];
  const functionDeclarations = [];

  for (const node of root.get().node.program.body) {
    let isArrowFunction = false;
    if (node.type === 'VariableDeclaration') {
      isArrowFunction =
        node.declarations.filter((dec) => dec.init.type === 'ArrowFunctionExpression').length > 0;
    }

    if (node.type === 'FunctionDeclaration' || isArrowFunction) {
      functionDeclarations.push(node);
    } else {
      remainingBody.push(node);
    }
  }

  root.get().node.program.body = remainingBody;

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
      type: 'ObjectExpression',
    },
  });

  const strapiArg = j.property('init', j.identifier('strapi'), j.identifier('strapi'));
  const objectExpression = moduleExports.length && moduleExports.get().value.right;

  if (!objectExpression) {
    console.log('This file does not need to be transformed');
    process.exit(1);
  }

  const arrowFunctionExpression = j.arrowFunctionExpression(
    [j.objectPattern([{ ...strapiArg, shorthand: true, loc: { indent: 0 } }])],
    j.blockStatement([
      ...functionDeclarations,
      j.returnStatement(j.objectExpression(objectExpression.properties)),
    ])
  );

  moduleExports.get().value.right = arrowFunctionExpression;

  return root.toSource({ quote: 'single' });
};
