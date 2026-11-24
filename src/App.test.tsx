import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

afterEach(() => { cleanup(); window.history.pushState({}, '', '/'); });

// jsdom lacks the browser APIs the pages use for scroll reveals and reduced motion.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} } as never;
window.matchMedia ??= (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as never;
window.scrollTo = () => {};

test.each(['/', '/socratic', '/aviso-legal', '/privacidad', '/condiciones'])('%s renders', (path) => {
  window.history.pushState({}, '', path);
  render(<App />);
  expect(screen.getAllByAltText('Shearn').length).toBeGreaterThan(0);
});

// /vera is a static page outside the SPA: a client-side navigation would hit the catch-all and land on '/'.
test('links to /vera do a full page load', () => {
  render(<App />);
  const prevented: boolean[] = [];
  const record = (e: Event) => { prevented.push(e.defaultPrevented); e.preventDefault(); };
  document.addEventListener('click', record);
  screen.getAllByRole('link')
    .filter((a) => a.getAttribute('href')?.startsWith('/vera'))
    .forEach((a) => fireEvent.click(a));
  document.removeEventListener('click', record);
  expect(prevented.length).toBeGreaterThanOrEqual(4); // header, footer and two on Home
  expect(prevented).not.toContain(true);
});
