import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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
