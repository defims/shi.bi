import { CustomStepName, EnhancedCustomStep, EnhancedUserFlow } from '../'
import { loopParentChildrenMap } from './loop'

export type CustomBreakStep = EnhancedCustomStep & {
  name: CustomStepName.Break
}
export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: CustomBreakStep,
  flow: EnhancedUserFlow,
}) => {
  const parentStep = loopParentChildrenMap.get(step)
  const steps = parentStep?.parameters.steps ?? flow.steps
  const stepIndex = steps.lastIndexOf(step);
  const parentStepIndex = parentStep
    ? steps.lastIndexOf(parentStep)
    : steps.length - 1;
  console.log(id, 'before customBreak step', {parentStep, steps, stepIndex, parentStepIndex})
  if(parentStep) {
    parentStep.parameters.count = 0
  }
  // remove (stepIndex, parentStepIndex] steps
  if(parentStepIndex > stepIndex) {
    steps.splice(stepIndex + 1, parentStepIndex - stepIndex)
  }
}