import {
  WaitForExpressionStep as OriginWaitForExpressionStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'

export type WaitForExpressionStep = Omit<
  OriginWaitForExpressionStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.WaitForExpression,
}
export const type = {
  timeout: Number,
}
export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: WaitForExpressionStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}