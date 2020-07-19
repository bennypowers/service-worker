const SW_SCRIPTS = [
  // '/service-worker.js',
  '/test-sw.js',
  '/new-sw.js',
  '/broadcast-sw.js',
  '/sw.js',
];

function rewriteSWScripts(context, next) {
  if (SW_SCRIPTS.includes(context.url))
    context.url = `/test/service-workers${context.url}`;
  return next();
}

export default {
  port: 9090,
  files: [
    'test/*.test.js',
  ],
  middleware: [rewriteSWScripts],
  nodeResolve: true,
  coverage: true,
  coverageConfig: {
    report: true,
  },
};
