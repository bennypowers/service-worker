import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

const SW_SCRIPTS = [
  '/service-worker.js',
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

export default /** @type{import('@web/test-runner').TestRunnerConfig}*/({
  port: 9090,
  files: ['test/*.test.ts'],
  plugins: [esbuildPlugin({ ts: true, target: 'auto' })],
  middleware: [rewriteSWScripts],
  browsers: [playwrightLauncher()],
  nodeResolve: true,
});
