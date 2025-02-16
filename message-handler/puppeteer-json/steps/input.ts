import { EnhancedStepType, EnhancedBaseStep, EnhancedUserFlow, EnhancedStep } from '../'

export type InputStep = EnhancedBaseStep & {
  title?: string,
  type: EnhancedStepType.Input,
  text: string,
}
export const type = {
  timeout: Number,
}
export const before = ({
  id,
  step,
  flow,
}: {
  id: string,
  step: InputStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.text ? ` "${step?.text}"` : ''
  }${
    step?.title ? ` "${step?.title}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}
export const run = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: InputStep,
  flow: EnhancedUserFlow,
}) => {
  const stepIndex = flow.steps.lastIndexOf(step);
  const insertSteps = step.text
    .split('')
    .map(key => [
      { type: EnhancedStepType.KeyDown, key },
      { type: EnhancedStepType.KeyUp, key },
    ])
    .flat() as EnhancedStep[]
  if(insertSteps?.length) {
    flow.steps.splice(stepIndex + 1, 0, ...insertSteps);
  }
}