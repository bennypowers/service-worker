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
declare class ServiceWorkerElement extends HTMLElement {
    static get is(): string;
    static get observedAttributes(): string[];
    set autoReload(arg: boolean);
    /**
       * If true, when updates are found, the page will automatically
       * reload, so long as the user has not yet interacted with it.
       * @attr auto-reload
       */
    get autoReload(): boolean;
    __autoReload: any;
    set error(arg: Error);
    /**
       * Error state of the service-worker registration
       * @type {Error}
       * @attr error - the error message
       */
    get error(): Error;
    __error: Error;
    set channelName(arg: string);
    /**
       * Channel name for communicating with the service worker.
       * @type {string}
       * @attr channel-name
       */
    get channelName(): string;
    __channelName: string;
    set path(arg: string);
    /**
       * Path to the service worker script.
       * @type {string}
       * @attr path
       */
    get path(): string;
    __path: string;
    set scope(arg: string);
    /**
       * Scope for the service worker.
       * @type {string}
       * @attr scope
       */
    get scope(): string;
    __scope: string;
    set updateAction(arg: string);
    /**
       * String passed to serviceWorker which triggers self.skipWaiting().
       * String will be passed in message.action.
       * @attr update-action
       * @type {string}
       */
    get updateAction(): string;
    __updateAction: string;
    /**
       * @private
       * @return {boolean}
       */
    get shouldRegister(): boolean;
    /** True when the service worker is installed */
    installed: boolean;
    /** True when the page has been interacted with */
    interacted: boolean;
    /**
       * BroadcastChannel for communicating with the service worker
       * @type {BroadcastChannel}
       */
    channel: BroadcastChannel;
    /**
       * A reference to the service worker instance.
       * @type {ServiceWorker}
       */
    serviceWorker: ServiceWorker;
    connectedCallback(): void;
    /**
         * @param {string} name
         * @param {string} oldVal
         * @param {string} newVal
         */
    attributeChangedCallback(name: string, oldVal: string, newVal: string): void;
    /**
       * Registers a service worker, and prompts to update as needed
       * @param  {Object} options Initialization options
       * @param  {String}  [options.path=this.path]              Path to the sw script
       * @param  {String}  [options.scope=this.scope]            Scope of the sw
       * @param  {String}  [options.updateAction=this.updateAction] action to trigger the sw update.
       * @return {Promise<ServiceWorkerRegistration>}
       */
    registerServiceWorker({ path, scope }?: {
        path?: string;
        scope?: string;
        updateAction?: string;
    }): Promise<ServiceWorkerRegistration>;
    registrationInProgress: boolean;
    /**
       * Fire an event
       * @param  {string} type
       * @param  {CustomEventInit|ErrorEventInit} opts
       * @return {boolean}
       * @private
       */
    fire(type: string, opts: ErrorEventInit | CustomEventInit<any>): boolean;
    /**
       * Sets the error property
       * @param  {Error} error
       * @return {Error}
       * @private
       */
    onError(error: Error): Error;
    /**
       * @param  {ServiceWorkerRegistration} reg
       * @return {ServiceWorkerRegistration}
       * @private
       */
    onRegistration(reg: ServiceWorkerRegistration): ServiceWorkerRegistration;
    fresh: boolean;
    /**
       * Listen for changes on a new worker, notify when installed. 🍞
       * @param  {ServiceWorker} serviceWorker
       * @return {ServiceWorker}
       * @private
       */
    track(serviceWorker: ServiceWorker): ServiceWorker;
    /**
         * When an update is found, if user has not yet interacted with the page,
         * reload it for them, otherwise, prompt them to reload 🍩.
         * @param  {ServiceWorker} serviceWorker
         * @return {ServiceWorker}
         * @private
         */
    update(serviceWorker: ServiceWorker): ServiceWorker;
    /** @private */
    refresh(): void;
}
