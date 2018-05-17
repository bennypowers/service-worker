let snackbar;

const MDL_SCRIPT_SRC = 'https://code.getmdl.io/1.3.0/material.min.js';
const MDL_STYLESHEET_HREF = 'https://code.getmdl.io/1.3.0/material.indigo-pink.min.css';
const MATERIAL_ICON_FONT_HREF = 'https://fonts.googleapis.com/icon?family=Material+Icons';

const isMdlStylesheetLink = link =>
  link.href === MDL_STYLESHEET_HREF;

const isMaterialIconFontLink = link =>
  link.href === MATERIAL_ICON_FONT_HREF;

const loadStylesheet = href => new Promise((resolve, reject) => {
  const link = document.createElement('link');
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
  document.head.appendChild(link);
});

const loadMdlStylesheet = loadStylesheet(MDL_STYLESHEET_HREF);
const loadMaterialIconFont = loadStylesheet(MATERIAL_ICON_FONT_HREF);

const loadAsync = src => new Promise( async (resolve, reject) => {
  const stylesheets = [...document.head.querySelectorAll('link[rel="stylesheet"]')];
  const stylesLoaded = stylesheets.some(isMdlStylesheetLink)
  const fontLoaded = stylesheets.some(isMaterialIconFontLink)
  if (!stylesLoaded) await loadMdlStylesheet();
  if (!fontsLoaded) await loadMaterialIconFont();
  if ('componentHandler' in window) resolve();
  const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        script.src = src;
  document.head.appendChild(script)
});

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
   * @customElement
   * @extends HTMLElement
   *
   * @demo demo/index.html
   */
    class ServiceWorker extends HTMLElement {
      static get is() {return ;}

      static get observedAttributes() {
        return [
          'auto-reload',
          'language',
          'path',
          'scope',
          'toast-duration',
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
         * language for strings.
         * e.g. 'he'. defaults to first 2 chars of document lang or 'en'.
         */
        this.language = document.documentElement.lang.substring(0, 2) || 'en';

        /** A reference to the service worker instance. */
        this.worker = null;

        /**
         * String passed to serviceWorker which triggers self.skipWaiting().
         * String will be passed in message.action.
         */
        this.updateAction = 'skipWaiting';

        /** Reference to the toast element. */
        this.toast = null;

        /** Duration of the toast. */
        this.toastDuration = 10000,

        /** Scope for the service worker. */
        this.scope = '/';

        /** Path to the service worker script. */
        this.path = '/service-worker.js';

        /** i18n strings. */
        this.resources = {

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

        }
      }

      connectedCallback() {
        const { autoReload, path, scope, updateAction } = this;
        this.registerServiceWorker({ autoReload, path, scope, updateAction });
      }

      attributeChangedCallback(name, newVal, oldVal) {
        switch (name) {
          case 'path':
            this.path = newVal;
            this.registerServiceWorker({ path: newVal });
            break;
          case 'scope': this.scope = newVal; break;
          case 'toast-duration': this.toastDuration = newVal; break;
          case 'update-action': this.updateAction = newVal; break;
          case 'auto-reload': this.autoReload = this.hasAttribute(name); break;
          case 'language': this.language = newVal; break;
        }
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

        const actionHandler = () => window.location.reload();
        const actionText = this.localize('ok');
        const message = `${this.localize('newVersion')} ${this.localize('clickToUpdate')}`;
        const timeout = this.toastDuration;

        if (!window.componentHandler) {
          await loadAsync(MDL_SCRIPT_SRC)
        }

        if (!this.toast) {
          const { html, render } = await import('lit-html/lit-html.js');
          const temp = document.createElement('div')
          const snackbarTemplate = html`
            <div class="mdl-snackbar mdl-js-snackbar"
                aria-live="assertive"
                aria-atomic="true"
                aria-relevant="text">
              <div class="mdl-snackbar__text"></div>
              <button type="button" class="mdl-snackbar__action"></button>
            </div>`;

          render(snackbarTemplate, temp)
          snackbar  = temp.firstElementChild;
          this.toast = snackbar;
          document.body.appendChild(toast);
        }

        this.toast.MaterialSnackbar.showSnackbar({
          actionHandler,
          actionText,
          message,
          timeout,
        });
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
      async registerServiceWorker({ autoReload, path, scope, updateAction: action }) {
        if (!path || !scope || !action) return;
        let shouldToast = true;

        // When an update is found, if user has not yet interacted with the page,
        // reload it for them, otherwise, prompt them to reload 🍩.
        const update = (serviceWorker) => {
          serviceWorker.postMessage({ action });
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

        if (reg.active) this.worker = reg.active;

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

    customElements.define('service-worker', ServiceWorker);
  }
