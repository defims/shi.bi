import {
  CustomStep as OriginCustomStep
} from '@puppeteer/replay'

import { EnhancedStep, EnhancedStepType, EnhancedUserFlow } from '../index'

export type CustomStep = Omit<
  OriginCustomStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.CustomStep,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: CustomStep,
  flow: EnhancedUserFlow,
}) => {
  const enhancedStep = step as any as EnhancedStep
  console.group(`${
    step.type
  }${
    step?.name ? ` "${step?.name}"` : ''
  }${
    enhancedStep?.comment ? ` "${enhancedStep?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}