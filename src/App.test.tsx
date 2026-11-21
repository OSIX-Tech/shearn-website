import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from './App';
import { BUY_URL } from './lib/constants';

afterEach(() => { cleanup(); window.history.pushState({}, '', '/'); });

// jsdom lacks the browser APIs the pages use for scroll reveals and reduced motion.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;
window.matchMedia ??= (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as never;
window.scrollTo = () => {};

test.each(['/', '/socratic', '/vera', '/aviso-legal', '/privacidad', '/condiciones'])('%s renders', (path) => {
  window.history.pushState({}, '', path);
  render(<App />);
  expect(screen.getAllByAltText('Shearn').length).toBeGreaterThan(0);
});

test('vera shows the price and links to the Stripe checkout', () => {
  window.history.pushState({}, '', '/vera');
  render(<App />);
  expect(screen.getByText('89 €')).toBeTruthy();
  const hrefs = screen.getAllByRole('link', { name: /comprar vera/i }).map((a) => a.getAttribute('href'));
  expect(hrefs).toContain(BUY_URL);
});
