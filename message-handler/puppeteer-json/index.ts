import { Puppeteer } from 'puppeteer-core/lib/esm/puppeteer/common/Puppeteer.js';
import {
  createRunner,
  PuppeteerRunnerExtension,
  StepType,
  BaseStep,
  Step,
  UserFlow,
  ChangeStep,
  ClickStep,
  HoverStep,
  CloseStep,
  CustomStep,
  DoubleClickStep,
  EmulateNetworkConditionsStep,
  KeyDownStep,
  KeyUpStep,
  NavigateStep,
  ScrollStep,
  SetViewportStep,
  WaitForElementStep,
  WaitForExpressionStep,
} from '@puppeteer/replay';
import { Browser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser'
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { ExtensionDebuggerTransport } from './extension-debugger-transport';
import { EMessageType } from '../../utils/constants'
import { before as beforeUploadStep, UploadStep } from './step-handler/upload'
import { before as beforeMultipleClicksStep, MultipleClicksStep } from './step-handler/multiple-clicks'
import { before as beforeWaitTimeStep, WaitTimeStep } from './step-handler/wait-time'
import { before as beforeLoopStep, LoopStep } from './step-handler/loop'
import { before as beforeIfElementStep, IfElementStep } from './step-handler/if-element'
import { before as beforeIfExpressionStep, IfExpressionStep } from './step-handler/if-expression'
import { before as beforeBreakStep, BreakStep } from './step-handler/break'
import {
  before as beforeReturnElementStep,
  after as afterReturnElementStep,
  ReturnElementStep,
  ReturnElementStepReturn
} from './step-handler/return-element'
import {
  before as beforeReturnExpressionStep,
  ReturnExpressionStep,
  ReturnExpressionStepReturn
} from './step-handler/return-expression'
import {
  after as afterNavigateStep,
  navigateContext,
} from './step-handler/navigate'

export type EnhancedBaseStep = Omit<
  BaseStep,
  'type'
> & {
  type: EnhancedStepType,
  comment?: string,
}
export enum EnhancedStepType {
  // @puppeteer/replay step type
  Change = StepType.Change,
  Click = StepType.Click,
  Close = StepType.Close,
  CustomStep = StepType.CustomStep,
  DoubleClick = StepType.DoubleClick,
  EmulateNetworkConditions = StepType.EmulateNetworkConditions,
  Hover = StepType.Hover,
  KeyDown = StepType.KeyDown,
  KeyUp = StepType.KeyUp,
  Navigate = StepType.Navigate,
  Scroll = StepType.Scroll,
  SetViewport = StepType.SetViewport,
  WaitForElement = StepType.WaitForElement,
  WaitForExpression = StepType.WaitForExpression,

  // additional step type
  MultipleClicks = "multipleClicks",
  Upload = "upload",
  WaitTime = 'waitTime',
  Loop = "loop",
  IfElement = "ifElement",
  IfExpression = "ifExpression",
  Break = "break",
  ReturnElement = 'returnElement',
  ReturnExpression = "returnExpression",
}

/**
 * enhance @puppeteer/replay step
 * The ::-p-xpath pseudo-element can function as an independent descendant selector (parent child), enabling features like size comparison that are not possible with the :has pseudo-class. e.g. `[class*=wrapper] ::-p-xpath(./*[contains(@class,"contents") and number(substring(translate(.//time/@datetime,"-T:.Z",""),0,15))>=20240723033030])+[class*=container]`
 * You cannot use newlines within ::-p-xpath, as this will cause an error.
 * Nested 'contains' methods require balanced parentheses. e.g. ::-p-xpath(./*[contains(substring(translate(.//time/@datetime,"-T:.Z",""),0,15),(("20240723033030")))])
 */
export type EnhancedStep = (
  | ({ comment?: string } & (
    | Omit<ChangeStep, 'type'> & { type: EnhancedStepType.Change }
    | Omit<ClickStep, 'type'> & { type: EnhancedStepType.Click }
    | Omit<HoverStep, 'type'> & { type: EnhancedStepType.Hover }
    | Omit<CloseStep, 'type'> & { type: EnhancedStepType.Close }
    | Omit<CustomStep, 'type'> & { type: EnhancedStepType.CustomStep }
    | Omit<DoubleClickStep, 'type'> & { type: EnhancedStepType.DoubleClick }
    | Omit<EmulateNetworkConditionsStep, 'type'> & { type: EnhancedStepType.EmulateNetworkConditions }
    | Omit<KeyDownStep, 'type'> & { type: EnhancedStepType.KeyDown }
    | Omit<KeyUpStep, 'type'> & { type: EnhancedStepType.KeyUp }
    | Omit<NavigateStep, 'type'> & { type: EnhancedStepType.Navigate }
    | Omit<ScrollStep, 'type'> & { type: EnhancedStepType.Scroll }
    | Omit<SetViewportStep, 'type'> & { type: EnhancedStepType.SetViewport }
    | Omit<WaitForElementStep, 'type'> & { type: EnhancedStepType.WaitForElement }
    | Omit<WaitForExpressionStep, 'type'> & { type: EnhancedStepType.WaitForExpression }
  ))

  | UploadStep
  | MultipleClicksStep
  | WaitTimeStep
  | LoopStep
  | IfElementStep
  | IfExpressionStep
  | BreakStep
  | ReturnElementStep
  | ReturnExpressionStep
)
export type EnhancedUserFlow = Omit<UserFlow, 'steps'> & { steps: EnhancedStep[] }

// const hookFetchResponse = async ({
//   debuggee,
//   match,
//   handler,
// }: {
//   debuggee: chrome.debugger.Debuggee,
//   match: (params: any) => boolean,
//   handler: (params: any) => Promise<void>
// }) => {
//   await singletonDebugger.attach(debuggee)
//   // await chrome.debugger.attach(debuggee, "1.3")
//   await singletonDebugger.sendCommand(debuggee, "Fetch.enable", {
//   // await chrome.debugger.sendCommand(debuggee, "Fetch.enable", {
//     patterns: [
//       {
//         urlPattern: '*',
//         requestStage: 'Response',
//       },
//     ],
//   })
//   const fn = async (source: chrome.debugger.Debuggee, method: string, params: any) => {
//     if(method === "Fetch.requestPaused" && source.tabId === debuggee.tabId) { // TODO other debugee
//       if (params?.responseErrorReason === 'Failed' || !match(params)) {
//         await singletonDebugger.sendCommand(debuggee, "Fetch.continueResponse", {
//         // await chrome.debugger.sendCommand(debuggee, "Fetch.continueResponse", {
//           requestId: params.requestId
//         })
//       } else {
//         console.log('hookFetchResponse', {source, method, params})
//         await handler(params)
//       }
//     }
//   }
//   singletonDebugger.onEvent.addListener(fn)
//   // chrome.debugger.onEvent.addListener(fn)
//   return () => {
//     singletonDebugger.onEvent.removeListener(fn)
//     // chrome.debugger.onEvent.removeListener(fn)
//     singletonDebugger.detach(debuggee)
//     // chrome.debugger.detach(debuggee)
//   }
// }

export class Extension extends PuppeteerRunnerExtension {
  result: ReturnElementStepReturn | ReturnExpressionStepReturn | null

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
    const enhancedStep = step as any as EnhancedStep
    const enhancedFlow = flow as any as EnhancedUserFlow
    console.group(`${
      enhancedStep.type
    } ${
      (enhancedStep as any)?.name ?? ''
    }`)
    const id = this.id
    const page = this.page
    const senderDebuggee = this.senderDebuggee
    console.log(
      id,
      'beforeEachStep',
      enhancedStep.comment ?? (enhancedStep as any)?.key ?? '',
      {enhancedStep, enhancedFlow}
    );
    if(enhancedStep.type === EnhancedStepType.Upload) {
      await beforeUploadStep({
        id,
        step: enhancedStep as UploadStep,
        page,
        senderDebuggee
      })
    } else if(enhancedStep.type === EnhancedStepType.MultipleClicks) {
      await beforeMultipleClicksStep({
        id,
        step: enhancedStep as MultipleClicksStep,
        page,
        flow: enhancedFlow,
      })
    } else if(enhancedStep.type === EnhancedStepType.WaitTime) {
      await beforeWaitTimeStep({
        id,
        step: enhancedStep as WaitTimeStep,
      })
    } else if(enhancedStep.type === EnhancedStepType.Loop) {
      await beforeLoopStep({
        id,
        step: enhancedStep as LoopStep,
        flow: enhancedFlow,
      })
    } else if(enhancedStep.type === EnhancedStepType.IfElement) {
      await beforeIfElementStep({
        id,
        step: enhancedStep as IfElementStep,
        flow: enhancedFlow,
        page,
      })
    // } else if(enhancedStep.type === EnhancedStepType.IfExpression) {
    //   await beforeIfExpressionStep({
    //     id,
    //     step: enhancedStep as IfExpressionStep,
    //     flow: enhancedFlow,
    //     page,
    //   })
    } else if(enhancedStep.type === EnhancedStepType.Break) {
      await beforeBreakStep({
        id,
        step: enhancedStep as BreakStep,
        flow: enhancedFlow,
      })
    } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
      this.result = await beforeReturnElementStep({
        id,
        step: enhancedStep as ReturnElementStep,
        page,
      })
    // } else if(enhancedStep.type === EnhancedStepType.ReturnExpression) {
    //   this.result = await beforeReturnExpressionStep({
    //     id,
    //     step: enhancedStep as ReturnExpressionStep,
    //     flow: enhancedFlow,
    //     page,
    //   })
    }
    await super.beforeEachStep?.(step, flow);
  }

  async runStep(step: Step, flow: UserFlow) {
    console.log(
      this.id,
      'runStep',
      (step as any)?.comment ?? (step as any).key ?? '',
      {step, flow}
    );
    if(Object.values(StepType).includes(step.type)) {
      await super.runStep?.(step, flow)
    } else {
      // Treat any step that are not in @puppeteer/replay as customStep.
      await super.runStep?.({type: StepType.CustomStep, name: step.type, parameters: {}}, flow)
    }
  }

  async afterEachStep(step: any, flow: any) {
    const enhancedStep = step as EnhancedStep
    const enhancedFlow = flow as EnhancedUserFlow
    await super.afterEachStep?.(step, flow);
    const id = this.id;
    // const page = this.page
    const senderDebuggee = this.senderDebuggee
    const result = this.result
    if (step.type === StepType.Navigate) {
      await afterNavigateStep({
        id,
        step: step as NavigateStep,
      }) 
    } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
      await afterReturnElementStep({
        id,
        step: enhancedStep as ReturnElementStep,
        senderDebuggee,
        result,
      }) 
    }
    console.log(
      id,
      'afterEachStep',
      enhancedStep.comment ?? (enhancedStep as any).key ?? '',
      {enhancedStep, enhancedFlow}
    );
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
  id,
  sender,
}: {
  id: string,
  request: {
    type: EMessageType,
    payload?: UserFlow,
  },
  sender: chrome.runtime.MessageSender,
}) => {
  const recording = request?.payload;
  if(recording) {
    navigateContext.updateContextUrl(recording)
    // create first tab
    const firstNavigatorUrl = navigateContext.getContext()[0].url
    const tab = await chrome.tabs.create({ url: firstNavigatorUrl })

    console.log(id, {tab, sender, recording});

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

      const extension = new Extension(id, senderDebuggee, browser, page, {timeout: 7000})
      const runner = await createRunner(recording, extension)
      console.log(id, {runner})
      await runner.run()
      const result = extension.result

      console.log(id, {result})
      // proxy result urls
      await browser.close()
      // await senderBrowser.close()
      console.log(id, "close", {result})

      return result
    }
  }
}