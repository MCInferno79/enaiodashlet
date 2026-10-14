import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,writeFile,readFile,mkdir,rm } from 'node:fs/promises';
import { addProfile } from '../scripts/profiles.mjs';
import { createHash } from 'node:crypto';
import path from 'node:path';
test('Exportdatei bleibt bytegleich; offizieller Manifest-Eintrag, XL-Typ und freie Bezeichnung',async t=>{
  await mkdir('work',{recursive:true});const root=await mkdtemp(path.resolve('work/profiles-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(root+'/profiles');await writeFile(root+'/profiles/catalog.json','[]');await writeFile(root+'/manifest.json','{}');
  // Opaque fake bytes exercise copy integrity only, not compatibility with Stream Deck.
  const opaque=Buffer.from('PK-test-fixture-not-a-real-profile');const source=root+'/export.streamDeckProfile';await writeFile(source,opaque);
  await addProfile(root,source,'Meeting','Meeting / Besprechungen',2);
  assert.deepEqual(await readFile(source),opaque);assert.deepEqual(await readFile(root+'/profiles/Meeting-type2.streamDeckProfile'),opaque);
  const catalog=JSON.parse(await readFile(root+'/profiles/catalog.json'));assert.equal(catalog[0].sha256,createHash('sha256').update(opaque).digest('hex'));
  assert.deepEqual(JSON.parse(await readFile(root+'/manifest.json')).Profiles,[{Name:'profiles/Meeting-type2',DeviceType:2,Readonly:false,AutoInstall:true,DontAutoSwitchWhenInstalled:true}]);
  await assert.rejects(addProfile(root,source,'Meeting','Meeting',2));await assert.rejects(addProfile(root,source,'../Meeting','Meeting',2));
});
