import {
  ScrollStep as OriginScrollStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'
import { asAProperty as asAWaitForElementProperty } from './wait-for-element'

export type ScrollStep = Omit<
  OriginScrollStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.Scroll,
  waitForElement?: boolean
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: ScrollStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.waitForElement ? '.waitForElement' : ''
  }${
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});

  await asAWaitForElementProperty({
    id,
    step,
    flow
  })
}