import {
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { EnhancedCustomStep, CustomStepName, EnhancedUserFlow } from '../'

export type CustomReturnExpressionStep = EnhancedCustomStep & {
  name: CustomStepName.ReturnExpression,
  parameters: Omit<WaitForExpressionStep, 'type'>
}
export type CustomReturnExpressionStepReturn = {
  result?: any,
  name: CustomStepName.ReturnExpression
}
export const before = async ({
  id,
  step,
  flow,
  page,
}: {
  id: string,
  step: CustomReturnExpressionStep,
  flow: EnhancedUserFlow,
  page: Page,
}): Promise<CustomReturnExpressionStepReturn> => {
  const { expression } = step.parameters;
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
    name: CustomStepName.ReturnExpression
  }
}