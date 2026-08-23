import assert from 'node:assert/strict';
import test from 'node:test';
import { PrimeOSClient } from '../index.js';

test('constructs a client with explicit configuration', () => {
  const client = new PrimeOSClient({ apiUrl: 'http://127.0.0.1:3000', apiKey: 'test-key' });

  assert.equal(client.apiUrl, 'http://127.0.0.1:3000');
  assert.equal(client.apiKey, 'test-key');
  assert.equal(typeof client.submitResult, 'function');
  assert.equal(typeof client.generateLocal, 'function');
});

test('rejects local generation requests without a prompt', async () => {
  const client = new PrimeOSClient({ apiKey: 'test-key' });

  await assert.rejects(() => client.generateLocal('http://127.0.0.1:5000'), {
    message: 'prompt required'
  });
});
