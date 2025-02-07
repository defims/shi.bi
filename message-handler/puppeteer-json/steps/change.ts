import {
  ChangeStep as OriginChangeStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'
import { asAProperty as asAWaitForElementProperty } from './wait-for-element'

export type ChangeStep = Omit<
  OriginChangeStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.Change,
  waitForElement?: boolean
}

export const type = {
  waitElement: Boolean,
  timeout: Number,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: ChangeStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.waitForElement ? '.waitForElement' : ''
  }${
    step?.title ? ` "${step?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});

  await asAWaitForElementProperty({
    id,
    step,
    flow
  })
}