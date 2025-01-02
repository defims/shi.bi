// This step is deprecated.
import {
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { EnhancedBaseStep, EnhancedStepType, EnhancedUserFlow } from '../'

export type ReturnExpressionStep = EnhancedBaseStep & Omit<
  WaitForExpressionStep,
  'type'
> & {
  type: EnhancedStepType.ReturnExpression,
}
export type ReturnExpressionStepReturn = {
  result?: any,
  type: EnhancedStepType.ReturnExpression
}
export const before = async ({
  id,
  step,
  flow,
  page,
}: {
  id: string,
  step: ReturnExpressionStep,
  flow: EnhancedUserFlow,
  page: Page,
}): Promise<ReturnExpressionStepReturn> => {
  const { expression } = step;
  const result = await page.evaluate(expression);

  // remove remain steps
  const steps = flow.steps
  const stepIndex = steps.lastIndexOf(step);
  const parentStepIndex = steps.length - 1;

  // remove (stepIndex, parentStepIndex] steps
  if(parentStepIndex > stepIndex) {
    steps.splice(stepIndex + 1, parentStepIndex - stepIndex)
  }

  console.log(id, 'before customReturnExpression step', {steps, stepIndex, parentStepIndex, expression, result});

  return {
    result,
    type: EnhancedStepType.ReturnExpression
  }
}