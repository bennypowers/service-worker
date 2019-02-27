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

    /**
     * If true, when updates are found, the page will automatically
     * reload, so long as the user has not yet interacted with it.
     */
    get autoReload() {
      return this.__autoReload;
    }

    set autoReload(value) {
      this.__autoReload = value;
      if (!value) this.removeAttribute('auto-reload');
      if (value && !this.hasAttribute('auto-reload')) this.setAttribute('auto-reload', '')
    }

    /** Path to the service worker script. */
    get path() {
      return this.__path;
    }

    set path(path) {
      this.__path = path;
      this.registerServiceWorker({path});
      if (this.getAttribute('path') !== path) {
        this.setAttribute('path', path);
      }
    }

    /** Scope for the service worker. */
    get scope() {
      return this.__scope;
    }

    set scope(scope) {
      this.__scope = scope;
      this.registerServiceWorker({scope});
      if (this.getAttribute('scope') !== scope) {
        this.setAttribute('scope', scope);
      }
    }

    /**
     * String passed to serviceWorker which triggers self.skipWaiting().
     * String will be passed in message.action.
     */
    get updateAction() {
      return this.__updateAction;
    }

    set updateAction(action) {
      this.__updateAction = action;
      if (this.getAttribute('update-action') !== action) {
        this.setAttribute('update-action', action);
      }
    }

    constructor() {
      super();

      this.autoReload = false;
      this.updateAction = 'skipWaiting';

      /**
       * Error state of the service-worker registration
       * @type {Error|null}
       */
      this.error = null;

      /** A reference to the service worker instance. */
      this.worker = null;

      this.onError = this.onError.bind(this);
      this.onInteraction = this.onInteraction.bind(this);
      this.onRegistration = this.onRegistration.bind(this);
      this.track = this.track.bind(this);
      this.update = this.update.bind(this);

      // Check whether the user has interacted with the page yet.
      document.addEventListener('click', this.onInteraction);
      document.addEventListener('keyup', this.onInteraction);
    }

    connectedCallback() {
      this.style.display = 'none';
      if (!this.scope) this.scope = '/';
      if (!this.path) this.path = '/service-worker.js';

      this.registerServiceWorker();
    }

    attributeChangedCallback(name, oldVal, newVal) {
      switch (name) {
        case 'path': this.path = newVal; break;
        case 'scope': this.scope = newVal; break;
        case 'update-action': this.updateAction = newVal; break;
        case 'auto-reload': this.autoReload = newVal || newVal === ""; break;
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
      this.registrationInProgress = false;
      this.error = error;
      this.fire('error-changed', {error});
      return error;
    }

    onRegistration(reg) {
      this.registrationInProgress = false;
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

    shouldRegister() {
      return (
        !this.registrationInProgress &&
        this.scope != null &&
        !!this.path &&
        !!this.updateAction
      );
    }

    /**
     * Registers a service worker, and prompts to update as needed
     * @param  {Object} options Initialization options
     * @param  {String}  [options.path=this.path]              Path to the sw script
     * @param  {String}  [options.scope=this.scope]            Scope of the sw
     * @param  {String}  [options.updateAction=this.updateAction] action to trigger the sw update.
     * @return {Promise<ServiceWorkerRegistration>}
     */
    async registerServiceWorker({
      path = this.path,
      scope = this.scope,
      updateAction = this.updateAction,
    } = {}) {
      if (!this.shouldRegister()) return;
      this.registrationInProgress = true;
      return navigator.serviceWorker.register(path, {scope})
        .then(this.onRegistration)
        .catch(this.onError);
    }

    /**
     * Listen for changes on a new worker, notify when installed. 🍞
     * @param  {ServiceWorker} serviceWorker
     * @return {ServiceWorker}
     */
    track(serviceWorker) {
      serviceWorker.onstatechange = () =>
        serviceWorker.state !== 'installed' ? undefined
          : this.update(serviceWorker);
      return serviceWorker;
    }

    /**
       * When an update is found, if user has not yet interacted with the page,
       * reload it for them, otherwise, prompt them to reload 🍩.
       * @param  {ServiceWorker} serviceWorker
       * @return {ServiceWorker}
       */
    update(serviceWorker) {
      serviceWorker.postMessage({action: this.action});
      this.fire('service-worker-changed', {detail: serviceWorker});
      const shouldReload = (
        !this.interacted &&
        this.autoReload &&
        serviceWorker.state === 'waiting'
      );
      if (shouldReload) location.reload();
      return serviceWorker;
    }
  }

  customElements.define(ServiceWorker.is, ServiceWorker);
}
