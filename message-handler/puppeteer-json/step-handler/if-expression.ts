import {
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { EnhancedCustomStep, CustomStepName, EnhancedStep, EnhancedUserFlow } from '../'

export type CustomIfExpressionStep = EnhancedCustomStep & {
  name: CustomStepName.IfExpression
  parameters: Omit<WaitForExpressionStep, 'type'> & {
    steps?: EnhancedStep[],
    elseSteps?: EnhancedStep[],
  }
}
export const before = async ({
  id,
  step,
  flow,
  page,
}: {
  id: string,
  step: CustomIfExpressionStep,
  flow: EnhancedUserFlow,
  page: Page,
}) => {
  // https://github.com/puppeteer/puppeteer/blob/0999b7fa4b9257546e4286d3656e6e90a51205b3/packages/puppeteer-core/src/util/Function.ts#L20C1-L22C16
  const {
    expression
  } = step.parameters;
  const result = await page.evaluate(expression);
  const stepIndex = flow.steps.lastIndexOf(step);
  const insertSteps = result
    ? step.parameters.steps
    : step.parameters.elseSteps
  if(insertSteps?.length) {
    flow.steps.splice(stepIndex + 1, 0, ...insertSteps);
  }
  console.log(id, 'before customIfExpression step', {expression, result, stepIndex, insertSteps});
}
