/* global clients */
self.addEventListener('message', event =>
  event.waitUntil(clients.matchAll().then(allClients =>
    allClients.forEach(client =>
      client.postMessage({msg: 'Service Worker Poked! 🎉'})
))));
