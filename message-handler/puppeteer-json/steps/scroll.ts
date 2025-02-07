import {
  ScrollStep as OriginScrollStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'
import { asAProperty as asAWaitForElementProperty } from './wait-for-element'

export type ScrollStep = Omit<
  OriginScrollStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.Scroll,
  waitForElement?: boolean
}
export const type = {
  timeout: Number,
  x: Number,
  y: Number,
  waitForElement: Boolean,
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
    step?.title ? ` "${step?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});

  await asAWaitForElementProperty({
    id,
    step,
    flow
  })
}