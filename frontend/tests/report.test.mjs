import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLocationReport, distanceMiles } from '../lib/report.ts';

const plant = (id, lat, status = 'pending') => ({
  id, permitNumber: id, category: 'concrete_batch_plant', name: id,
  operator: null, address: null, city: null, county: 'Harris', zip: null,
  lat, lng: lat === null ? null : -95.4, locationSource: lat === null ? null : 'tceq_map_link',
  status, permitType: 'new', dateReceived: '2026-01-01', commentDeadline: null,
  productionRate: null, emissions: [], noticeUrl: 'https://www.tceq.texas.gov/',
  scrapedAt: '2026-10-10T23:00:00Z', notes: null,
});
const dataset = { generatedAt: '2026-10-10T23:00:00Z', source: 'TCEQ fixture', count: 5,
  plants: [plant('near', 29.71), plant('existing', 29.73, 'existing'),
    plant('far', 29.8), plant('missing', null), plant('outside', 29.72)] };
dataset.plants[4].county = 'Other';
const location = { latitude: 29.7, longitude: -95.4 };

test('calculates distance in miles, including coincident locations', () => {
  assert.equal(distanceMiles(location, location), 0);
  assert.ok(Math.abs(distanceMiles({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 }) - 69.09) < 0.02);
});
test('counts each status inside 1/3/5 miles and excludes unknown/out-of-county positions', () => {
  const r = buildLocationReport(dataset, 'Home', location);
  assert.deepEqual(r.metrics, [
    { radiusMiles: 1, existing: 0, pending: 1 },
    { radiusMiles: 3, existing: 1, pending: 1 },
    { radiusMiles: 5, existing: 1, pending: 1 },
  ]);
  assert.deepEqual(r.permits.map(p => p.id), ['near', 'existing']);
  assert.deepEqual(r.unlocatedPermits.map(p => p.id), ['missing']);
});
test('preserves missing deadlines/emissions and source caveats without fabricating scores', () => {
  const r = buildLocationReport(dataset, 'Home', location);
  assert.equal(r.permits[0].commentDeadline, null);
  assert.deepEqual(r.permits[0].emissions, []);
  assert.equal(r.permits[0].operator, null);
  assert.equal(r.permits[0].impactScore, undefined);
  assert.equal(r.generatedAt, '2026-10-10T23:00:00Z');
});
test('returns an empty nearby list instead of relocating permits to a search', () => {
  const r = buildLocationReport(dataset, 'Distant', { latitude: 30.1, longitude: -95.9 });
  assert.equal(r.permits.length, 0);
  assert.deepEqual(r.metrics.map(m => m.pending + m.existing), [0, 0, 0]);
});
test('rejects non-finite coordinates', () => {
  assert.throws(() => buildLocationReport(dataset, 'Bad', { latitude: NaN, longitude: -95 }), /coordinates/i);
});
