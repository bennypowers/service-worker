if ('serviceWorker' in navigator) {
  /**
   * Custom Element for declaratively adding a service worker
   * with optional auto-update.
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
    static get is() {return 'service-worker';}

    static get observedAttributes() {
      return [
        'auto-reload',
        'path',
        'scope',
        'update-action',
      ];
    }

    get autoReload() {
      return this.__autoReload;
    }

    set autoReload(value) {
      this.__autoReload = value;
      value
        ? this.setAttribute('auto-reload', '')
        : this.removeAttribute('auto-reload');
    }

    get path() {
      return this.__path;
    }

    set path(path) {
      this.__path = path;
      if (this.getAttribute('path') !== path) this.setAttribute('path', path);
      this.registerServiceWorker({path});
    }

    get scope() {
      return this.__scope;
    }

    set scope(scope) {
      this.__scope = scope;
      if (this.getAttribute('scope') !== scope) this.setAttribute('scope', scope);
      this.registerServiceWorker({scope});
    }

    get updateAction() {
      return this.__updateAction;
    }

    set updateAction(action) {
      this.__updateAction = action;
      this.setAttribute('update-action', action);
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

      this.onError = this.onError.bind(this);
      this.onInteraction = this.onInteraction.bind(this);
      this.onRegistration = this.onRegistration.bind(this);
      this.track = this.track.bind(this);
      this.update = this.update.bind(this);

      // Check whether the use has interacted with the page yet.
      document.addEventListener('click', this.onInteraction);
      document.addEventListener('keyup', this.onInteraction);
    }

    connectedCallback() {
      this.setAttribute('aria-hidden', true);
      this.registerServiceWorker();
    }

    attributeChangedCallback(name, newVal, oldVal) {
      switch (name) {
        case 'path': this.path = newVal; break;
        case 'scope': this.scope = newVal; break;
        case 'update-action': this.updateAction = newVal; break;
        case 'auto-reload': this.autoReload = newVal; break;
      }
    }

    fire(type, opts) {
      return this.dispatchEvent(
          new CustomEvent(type, {
            bubbles: true,
            composed: true,
            ...opts,
          })
      );
    }

    onInteraction(event) {
      this.interacted = true;
      document.removeEventListener('click', this.onInteraction);
      document.removeEventListener('keyup', this.onInteraction);
    }

    onError(error) {
      this.error = error;
      this.fire('error-changed', {error});
      return error;
    }

    onRegistration(reg) {
      if (reg.active) this.update(reg.active);

      // If there's no previous SW, quit early - this page load is fresh. 🍌
      if (!navigator.serviceWorker.controller) return 'Page fresh.';

      // A new SW is already waiting to activate. Update. 👯
      else if (reg.waiting) return this.update(reg.waiting);

      // A new SW is installing.
      // Listen for updates, then notify when installed. 🍻
      else if (reg.installing) return this.track(reg.installing);

      // Otherwise, when a new service worker arrives, listen for updates,
      // and if it becomes installed, notify the user. 🍷
      else reg.onupdatefound = () =>
        this.track(reg.installing);

      return reg;
    }

    /**
     * Registers a service worker, and prompts to update as needed
     * @param  {Object} options Initialization options
     * @param  {Boolean} [options.autoReload=this.autoReload]  Path to the sw script
     * @param  {String}  [options.path=this.path]              Path to the sw script
     * @param  {String}  [options.scope=this.scope]            Scope of the sw
     * @param  {String}  [options.updateAction=this.updateAction] action to trigger the sw update.
     * @return {Promise<ServiceWorkerRegistration>}
     */
    async registerServiceWorker({
      autoReload = this.autoReload,
      path = this.path,
      scope = this.scope,
      updateAction = this.updateAction,
    }) {
      return (path && scope && updateAction)
        // Register the service worker
        ? navigator.serviceWorker.register(path, {scope})
            .then(this.onRegistration)
            .catch(this.onError)
        : null;
    }

    /**
     * Listen for changes on a new worker, notify when installed. 🍞
     * @param  {ServiceWorker} serviceWorker
     * @return {ServiceWorker}
     */
    track(serviceWorker) {
      serviceWorker.onstatechange = () =>
        serviceWorker.state === 'installed'
          ? this.update(serviceWorker)
          : undefined;
      return serviceWorker;
    }

    /**
       * When an update is found, if user has not yet interacted with the page,
       * reload it for them, otherwise, prompt them to reload 🍩.
       * @param  {ServiceWorker} serviceWorker
       */
    update(serviceWorker) {
      serviceWorker.postMessage({action: this.action});
      this.fire('service-worker-changed', {detail: serviceWorker});
      if (!this.interacted && this.autoReload) location.reload();
    }
  }

  customElements.define(ServiceWorker.is, ServiceWorker);
}
