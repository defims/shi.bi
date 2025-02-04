import {
  HoverStep as OriginHoverStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'
import * as waitForElementStep from './wait-for-element'

export type HoverStep = Omit<
  OriginHoverStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.Hover,
  waitForElement?: boolean
}

export const type = {
  timeout: Number,
  waitForElement: Boolean,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: HoverStep,
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

  await waitForElementStep.asAProperty({
    id,
    step,
    flow
  })
}