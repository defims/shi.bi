import {
  StepWithFrame,
} from '@puppeteer/replay';
import { EnhancedCustomStep, CustomStepName } from '../'

export type CustomWaitTimeStep = EnhancedCustomStep & {
  name: CustomStepName.WaitTime
  parameters: Omit<StepWithFrame, 'timeout' | 'type'> & {
    time: number,
  }
}
export const before = async ({
  id,
  step,
}: {
  id: string,
  step: CustomWaitTimeStep,
}) => {
  const {
    time
  } = step.parameters;
  await new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, time)
  })
  console.log(id, 'before customWaitTime step', {time});
}