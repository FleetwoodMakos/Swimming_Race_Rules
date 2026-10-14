import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Script } from 'node:vm';
import { validateJourney, validateLessons, validateLearningSupport } from '../src/journey-logic.mjs';
import { validateContent } from '../src/logic.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
// Explicit ownership/order: state and shared view helpers, views, then controller/startup.
const RUNTIME_FILES = ['state.js', 'views.js', 'pool-views.js', 'rulebook-views.js', 'updates-views.js', 'learning-support.js', 'journey.js', 'lesson-views.js', 'progress.js', 'start-sounds.js', 'reaction-game.js', 'app.js'];
const digest = (value, encoding = 'base64') => createHash('sha256').update(value).digest(encoding);
const lineEndings = (value) => value.replace(/\r\n?/g, '\n');

export function serializeForScript(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/gu, (character) => ({
    '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029'
  })[character]);
}

export function inspectApplicationSource(sources) {
  const problems = [];
  const forbidden = [
    [/\b(?:innerHTML|outerHTML|insertAdjacentHTML|createContextualFragment|DOMParser)\b/u, 'HTML parsing or injection sink'],
    [/\bdocument\s*\.\s*(?:write|writeln)\s*\(/u, 'document HTML injection sink'],
    [/\b(?:eval|Function)\b/u, 'dynamic code execution'],
    [/\bset(?:Timeout|Interval)\s*\(\s*['"`]/u, 'string-based timer'],
    [/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\s*\(/u, 'network capability'],
    [/\bimport\s*\(/u, 'dynamic module loading'],
    [/\.setAttribute(?:NS)?\s*\(\s*['"]on[a-z]+['"]/iu, 'content event-handler attribute'],
    [/<\/script/iu, 'embedded script closing tag']
  ];
  for (const [name, source] of Object.entries(sources)) {
    for (const [pattern, description] of forbidden) if (pattern.test(source)) problems.push(`${name}: ${description}`);
  }
  return problems;
}

export async function build({ sourceDir = resolve(ROOT, 'src'), outputPath = resolve(ROOT, 'dist/index.html') } = {}) {
  const [dataText, logicText, cssText, logoText, runtimeText] = await Promise.all([
    readFile(resolve(sourceDir, 'content.json'), 'utf8'), Promise.all(['logic.mjs','rulebook-logic.mjs','journey-logic.mjs','observation-poses.mjs','progress-logic.mjs'].map(name => readFile(resolve(sourceDir, name), 'utf8'))).then(parts => parts.join('\n')),
    Promise.all(['styles.css', 'pool-styles.css', 'rulebook-styles.css', 'updates-styles.css','journey-styles.css','progress-styles.css'].map(name => readFile(resolve(sourceDir, name), 'utf8'))).then(parts => parts.join('\n')), readFile(resolve(sourceDir, 'logo.txt'), 'utf8'),
    Promise.all(RUNTIME_FILES.map((name) => readFile(resolve(sourceDir, name), 'utf8')))
  ]);
  const data = JSON.parse(dataText);
  const audio = JSON.parse(await readFile(resolve(sourceDir, 'start-audio.json'), 'utf8'));
  if(typeof audio.marks!=='string'||!/^data:audio\/wav;base64,[A-Za-z0-9+/]+={0,2}$/.test(audio.marks)||audio.marks.length>500000)throw new Error('Invalid start audio');
  const learning = JSON.parse(await readFile(resolve(sourceDir, 'journey-content.json'), 'utf8'));
  const journeyErrors = [...validateJourney(learning,data),...validateLessons(learning,data),...validateLearningSupport(learning)];
  if(journeyErrors.length) throw new Error(journeyErrors.join('\n'));
  const validation = validateContent(data);
  if (!validation.ok) throw new Error(`Content validation failed:\n${validation.errors.join('\n')}`);
  const logic = lineEndings(logicText).replace(/^export\s+(?=(?:function|const|let|class)\b)/gm, '');
  const runtimeSources = Object.fromEntries(RUNTIME_FILES.map((name, index) => [name, lineEndings(runtimeText[index])]));
  const runtime = RUNTIME_FILES.map((name) => runtimeSources[name]).join('\n');
  const styles = lineEndings(cssText).trim();
  const logo = logoText.trim();
  const problems = inspectApplicationSource({ 'logic.mjs': logic, ...runtimeSources, 'combined runtime': runtime });
  if (/\b(?:import|export)\s+(?:[{*]|(?:const|function|class|default)\b)/u.test(`${logic}\n${runtime}`)) problems.push('Runtime must not import or export modules');
  if (/<\/style|@import\b|url\s*\(/iu.test(styles)) problems.push('Styles must not close their container or load assets');
  if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(logo) || logo.length > 700000 ||
    Buffer.from(logo.split(',')[1] || '', 'base64').subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') problems.push('Logo must be a bundled PNG data URI');
  if (problems.length) throw new Error(`Security checks failed:\n${problems.join('\n')}`);
  const script = `(() => {\n'use strict';\nconst DATA = ${serializeForScript(data)};\nconst LEARNING = ${serializeForScript(learning)};\nconst LOGO = ${serializeForScript(logo)};\nconst START_AUDIO = ${serializeForScript(audio)};\n${logic}\n${runtime}\n})();`;
  new Script(script, { filename: 'bundled-application.js' });
  const scriptHash = digest(script);
  const styleHash = digest(styles);
  const policy = `default-src 'none'; script-src 'sha256-${scriptHash}'; style-src 'sha256-${styleHash}'; img-src data:; media-src data:; base-uri 'none'; form-action 'none'; connect-src 'none'; object-src 'none'`;
  const html = `<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="referrer" content="no-referrer">\n<meta http-equiv="Content-Security-Policy" content="${policy}">\n<meta name="description" content="Swimming Race Rules by Fleetwood Mako’s. Learn competition requirements, touches, turns and officiating scenarios offline.">\n<meta name="theme-color" content="#082d49">\n<title>Swimming Race Rules · Fleetwood Mako’s</title>\n<style>${styles}</style>\n</head>\n<body>\n<div id="app"></div>\n<noscript>Enable JavaScript to use this offline learning app.</noscript>\n<script>${script}</script>\n</body>\n</html>\n`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf8');
  if(sourceDir===resolve(ROOT,'src') && outputPath===resolve(ROOT,'dist/index.html'))await writeFile(resolve(ROOT,'index.html'),html,'utf8');
  return { file: outputPath, bytes: Buffer.byteLength(html), sha256: digest(html, 'hex'), scriptHash, styleHash,
    rules: data.rules.length, scenarios: data.scenarios.length, sources: data.sources.length };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { console.log(JSON.stringify(await build(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
