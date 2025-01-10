// This step is deprecated.
import {
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { EnhancedBaseStep, EnhancedStepType, EnhancedStep, EnhancedUserFlow } from '../'

export type IfExpressionStep = EnhancedBaseStep & Omit<
  WaitForExpressionStep,
 'type'
> & {
  comment?: string,
  type: EnhancedStepType.IfExpression,
  steps?: EnhancedStep[],
  elseSteps?: EnhancedStep[],
}
export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: IfExpressionStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}
export const run = async ({
  id,
  step,
  flow,
  page,
}: {
  id: string,
  step: IfExpressionStep,
  flow: EnhancedUserFlow,
  page: Page,
}) => {
  // https://github.com/puppeteer/puppeteer/blob/0999b7fa4b9257546e4286d3656e6e90a51205b3/packages/puppeteer-core/src/util/Function.ts#L20C1-L22C16
  const {
    expression
  } = step;
  const result = await page.evaluate(expression);
  const stepIndex = flow.steps.lastIndexOf(step);
  const insertSteps = result
    ? step.steps
    : step.elseSteps
  if(insertSteps?.length) {
    flow.steps.splice(stepIndex + 1, 0, ...insertSteps);
  }
  console.log(id, 'before customIfExpression step', {expression, result, stepIndex, insertSteps});
}
