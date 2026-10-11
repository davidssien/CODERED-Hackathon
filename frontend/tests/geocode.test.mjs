import test from 'node:test';
import assert from 'node:assert/strict';
import { geocodeAddress } from '../lib/mapbox.ts';

test('missing token rejects arbitrary addresses instead of silently moving them to Houston', async () => {
  const previous = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  try { await assert.rejects(geocodeAddress('invalid address'), /preset|demo|configured/i); }
  finally { if (previous !== undefined) process.env.NEXT_PUBLIC_MAPBOX_TOKEN = previous; }
});
test('outside-county geocoding results are rejected', async () => {
  const oldToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test';
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ features: [{
    geometry: { coordinates: [-97.74, 30.27] },
    properties: { context: { district: { name: 'Travis County' }, region: { name: 'Texas' } } },
  }] }) });
  try { await assert.rejects(geocodeAddress('Austin'), /Harris County/); }
  finally { globalThis.fetch = oldFetch; if (oldToken === undefined) delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN; else process.env.NEXT_PUBLIC_MAPBOX_TOKEN = oldToken; }
});
