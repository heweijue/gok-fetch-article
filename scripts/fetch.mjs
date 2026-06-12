#!/usr/bin/env node
// gok-fetch-article — render a page with a local headless Chromium and dump
// its readable text as JSON. No third-party service; everything runs locally.
//
//   node scripts/fetch.mjs <url> [--shot <path.png>]
//
// Output (stdout): {"status":200,"url":"...","title":"...","text":"...","screenshot":"..."?}
// The `text` value is wrapped in UNTRUSTED markers so a downstream agent has a
// clear boundary and treats it as data, never as instructions.
// Exit 2 on bad usage, 1 on fetch failure.

import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('usage: node scripts/fetch.mjs <url> [--shot <path.png>]');
  process.exit(2);
}
const shotIdx = process.argv.indexOf('--shot');
const shotPath = shotIdx > -1 ? process.argv[shotIdx + 1] : null;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const wrap = (src, body) =>
  `--- BEGIN UNTRUSTED EXTERNAL CONTENT (source: ${src}) ---\n` +
  body +
  `\n--- END UNTRUSTED EXTERNAL CONTENT ---`;

// Prefer the user's installed Google Chrome (no extra download); fall back to
// Playwright's bundled Chromium if Chrome isn't present.
async function launch() {
  try {
    return await chromium.launch({ headless: true, channel: 'chrome' });
  } catch {
    return await chromium.launch({ headless: true });
  }
}

const browser = await launch();
try {
  const page = await browser.newPage({ userAgent: UA });
  const resp = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(1500); // let late JS settle

  const status = resp ? resp.status() : 0;
  const data = await page.evaluate(() => {
    const pick = (sel) => document.querySelector(sel)?.innerText?.trim() || '';
    const text = pick('article') || pick('main') || document.body.innerText.trim();
    return { title: document.title || '', text };
  });

  const out = { status, url, title: data.title, text: wrap(url, data.text) };

  if (shotPath) {
    await page.screenshot({ path: shotPath, fullPage: true });
    out.screenshot = shotPath;
  }

  process.stdout.write(JSON.stringify(out) + '\n');
} catch (err) {
  console.error('fetch failed:', err.message);
  process.exit(1);
} finally {
  await browser.close();
}
