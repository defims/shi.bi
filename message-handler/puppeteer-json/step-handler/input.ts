import { EnhancedStepType, EnhancedBaseStep, EnhancedUserFlow, EnhancedStep } from '../'

export type InputStep = EnhancedBaseStep & {
  type: EnhancedStepType.Input,
  text: string,
}
export const before = async ({
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