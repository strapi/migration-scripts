'use strict';

jest.autoMockOff();

const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'add-strapi-to-bootstrap-params');
