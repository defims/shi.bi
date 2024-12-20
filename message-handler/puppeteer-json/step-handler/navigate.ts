import {
  NavigateStep,
  UserFlow,
  StepType,
} from '@puppeteer/replay';
import { Browser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser'
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'
// import { Puppeteer } from 'puppeteer-core/lib/esm/puppeteer/common/Puppeteer.js';

// import { ExtensionDebuggerTransport } from '../extension-debugger-transport';

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

export const after = async ({
  id,
  step,
}: {
  id: string,
  step: NavigateStep,
}) => {
  console.log(id, 'after navigate step', {step})
  // TODO multiple context
}