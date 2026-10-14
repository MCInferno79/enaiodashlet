import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moduleFor } from './helpers.mjs';
import { readFile } from 'node:fs/promises';
const fixture=JSON.parse(await readFile('tests/fixtures/profiles-config.json','utf8'));
const {validateConfig,DEFAULT_CONFIG,matchRule,parsePattern}=await moduleFor('shared/config');
test('Neutraler Erststart ohne vorgegebene Webseiten; alte Regeln bleiben importierbar',()=>{
  assert.equal(DEFAULT_CONFIG.rules.length,0);
  assert.equal(validateConfig(fixture).rules.length,4);
  assert.deepEqual(validateConfig(DEFAULT_CONFIG),DEFAULT_CONFIG);
  for(const [host,key] of [['meet.example.org','Meeting'],['portal.example.org','Portal'],['metrics.example.org','Metrics'],['calendar.example.org','Calendar']])assert.equal(matchRule('https://'+host+'/Raum?token=secret',fixture.rules).rule.profile,key);
});
test('Hostgrenzen, Großschreibung, abschließender Punkt und fremde Protokolle',()=>{
  for(const url of ['https://meet.example.org.example.com','https://fakemeet.example.org','https://meet.example.org@evil.invalid','edge://settings','file:///meet.example.org','kein url'])assert.equal(matchRule(url,fixture.rules).rule,undefined);
  assert.equal(matchRule('https://MEET.EXAMPLE.ORG.:443/a',fixture.rules).rule.profile,'Meeting');
});
test('Wildcards, Pfadsegmentgrenzen, Priorität und deaktivierte Regeln',()=>{
  const base=fixture.rules[0];const rules=[{...base,id:'wild',pattern:'*.example.org',priority:0,profile:'wild'},{...base,id:'path',pattern:'portal.example.org/dashboard',priority:200,profile:'path'},base];
  assert.equal(matchRule('https://example.org',rules).rule,undefined);
  assert.equal(matchRule('https://x.y.example.org',rules).rule.profile,'wild');
  assert.equal(matchRule('https://portal.example.org/dashboard/a?foo=secret',rules).rule.profile,'path');
  assert.equal(matchRule('https://portal.example.org/dashboard-evil',rules).rule.profile,'wild');
  assert.equal(matchRule('https://meet.example.org',rules).rule.profile,'Meeting');
  assert.equal(matchRule('https://meet.example.org',[{...base,enabled:false}]).rule,undefined);
  assert.equal(parsePattern('https://BÜCHER.example/a').host,'xn--bcher-kva.example');
});
test('Fehlerhafte Konfiguration, Prototypschlüssel, doppelte IDs und sensible Muster ablehnen',()=>{
  for(const pattern of ['https://user:pass@meet.example.org','meet.example.org?token=secret','meet.example.org/#room','*.de.evil:*','meet.example.org/a/../b','meet.example.org/a*','meet.example.org:443','meet.example.org/a%2fb'])assert.throws(()=>parsePattern(pattern));
  for(const value of [{...DEFAULT_CONFIG,rules:[fixture.rules[0],fixture.rules[0]]},{...DEFAULT_CONFIG,paused:'false'},{...DEFAULT_CONFIG,unknown:'default'},JSON.parse('{"__proto__":{},"version":1}')])assert.throws(()=>validateConfig(value));
});
