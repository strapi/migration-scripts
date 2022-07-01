'use strict';

jest.autoMockOff();

const defineTest = require('jscodeshift/dist/testUtils').defineTest;

defineTest(__dirname, 'change-model-getters-to-content-types');
