import test from 'node:test';
import assert from 'node:assert/strict';
import { geocodeAddress } from '../lib/mapbox.ts';

async function withResponse(response, run) {
  const oldToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const oldFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test';
  globalThis.fetch = async () => response;
  try { await run(); }
  finally { globalThis.fetch = oldFetch; if (oldToken === undefined) delete process.env.NEXT_PUBLIC_MAPBOX_TOKEN; else process.env.NEXT_PUBLIC_MAPBOX_TOKEN = oldToken; }
}
test('uses the returned Harris County coordinates, rather than the Houston fallback', async () => {
  await withResponse({ ok: true, json: async () => ({ features: [{
    geometry: { coordinates: [-95.44, 29.65] }, properties: { full_address: 'Verified address',
      context: { district: { name: 'Harris County' }, region: { name: 'Texas' } } },
  }] }) }, async () => {
    assert.deepEqual(await geocodeAddress('address'), { label: 'Verified address', coordinates: { latitude: 29.65, longitude: -95.44 } });
  });
});
test('handles an address search with no results', async () => {
  await withResponse({ ok: true, json: async () => ({ features: [] }) }, async () => {
    await assert.rejects(geocodeAddress('unknown'), /No matching address/);
  });
});
test('handles the geocoding service being unavailable', async () => {
  await withResponse({ ok: false }, async () => {
    await assert.rejects(geocodeAddress('address'), /unavailable/);
  });
});
test('does not infer county coverage from an incomplete result', async () => {
  await withResponse({ ok: true, json: async () => ({ features: [{
    geometry: { coordinates: [-95.44, 29.65] }, properties: { context: {} },
  }] }) }, async () => {
    await assert.rejects(geocodeAddress('address'), /verify/);
  });
});
