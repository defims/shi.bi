import { EnhancedCustomStep, CustomStepName, EnhancedStep, EnhancedUserFlow } from '../'

export type CustomLoopStep = EnhancedCustomStep & {
  name: CustomStepName.Loop,
  parameters: {
    count?: number,
    steps?: EnhancedStep[],
  }
}

export const loopParentChildrenMap = new Map<EnhancedStep, CustomLoopStep>()

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: CustomLoopStep,
  flow: EnhancedUserFlow,
}) => {
  const { steps } = step.parameters;
  if(steps?.length) {
    // change remain count of current loop step
    // put steps and current loop step after current loop step
    const count = step.parameters.count ?? -1
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
        step.parameters.count! --;
        flow.steps.splice(stepIndex + 1, 0, ...steps, step);
      } else if(count > 1) {
        step.parameters.count! --;
        flow.steps.splice(stepIndex + 1, 0, ...steps, step);
      }
    }
  }
}