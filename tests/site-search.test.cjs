const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('404 search keeps special characters and targets the canonical production hostname', () => {
  const destinations = [];
  const context = {
    URL,
    document:{querySelector:()=>({href:'https://neuir.github.io/404.html'})},
    location:{origin:'http://localhost:4000',assign:url=>destinations.push(url)}
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('_scripts/site-search.js','utf8'),context);
  const submit = q=>context.onSiteSearchSubmit({preventDefault(){},target:{elements:{q:{value:q}}}});
  submit('   ');
  assert.equal(destinations.length,0);
  submit('  检索 & memory / "论文"  ');
  const destination = new URL(destinations[0]);
  assert.equal(destination.origin,'https://www.google.com');
  assert.equal(destination.searchParams.get('q'),'site:neuir.github.io 检索 & memory / "论文"');
});
