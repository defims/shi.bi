import {
  UserStep,
  ClickStep,
  selectorToPElementSelector,
  mouseButtonMap,
  AssertedEventType,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'
import { Frame } from 'puppeteer-core/lib/esm/puppeteer/api/Frame'

import { EnhancedUserFlow, EnhancedCustomStep, CustomStepName} from '../'
import { getFrame } from '../utils'

async function waitForEvents(pageOrFrame: Frame | Page, step: UserStep, timeout: number) {
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

export type CustomMultipleClicksStep = EnhancedCustomStep & {
  name: CustomStepName.MultipleClicks,
  parameters: Omit<ClickStep, 'type'> & {
    count?: number,
  }
}

export const before = async ({
  id,
  step,
  page,
  flow,
}: {
  id: string,
  step: CustomMultipleClicksStep,
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
    .locatorRace(step.parameters.selectors.map((selector) => (
      localFrame.locator(selectorToPElementSelector(selector))
    )))
    .setTimeout(timeout)
    .on('action', () => startWaitingForEvents())
    .click({
    count: step.parameters.count ?? 1,
    button: step.parameters.button && mouseButtonMap.get(step.parameters.button),
    delay: step.parameters.duration,
    offset: {
      x: step.parameters.offsetX,
      y: step.parameters.offsetY,
    },
  });
  await assertedEventsPromise;
}
