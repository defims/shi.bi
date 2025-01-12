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
  duration: number,
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
    duration
  } = step;
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, duration)
  })
  console.log(id, 'before waitTime step', {duration});
}