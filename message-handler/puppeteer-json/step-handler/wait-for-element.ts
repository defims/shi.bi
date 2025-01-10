import {
  WaitForElementStep as OriginWaitForElementStep,
  Selector
} from '@puppeteer/replay';
import { EnhancedStep, EnhancedBaseStep, EnhancedUserFlow, EnhancedStepType } from '../index'

export type WaitForElementStep = Omit<
  OriginWaitForElementStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.WaitForElement,
}

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: WaitForElementStep,
  flow: EnhancedUserFlow,
}) => {
  console.group(`${
    step.type
  }${
    step?.comment ? ` "${step?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}

export const asAProperty = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: EnhancedBaseStep & { waitForElement?: boolean, selectors?: Selector[] },
  flow: EnhancedUserFlow,
}) => {
  console.log(id, "waitForElementStep asAProperty", {step, flow});
  const stepIndex = flow.steps.lastIndexOf(step as EnhancedStep);
  if(step && step.selectors && step.waitForElement) {
    // [{type: EnhancedStepType.Click, waitForElement: true}]
    // =>
    // [{type: EnhancedStepType.WaitForElement}, {type: EnhancedStepType.Click}]
    const {waitForElement, ...newStep} = step;
    // Change the type of the current step to execute as a WaitForElement step.
    step.type = EnhancedStepType.WaitForElement;
    step.waitForElement = false;
    // Insert the steps for actual execution.
    const insertSteps = [newStep] as EnhancedStep[]
    if(insertSteps?.length) {
      flow.steps.splice(stepIndex + 1, 0, ...insertSteps);
    }
    console.log(id, { step, flow, waitForElement, insertSteps })
  }
}