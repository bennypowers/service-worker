/* eslint-env mocha */
import {expect, fixture, oneEvent} from '@open-wc/testing';
import '../service-worker.js';
import sinon from 'sinon';

async function unregisterAllServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  return await Promise.all(registrations.map((r) => r.unregister()));
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

    describe('defaults', function() {
      const path = '/service-worker.js';
      const scope = '/';
      const updateAction = 'skipWaiting';
      it('path', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        expect(element.path).to.equal(path);
        expect(element.path).to.equal(path);
      });

      it('scope', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        expect(element.scope).to.equal(scope);
        expect(element.getAttribute('scope')).to.equal(scope);
      });

      it('autoReload', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        expect(element.autoReload).to.be.false;
        expect(element.hasAttribute('auto-reload')).to.be.false;
      });

      it('updateAction', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        expect(element.updateAction).to.equal(updateAction);
        expect(element.hasAttribute('updateAction')).to.be.false;
      });
    });

    describe('path attribute', function() {
      it('sets path property', async function() {
        const element = await fixture(`<service-worker path="./sw.js"></service-worker>`);
        expect(element.path).to.equal('./sw.js');
      });

      it('reflects path property', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        element.path = './sw.js';
        expect(element.getAttribute('path')).to.equal('./sw.js');
        element.path = null;
        expect(element.hasAttribute('path')).to.be.false;
      });

      describe('when connected', function() {
        it('setting it registers service-worker', async function() {
          const stub = sinon.stub(navigator.serviceWorker, 'register');
          const element = await fixture(`<service-worker></service-worker>`);
          element.path = './sw.js';
          expect(stub).to.have.been.calledWith('./sw.js');
          stub.restore();
        });
      });

      describe('when not connected', function() {
        it('setting it does not register service-worker', async function() {
          const spy = sinon.spy(navigator.serviceWorker, 'register');
          const element = await fixture(`<service-worker></service-worker>`);
          element.remove();
          element.path = './sw.js';
          expect(spy).to.not.have.been.calledWith('./sw.js');
          spy.restore();
        });
      });
    });

    describe('scope attribute', function() {
      const scope = '/party';
      it('sets scope property', async function() {
        const element = await fixture(`<service-worker scope="${ scope }"></service-worker>`);
        expect(element.scope).to.equal(scope);
      });

      it('reflects scope property', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        element.scope = scope;
        expect(element.getAttribute('scope')).to.equal(scope);
        element.scope = null;
        expect(element.hasAttribute('scope')).to.be.false;
      });

      describe('when connected', function() {
        it('setting it registers service-worker', async function() {
          const stub = sinon.stub(navigator.serviceWorker, 'register');
          const element = await fixture(`<service-worker></service-worker>`);
          element.scope = '/scope';
          expect(stub).to.have.been.calledWith(sinon.match.string, sinon.match({scope: '/scope'}));
          stub.restore();
        });
      });

      describe('when not connected', function() {
        it('setting it does not register service-worker', async function() {
          const spy = sinon.spy(navigator.serviceWorker, 'register');
          const element = await fixture(`<service-worker></service-worker>`);
          element.remove();
          element.scope = '/scope';
          expect(spy).to.not.have.been.calledWith(sinon.match.string, sinon.match({scope: '/scope'}));
          spy.restore();
        });
      });
    });

    describe('auto-reload attribute', function() {
      it('sets autoReload property', async function() {
        const element = await fixture(`<service-worker auto-reload></service-worker>`);
        expect(element.autoReload).to.be.true;
      });

      it('reflects autoReload property', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        element.autoReload = true;
        expect(element.hasAttribute('auto-reload')).to.be.true;
      });
    });

    describe('error property', function() {
      it('reflects message to error attribute', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        element.error = new Error('boo');
        expect(element.getAttribute('error')).to.equal('boo');
        expect(element.error).to.be.an.instanceof(Error);
      });

      it('must be an error', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        const initial = element.error;
        try {
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
        const element = await fixture(`<service-worker update-action="${ updateAction }"></service-worker>`);
        expect(element.updateAction).to.equal(updateAction);
      });

      it('reflects updateAction property', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        element.updateAction = updateAction;
        expect(element.getAttribute('update-action')).to.equal(updateAction);
        element.updateAction = null;
        expect(element.hasAttribute('update-action')).to.be.false;
      });
    });

    describe('channel-name attribute', function() {
      const channelName = 'party';
      it('sets channelName property', async function() {
        const element = await fixture(`<service-worker channel-name="${ channelName }"></service-worker>`);
        expect(element.channelName).to.equal(channelName);
      });

      it('reflects channelName property', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        element.channelName = channelName;
        expect(element.getAttribute('channel-name')).to.equal(channelName);
        element.channelName = null;
        expect(element.hasAttribute('channel-name')).to.be.false;
      });
    });

    describe('interacted property', function() {
      it('is false by default', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        expect(element.interacted).to.be.false;
      });

      it('is true after click', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        document.dispatchEvent(new Event('click'));
        expect(element.interacted).to.be.true;
      });

      it('is true after keyup', async function() {
        const element = await fixture(`<service-worker></service-worker>`);
        document.dispatchEvent(new Event('keyup'));
        expect(element.interacted).to.be.true;
      });
    });

    describe('when service worker is installed', function() {
      beforeEach(unregisterAllServiceWorkers);
      afterEach(unregisterAllServiceWorkers);

      it('fires the change event', async function() {
        const element = await fixture('<service-worker path="test-sw.js"></service-worker>');
        const event = await oneEvent(element, 'change');
        expect(event.detail.value).to.be.an.instanceof(ServiceWorker);
        expect(element.serviceWorker).to.equal(event.detail.value);
      });

      it('receives messages on the broadcast channel', async function() {
        const element = await fixture('<service-worker path="test-sw.js"></service-worker>');
        const {detail} = await oneEvent(element, 'message');
        expect(detail.data.action).to.equal('install');
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
