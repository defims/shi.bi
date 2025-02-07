import {
  CloseStep as OriginCloseStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'

export type CloseStep = Omit<
  OriginCloseStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.Close,
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
  step: CloseStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.title ? ` "${step?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}