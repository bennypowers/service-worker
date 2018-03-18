import { Element } from '../../@polymer/polymer/polymer-element.js';
import '../../@polymer/paper-button/paper-button.js';
import '../../@polymer/paper-toast/paper-toast.js';

if ('serviceWorker' in navigator) {
  /**
   * Custom Element for declaratively adding a service worker with
   * "Click To Update" prompt and optional auto-update.
   *
   * ```html
   * <service-worker id="serviceWorker"
   *     path="./service-worker.js"
   *     scope="/muh-data/"
   *     auto-reload
   * ></service-worker>
   * ```
   * ### Styling
   * Attribute | Description | Default
   * --------- | ----------- | ---------
   * `--service-worker-button-color` | Color of the "Click to Update" button text | var(--paper-yellow-400).
   *
   * @polymer
   * @customElement
   *
   * @demo demo/index.html
   */
    class ServiceWorker extends Element {
      static get is() {return 'service-worker';}

      static get properties() {
        return {

          /**
           * If true, when updates are found, the page will automatically
           * reload, so long as the user has not yet interacted with it.
           */
          autoReload: {
            type: Boolean,
            value: false,
          },

          /**
           * language for strings.
           * e.g. 'he'. defaults to first 2 chars of document lang or 'en'.
           */
          language: {
            type: String,
            value: document.documentElement.lang.substring(0, 2) || 'en',
          },

          /** Path to the service worker script. */
          path: {
            type: String,
            value: '/service-worker.js',
          },

          /** i18n strings. */
          resources: {
            type: Object,
            value: () => ({

              en: {
                newVersion: 'New Version Ready',
                ok: 'OK',
                clickToUpdate: 'Click to Update',
              },

              he: {
                newVersion: 'גרסה חדשה',
                ok: 'בסדר',
                clickToUpdate: 'לחץ לעדכן',
              },

            }),
          },

          /** Scope for the service worker. */
          scope: {
            type: String,
            value: '/',
          },

          /**
           * String passed to serviceWorker which triggers self.skipWaiting().
           * String will be passed in message.action.
           */
          updateAction: {
            type: String,
            value: 'skipWaiting',
          },

          /** Reference to the active worker. */
          worker: {
            type: Object,
            readOnly: true,
            value: null,
            notify: true,
          },

        };
      }

      connectedCallback() {
        super.connectedCallback();
        const {autoReload, path, scope, updateAction} = this;
        this.registerServiceWorker({autoReload, path, scope, updateAction});
      }

      /**
       * Miniature AppLocalizeBehavior implementation, without Intl.
       * @param  {String} key localization address
       * @return {String}     localized string
       * @protected
       */
      localize(key) {
        return this.resources[this.language][key];
      }

      /**
       * Display a toast prompting the user to update the service worker.
       * @protected
       */
      async openToast() {
        if (!this.toast) {
          const button = document.createElement('paper-button');
                button.id = 'serviceWorkerToastButton';
                button.innerHTML = this.localize('clickToUpdate');
                button.onclick = () => window.location.reload();
                button.style.color = 'var(--service-worker-button-color, var(--paper-yellow-400, #FFEE58))';
          const close = document.createElement('paper-button');
                close.id = 'serviceWorkerCloseButton';
                close.innerHTML = this.localize('ok');
                close.onclick = () => toast.close();
          const toast = document.createElement('paper-toast');
                toast.id = 'serviceWorkerToast';
                toast.duration = Infinity;
                toast.text = this.localize('newVersion');
                toast.appendChild(button);
                toast.appendChild(close);
          this.toast = toast;
          document.body.appendChild(toast);
        }
        this.toast.open();
      }

      /**
       * Registers a service worker, and prompts to update as needed
       * @param  {Boolean} [$0.autoReload=this.autoReload]  Path to the sw script
       * @param  {String}  [$0.path=this.path]              Path to the sw script
       * @param  {String}  [$0.scope=this.scope]            Scope of the sw
       * @param  {String}  [$0.updateAction=this.updateAction] action to trigger the sw update.
       * @return {Promise}
       */
      async registerServiceWorker({autoReload, path, scope, updateAction}) {
        if (!path || !scope || !updateAction) return;
        let shouldToast = true;

        // When an update is found, if user has not yet interacted with the page,
        // reload it for them, otherwise, prompt them to reload 🍩.
        const update = (serviceWorker) => {
          serviceWorker.postMessage({action: updateAction});
          shouldToast ? this.openToast() : location.reload();
        };

        // Listen for changes on a new worker, toast when installed. 🍞
        const track = (serviceWorker) =>
          serviceWorker.onstatechange = () =>
            (serviceWorker.state === 'installed') && update(serviceWorker);

        if (autoReload) {
          shouldToast = false;
          // Check whether the use has interacted with the page yet.
          const onInteraction = () => {
            shouldToast = true;
            document.removeEventListener('click', onInteraction);
            document.removeEventListener('keyup', onInteraction);
          };
          document.addEventListener('click', onInteraction);
          document.addEventListener('keyup', onInteraction);
        }

        // Register the service worker
        let reg;
        try {
          reg = await navigator.serviceWorker.register(path, {scope});
        } catch (error) {
          // eslint-disable-next-line no-console
          console.info('Could not register service worker.', error);
          return reg;
        }

        if (reg.active) this._setWorker(reg.active);

        // If there's no previous SW, quit early - this page load is fresh. 🍌
        if (!navigator.serviceWorker.controller) return 'Page fresh.';

        // A new SW is already waiting to activate. Update. 👯
        else if (reg.waiting) return update(reg.waiting);

        // A new SW is installing. Listen for updates, toast when installed. 🍻
        else if (reg.installing) track(reg.installing);

        // Otherwise, when a new service worker arrives, listen for updates,
        // and if it becomes installed, toast the user. 🍷
        else reg.onupdatefound = () => track(reg.installing);
      }
    }

    customElements.define(ServiceWorker.is, ServiceWorker);
  }
