let interacted = false;

class ServiceWorkerEvent extends Event {
  constructor(type: string) {
    super(type, { bubbles: true, composed: true });
  }
}

export class ServiceWorkerChangeEvent extends ServiceWorkerEvent {
  /** @deprecated */
  get detail() { return { value: this.serviceWorker }; }
  constructor(public serviceWorker: ServiceWorker) {
    super('change');
  }
}

export class ServiceWorkerMessageEvent extends ServiceWorkerEvent {
  /** @deprecated */
  get detail() { return { value: this.message }; }
  constructor(public message: Event) {
    super('message');
  }
}

export class ServiceWorkerErrorEvent extends Event {
  constructor(public error: Error) {
    super('error');
  }
}

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
 * @fires {ServiceWorkerChangeEvent} 'change' - When the service worker changes
 * @fires {ServiceWorkerErrorEvent} 'error' - When an error occurs
 * @fires {ServiceWorkerMessageEvent} 'message' - When a message is received on the broadcast channel
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

  /** A reference to the service worker instance. */
  serviceWorker: ServiceWorker|null = null;

  #registrationInProgress = false;

  #error: Error;

  /**
   * If true, when updates are found, the page will automatically
   * reload, so long as the user has not yet interacted with it.
   * @attr [auto-reload=false]
   */
  get autoReload(): boolean {
    return this.hasAttribute('auto-reload');
  }

  set autoReload(value) {
    this.toggleAttribute('auto-reload', value);
  }

  /**
   * True when the service worker is installed.
   * @attr [installed=false]
   */
  get installed(): boolean {
    return this.hasAttribute('installed');
  }

  set installed(value) {
    this.toggleAttribute('installed', value);
  }

  /**
   * Error state of the service-worker registration
   * @attr error - the error message
   */
  get error(): Error {
    return this.#error ?? null;
  }

  set error(value) {
    if (value) {
      if (value instanceof Error)
        this.setAttribute('error', value.message);
      else
        throw new Error('error must be an instance of Error');
    } else
      this.removeAttribute('error');

    this.#error = value;
  }

  /**
   * Channel name for communicating with the service worker.
   * @attr [channel-name=service-worker]
   */
  get channelName(): string|null {
    return this.getAttribute('channel-name') || 'service-worker';
  }

  set channelName(channelName) {
    if (channelName != null)
      this.setAttribute('channel-name', channelName);
    else
      this.removeAttribute('channel-name');
    this.#updateChannelName();
  }

  /**
   * Path to the service worker script.
   * @attr [path=/service-worker.js]
   */
  get path(): string {
    return this.getAttribute('path') || '/service-worker.js';
  }

  set path(path: string|null) {
    if (path != null)
      this.setAttribute('path', path);
    else
      this.removeAttribute('path');
    this.#updateConfig();
  }

  /**
   * Scope for the service worker.
   * @attr [scope=/]
   */
  get scope(): string {
    return this.getAttribute('scope') || '/';
  }

  set scope(scope: string|null) {
    if (scope != null)
      this.setAttribute('scope', scope);
    else
      this.removeAttribute('scope');
    this.#updateConfig();
  }

  /**
   * String passed to serviceWorker which triggers self.skipWaiting().
   * String will be passed in message.action.
   * @attr [update-action=skipWaiting]
   */
  get updateAction(): string|null {
    return this.getAttribute('update-action') || 'skipWaiting';
  }

  set updateAction(updateAction) {
    if (updateAction != null)
      this.setAttribute('update-action', updateAction);
    else
      this.removeAttribute('update-action');
  }

  /**
   * @type {boolean}
   */
  get #shouldRegister(): boolean {
    return (
      this.isConnected &&
       !this.#registrationInProgress &&
        this.scope != null &&
      !!this.path &&
      !!this.updateAction
    );
  }

  constructor() {
    super();
    this.#updateConfig();
    this.#updateChannelName();
  }

  connectedCallback() {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(':host { display: none; }');
    this.attachShadow({ mode: 'open' }).adoptedStyleSheets = [sheet];
    this.registerServiceWorker();
  }

  attributeChangedCallback(name: string, oldVal: string|null, newVal: string|null) {
    if (oldVal === newVal) return;
    switch (name) {
      case 'path': this.path = newVal; break;
      case 'scope': this.scope = newVal; break;
      case 'channel-name': this.channelName = newVal; break;
      case 'update-action': this.updateAction = newVal; break;
    }
  }

  /**
   * Registers a service worker, and prompts to update as needed
   */
  async registerServiceWorker(
    options?: Partial<Pick<ServiceWorkerElement, 'path'|'scope'|'updateAction'>>
  ): Promise<ServiceWorkerRegistration|void> {
    const { path = this.path, scope = this.scope } = options ?? this;
    if (!this.#shouldRegister || !path) return;
    this.#registrationInProgress = true;
    try {
      const registration = await navigator.serviceWorker.register(path, { scope });
      return this.#onRegistration(registration);
    } catch (error) {
      this.#onError(error);
    }
  }

  #updateConfig() {
    const { path, scope } = this;
    this.registerServiceWorker({ path, scope });
  }

  #channel: BroadcastChannel;

  #updateChannelName() {
    if (this.channelName) {
      this.#channel?.removeEventListener('message', this.#onMessage);
      this.#channel = new BroadcastChannel(this.channelName);
      this.#channel.addEventListener('message', this.#onMessage);
    }
  }

  /**
   * Sets the error property
   */
  #onError(error: Error): Error {
    this.error = error;
    this.#registrationInProgress = false;
    this.dispatchEvent(new ServiceWorkerErrorEvent(error));
    return error;
  }

  /**
   * @param message message event from the BroadcastChannel
   */
  #onMessage = (message: Event) => this.dispatchEvent(new ServiceWorkerMessageEvent(message));

  #fresh: boolean;

  #onRegistration(reg: ServiceWorkerRegistration): ServiceWorkerRegistration {
    this.#registrationInProgress = false;
    this.#fresh = !navigator.serviceWorker.controller;

    if (reg.active)
      this.#update(reg.active);

    // A new SW is already waiting to activate. Update. 👯
    else if (reg.waiting)
      this.#update(reg.waiting);

    // A new SW is installing.
    // Listen for updates, then notify when installed. 🍻
    else if (reg.installing)
      this.#track(reg.installing);

    // Otherwise, when a new service worker arrives, listen for updates,
    // and if it becomes installed, notify the user. 🍷
    else reg.onupdatefound = () => reg.installing && this.#track(reg.installing);

    return reg;
  }

  /**
   * Listen for changes on a new worker, notify when installed. 🍞
   */
  #track(serviceWorker: ServiceWorker): ServiceWorker {
    serviceWorker.onstatechange = () =>
        serviceWorker.state !== 'installed' ? undefined
      : this.#update(serviceWorker);
    return serviceWorker;
  }

  /**
   * When an update is found, if user has not yet interacted with the page,
   * reload it for them, otherwise, prompt them to reload 🍩.
   */
  #update(serviceWorker: ServiceWorker): ServiceWorker {
    if (serviceWorker.state === 'installed')
      this.installed = true;
    this.serviceWorker = serviceWorker;
    if (this.dispatchEvent(new ServiceWorkerChangeEvent(serviceWorker))) {
      const { autoReload, installed, updateAction: action } = this;
      if (installed) serviceWorker.postMessage({ action });
      if (!this.#fresh && !interacted && autoReload && installed) this.#refresh();
    }
    return serviceWorker;
  }

  #refresh() {
    window.location.reload();
  }
}

/**
 * Sets the `interacted` boolean
 */
function onInteraction() {
  interacted = true;
}

if ('serviceWorker' in navigator) {
  customElements.define('service-worker', ServiceWorkerElement);
  // Check whether the user has interacted with the page yet.
  document.addEventListener('click', onInteraction, { once: true });
  document.addEventListener('keyup', onInteraction, { once: true });
}


