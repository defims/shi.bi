import { Puppeteer } from 'puppeteer-core/lib/esm/puppeteer/common/Puppeteer.js';
import {
  createRunner,
  PuppeteerRunnerExtension,
  Step,
  CustomStep,
  UserFlow,
  StepType,
  StepWithTarget,
  StepWithFrame,
  NavigateStep,
} from '@puppeteer/replay';
export { StepType } from '@puppeteer/replay'
import { Browser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser'
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { ExtensionDebuggerTransport } from './extension-debugger-transport';
import { EMessageType } from '../../utils/constants'
import { singletonDebugger } from '../../utils/singleton-debugger'
import { before as beforeUploadStep, CustomUploadStep } from './step-handler/upload'
import { before as beforeMultipleClicksStep, CustomMultipleClicksStep } from './step-handler/multiple-clicks'
import { before as beforeWaitTimeStep, CustomWaitTimeStep } from './step-handler/wait-time'
import { before as beforeLoopStep, CustomLoopStep } from './step-handler/loop'
import { before as beforeIfElementStep, CustomIfElementStep } from './step-handler/if-element'
import { before as beforeIfExpressionStep, CustomIfExpressionStep } from './step-handler/if-expression'
import { before as beforeBreakStep, CustomBreakStep } from './step-handler/break'
import {
  before as beforeReturnElementStep,
  after as afterReturnElementStep,
  CustomReturnElementStep,
  CustomReturnElementStepReturn
} from './step-handler/return-element'
import {
  before as beforeReturnExpressionStep,
  CustomReturnExpressionStep,
  CustomReturnExpressionStepReturn
} from './step-handler/return-expression'
import {
  after as afterNavigateStep,
  navigateContext,
} from './step-handler/navigate'

export type EnhancedUserFlow = Omit<UserFlow, 'steps'> & { steps: EnhancedStep[] }

export enum CustomStepName {
  Upload = "upload",
  MultipleClicks = "multipleClicks",
  WaitTime = 'waitTime',
  Loop = "loop",
  IfElement = "ifElement",
  IfExpression = "ifExpression",
  Break = "break",
  ReturnElement = 'returnElement',
  ReturnExpression = "returnExpression",
}

export type EnhancedCustomStep = (StepWithTarget | StepWithFrame) & {
  type: StepType.CustomStep;
  comment?: string;
  name: CustomStepName;
};

/**
 * enhance @puppeteer/replay step
 * The ::-p-xpath pseudo-element can function as an independent descendant selector (parent child), enabling features like size comparison that are not possible with the :has pseudo-class. e.g. `[class*=wrapper] ::-p-xpath(./*[contains(@class,"contents") and number(substring(translate(.//time/@datetime,"-T:.Z",""),0,15))>=20240723033030])+[class*=container]`
 * You cannot use newlines within ::-p-xpath, as this will cause an error.
 * Nested 'contains' methods require balanced parentheses. e.g. ::-p-xpath(./*[contains(substring(translate(.//time/@datetime,"-T:.Z",""),0,15),(("20240723033030")))])
 */
export type EnhancedStep = (
  | Exclude<Step, CustomStep> & { comment?: string }
  | CustomUploadStep
  | CustomMultipleClicksStep
  | CustomWaitTimeStep
  | CustomLoopStep
  | CustomBreakStep
  | CustomIfElementStep
  | CustomIfExpressionStep
  | CustomReturnElementStep
  | CustomReturnExpressionStep
)

const hookFetchResponse = async ({
  debuggee,
  match,
  handler,
}: {
  debuggee: chrome.debugger.Debuggee,
  match: (params: any) => boolean,
  handler: (params: any) => Promise<void>
}) => {
  await singletonDebugger.attach(debuggee)
  // await chrome.debugger.attach(debuggee, "1.3")
  await singletonDebugger.sendCommand(debuggee, "Fetch.enable", {
  // await chrome.debugger.sendCommand(debuggee, "Fetch.enable", {
    patterns: [
      {
        urlPattern: '*',
        requestStage: 'Response',
      },
    ],
  })
  const fn = async (source: chrome.debugger.Debuggee, method: string, params: any) => {
    if(method === "Fetch.requestPaused" && source.tabId === debuggee.tabId) { // TODO other debugee
      if (params?.responseErrorReason === 'Failed' || !match(params)) {
        await singletonDebugger.sendCommand(debuggee, "Fetch.continueResponse", {
        // await chrome.debugger.sendCommand(debuggee, "Fetch.continueResponse", {
          requestId: params.requestId
        })
      } else {
        console.log('hookFetchResponse', {source, method, params})
        await handler(params)
      }
    }
  }
  singletonDebugger.onEvent.addListener(fn)
  // chrome.debugger.onEvent.addListener(fn)
  return () => {
    singletonDebugger.onEvent.removeListener(fn)
    // chrome.debugger.onEvent.removeListener(fn)
    singletonDebugger.detach(debuggee)
    // chrome.debugger.detach(debuggee)
  }
}

export class Extension extends PuppeteerRunnerExtension {
  result: CustomReturnElementStepReturn | CustomReturnExpressionStepReturn | null

  private id: string
  private senderDebuggee: chrome.debugger.Debuggee

  constructor(id: string, senderDebuggee: chrome.debugger.Debuggee, browser: Browser, page: Page, opts?: {
    timeout?: number;
  }) {
    super(browser, page, opts)
    this.id = id
    this.senderDebuggee = senderDebuggee
    this.result = null
  }

  async beforeAllSteps(flow: UserFlow) {
    console.group(flow.title)
    console.log(this.id, 'beforeAllSteps', {flow});
    await super.beforeAllSteps?.(flow);
  }

  async beforeEachStep(step: Step, flow: UserFlow) {
    const enhancedStep = step as EnhancedStep
    console.group(`${enhancedStep.type} ${
      (step as any).name 
      ?? (step as any).key
      ?? ''
    }`)
    const id = this.id
    const page = this.page
    const senderDebuggee = this.senderDebuggee
    console.log(id, 'beforeEachStep', enhancedStep.comment, {step, flow});
    if(step.type === StepType.CustomStep && step.name === CustomStepName.Upload) {
      await beforeUploadStep({
        id,
        step: step as CustomUploadStep,
        page,
        senderDebuggee
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.MultipleClicks) {
      await beforeMultipleClicksStep({
        id,
        step: step as CustomMultipleClicksStep,
        page,
        flow: flow as EnhancedUserFlow,
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.WaitTime) {
      await beforeWaitTimeStep({
        id,
        step: step as CustomWaitTimeStep,
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.Loop) {
      await beforeLoopStep({
        id,
        step: step as CustomLoopStep,
        flow: flow as EnhancedUserFlow,
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.IfElement) {
      await beforeIfElementStep({
        id,
        step: step as CustomIfElementStep,
        flow: flow as EnhancedUserFlow,
        page,
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.IfExpression) {
      await beforeIfExpressionStep({
        id,
        step: step as CustomIfExpressionStep,
        flow: flow as EnhancedUserFlow,
        page,
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.Break) {
      await beforeBreakStep({
        id,
        step: step as CustomBreakStep,
        flow: flow as EnhancedUserFlow,
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.ReturnElement) {
      this.result = await beforeReturnElementStep({
        id,
        step: step as CustomReturnElementStep,
        page,
      })
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.ReturnExpression) {
      this.result = await beforeReturnExpressionStep({
        id,
        step: step as CustomReturnExpressionStep,
        flow: flow as EnhancedUserFlow,
        page,
      })
    }
    await super.beforeEachStep?.(step, flow);
  }

  async afterEachStep(step: Step, flow: UserFlow) {
    await super.afterEachStep?.(step, flow);
    const id = this.id;
    const page = this.page
    const senderDebuggee = this.senderDebuggee
    const result = this.result
    if (step.type === StepType.Navigate) {
      await afterNavigateStep({
        id,
        step: step as NavigateStep,
      }) 
    } else if(step.type === StepType.CustomStep && step.name === CustomStepName.ReturnElement) {
      await afterReturnElementStep({
        id,
        step: step as CustomReturnElementStep,
        senderDebuggee,
        result,
      }) 
    }
    console.log(id, 'afterEachStep', (step as EnhancedStep).comment, {step, flow});
    console.groupEnd()
  }

  async afterAllSteps(flow: any) {
    await super.afterAllSteps?.(flow);
    console.log(this.id, 'afterAllSteps', {flow});
    console.groupEnd()
  }
}

export const handlePuppeteerJson = async ({
  request,
  sender,
}: {
  request: {
    type: EMessageType,
    payload?: UserFlow,
    id: string
  },
  sender: chrome.runtime.MessageSender,
}) => {
  const recording = request?.payload;
  if(recording) {
    navigateContext.updateContextUrl(recording)
    // create first tab
    const firstNavigatorUrl = navigateContext.getContext()[0].url
    const tab = await chrome.tabs.create({ url: firstNavigatorUrl })

    console.log(request.id, {tab, sender, recording});

    if (sender.tab?.id && tab.id) {
      // sender raw cdp, target puppeteer
      const senderDebuggee = { tabId: sender.tab.id }


      const puppeteer = new Puppeteer({isPuppeteerCore: true})

      // transport.debug = true;
      // (globalThis as any).__PUPPETEER_DEBUG = '*'
      const debuggee: chrome.debugger.Debuggee = { tabId: tab.id }
      const browser = await puppeteer.connect({
        transport: await ExtensionDebuggerTransport.create(debuggee),
        defaultViewport: null,
      });
      const [page] = await browser.pages();

      navigateContext.updateContext(0, {
        url: firstNavigatorUrl,
        debuggee,
        browser,
        page,
      })

      const extension = new Extension(request.id, senderDebuggee, browser, page, {timeout: 7000})
      const runner = await createRunner(recording, extension)
      console.log(request.id, {runner})
      await runner.run()
      const result = extension.result

      console.log(request.id, {result})
      // proxy result urls
      await browser.close()
      // await senderBrowser.close()
      console.log(request.id, "close", {result})

      return result
    }
  }
}