import {
  NavigateStep as OriginNavigateStep,
  UserFlow,
  StepType,
} from '@puppeteer/replay';
import { Browser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser'
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'
// import { Puppeteer } from 'puppeteer-core/lib/esm/puppeteer/common/Puppeteer.js';

// import { ExtensionDebuggerTransport } from '../extension-debugger-transport';
import { EnhancedStep, EnhancedStepType, EnhancedUserFlow } from '../index'

export type NavigateStep = Omit<
  OriginNavigateStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.Navigate,
}

export const type = {
  timeout: Number,
}

type Context = {
  url: string
  debuggee?: chrome.debugger.Debuggee
  browser?: Browser,
  page?: Page,
}

class NavigateContext {
  private context: Context[] = []

  updateContextUrl (
    recording?: UserFlow,
  ) {
    this.context = [
      ...this.context,
      ...(recording?.steps
        ?.filter(step => (step.type === StepType.Navigate))
        ?.map(v => ({ url: v.url }))
        ?? []
      )
    ]
  }

  getContext() {
    return this.context
  }

  getLastestContext() {
    return this.context.find(({debuggee}) => debuggee)
  }

  async updateContext(index: number, context: Context) {
    this.context[index] = context
  }

}

export const navigateContext = new NavigateContext()

export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: NavigateStep,
  flow: EnhancedUserFlow,
}) => {
  const enhancedStep = step as any as EnhancedStep
  console.group(`${
    step.type
  }${
    step?.url ? ` "${step?.url}"` : ''
  }${
    enhancedStep?.comment ? ` "${enhancedStep?.comment}"` : ''
  }`);
  console.log(id, 'beforeEachStep', {step, flow});
}

export const after = async ({
  id,
  step,
}: {
  id: string,
  step: NavigateStep,
}) => {
  console.log(id, 'afterEachStep', {step})
  // TODO multiple context
}