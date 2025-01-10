import { EnhancedStepType, EnhancedBaseStep, EnhancedUserFlow } from '../'
import { loopParentChildrenMap } from './loop'

export type BreakStep = EnhancedBaseStep & {
  comment?: string,
  type: EnhancedStepType.Break
}
export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: BreakStep,
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
  flow,
}: {
  id: string,
  step: BreakStep,
  flow: EnhancedUserFlow,
}) => {
  const parentStep = loopParentChildrenMap.get(step)
  const steps = parentStep?.steps ?? flow.steps
  const stepIndex = steps.lastIndexOf(step);
  const parentStepIndex = parentStep
    ? steps.lastIndexOf(parentStep)
    : steps.length - 1;
  console.log(id, 'before customBreak step', {parentStep, steps, stepIndex, parentStepIndex})
  if(parentStep) {
    parentStep.count = 0
  }
  // remove (stepIndex, parentStepIndex] steps
  if(parentStepIndex > stepIndex) {
    steps.splice(stepIndex + 1, parentStepIndex - stepIndex)
  }
}