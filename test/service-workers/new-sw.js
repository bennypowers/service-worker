const channel = new BroadcastChannel('service-worker');

addEventListener('install', function() {
  skipWaiting();
  channel.postMessage({ action: 'refresh' });
});
