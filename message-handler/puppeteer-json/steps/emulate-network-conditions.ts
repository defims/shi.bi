import {
  EmulateNetworkConditionsStep as OriginEmulateNetworkConditionsStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'

export type EmulateNetworkConditionsStep = Omit<
  OriginEmulateNetworkConditionsStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.EmulateNetworkConditions,
}

export const type = {
  timeout: Number,
  download: Number,
  upload: Number,
  latency: Number,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: EmulateNetworkConditionsStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.title ? ` "${step?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});

}