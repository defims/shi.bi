import { EnhancedStepType, EnhancedBaseStep, EnhancedStep, EnhancedUserFlow } from '../'

export type LoopStep = EnhancedBaseStep & {
  comment?: string,
  type: EnhancedStepType.Loop,
  count?: number,
  steps?: EnhancedStep[],
}
export const type = {
  timeout: Number,
  count: Number,
}
export const loopParentChildrenMap = new Map<EnhancedStep, LoopStep>()

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: LoopStep,
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
  step: LoopStep,
  flow: EnhancedUserFlow,
}) => {
  const { steps } = step;
  if(steps?.length) {
    // change remain count of current loop step
    // put steps and current loop step after current loop step
    const count = step.count ?? -1
    const stepIndex = flow.steps.lastIndexOf
    (step);
    console.log(id, 'before customLoop step', {stepIndex, count, steps})
    // 0 for loop end placeholder
    if(stepIndex > -1 && count !== 0) {
      // insert the parent pointer into children
      steps.forEach(child => {
        loopParentChildrenMap.set(child, step);
      })
      if(count < 0) { // infinite loop
        flow.steps.splice(stepIndex + 1, 0, ...steps, step);
      } else if(count === 1) { // loop one time
        step.count! --;
        flow.steps.splice(stepIndex + 1, 0, ...steps, step);
      } else if(count > 1) {
        step.count! --;
        flow.steps.splice(stepIndex + 1, 0, ...steps, step);
      }
    }
  }
}