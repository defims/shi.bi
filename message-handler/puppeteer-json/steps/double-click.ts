import {
  DoubleClickStep as OriginDoubleClickStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'
import * as waitForElementStep from './wait-for-element'

export type DoubleClickStep = Omit<
  OriginDoubleClickStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.DoubleClick,
  waitForElement?: boolean
}

export const type = {
  timeout: Number,
  waitForElement: Boolean,
  offsetX: Number,
  offsetY: Number,
  duration: Number,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: DoubleClickStep,
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