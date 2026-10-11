import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildCommentDraft, explainPermit } from '../lib/assistance.ts';
const data = JSON.parse(readFileSync(new URL('../../data/concrete-plants.json', import.meta.url)));
const permit = {...data.plants.find(p => p.id === 'tceq-77728'), distanceMiles:null};

test('a missing Gemini key yields clearly labeled cached facts without an external request', async () => {
  const result = await explainPermit(permit, {apiKey:'', fetcher:() => {throw new Error('unexpected external call');}});
  assert.equal(result.mode, 'facts');
  assert.match(result.explanation, /renewal/);
  assert.match(result.explanation, /deadline.*unavailable/i);
  assert.match(result.explanation, /not.*zero emissions/i);
});
test('comment draft requests information without inventing residence, health harm, or a deadline', () => {
  const result = buildCommentDraft(permit);
  assert.match(result.draft, /77728/);
  assert.match(result.draft, /comment period/);
  assert.match(result.draft, /\[Your name\]/);
  assert.equal(result.submitted, false);
  assert.match(result.warning, /deadline/i);
  assert.doesNotMatch(result.draft, /I live|causes cancer|must reject/);
});
test('Gemini receives server facts and the key in a header, and validates the returned text', async () => {
  let sent;
  const fetcher = async (url, init) => {
    sent = {url, init, body:JSON.parse(init.body)};
    return Response.json({candidates:[{finishReason:'STOP', content:{parts:[{text:JSON.stringify({explanation:'This is a renewal application. Check the source for current status.'})}]}}]});
  };
  const result = await explainPermit(permit, {apiKey:'test-secret', model:'gemini-2.5-flash', fetcher});
  assert.equal(result.mode, 'gemini');
  assert.equal(sent.init.headers['x-goog-api-key'], 'test-secret');
  assert.ok(!sent.url.includes('test-secret'));
  assert.equal(JSON.parse(sent.body.contents[0].parts[0].text).permitNumber, '77728');
  assert.equal(JSON.parse(sent.body.contents[0].parts[0].text).commentDeadline, null);
  assert.match(sent.body.systemInstruction.parts[0].text, /untrusted/i);
  assert.equal(result.sourceUrl, permit.noticeUrl);
});
test('upstream errors, malformed JSON, and truncated generation fall back to cached facts', async () => {
  const responses = [new Response('secret upstream details', {status:429}),
    Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'not json'}]}}]}),
    Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]}),
    Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"explanation":42}'}]}}]})];
  for (const response of responses) {
    const result = await explainPermit(permit, {apiKey:'test-secret', fetcher:async () => response});
    assert.equal(result.mode, 'facts');
    assert.doesNotMatch(JSON.stringify(result), /secret upstream details|test-secret/);
    assert.match(result.message, /unavailable/i);
  }
});
