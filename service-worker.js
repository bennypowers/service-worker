/* istanbul ignore else */
if ('serviceWorker' in navigator) {
  /**
   * Custom Element for declaratively adding a service worker with optional auto-update.
   *
   * @example
   * ```html
   * <service-worker id="serviceWorker"
   *     path="./service-worker.js"
   *     scope="/muh-data/"
   *     auto-reload
   * ></service-worker>
   * ```
   *
   * @element service-worker
   *
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
     * @attr auto-reload
     */
    get autoReload() {
      return !!this.__autoReload;
    }

    set autoReload(value) {
      this.__autoReload = !!value;
      if (value) this.setAttribute('auto-reload', '');
      else this.removeAttribute('auto-reload');
    }

    }

    /**
     * Path to the service worker script.
     * @type {string}
     * @attr path
     */
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

    /**
     * Scope for the service worker.
     * @type {string}
     * @attr scope
     */
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
     * @attr update-action
     * @type {string}
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

    /**
     * @private
     * @return {boolean}
     */
    get shouldRegister() {
      return (
        !this.registrationInProgress &&
        this.scope != null &&
        !!this.path &&
        !!this.updateAction
      );
    }

    constructor() {
      super();

      this.interacted = false;

      this.autoReload = false;

      this.updateAction = 'skipWaiting';

      /**
       * Error state of the service-worker registration
       * @type {Error|null}
       */
      this.error = null;

      this.path = '/service-worker.js';

      this.scope = '/';

      /**
       * A reference to the service worker instance.
       * @type {ServiceWorker}
       */
      this.worker = null;

      const onInteraction = () => this.interacted = true;

      // Check whether the user has interacted with the page yet.
      document.addEventListener('click', onInteraction, {once: true});
      document.addEventListener('keyup', onInteraction, {once: true});
    }

    connectedCallback() {
      this.style.display = 'none';
      this.registerServiceWorker();
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      switch (name) {
        case 'path': this.path = newVal; break;
        case 'scope': this.scope = newVal; break;
        case 'update-action': this.updateAction = newVal; break;
        case 'auto-reload': this.autoReload = !!newVal || newVal === ''; break;
      }
    }

    /**
     * Registers a service worker, and prompts to update as needed
     * @param  {Object} options Initialization options
     * @param  {String}  [options.path=this.path]              Path to the sw script
     * @param  {String}  [options.scope=this.scope]            Scope of the sw
     * @param  {String}  [options.updateAction=this.updateAction] action to trigger the sw update.
     * @return {Promise<ServiceWorkerRegistration>}
     */
    async registerServiceWorker({path = this.path, scope = this.scope} = {}) {
      if (!this.shouldRegister) return;
      this.registrationInProgress = true;
      try {
        const reg = await navigator.serviceWorker.register(path, {scope});
        return this.onRegistration(reg);
      } catch (error) {
        this.onError(error);
      }
    }

    /**
     * Fire an event
     * @param  {string} type
     * @param  {EventInit} opts
     * @return {boolean}
     * @private
     */
    fire(type, opts) {
      return this.dispatchEvent(
          new CustomEvent(type, {
            bubbles: true,
            composed: true,
            ...opts,
          })
      );
    }

    /** @private */
    onInteraction() {
      this.interacted = true;
      document.removeEventListener('click', this.onInteraction);
      document.removeEventListener('keyup', this.onInteraction);
    }

    /**
     * Sets the error property
     * @param  {Error} error
     * @return {Error}
     * @private
     */
    onError(error) {
      this.error = error;
      this.registrationInProgress = false;
      this.fire('error-changed', {error});
      return error;
    }

    /**
     * @param  {ServiceWorkerRegistration} reg
     * @return {ServiceWorkerRegistration|string}
     * @private
     */
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

    /**
     * Listen for changes on a new worker, notify when installed. 🍞
     * @param  {ServiceWorker} serviceWorker
     * @return {ServiceWorker}
     * @private
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
       * @private
       */
    update(serviceWorker) {
      const detail = serviceWorker
      const installed = serviceWorker.state === 'installed'
      const { interacted, autoReload, action } = this;

      if (installed) serviceWorker.postMessage({action});
      if (!interacted && autoReload && installed) location.reload();

      this.fire('service-worker-changed', {detail});
      return serviceWorker;
    }
  }

  customElements.define(ServiceWorker.is, ServiceWorker);
}
