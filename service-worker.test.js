/* eslint-env mocha */
import {expect, fixture} from '@open-wc/testing';
import './service-worker.js';

if ('serviceWorker' in navigator) {
  describe('<service-worker> when supported', function() {
    it('instantiating the element works', async function() {
      const element = await fixture(`<service-worker></service-worker>`);
      expect(element.constructor.is).to.equal('service-worker');
    });

    it('default path is correct', async function() {
      const element = await fixture(`<service-worker></service-worker>`);
      expect(element.path).to.equal('/service-worker.js');
    });

    it('default scope is correct', async function() {
      const element = await fixture(`<service-worker></service-worker>`);
      expect(element.scope).to.equal('/');
      expect(element.getAttribute('scope')).to.equal('/');
    });

    it('default autoReload value is correct', async function() {
      const element = await fixture(`<service-worker></service-worker>`);
      expect(element.autoReload).to.be.false;
    });

    it('default updateAction is correct', async function() {
      const element = await fixture(`<service-worker></service-worker>`);
      expect(element.updateAction).to.equal('skipWaiting');
    });

    it('setting path attribute sets path property', async function() {
      const element = await fixture(`<service-worker path="./sw.js"></service-worker>`);
      expect(element.path).to.equal('./sw.js');
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
