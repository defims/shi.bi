import {
  StepWithFrame,
} from '@puppeteer/replay';
import { EnhancedStepType, EnhancedBaseStep, EnhancedUserFlow } from '../'

export type WaitTimeStep = EnhancedBaseStep & Omit<
  StepWithFrame,
 'timeout' | 'type'
> & {
  comment?: string,
  type: EnhancedStepType.WaitTime,
  time: number,
}
export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: WaitTimeStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}
export const run = async ({
  id,
  step,
}: {
  id: string,
  step: WaitTimeStep,
}) => {
  const {
    time
  } = step;
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, time)
  })
  console.log(id, 'before waitTime step', {time});
}