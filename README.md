# \<service-worker\>

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

When an update is detected, `<service-worker>` will post a message to the service worker of the type `{action: updateAction}` where `updateAction` is by `'skipWaiting'` by default. You can customize the action passed by setting the `update-action` attribute. Your service worker should contain a message handler which receives that action and triggers `self.skipWaiting`:

```js
self.addEventListener('message', event =>
  (event.data.action === 'skipWaiting') && self.skipWaiting());
```

If `auto-reload` is set, `<service-worker>` will check if the user has not yet interacted with the app, and if she hasn't, will refresh the page.

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
