/* eslint-env node */
/* eslint-disable import/no-extraneous-dependencies */
const {createDefaultConfig} = require('@open-wc/testing-karma');
const merge = require('deepmerge');

module.exports = (config) => {
  config.set(
      merge(createDefaultConfig(config), {
        files: [
          {pattern: config.grep ? config.grep : 'test/*.test.js', type: 'module'},
          {pattern: 'test/service-workers/*', included: false},
        ],
        proxies: {
          '/service-worker.js': '/base/test/service-workers/service-worker.js',
          '/test-sw.js': '/base/test/service-workers/test-sw.js',
          '/new-sw.js': '/base/test/service-workers/new-sw.js',
          '/sw.js': '/base/test/service-workers/sw.js',
        },
        esm: {
          nodeResolve: true,
          coverageExclude: ['test/**/*'],
        },
      }),
  );
  return config;
};
