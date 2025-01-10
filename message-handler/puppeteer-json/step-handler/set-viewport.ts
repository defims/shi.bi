import {
  SetViewportStep as OriginSetViewportStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'

export type SetViewportStep = Omit<
  OriginSetViewportStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.SetViewport,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: SetViewportStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}