import {
  WaitForElementStep,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'
import { Frame } from 'puppeteer-core/lib/esm/puppeteer/api/Frame'

import { EnhancedBaseStep, EnhancedStepType, EnhancedStep, EnhancedUserFlow } from '../index'
import { querySelectorsAll, getFrame } from '../utils'
import { comparators } from '../constants'
import * as waitForElementStep from './wait-for-element'

export type IfElementStep = EnhancedBaseStep & Omit<
  WaitForElementStep, 'type'
> & {
  title?: string,
  type: EnhancedStepType.IfElement,
  steps?: EnhancedStep[],
  elseSteps?: EnhancedStep[],
  waitForElement?: boolean,
}
export const type = {
  timeout: Number,
  waitForElement: Boolean,
  count: Number,
  visible: Boolean,
}
export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: IfElementStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.waitForElement ? '.waitForElement' : ''
  }${
    step?.title ? ` "${step?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});

  await waitForElementStep.asAProperty({
    id,
    step,
    flow
  })
}
export const run = async ({
  id,
  step,
  flow,
  page,
}: {
  id: string,
  step: IfElementStep,
  flow: EnhancedUserFlow,
  page: Page,
}) => {
  // refer to https://github.com/puppeteer/replay/blob/e2c85b98e497c9191eae5a2d23429588fcd5849e/src/PuppeteerRunnerExtension.ts#L356
  async function ifElement(
    step: Omit<WaitForElementStep, 'type'>,
    frame: Frame | Page,
  ): Promise<boolean> {
    const {
      count = 1,
      operator = '>=',
      visible = true,
      properties,
      attributes,
    } = step;
    const compFn = comparators[operator];

    const elements = await querySelectorsAll(step.selectors, frame);
    let result = compFn(elements.length, count);
    const elementsHandle = await frame.evaluateHandle(
      (...elements) => {
        return elements;
      },
      ...elements
    );
    await Promise.all(elements.map((element) => element.dispose()));
    if (result && (properties || attributes)) {
      result = await elementsHandle.evaluate(
        (elements, properties, attributes) => {
          if (attributes) {
            for (const element of elements) {
              for (const [name, value] of Object.entries(attributes)) {
                if (element.getAttribute(name) !== value) {
                  return false;
                }
              }
            }
          }
          if (properties) {
            for (const element of elements) {
              if (!isDeepMatch(properties, element)) {
                return false;
              }
            }
          }
          return true;

          function isDeepMatch<T>(a: T, b: unknown): b is T {
            if (a === b) {
              return true;
            }
            if ((a && !b) || (!a && b)) {
              return false;
            }
            if (!(a instanceof Object) || !(b instanceof Object)) {
              return false;
            }
            for (const [key, value] of Object.entries(a)) {
              if (!isDeepMatch(value, (b as Record<string, unknown>)[key])) {
                return false;
              }
            }
            return true;
          }
        },
        properties,
        attributes
      );
    }
    await elementsHandle.dispose();

    return result === visible;
  }

  const targetPageOrFrame = page; //TODO
  const localFrame = await getFrame(targetPageOrFrame, step);
  const result = await ifElement(step, localFrame);
  const stepIndex = flow.steps.lastIndexOf(step);
  const insertSteps = result
    ? step.steps
    : step.elseSteps
  console.log(id, 'before customIfElement step', {result, insertSteps})
  if(insertSteps?.length) {
    flow.steps.splice(stepIndex + 1, 0, ...insertSteps);
  }
}