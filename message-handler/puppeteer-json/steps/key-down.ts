import {
  KeyDownStep as OriginKeyDownStep
} from '@puppeteer/replay'

import { EnhancedStep, EnhancedStepType, EnhancedUserFlow } from '../index'

export type KeyDownStep = Omit<
  OriginKeyDownStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.KeyDown,
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
  step: KeyDownStep,
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