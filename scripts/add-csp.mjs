// Adds a Content-Security-Policy to the built page (dist/index.html) after `expo export`. Done here rather than in
// public/index.html so the dev server, which needs eval and websockets, is unaffected.
// Inline scripts are allowed only by the exact hash of what is in the built page, so any other script is refused.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const file = 'dist/index.html';
let html = readFileSync(file, 'utf8');
if (html.includes('Content-Security-Policy')) {
  console.log('CSP already present');
  process.exit(0);
}

// The Supabase address is public (it is in the app already); only its origin goes into the policy.
const env = existsSync('.env')
  ? Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .filter((line) => /^[A-Z0-9_]+=/.test(line))
        .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
    )
  : {};
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL is not set, so the policy cannot allow the database.');
const supabase = new URL(supabaseUrl).origin;

const hashes = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
  // Browsers turn CRLF and lone CR into LF before hashing a script, so hash it the same way.
  (match) => `'sha256-${createHash('sha256').update(match[1].replace(/\r\n?/g, '\n')).digest('base64')}'`,
);

const policy = [
  "default-src 'self'",
  `script-src 'self' ${hashes.join(' ')}`,
  // react-native-web writes its styles into style tags at run time.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabase}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const anchor = '<meta charset="utf-8" />';
if (!html.includes(anchor)) throw new Error(`Could not find ${anchor} in ${file}.`);
html = html.replace(anchor, `${anchor}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
writeFileSync(file, html);
console.log(`CSP added (${hashes.length} inline script hash${hashes.length === 1 ? '' : 'es'}, database ${supabase === new URL(supabaseUrl).origin ? 'allowed' : ''}).`);
