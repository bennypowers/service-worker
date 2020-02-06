[![Published on npm](https://img.shields.io/npm/v/@power-elements/service-worker)](https://npm.im/@power-elements/service-worker)
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/bennypowers/service-worker)
[![Test Status](https://github.com/bennypowers/service-worker/workflows/test/badge.svg)](https://github.com/bennypowers/service-worker/actions?query=workflow%3Atest)
[![Test Coverage](https://api.codeclimate.com/v1/badges/512ba168f108821c0be1/test_coverage)](https://codeclimate.com/github/bennypowers/service-worker/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/512ba168f108821c0be1/maintainability)](https://codeclimate.com/github/bennypowers/service-worker/maintainability)
[![Contact me on Codementor](https://cdn.codementor.io/badges/contact_me_github.svg)](https://www.codementor.io/bennyp?utm_source=github&utm_medium=button&utm_term=bennyp&utm_campaign=github)
# service-worker

Custom Element for declaratively adding a service worker with optional auto-update.

## Example

```html
<service-worker id="serviceWorker"
    path="./service-worker.js"
    scope="/muh-data/"
    auto-reload
></service-worker>
```

## Properties

| Property       | Attribute       | Type            | Default              | Description                                      |
|----------------|-----------------|-----------------|----------------------|--------------------------------------------------|
| `autoReload`   | `auto-reload`   | `boolean`       | false                | If true, when updates are found, the page will automatically<br />reload, so long as the user has not yet interacted with it. |
| `error`        | `error`         | `Error`         | null                 | Error state of the service-worker registration   |
| `interacted`   |                 | `boolean`       | false                |                                                  |
| `path`         | `path`          | `string`        | "/service-worker.js" | Path to the service worker script.               |
| `scope`        | `scope`         | `string`        | "/"                  | Scope for the service worker.                    |
| `updateAction` | `update-action` | `string`        | "skipWaiting"        | String passed to serviceWorker which triggers self.skipWaiting().<br />String will be passed in message.action. |
| `worker`       |                 | `ServiceWorker` | null                 | A reference to the service worker instance.      |

## Methods

| Method                  | Type                                             | Description                                      |
|-------------------------|--------------------------------------------------|--------------------------------------------------|
| `registerServiceWorker` | `({ path, scope }?: { path?: string; scope?: string; updateAction?: string; }): Promise<ServiceWorkerRegistration>` | Registers a service worker, and prompts to update as needed<br /><br />**options.path**: Path to the sw script |

## Events

| Event                    | Description                |
|--------------------------|----------------------------|
| `error-changed`          | New value of error         |
| `service-worker-changed` | New value of serviceWorker |

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
const dialogTemplate = document.createElement('template');
dialogTemplate.innerHTML = `
  <dialog>
    <form method="dialog">
      <h1>New Version Available!</h1>
      <p>Reload the Page?</p>
      <menu>
        <button value="confirm">OK</button>
        <button value="cancel">Cancel</button>
      </menu>
    </form>
  </dialog>
`;
document.querySelector('service-worker')
  .addEventListener('service-worker-changed', event => {
    const dialog = dialogTemplate.content.cloneNode(true);
    dialog.addEventListener('close', function({ returnValue }) {
      if (returnValue === 'confirm') location.reload();
    });
    document.body.append(dialog);
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
// workbox-config.js
module.exports = {
  // ...
  skipWaiting: true,
};
```

#### Rollup
```js
// rollup.config.js
import { generateSW } from 'rollup-plugin-workbox';
export default {
  // ...
  // use workbox-config.js as above
  plugins: [generateSW(require('./workbox-config.js'))]
}
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
