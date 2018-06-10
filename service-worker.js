if ('serviceWorker' in navigator) {
  /**
   * Custom Element for declaratively adding a service worker with optional auto-update.
   *
   * ```html
   * <service-worker id="serviceWorker"
   *     path="./service-worker.js"
   *     scope="/muh-data/"
   *     auto-reload
   * ></service-worker>
   * ```
   *
   * @customElement
   * @extends HTMLElement
   *
   * @demo demo/index.html
   */
    class ServiceWorker extends HTMLElement {
      static get is() {return;}

      static get observedAttributes() {
        return [
          'auto-reload',
          'path',
          'scope',
          'update-action',
        ];
      }

      constructor() {
        super();

        /**
         * If true, when updates are found, the page will automatically
         * reload, so long as the user has not yet interacted with it.
         */
        this.autoReload = false;

        /**
         * Error state of the service-worker registration
         * @type {Error|null}
         */
        this.error = null;

        /** A reference to the service worker instance. */
        this.worker = null;

        /**
         * String passed to serviceWorker which triggers self.skipWaiting().
         * String will be passed in message.action.
         */
        this.updateAction = 'skipWaiting';

        /** Scope for the service worker. */
        this.scope = '/';

        /** Path to the service worker script. */
        this.path = '/service-worker.js';
      }

      connectedCallback() {
        const {autoReload, path, scope, updateAction} = this;
        this.registerServiceWorker({autoReload, path, scope, updateAction});
      }

      attributeChangedCallback(name, newVal, oldVal) {
        switch (name) {
          case 'path':
            this.path = newVal;
            this.registerServiceWorker({path: newVal});
            break;
          case 'scope': this.scope = newVal; break;
          case 'update-action': this.updateAction = newVal; break;
          case 'auto-reload': this.autoReload = this.hasAttribute(name); break;
        }
      }

      /**
       * Registers a service worker, and prompts to update as needed
       * @param  {Object} options Initialization options
       * @param  {Boolean} [options.autoReload=this.autoReload]  Path to the sw script
       * @param  {String}  [options.path=this.path]              Path to the sw script
       * @param  {String}  [options.scope=this.scope]            Scope of the sw
       * @param  {String}  [options.updateAction=this.updateAction] action to trigger the sw update.
       * @return {Promise}
       */
      async registerServiceWorker({
        autoReload,
        path,
        scope,
        updateAction: action,
      }) {
        if (!path || !scope || !action) return;

        // When an update is found, if user has not yet interacted with the page,
        // reload it for them, otherwise, prompt them to reload 🍩.
        const update = (serviceWorker) => {
          serviceWorker.postMessage({action});
          this.dispatchEvent(new CustomEvent('service-worker-changed', {
            bubbles: true,
            composed: true,
            detail: serviceWorker,
          }));
        };

        // Listen for changes on a new worker, notify when installed. 🍞
        const track = (serviceWorker) =>
          serviceWorker.onstatechange = () =>
            (serviceWorker.state === 'installed') && update(serviceWorker);

        if (autoReload) {
          // Check whether the use has interacted with the page yet.
          const onInteraction = () => {
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
          this.error = error;
          this.dispatchEvent(new CustomEvent('error-changed', {
            bubbles: true,
            composed: true,
            error,
          }));
          return reg;
        }

        if (reg.active) update(reg.active);

        // If there's no previous SW, quit early - this page load is fresh. 🍌
        if (!navigator.serviceWorker.controller) return 'Page fresh.';

        // A new SW is already waiting to activate. Update. 👯
        else if (reg.waiting) return update(reg.waiting);

        // A new SW is installing. Listen for updates, notify when installed. 🍻
        else if (reg.installing) track(reg.installing);

        // Otherwise, when a new service worker arrives, listen for updates,
        // and if it becomes installed, notify the user. 🍷
        else reg.onupdatefound = () => track(reg.installing);
      }
    }

    customElements.define('service-worker', ServiceWorker);
  }
