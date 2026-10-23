const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM,VirtualConsole} = require('jsdom');
const core = require('../_scripts/search-core.js');

const record = core.createRecord({
  text:'MetaMem: Memory for Retrieval — Haidong Xin ACL 2026 CCF-A',
  aliases:{'辛海东':'Haidong Xin'},tags:['Information Retrieval']
});
test('normalization covers case, full-width input, Unicode dashes and CCF spacing',()=>{
  for(const q of ['metamem','ＭＥＴＡＭＥＭ','ＣＣＦ　Ａ　２０２６','CCF_A 2026','辛海东 2026','HaidongXin']) {
    assert.ok(core.matches(record,core.parse(q)),q);
  }
  assert.equal(core.normalize('  multi–modal　 retrieval  '),'multi-modal retrieval');
});
test('all terms and quoted phrases must match, including unfinished smart quotes',()=>{
  assert.ok(core.matches(record,core.parse('“memory for” “retrieval”')));
  assert.ok(!core.matches(record,core.parse('"memory" "legal"')));
  assert.ok(core.matches(record,core.parse('"memory for')));
  assert.ok(core.matches(record,core.parse('"tag: information retrieval"')));
  assert.ok(core.highlightTerms(record,core.parse('辛海东')).includes('Haidong Xin'));
});
test('query metacharacters remain literal and long URL queries are bounded',()=>{
  const special=core.createRecord({text:'A*-Thought (C++) [RAG]'});
  for(const q of ['A*-Thought','(C++)','[RAG]']) assert.ok(core.matches(special,core.parse(q)));
  assert.ok(!core.matches(special,core.parse('.*')));
  assert.equal(core.parse('x'.repeat(10000)).raw.length,256);
});

const papers = [
  {title:'MetaMem: Memory for Retrieval',authors:'Haidong Xin, Zhenghao Liu',details:'ACL 2026 CCF-A',group:'conference',aliases:{'辛海东':'Haidong Xin'}},
  {title:'Legal Memory',authors:'Xin Dai',details:'ACM 2025 CCF-B',group:'conference',aliases:{'戴鑫':'Xin Dai'}},
  {title:'Knowledge Intensive Agents',authors:'Haidong Xin',details:'AI Open 2026',group:'journal',aliases:{'辛海东':'Haidong Xin'}}
];
const fixture = `<div class="search-box"><input class="search-input" type="search" disabled><button disabled><i class="icon"></i></button></div>
<div class="search-info" role="status"></div><div id="paper-results">${['conference','journal'].map(group=>
  `<div data-search-group="${group}"><h2>${group}</h2>${papers.filter(p=>p.group===group).map(p=>
    `<div class="citation-container"><div class="citation" data-search-aliases='${JSON.stringify(p.aliases)}'><div class="citation-text"><a class="citation-title">${p.title}</a><div class="citation-authors">${p.authors}</div><div class="citation-details">${p.details}</div></div></div></div>`
  ).join('')}</div>`).join('')}</div>`;
async function setup({query='',mark=false}={}) {
  const errors=[];
  const virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error.message));
  const dom=new JSDOM(fixture,{url:`https://neuir.github.io/research/?analytics_debug=1&search=${encodeURIComponent(query)}#section`,runScripts:'outside-only',virtualConsole});
  const w=dom.window;
  const events=[];
  w.document.addEventListener('sitesearch',e=>events.push(e.detail));
  if(mark) w.eval(fs.readFileSync('assets/vendor/mark.min.js','utf8'));
  w.eval(fs.readFileSync('_scripts/search-core.js','utf8'));
  w.eval(fs.readFileSync('_scripts/search.js','utf8'));
  if(w.document.readyState!=='complete') await new Promise(r=>w.addEventListener('load',r,{once:true}));
  const input=w.document.querySelector('input');
  const visible=()=>[...w.document.querySelectorAll('.citation')].filter(e=>e.style.display!=='none');
  const key=(key,props={})=>input.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...props}));
  const type=(value,props={})=>{input.value=value;input.dispatchEvent(new w.InputEvent('input',{bubbles:true,...props}));};
  const wait=()=>new Promise(r=>w.setTimeout(r,190));
  return {dom,w,input,visible,key,type,wait,events,errors};
}
test('Chinese aliases, categories, empty groups and visible-name highlights work',async t=>{
  const s=await setup({query:'辛海东',mark:true});t.after(()=>s.dom.window.close());
  assert.equal(s.input.disabled,false);
  assert.equal(s.visible().length,2);
  assert.ok([...s.w.document.querySelectorAll('mark')].some(e=>e.textContent==='Haidong Xin'));
  s.type('期刊 2026');s.key('Enter');
  assert.equal(s.visible().length,1);
  assert.equal(s.w.document.querySelector('[data-search-group=conference]').hidden,true);
  assert.equal(s.w.document.querySelector('[data-search-group=journal]').hidden,false);
  assert.ok(!s.w.document.querySelector('mark')?.textContent.includes('Haidong'));
});
test('IME composition is not filtered or cleared until committed, and final events deduplicate',async t=>{
  const s=await setup({query:'memory'});t.after(()=>s.dom.window.close());
  const before=s.events.length;
  s.input.dispatchEvent(new s.w.CompositionEvent('compositionstart',{bubbles:true}));
  s.type('辛',{isComposing:true});s.key('Escape',{isComposing:true});s.key('Enter',{keyCode:229});
  await s.wait();
  assert.equal(s.input.value,'辛');assert.equal(s.visible().length,2);assert.equal(s.events.length,before);
  s.input.value='辛海东';
  s.input.dispatchEvent(new s.w.CompositionEvent('compositionend',{bubbles:true,data:'辛海东'}));
  s.type('辛海东');await s.wait();
  assert.equal(s.visible().length,2);assert.equal(s.events.length,before+1);
  s.key('Enter');assert.equal(s.events.length,before+1);
});
test('clear cancels pending work and the result link clears without navigation',async t=>{
  const s=await setup();t.after(()=>s.dom.window.close());
  s.type('memory');s.w.document.querySelector('.search-box button').click();await s.wait();
  assert.equal(s.input.value,'');assert.equal(s.visible().length,3);
  assert.equal(new URL(s.w.location.href).searchParams.get('search'),null);
  s.type('no-such-paper');s.key('Enter');
  assert.equal(s.visible().length,0);assert.equal(s.w.document.getElementById('paper-results').hidden,true);
  assert.match(s.w.document.querySelector('.search-info').textContent,/未找到/);
  s.w.document.querySelector('[data-search-clear]').click();await s.wait();
  assert.equal(s.visible().length,3);assert.equal(s.w.document.activeElement,s.input);
  assert.equal(s.w.location.hash,'#section');assert.equal(new URL(s.w.location.href).searchParams.get('analytics_debug'),'1');
  assert.deepEqual(s.errors,[]);
});
test('URL/history restoration cancels a pending query and preserves history state',async t=>{
  const s=await setup({query:'辛海东'});t.after(()=>s.dom.window.close());
  s.type('memory');
  s.w.history.replaceState({scroll:42},'','?analytics_debug=1&search=2025#section');
  s.w.dispatchEvent(new s.w.PopStateEvent('popstate'));await s.wait();
  assert.equal(s.input.value,'2025');assert.equal(s.visible().length,1);
  s.type('2026');s.key('Enter');
  assert.equal(s.visible().length,2);assert.equal(s.w.history.state.scroll,42);
  s.key('Escape');assert.equal(s.visible().length,3);assert.equal(s.input.value,'');
});
test('an oversized initial URL is safely shortened and missing Mark does not break filtering',async t=>{
  const s=await setup({query:'x'.repeat(10000)});t.after(()=>s.dom.window.close());
  assert.equal(s.input.value.length,256);
  assert.equal(new URL(s.w.location.href).searchParams.get('search').length,256);
  s.type('ＣＣＦ　Ａ　２０２６');s.key('Enter');assert.equal(s.visible().length,1);
  assert.deepEqual(s.errors,[]);
});
