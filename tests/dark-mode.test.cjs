const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const restore = fs.readFileSync('_includes/scripts.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const controls = fs.readFileSync('_scripts/dark-mode.js', 'utf8');

test('saved dark mode is restored before the deferred controls initialize', async t => {
  for (const saved of ['true', 'false', 'unexpected']) {
    const dom = new JSDOM('<input class="dark-toggle" type="checkbox">', {url:'https://neuir.github.io/', runScripts:'outside-only'});
    t.after(() => dom.window.close());
    const w = dom.window;
    w.localStorage.setItem('dark-mode', saved);
    w.eval(restore);
    assert.equal(w.document.documentElement.dataset.dark, saved === 'true' ? 'true' : 'false');
    // This also exercises late initialization after DOMContentLoaded.
    await new Promise(resolve => w.addEventListener('load', resolve, {once:true}));
    w.eval(controls);
    const toggle = w.document.querySelector('input');
    assert.equal(toggle.checked, saved === 'true');
    const themes = [];
    w.document.addEventListener('themechange', event => themes.push(event.detail.theme));
    toggle.checked = !toggle.checked;
    w.onDarkToggleChange({target:toggle});
    assert.equal(w.localStorage.getItem('dark-mode'), String(toggle.checked));
    assert.deepEqual(themes, [toggle.checked ? 'dark' : 'light']);
  }
});

test('blocked storage still permits theme restoration and toggling', async t => {
  const dom = new JSDOM('<input class="dark-toggle" type="checkbox">', {url:'https://neuir.github.io/', runScripts:'outside-only'});
  t.after(() => dom.window.close());
  const w = dom.window;
  Object.defineProperty(w, 'localStorage', {get() { throw new w.DOMException('Storage is blocked', 'SecurityError'); }});
  w.eval(restore);
  w.eval(controls);
  await new Promise(resolve => w.addEventListener('load', resolve, {once:true}));
  assert.equal(w.document.documentElement.dataset.dark, 'false');
  const toggle = w.document.querySelector('input');
  assert.equal(toggle.checked, false);
  toggle.checked = true;
  assert.doesNotThrow(() => w.onDarkToggleChange({target:toggle}));
  assert.equal(w.document.documentElement.dataset.dark, 'true');
});
