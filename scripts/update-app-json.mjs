#!/usr/bin/env node
/**
 * Atualiza `expo.version` em `app.json` para a versão passada como argumento.
 * Uso: node scripts/update-app-json.mjs 1.2.3
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const version = process.argv[2];

if (!version) {
  console.error('Uso: update-app-json.mjs <version>');
  process.exit(2);
}

const appJsonPath = path.join(process.cwd(), 'app.json');
if (!fs.existsSync(appJsonPath)) {
  console.error('app.json não encontrado no diretório corrente.');
  process.exit(1);
}

try {
  const raw = fs.readFileSync(appJsonPath, 'utf8');
  const obj = JSON.parse(raw);
  if (!obj.expo) obj.expo = {};
  obj.expo.version = version;
  fs.writeFileSync(appJsonPath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log('✓ app.json atualizado para versão', version);
  process.exit(0);
} catch (err) {
  console.error('Erro ao atualizar app.json:', err?.message ?? err);
  process.exit(1);
}
