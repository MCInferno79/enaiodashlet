import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleFor } from './helpers.mjs';
import { readFile } from 'node:fs/promises';
const fixture=JSON.parse(await readFile('tests/fixtures/legacy-config.json','utf8'));
const {validateConfig,DEFAULT_CONFIG,matchRule,parsePattern}=await moduleFor('shared/config');
test('Neutraler Erststart ohne vorgegebene Webseiten; alte Regeln bleiben importierbar',()=>{
  assert.equal(DEFAULT_CONFIG.rules.length,0);
  assert.equal(validateConfig(fixture).rules.length,4);
  assert.deepEqual(validateConfig(DEFAULT_CONFIG),DEFAULT_CONFIG);
  for(const [host,key] of [['bbb.herten.de','BBB'],['heki.herten.de','HeKI'],['hekiport.vw.intern.herten.de','Grafana'],['speakr.vw.intern.herten.de','Speakr']])assert.equal(matchRule('https://'+host+'/Raum?token=secret',fixture.rules).rule.profile,key);
});
test('Hostgrenzen, Großschreibung, abschließender Punkt und fremde Protokolle',()=>{
  for(const url of ['https://bbb.herten.de.example.com','https://fakebbb.herten.de','https://bbb.herten.de@evil.invalid','edge://settings','file:///bbb.herten.de','kein url'])assert.equal(matchRule(url,fixture.rules).rule,undefined);
  assert.equal(matchRule('https://BBB.HERTEN.DE.:443/a',fixture.rules).rule.profile,'BBB');
});
test('Wildcards, Pfadsegmentgrenzen, Priorität und deaktivierte Regeln',()=>{
  const base=fixture.rules[0];const rules=[{...base,id:'wild',pattern:'*.herten.de',priority:0,profile:'wild'},{...base,id:'path',pattern:'heki.herten.de/dashboard',priority:200,profile:'path'},base];
  assert.equal(matchRule('https://herten.de',rules).rule,undefined);
  assert.equal(matchRule('https://x.y.herten.de',rules).rule.profile,'wild');
  assert.equal(matchRule('https://heki.herten.de/dashboard/a?foo=secret',rules).rule.profile,'path');
  assert.equal(matchRule('https://heki.herten.de/dashboard-evil',rules).rule.profile,'wild');
  assert.equal(matchRule('https://bbb.herten.de',rules).rule.profile,'BBB');
  assert.equal(matchRule('https://bbb.herten.de',[{...base,enabled:false}]).rule,undefined);
  assert.equal(parsePattern('https://BÜCHER.example/a').host,'xn--bcher-kva.example');
});
test('Fehlerhafte Konfiguration, Prototypschlüssel, doppelte IDs und sensible Muster ablehnen',()=>{
  for(const pattern of ['https://user:pass@bbb.herten.de','bbb.herten.de?token=secret','bbb.herten.de/#room','*.de.evil:*','bbb.herten.de/a/../b','bbb.herten.de/a*','bbb.herten.de:443','bbb.herten.de/a%2fb'])assert.throws(()=>parsePattern(pattern));
  for(const value of [{...DEFAULT_CONFIG,rules:[fixture.rules[0],fixture.rules[0]]},{...DEFAULT_CONFIG,paused:'false'},{...DEFAULT_CONFIG,unknown:'default'},JSON.parse('{"__proto__":{},"version":1}')])assert.throws(()=>validateConfig(value));
});
