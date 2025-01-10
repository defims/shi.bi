import {
  KeyUpStep as OriginKeyUpStep
} from '@puppeteer/replay'

import { EnhancedStep, EnhancedStepType, EnhancedUserFlow } from '../index'

export type KeyUpStep = Omit<
  OriginKeyUpStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.KeyUp,
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
    enhancedStep?.comment ? ` "${enhancedStep?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}