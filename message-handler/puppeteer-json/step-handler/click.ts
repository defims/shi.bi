import {
  ClickStep as OriginClickStep
} from '@puppeteer/replay'

import { EnhancedStepType, EnhancedUserFlow } from '../index'
import * as waitForElementStep from './wait-for-element'

export type ClickStep = Omit<
  OriginClickStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.Click,
  waitForElement?: boolean
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
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});

  await waitForElementStep.asAProperty({
    id,
    step,
    flow
  })
}