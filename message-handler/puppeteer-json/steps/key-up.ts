import {
  KeyUpStep as OriginKeyUpStep
} from '@puppeteer/replay'

import { EnhancedStep, EnhancedStepType, EnhancedUserFlow } from '../index'

export type KeyUpStep = Omit<
  OriginKeyUpStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.KeyUp,
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
  step: KeyUpStep,
  flow: EnhancedUserFlow,
}) => {
  const enhancedStep = step as any as EnhancedStep
  console.group(`${
    step.type
  }${
    step?.key ? ` "${step?.key}"` : ''
  }${
    enhancedStep?.title ? ` "${enhancedStep?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}