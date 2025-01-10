import {
  EmulateNetworkConditionsStep as OriginEmulateNetworkConditionsStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'

export type EmulateNetworkConditionsStep = Omit<
  OriginEmulateNetworkConditionsStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.EmulateNetworkConditions,
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
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});

}