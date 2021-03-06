let interacted = false;

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
 * @fires 'change' - When the service worker changes
 * @fires 'error' - When an error occurs
 * @fires 'message' - When a message is received on the broadcast channel
 */
export class ServiceWorkerElement extends HTMLElement {
  static get is() { return 'service-worker'; }

  static get observedAttributes() {
    return [
      'channel-name',
      'path',
      'scope',
      'update-action',
    ];
  }

  /**
   * If true, when updates are found, the page will automatically
   * reload, so long as the user has not yet interacted with it.
   * @attr {boolean} [auto-reload=false]
   */
  get autoReload() {
    return this.hasAttribute('auto-reload');
  }

  set autoReload(value) {
    if (value) this.setAttribute('auto-reload', '');
    else this.removeAttribute('auto-reload');
  }

  /**
   * True when the service worker is installed.
   * @attr {boolean} [installed=false]
   */
  get installed() {
    return this.hasAttribute('installed');
  }

  set installed(value) {
    if (value) this.setAttribute('installed', '');
    else this.removeAttribute('installed');
  }

  /**
   * Error state of the service-worker registration
   * @type {Error}
   * @attr error - the error message
   */
  get error() {
    return this.__error;
  }

  set error(value) {
    if (value) {
      if (value instanceof Error)
        this.setAttribute('error', value.message);
      else
        throw new Error('error must be an instance of Error');
    } else
      this.removeAttribute('error');

    this.__error = value;
  }

  /**
   * Channel name for communicating with the service worker.
   * @type {string}
   * @attr [channel-name=service-worker]
   */
  get channelName() {
    return this.__channelName;
  }

  set channelName(channelName) {
    if (this.__channelName === channelName) return;
    this.__channelName = channelName;
    if (channelName != null) this.setAttribute('channel-name', channelName);
    else this.removeAttribute('channel-name');

    if (this.channel)
      this.channel.removeEventListener('message', this.onMessage);

    this.channel =
      new BroadcastChannel(this.channelName);

    this.channel.addEventListener('message', this.onMessage);
  }

  /**
   * Path to the service worker script.
   * @type {string}
   * @attr [path=/service-worker.js]
   */
  get path() {
    return this.__path;
  }

  set path(path) {
    if (this.__path === path) return;
    this.__path = path;
    if (path != null) this.setAttribute('path', path);
    else this.removeAttribute('path');
    this.registerServiceWorker({ path });
  }

  /**
   * Scope for the service worker.
   * @type {string}
   * @attr [scope=/]
   */
  get scope() {
    return this.__scope;
  }

  set scope(scope) {
    if (this.__scope === scope) return;
    this.__scope = scope;
    if (scope != null) this.setAttribute('scope', scope);
    else this.removeAttribute('scope');
    this.registerServiceWorker({ scope });
  }

  /**
   * String passed to serviceWorker which triggers self.skipWaiting().
   * String will be passed in message.action.
   * @attr [update-action=skipWaiting]
   * @type {string}
   */
  get updateAction() {
    return this.__updateAction;
  }

  set updateAction(updateAction) {
    if (this.__updateAction === updateAction) return;
    this.__updateAction = updateAction;
    if (updateAction != null) this.setAttribute('update-action', updateAction);
    else this.removeAttribute('update-action');
  }

  /**
   * @private
   * @type {boolean}
   */
  get shouldRegister() {
    return (
      this.isConnected &&
        !this.registrationInProgress &&
        this.scope != null &&
        !!this.path &&
        !!this.updateAction
    );
  }

  /** Whether the user has interacted with the page since load */
  get interacted() {
    return interacted;
  }

  constructor() {
    super();

    /** @private */
    this.onMessage = this.onMessage.bind(this);

    this.installed = false;

    this.updateAction = this.getAttribute('update-action') || 'skipWaiting';

    this.error = null;

    this.channelName = this.getAttribute('channel-name') || 'service-worker';

    this.path = this.getAttribute('path') || '/service-worker.js';

    this.scope = this.getAttribute('scope') || '/';

    /**
     * A reference to the service worker instance.
     * @type {ServiceWorker}
     */
    this.serviceWorker = null;

    // Check whether the user has interacted with the page yet.
    document.addEventListener('click', this.onInteraction, { once: true });
    document.addEventListener('keyup', this.onInteraction, { once: true });
  }

  connectedCallback() {
    this.style.display = 'none';
    this.registerServiceWorker();
  }

  attributeChangedCallback(name, oldVal, newVal) {
    switch (name) {
      case 'path': this.path = newVal; break;
      case 'scope': this.scope = newVal; break;
      case 'channel-name': this.channelName = newVal; break;
      case 'update-action': this.updateAction = newVal; break;
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
  async registerServiceWorker(options = this) {
    const { path = this.path, scope = this.scope } = options;
    if (!this.shouldRegister) return;
    this.registrationInProgress = true;
    try {
      const registration = await navigator.serviceWorker.register(path, { scope });
      return this.onRegistration(registration);
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * Fire an event
   * @param  {string} type
   * @param  {CustomEventInit|ErrorEventInit} opts
   * @return {boolean}
   * @private
   */
  fire(type, opts) {
    const event = type === 'error' ? new ErrorEvent(type, opts) : new CustomEvent(type, opts);
    return this.dispatchEvent(event);
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
    this.fire('error', { error });
    return error;
  }

  /**
   * @param {Event} event message event from the BroadcastChannel
   * @private
   */
  onMessage(event) {
    this.fire('message', { detail: event });
  }

  /**
   * Sets the `interacted` boolean
   * @private
   */
  onInteraction() {
    interacted = true;
  }

  /**
   * @param  {ServiceWorkerRegistration} reg
   * @return {ServiceWorkerRegistration}
   * @private
   */
  onRegistration(reg) {
    this.registrationInProgress = false;
    this.fresh = !navigator.serviceWorker.controller;

    if (reg.active)
      this.update(reg.active);

    // A new SW is already waiting to activate. Update. 👯
    else if (reg.waiting)
      this.update(reg.waiting);

    // A new SW is installing.
    // Listen for updates, then notify when installed. 🍻
    else if (reg.installing)
      this.track(reg.installing);

    // Otherwise, when a new service worker arrives, listen for updates,
    // and if it becomes installed, notify the user. 🍷
    else reg.onupdatefound = () => this.track(reg.installing);

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
    if (serviceWorker.state === 'installed')
      this.installed = true;
    this.serviceWorker = serviceWorker;
    this.fire('change', { detail: { value: serviceWorker } });
    const { autoReload, installed, interacted, fresh, updateAction: action } = this;
    if (installed) serviceWorker.postMessage({ action });
    if (!fresh && !interacted && autoReload && installed) this.refresh();
    return serviceWorker;
  }

  /** @private */
  refresh() {
    window.location.reload();
  }
}

/* istanbul ignore else */
if ('serviceWorker' in navigator)
  customElements.define('service-worker', ServiceWorkerElement);
