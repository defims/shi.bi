import {
  ClickStep,
  selectorToPElementSelector,
  mouseButtonMap,
  AssertedEventType,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'
import { Frame } from 'puppeteer-core/lib/esm/puppeteer/api/Frame'

import { EnhancedUserFlow, EnhancedStepType, EnhancedBaseStep, EnhancedStep } from '../'
import { getFrame } from '../utils'

async function waitForEvents(pageOrFrame: Frame | Page, step: EnhancedStep, timeout: number) {
  const promises = [];
  if (step.assertedEvents) {
      for (const event of step.assertedEvents) {
          switch (event.type) {
              case AssertedEventType.Navigation: {
                  promises.push(pageOrFrame.waitForNavigation({
                      timeout,
                  }));
                  continue;
              }
              default:
                  throw new Error(`Event type ${event.type} is not supported`);
          }
      }
  }
  await Promise.all(promises);
}

export type MultipleClicksStep = EnhancedBaseStep & Omit<
  ClickStep,
  'type'
> & {
  type: EnhancedStepType.MultipleClicks,
  count?: number,
}

export const before = async ({
  id,
  step,
  page,
  flow,
}: {
  id: string,
  step: MultipleClicksStep,
  page: Page,
  flow: EnhancedUserFlow,
}) => {
  const timeout = step.timeout || flow?.timeout || 5000;
  console.log(id, 'before customMultipleClicks step', {timeout});
  const localFrame = await getFrame(page, step); // TODO
  let assertedEventsPromise = null;
  const startWaitingForEvents = () => {
    assertedEventsPromise = waitForEvents(localFrame, step, timeout);
  };
  await page
    .locatorRace(step.selectors.map((selector) => (
      localFrame.locator(selectorToPElementSelector(selector))
    )))
    .setTimeout(timeout)
    .on('action', () => startWaitingForEvents())
    .click({
    count: step.count ?? 1,
    button: step.button && mouseButtonMap.get(step.button),
    delay: step.duration,
    offset: {
      x: step.offsetX,
      y: step.offsetY,
    },
  });
  await assertedEventsPromise;
}
