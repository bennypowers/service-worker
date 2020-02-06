/* eslint-env serviceworker */

const channel = new BroadcastChannel('service-worker');

addEventListener('install', function(event) {
  skipWaiting();
  channel.postMessage({action: 'refresh'});
});
