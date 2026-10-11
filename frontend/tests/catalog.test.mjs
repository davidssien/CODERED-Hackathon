import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findPermit, listPermits } from '../lib/catalog.ts';
import { buildLocationReport, findSampleSchools } from '../lib/report.ts';
import { parseCoordinates, parsePermitFilters } from '../lib/query.ts';

const data = JSON.parse(readFileSync(new URL('../../data/concrete-plants.json', import.meta.url)));
const demo = JSON.parse(readFileSync(new URL('../../data/demo-addresses.json', import.meta.url)));
const schools = demo.addresses.map(p => ({ id:p.id, label:p.label, address:p.address,
  coordinates:{latitude:p.lat, longitude:p.lng}, locationSource:p.locationSource }));
const hobby = schools.find(p => p.id === 'hobby-elementary');

test('catalog includes unlocated records and filters status without inventing distances', () => {
  const all = listPermits(data, {});
  assert.equal(all.length, 89);
  assert.equal(all.filter(p => p.lat === null).length, 19);
  assert.ok(all.every(p => p.distanceMiles === null));
  assert.equal(listPermits(data, {status:'pending'}).length, 4);
  assert.equal(listPermits(data, {query:'77728'})[0].id, 'tceq-77728');
});
test('spatial catalog uses exact distances and excludes unknown positions', () => {
  const results = listPermits(data, {coordinates:hobby.coordinates, radiusMiles:3, status:'pending'});
  assert.deepEqual(results.map(p => p.id), ['tceq-77728']);
  assert.ok(results[0].distanceMiles > 1.18 && results[0].distanceMiles < 1.19);
  const frost = schools.find(p => p.id === 'frost-elementary');
  assert.equal(listPermits(data, {coordinates:frost.coordinates, radiusMiles:1}).length, 0);
});
test('permit lookup preserves nullable facts and labels school coverage as a sample', () => {
  const permit = findPermit(data, 'tceq-77728', hobby.coordinates, schools);
  assert.equal(permit.permitType, 'renewal');
  assert.equal(permit.commentDeadline, null);
  assert.deepEqual(permit.emissions, []);
  assert.equal(permit.schoolContext.coverage, 'demo_sample');
  assert.equal(permit.schoolContext.sampleSize, 3);
  assert.equal(permit.schoolContext.schools[0].id, 'hobby-elementary');
  assert.ok(permit.schoolContext.schools[0].distanceMiles > 1.18);
  assert.equal(findPermit(data, 'not-a-permit', undefined, schools), null);
});
test('school context handles empty samples and is measured from the selected point', () => {
  assert.deepEqual(findSampleSchools(hobby.coordinates, []).schools, []);
  const context = findSampleSchools(hobby.coordinates, schools);
  assert.equal(context.schools[0].distanceMiles, 0);
  const report = buildLocationReport(data, hobby.label, hobby.coordinates, schools);
  assert.equal(report.schoolContext.schools[0].id, hobby.id);
  assert.equal(report.metrics.find(m => m.radiusMiles === 3).pending, 1);
});
test('coordinate parsing rejects missing, partial, non-finite, and out-of-area input', () => {
  assert.equal(parseCoordinates(new URLSearchParams(), false), undefined);
  for (const input of ['', 'lat=29.6', 'lat=&lng=-95.4', 'lat=NaN&lng=-95.4', 'lat=30.5&lng=-95.4']) {
    assert.throws(() => parseCoordinates(new URLSearchParams(input)), /coordinates|Harris County/);
  }
  assert.deepEqual(parseCoordinates(new URLSearchParams('lat=29.6&lng=-95.4')), {latitude:29.6, longitude:-95.4});
});
test('catalog filter parsing rejects invalid status and spatial filters without coordinates', () => {
  for (const input of ['status=approved', 'radius=3', 'lat=29.6&lng=-95.4&radius=0', 'lat=29.6&lng=-95.4&radius=NaN', 'lat=29.6&lng=-95.4&radius=100']) {
    assert.throws(() => parsePermitFilters(new URLSearchParams(input)));
  }
  assert.equal(parsePermitFilters(new URLSearchParams('lat=29.6&lng=-95.4')).radiusMiles, 5);
});
