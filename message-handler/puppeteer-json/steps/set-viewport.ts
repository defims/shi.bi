import {
  SetViewportStep as OriginSetViewportStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'

export type SetViewportStep = Omit<
  OriginSetViewportStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.SetViewport,
}
export const type = {
  timeout: Number,
  width: Number,
  height: Number,
  deviceScaleFactor: Number,
  isMobile: Boolean,
  hasTouch: Boolean,
  isLandscape: Boolean,
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
    step?.title ? ` "${step?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}