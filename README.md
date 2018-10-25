# \<service-worker\>
[![Build Status](https://travis-ci.org/bennypowers/service-worker.svg?branch=master)](https://travis-ci.org/bennypowers/service-worker)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/bennypowers/service-worker)
[![Contact me on Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)

Custom Element for declaratively adding a service worker with "Click To Update" prompt and optional auto-install.

## Usage

```html
<service-worker id="serviceWorker"
    path="./my-service-worker.js"
    scope="/muh-data/"
    auto-reload
></service-worker>
```

## Updating the Service Worker.

When an updated service worker is detected, `<service-worker>` will post a message to the service worker with the contents `{ action: this.updateAction }`. You can customize the name of the passed action by setting the `updateAction` property or the `update-action` attribute (they will sync with each other). `updateAction` is by `'skipWaiting'` by default. You can then handle that message in your service worker by running `self.skipWaiting()`:

```js
self.addEventListener('message', event => {
  switch (event.data.action) {
    case 'skipWaiting': return self.skipWaiting();
  }
});
```

If `auto-reload` is set, `<service-worker>` will check if the user has not yet interacted with the app, and if she hasn't, refresh the page by calling `location.reload()` when the new service-worker is installed. Listen for the `service-worker-changed` event to display a message to the user when the service worker updates.

```js
document.querySelector('service-worker')
  .addEventListener('service-worker-changed', event => {
    const dialog = document.createElement('dialog')
    dialog.innerHTML = `
      <h1>New Version Available!</h1>
      <p>Reload the Page?</p>
      <button id="sw-dialog-confirm">OK</button>
      <button id="sw-dialog-cancel">Cancel</button>
    `;
    dialog.querySelector('sw-dialog-cancel').onclick = () => dialog.close();
    dialog.querySelector('sw-dialog-confirm').onclick = () => location.reload();
    dialog.showModal();
  })
```

### sw-precache
If you are using [sw-precache](https://github.com/GoogleChromeLabs/sw-precache#skipwaiting-boolean) to generate your SW, it will automatically skip waiting on reload, unless you specify otherwise in `sw-precache-config.js`

### Workbox
[Workbox](https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-sw.WorkboxSW) offers a similar feature, although you must opt in when constructing the workbox instance.

#### Directly in service-worker.js

```js
// service-worker.js
const workboxSW = new WorkboxSW({
  skipWaiting: true,
});
```

#### Workbox CLI
```js
// workbox-cli-config.js
module.exports = {
  skipWaiting: true,
};
```

#### Webpack
```js
// webpack.config.js
const workboxPlugin = require('workbox-webpack-plugin');

plugins: [
  new workboxPlugin({
    skipWaiting: true,
  }),
];
```

#### Gulp
```js
// gulpfile.js
const workbox = require('workbox-build');

gulp.task('generate-service-worker', () => {
  workbox.generateSW({
    skipWaiting: true,
  });
});
```
