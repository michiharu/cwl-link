import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const expected = 'https://region.console.aws.amazon.com/cloudwatch/home?region=region#logsV2:log-groups/log-group/LOG_GROUP';
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

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

test('published type definitions do not import from aws-lambda', () => {
  for (const file of ['dist/cwl-link.d.ts', 'dist/cwl-link.d.cts']) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /from\s+['"]aws-lambda['"]/, file);
  }
});

test('package.json declares sideEffects false', () => {
  assert.equal(pkg.sideEffects, false);
});

test('package.json declares a Node engine range', () => {
  assert.equal(pkg.engines?.node, '>=20');
});

test('LICENSE is present and names MIT', () => {
  const license = readFileSync(new URL('../LICENSE', import.meta.url), 'utf8');
  assert.equal(license.split('\n')[0], 'MIT License');
  assert.match(license, /Copyright \(c\) 2022 michiharu/);
});
