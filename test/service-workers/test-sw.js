/* eslint-env serviceworker */

const channel = new BroadcastChannel('service-worker');

addEventListener('activate', function(event) {
  skipWaiting();
  event.waitUntil(clients.claim());
  channel.postMessage({action: 'activate'});
});

addEventListener('install', function(event) {
  skipWaiting();
  event.waitUntil(clients.claim());
  channel.postMessage({action: 'install'});
});

addEventListener('message', async function(event) {
  const {data: {action}} = event;
  channel.postMessage({action});
});
