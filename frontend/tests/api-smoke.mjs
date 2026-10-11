import test from 'node:test';
import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';
async function get(path, status=200, method='GET') {
  const response = await fetch(base + path, {method, signal:AbortSignal.timeout(25000)});
  assert.equal(response.status, status, path);
  return response.json();
}
test('production API serves the cached catalog, filters, details, and school demo locations', async () => {
  const catalog = await get('/api/permits');
  assert.equal(catalog.count, 89);
  assert.ok(catalog.permits.every(p => p.distanceMiles === null));
  const pending = await get('/api/permits?status=pending');
  assert.equal(pending.count, 4);
  const demos = await get('/api/demo-locations');
  assert.equal(demos.coverage, 'demo_sample');
  assert.equal(demos.locations.length, 3);
  const hobby = demos.locations.find(p => p.id === 'hobby-elementary');
  const coords = new URLSearchParams({lat:hobby.coordinates.latitude,lng:hobby.coordinates.longitude});
  const report = await get(`/api/report?${coords}`);
  assert.equal(report.metrics.find(m => m.radiusMiles===3).pending, 1);
  assert.equal(report.schoolContext.schools[0].distanceMiles, 0);
  const detail = await get(`/api/permits/tceq-77728?${coords}`);
  assert.equal(detail.permit.permitType, 'renewal');
  assert.equal(detail.permit.commentDeadline, null);
  assert.ok(detail.permit.distanceMiles > 1.18 && detail.permit.distanceMiles < 1.19);
  assert.equal(detail.permit.schoolContext.schools[0].id, hobby.id);
  const draft = await get('/api/permits/tceq-77728/comment');
  assert.equal(draft.submitted, false);
  assert.match(draft.draft, /77728/);
  assert.equal(draft.mode, 'template');
  const explanation = await get('/api/permits/tceq-77728/explanation', 200, 'POST');
  assert.ok(['facts','gemini'].includes(explanation.mode));
  assert.equal(typeof explanation.explanation, 'string');
  if (explanation.mode === 'facts') assert.match(explanation.message, /cached facts/);
});
test('API returns actionable errors for invalid inputs and missing records', async () => {
  for (const path of ['/api/report','/api/report?lat=NaN&lng=-95.4',
    '/api/report?lat=30.5&lng=-95.4','/api/permits?status=approved','/api/permits?radius=3',
    '/api/permits?lat=29.6&lng=-95.4&radius=0','/api/permits/tceq-77728?lat=29.6']) {
    assert.equal(typeof (await get(path,400)).error,'string');
  }
  for (const suffix of ['','/comment','/explanation']) {
    assert.equal(typeof (await get(`/api/permits/nonexistent${suffix}`,404,suffix==='/explanation'?'POST':'GET')).error,'string');
  }
});
