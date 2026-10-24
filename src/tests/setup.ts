import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { initDemoStore } from '@/app/store/demoStore';
import { sequentialIdFactory } from '@/domain/ids';
import { createMemoryAdapter } from '@/lib/storage/memoryAdapter';
import { useToastStore } from '@/components/ui/toast';
import { TEST_NOW } from './helpers';

// jsdom does not implement <dialog> modality; provide the minimal behaviour our Dialog relies on.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

window.scrollTo = () => undefined;
Element.prototype.scrollIntoView = function scrollIntoView() {};

beforeEach(() => {
  initDemoStore({ adapter: createMemoryAdapter(), clock: () => TEST_NOW, newId: sequentialIdFactory() });
  useToastStore.getState().clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
