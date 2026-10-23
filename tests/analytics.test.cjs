const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('_scripts/analytics.js', 'utf8');

function setup({ url = 'https://neuir.github.io/', production = true, dnt, gpc, ready = 'complete', configText, scrollHeight = 4000 } = {}) {
  const listeners = new Map();
  const scripts = [];
  const commands = [];
  const listen = (type, callback, options) => {
    const list = listeners.get(type) || [];
    list.push({ callback, once: options?.once });
    listeners.set(type, list);
  };
  const dispatch = (type, detail = {}) => {
    const list = listeners.get(type) || [];
    listeners.set(type, list.filter(item => !item.once));
    list.forEach(item => item.callback(detail));
  };
  const document = {
    readyState: ready, title: 'NEUIR', hidden: false,
    referrer: 'https://example.org/path/?private=secret#email',
    documentElement: { scrollHeight },
    getElementById: () => ({textContent: configText ?? JSON.stringify({
      measurementId: 'G-TEST', hosts: ['neuir.github.io'], production,
      vitalsPath: '/assets/vendor/web-vitals.js'
    })}),
    addEventListener: listen,
    querySelectorAll: () => [],
    createElement: () => ({}),
    head: {appendChild: node => scripts.push(node)}
  };
  const context = {
    document, location: new URL(url), URL, URLSearchParams,
    navigator: {doNotTrack: dnt, globalPrivacyControl: gpc},
    performance: {now: () => 0}, scrollY: 0, innerHeight: 800,
    addEventListener: listen, setTimeout: () => 1, clearTimeout: () => {},
    requestAnimationFrame: callback => callback(),
    gtag: (...args) => commands.push(args)
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return {context, scripts, commands, dispatch};
}

test('only the production hostname loads Google; privacy preferences are respected', () => {
  for (const options of [
    {url:'http://localhost:4000/'}, {url:'http://127.0.0.1:4173/'},
    {url:'https://other.example/'}, {production:false}, {dnt:'1'}, {gpc:true}
  ]) {
    const run = setup(options);
    assert.equal(run.context.siteAnalytics.enabled, false);
    assert.equal(run.scripts.length, 0);
    assert.equal(run.commands.length, 0);
  }
  const run = setup();
  assert.equal(run.context.siteAnalytics.enabled, true);
  assert.equal(run.scripts.filter(s => s.src?.includes('googletagmanager')).length, 1);
});

test('local debug records bounded, sanitized events without sending Google traffic', () => {
  const run = setup({url:'http://localhost:4000/research/?analytics_debug=1&search=private'});
  assert.equal(run.context.siteAnalytics.debug, true);
  assert.equal(run.context.siteAnalytics.enabled, false);
  for (let i = 0; i < 250; i++) run.dispatch('sitesearch', {detail:{queryLength:7,results:3,total:83}});
  assert.equal(run.context.siteAnalytics.events.length, 200);
  assert.ok(!JSON.stringify(run.context.siteAnalytics.events).includes('private'));
  assert.ok(run.scripts.every(s => !s.src.includes('google')));
  assert.equal(run.commands.length, 0);
});

test('one page view for both deferred and late script initialization', () => {
  for (const ready of ['loading','complete']) {
    const run = setup({ready});
    if (ready === 'loading') {
      run.dispatch('DOMContentLoaded');
      run.dispatch('DOMContentLoaded');
    }
    assert.equal(run.commands.filter(c => c[0] === 'event' && c[1] === 'page_view').length, 1);
    assert.equal(run.commands.find(c => c[0] === 'config')[2].send_page_view, false);
  }
});

test('search and contacts omit original queries and email addresses', () => {
  const run = setup({url:'https://neuir.github.io/research/?search=private&analytics_debug=1'});
  run.dispatch('sitesearch', {detail:{queryLength:0,results:83,total:83}});
  assert.equal(run.context.siteAnalytics.events.filter(e=>e.name==='search_clear').length, 0);
  run.dispatch('sitesearch', {detail:{queryLength:7,results:3,total:83,query:'private'}});
  run.dispatch('sitesearch', {detail:{queryLength:0,results:83,total:83}});
  const email = {getAttribute: ()=>'mailto:private@example.org',closest:()=>null};
  run.dispatch('click', {target:{closest:()=>email}});
  const events = run.context.siteAnalytics.events;
  const clearLink = {dataset:{searchClear:''},getAttribute:()=> './',closest:()=>null};
  run.dispatch('click', {target:{closest:()=>clearLink}});
  assert.equal(events.filter(e=>e.name==='site_search').length,1);
  assert.equal(events.filter(e=>e.name==='search_clear').length,1);
  assert.equal(events.filter(e=>e.name==='link_click').length,0);
  assert.equal(events.filter(e=>e.name==='page_view').length,1);
  assert.equal(events.find(e=>e.name==='contact_click').params.contact_method,'email');
  assert.ok(!JSON.stringify(events).includes('private'));
  const config = run.commands.find(c=>c[0]==='config')[2];
  assert.equal(config.page_location,'https://neuir.github.io/research/');
  assert.equal(config.page_referrer,'https://example.org/path/');
});

test('malformed or missing analytics configuration does not break the page', () => {
  for (const configText of ['{bad json','null','{}','{"measurementId":"G-X","production":true}']) assert.doesNotThrow(()=>setup({configText}));
});

test('a short page does not count as a user scrolling through every milestone', () => {
  const run = setup({scrollHeight:500});
  assert.equal(run.commands.filter(c=>c[0]==='event'&&c[1]==='scroll_depth').length,0);
});
