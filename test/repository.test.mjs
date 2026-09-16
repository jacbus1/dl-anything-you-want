// SPDX-License-Identifier: MIT
// Copyright (c) 2026 jacbus1 and FramePocket contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
async function markdown(dir = '') {
  const found = [];
  for (const entry of await readdir(new URL(dir, root), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const path = dir + entry.name;
    if (entry.isDirectory()) found.push(...await markdown(path + '/'));
    else if (path.endsWith('.md')) found.push(path);
  }
  return found;
}
test('repository metadata targets the public source repository', async () => {
  const data = JSON.parse(await read('package.json'));
  assert.equal(data.license, 'MIT');
  assert.equal(data.author, 'jacbus1');
  assert.equal(data.repository.url, 'git+https://github.com/jacbus1/framepocket.git');
  assert.equal(data.private, true);
});
test('MIT attribution and image notice inclusion are consistent', async () => {
  assert.match(await read('LICENSE'), /Copyright \(c\) 2026 jacbus1 and FramePocket contributors/);
  assert.match(await read('Dockerfile'), /LICENSE THIRD_PARTY_NOTICES\.md/);
  assert.match(await read('.dockerignore'), /!LICENSE/);
});
test('English and Traditional Chinese documentation are separate', async () => {
  for (const base of ['README', 'SECURITY', 'CONTRIBUTING', 'CHANGELOG', 'THIRD_PARTY_NOTICES']) {
    assert.match(await read(base + '.md'), new RegExp(base + '\\.zh-TW\\.md'));
    assert.match(await read(base + '.zh-TW.md'), new RegExp(base + '\\.md'));
  }
  for (const topic of ['deployment', 'licensing', 'research', 'verification']) {
    assert.ok((await read('docs/en/' + topic + '.md')).length > 100);
    assert.ok((await read('docs/zh-TW/' + topic + '.md')).length > 100);
  }
});
test('relative Markdown links resolve to repository files', async () => {
  for (const path of await markdown()) {
    const content = (await read(path)).replace(/```[\s\S]*?```/g, '');
    for (const match of content.matchAll(/\]\(([^\s)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      assert.ok((await stat(new URL(target, new URL(path, root)))).isFile(), path + ': ' + target);
    }
  }
});
test('Pages is manual, main-only and uploads only static web assets', async () => {
  const source = await read('.github/workflows/pages.yml');
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /github\.ref == 'refs\/heads\/main'/);
  assert.match(source, /path: web/);
  assert.doesNotMatch(source, /\n  push:/);
  assert.match(await read('.gitignore'), /!\.env\.example/);
});
