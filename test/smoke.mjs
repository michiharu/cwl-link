import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const expected = 'https://region.console.aws.amazon.com/cloudwatch/home?region=region#logsV2:log-groups/log-group/LOG_GROUP';

test('require("cwl-link") loads the CJS bundle', () => {
  assert.match(require.resolve('cwl-link'), /cwl-link\.cjs$/);
  const cwllink = require('cwl-link');
  assert.equal(typeof cwllink.create, 'function');
  assert.equal(cwllink.create('region', 'LOG_GROUP'), expected);
});

test('import("cwl-link") loads the ESM bundle', async () => {
  assert.match(import.meta.resolve('cwl-link'), /cwl-link\.mjs$/);
  const cwllink = await import('cwl-link');
  assert.equal(typeof cwllink.create, 'function');
  assert.equal(cwllink.create('region', 'LOG_GROUP'), expected);
});
