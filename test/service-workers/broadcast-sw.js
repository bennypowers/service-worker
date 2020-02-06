/* eslint-env serviceworker */

const channel = new BroadcastChannel('service-worker');

addEventListener('install', function(event) {
  event.waitUntil(clients.claim());
  channel.postMessage({action: 'install'});
});
