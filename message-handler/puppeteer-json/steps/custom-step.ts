import {
  CustomStep as OriginCustomStep
} from '@puppeteer/replay'

import { EnhancedStep, EnhancedStepType, EnhancedUserFlow } from '../index'

export type CustomStep = Omit<
  OriginCustomStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.CustomStep,
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
  step: CustomStep,
  flow: EnhancedUserFlow,
}) => {
  const enhancedStep = step as any as EnhancedStep
  console.group(`${
    step.type
  }${
    step?.name ? ` "${step?.name}"` : ''
  }${
    enhancedStep?.title ? ` "${enhancedStep?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}