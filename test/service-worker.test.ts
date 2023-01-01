import type { SinonStub } from 'sinon';
import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import sinon from 'sinon';
import {
  ServiceWorkerChangeEvent,
  ServiceWorkerElement,
  ServiceWorkerMessageEvent,
} from '../service-worker-element.js';

async function unregisterAllServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  return await Promise.all(registrations.map(r => r.unregister()));
}

if ('serviceWorker' in navigator) {
  before(unregisterAllServiceWorkers);
  after(unregisterAllServiceWorkers);
  beforeEach(unregisterAllServiceWorkers);
  afterEach(unregisterAllServiceWorkers);

  describe('<service-worker> when supported', function() {
    it('instantiating the element works', function() {
      expect(() => document.createElement('service-worker')).to.not.throw;
    });

    it('has a static is property', async function() {
      expect(ServiceWorkerElement.is).to.equal('service-worker');
    });

    describe('defaults', function() {
      let element: ServiceWorkerElement;
      let stub: SinonStub;
      beforeEach(function() {
        stub = sinon.stub(navigator.serviceWorker, 'register');
      });

      beforeEach(async function() {
        element = await fixture(html`<service-worker path="./sw.js"></service-worker>`);
      });

      afterEach(function() {
        stub.resetHistory();
        stub.restore();
      });

      beforeEach(async function() {
        element = await fixture(html`<service-worker></service-worker>`);
      });

      it('path', function() {
        expect(element.path).to.equal('/service-worker.js');
      });

      it('scope', function() {
        expect(element.scope, 'prop').to.equal('/');
        expect(element.getAttribute('scope'), 'attr').to.be.null;
      });

      it('autoReload', function() {
        expect(element.autoReload).to.be.false;
        expect(element.hasAttribute('auto-reload')).to.be.false;
      });

      it('updateAction', function() {
        expect(element.updateAction).to.equal('skipWaiting');
        expect(element.hasAttribute('update-action')).to.be.false;
      });

      describe('disconnecting the element', function() {
        beforeEach(function() {
          element.remove();
        });
        describe('then setting path', function() {
          beforeEach(function() {
            stub.resetHistory();
            element.path = './sw.js';
          });
          it('setting path does not register service-worker', function() {
            expect(stub.calledWith('./sw.js')).to.be.false;
          });
        });
      });
    });

    describe('path attribute', function() {
      let element: ServiceWorkerElement;
      let stub: SinonStub;
      beforeEach(async function() {
        stub = sinon.stub(navigator.serviceWorker, 'register');
      });

      beforeEach(async function() {
        element = await fixture(html`<service-worker path="./sw.js"></service-worker>`);
      });

      afterEach(function() {
        stub.restore();
      });

      it('sets path property', function() {
        expect(element.path).to.equal('./sw.js');
      });

      describe('when connected', function() {
        it('registers the service worker', function() {
          expect(stub.calledWith('./sw.js')).to.be.true;
        });
      });

      describe('unsetting path', function() {
        beforeEach(function() {
          stub.resetHistory();
          element.path = null;
        });
        it('reflects path property', async function() {
          expect(element.hasAttribute('path')).to.be.false;
        });
      });
    });

    describe('scope attribute', function() {
      const scope = '/party';
      it('sets scope property', async function() {
        const element: ServiceWorkerElement = await fixture(html`<service-worker scope="${scope}"></service-worker>`);
        expect(element.scope).to.equal(scope);
      });

      it('reflects scope property', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
        element.scope = scope;
        expect(element.getAttribute('scope')).to.equal(scope);
        element.scope = null;
        expect(element.hasAttribute('scope')).to.be.false;
      });

      describe('when connected', function() {
        it('setting it registers service-worker', async function() {
          const stub = sinon.stub(navigator.serviceWorker, 'register');
          const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
          element.scope = '/scope';
          expect(stub)
            .to
            .have
            .been
            .calledWith(sinon.match.string, sinon.match({ scope: '/scope' }));
          stub.restore();
        });
      });

      describe('when not connected', function() {
        it('setting it does not register service-worker', async function() {
          const spy = sinon.spy(navigator.serviceWorker, 'register');
          const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
          element.remove();
          element.scope = '/scope';
          expect(spy)
            .to
            .not
            .have
            .been
            .calledWith(sinon.match.string, sinon.match({ scope: '/scope' }));
          spy.restore();
        });
      });
    });

    describe('auto-reload attribute', function() {
      it('sets autoReload property', async function() {
        const element: ServiceWorkerElement = await fixture(html`<service-worker auto-reload></service-worker>`);
        expect(element.autoReload).to.be.true;
      });

      it('reflects autoReload property', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
        element.autoReload = true;
        expect(element.hasAttribute('auto-reload')).to.be.true;
      });

      it('reflects autoReload property as boolean attribute', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker auto-reload></service-worker>`);
        element.autoReload = false;
        expect(element.autoReload).to.be.false;
        expect(element.hasAttribute('auto-reload')).to.be.false;
      });
    });

    describe('error property', function() {
      it('reflects message to error attribute', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
        element.error = new Error('boo');
        expect(element.getAttribute('error')).to.equal('boo');
        expect(element.error).to.be.an.instanceof(Error);
      });

      it('must be an error', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
        const initial = element.error;
        try {
          // @ts-expect-error: testing bad setter
          element.error = 'hah';
          expect.fail('was able to set a non-Error error value');
        } catch (e) {
          expect(e.message).to.equal('error must be an instance of Error');
          expect(element.error).to.equal(initial);
        }
      });
    });

    describe('update-action attribute', function() {
      const updateAction = 'party';
      it('sets updateAction property', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker update-action="${updateAction}"></service-worker>`);
        expect(element.updateAction).to.equal(updateAction);
      });

      it('reflects updateAction property', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
        element.updateAction = updateAction;
        expect(element.getAttribute('update-action')).to.equal(updateAction);
        element.updateAction = null;
        expect(element.hasAttribute('update-action')).to.be.false;
      });
    });

    describe('channel-name attribute', function() {
      const channelName = 'party';
      it('sets channelName property', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker channel-name="${channelName}"></service-worker>`);
        expect(element.channelName).to.equal(channelName);
      });

      it('reflects channelName property', async function() {
        const element: ServiceWorkerElement = await fixture(`<service-worker></service-worker>`);
        element.channelName = channelName;
        expect(element.getAttribute('channel-name')).to.equal(channelName);
        element.channelName = null;
        expect(element.hasAttribute('channel-name')).to.be.false;
      });
    });

    describe('when service worker is installed', function() {
      it('fires the change event', async function() {
        let resolve: (v: Event|PromiseLike<Event>) => void = () => new Event('fail');
        const p = new Promise(r => resolve = r);
        const element: ServiceWorkerElement = await fixture(html`
          <service-worker @change="${resolve}"></service-worker>
        `);
        await nextFrame();
        element.path = 'test-sw.js';
        const event = await p as ServiceWorkerChangeEvent;
        expect(element.serviceWorker).to.equal(event.serviceWorker);
      });

      it('receives messages on the broadcast channel', async function() {
        let resolve: (v: Event|PromiseLike<Event>) => void = () => new Event('fail');
        const p = new Promise(r => resolve = r);
        const element: ServiceWorkerElement = await fixture(html`<service-worker @message="${resolve}"></service-worker>`);
        await nextFrame();
        element.path = 'broadcast-sw.js';
        const event = await p as ServiceWorkerMessageEvent;
        expect((event.message as any).data.action).to.equal('install');
      });
    });

    // TODO: toasting and reloading
    // TODO: i18n
  });
} else {
  describe('<service-worker> when unsupported', function() {
    it('element is not defined', function() {
      expect(customElements.get('service-worker')).to.not.be.ok;
    });
  });
}
