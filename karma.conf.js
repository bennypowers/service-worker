/* eslint-env node */
/* eslint-disable import/no-extraneous-dependencies */
const {createDefaultConfig} = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = (config) => {
  config.set(
      merge(createDefaultConfig(config), {
        files: [{pattern: config.grep ? config.grep : '*.test.js', type: 'module'}],
        esm: {nodeResolve: true, coverageExclude: ['*.test.js']},
      }),
  );
  return config;
};
