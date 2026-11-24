import { expect, test } from 'vitest';
import page from '../public/vera/index.html?raw';
import vercel from '../vercel.json';
import { BUY_URL, PLAY_URL } from './lib/constants';

// /vera is a static page (public/vera), outside the React app, so it can't import the constants.
test('vera sells through the Stripe checkout and links the app and the sale terms', () => {
  expect(page).toContain(`href="${BUY_URL}"`);
  expect(page).toContain(`href="${PLAY_URL}"`);
  expect(page).toContain('href="/condiciones"');
  expect(page).toContain('id="comprar"'); // Home links to /vera#comprar
});

test('vercel serves /vera before the SPA fallback', () => {
  const sources = vercel.rewrites.map((r) => r.source);
  expect(sources).toContain('/vera');
  expect(sources.indexOf('/vera')).toBeLessThan(sources.indexOf('/(.*)'));
});
