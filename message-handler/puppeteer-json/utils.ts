import { Selector } from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'
import { Frame } from 'puppeteer-core/lib/esm/puppeteer/api/Frame'
import { ElementHandle } from 'puppeteer-core/lib/esm/puppeteer/api/ElementHandle'

import { EnhancedStep } from './index'

export async function getFrame(pageOrFrame: Frame | Page, step: EnhancedStep) {
  let frame = 'mainFrame' in pageOrFrame ? pageOrFrame.mainFrame() : pageOrFrame;
  if ('frame' in step && step.frame) {
    for (const index of step.frame) {
      frame = frame.childFrames()[index];
    }
  }
  return frame;
}

export async function querySelectorsAll(
  selectors: Selector[],
  frame: Frame | Page
): Promise<ElementHandle<Element>[]> {
  for (const selector of selectors) {
    const result = await querySelectorAll(selector, frame);
    if (result.length) {
      return result;
    }
  }
  return [];
}

export async function querySelectorAll(
  selector: Selector,
  frame: Frame | Page
): Promise<ElementHandle<Element>[]> {
  if (!Array.isArray(selector)) {
    selector = [selector];
  }
  if (!selector.length) {
    throw new Error('Empty selector provided to querySelectorAll');
  }
  let elementHandles = await frame.$$(selector[0]!);
  if (!elementHandles.length) {
    return [];
  }
  for (const part of selector.slice(1, selector.length)) {
    elementHandles = (
      await Promise.all(
        elementHandles.map(async (handle) => {
          const innerHandle = await handle.evaluateHandle((el) =>
            el.shadowRoot ? el.shadowRoot : el
          );
          const elementHandles = await innerHandle.$$(part);
          innerHandle.dispose();
          handle.dispose();
          return elementHandles;
        })
      )
    ).flat();
    if (!elementHandles.length) {
      return [];
    }
  }
  return elementHandles;
}

// From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
export function bytesToBase64(bytes: any) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

export const validUTF16StringEncoded = (validUTF16String: string) => (
  bytesToBase64(new TextEncoder().encode(validUTF16String))
)
