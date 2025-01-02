import {
  StepWithFrame,
} from '@puppeteer/replay';
import { EnhancedStepType, EnhancedBaseStep } from '../'

export type WaitTimeStep = EnhancedBaseStep & Omit<
  StepWithFrame,
 'timeout' | 'type'
> & {
  type: EnhancedStepType.WaitTime,
  time: number,
}
export const before = async ({
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