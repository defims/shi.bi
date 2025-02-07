import {
  UserFlow as OriginFlowStep
} from '@puppeteer/replay'

import { EnhancedStepType } from '../'

export type FlowStep = Omit<
OriginFlowStep,
  'type'
> & {
  title?: string,
  type: EnhancedStepType.Flow,
}

export const type = {
  timeout: Number,
}
