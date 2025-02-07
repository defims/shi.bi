import {
  ClickStep as OriginClickStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'
import * as waitForElementStep from './wait-for-element'

export type ClickStep = Omit<
  OriginClickStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.Click,
  waitForElement?: boolean
}

export const type = {
  offsetX: Number,
  offsetY: Number,
  waitElement: Boolean,
  duration: Number,
  timeout: Number,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: ClickStep,
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

  await waitForElementStep.asAProperty({
    id,
    step,
    flow
  })
}