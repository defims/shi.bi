import { Puppeteer } from 'puppeteer-core/lib/esm/puppeteer/common/Puppeteer.js';
import {
  createRunner,
  PuppeteerRunnerExtension,
  StepType,
  BaseStep,
  Step,
  UserFlow,
} from '@puppeteer/replay';
import { Browser } from 'puppeteer-core/lib/esm/puppeteer/api/Browser'
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { ExtensionDebuggerTransport } from './extension-debugger-transport';
import { EMessageType } from '../../utils/constants'

import * as steps from './steps';

export type EnhancedBaseStep = Omit<
  BaseStep,
  'type'
> & {
  type: EnhancedStepType,
  title?: string,
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
  Flow = "flow",
  MultipleClicks = "multipleClicks",
  UploadFile = "uploadFile",
  WaitTime = 'waitTime',
  Loop = "loop",
  IfElement = "ifElement",
  IfExpression = "ifExpression",
  Break = "break",
  ReturnElement = 'returnElement',
  ReturnExpression = "returnExpression",
  Input = "input",
}

/**
 * enhance @puppeteer/replay step
 * The ::-p-xpath pseudo-element can function as an independent descendant selector (parent child), enabling features like size comparison that are not possible with the :has pseudo-class. e.g. `[class*=wrapper] ::-p-xpath(./*[contains(@class,"contents") and number(substring(translate(.//time/@datetime,"-T:.Z",""),0,15))>=20240723033030])+[class*=container]`
 * You cannot use newlines within ::-p-xpath, as this will cause an error.
 * Nested 'contains' methods require balanced parentheses. e.g. ::-p-xpath(./*[contains(substring(translate(.//time/@datetime,"-T:.Z",""),0,15),(("20240723033030")))])
 */
export type EnhancedStep = (
  | ({ title?: string } & (
    | steps.changeStep.ChangeStep
    | steps.clickStep.ClickStep
    | steps.closeStep.CloseStep
    | steps.customStepStep.CustomStep
    | steps.doubleClickStep.DoubleClickStep
    | steps.emulateNetworkConditionsStep.EmulateNetworkConditionsStep
    | steps.hoverStep.HoverStep
    | steps.keyDownStep.KeyDownStep
    | steps.keyUpStep.KeyUpStep
    | steps.navigateStep.NavigateStep
    | steps.scrollStep.ScrollStep
    | steps.setViewportStep.SetViewportStep
    | steps.waitForElementStep.WaitForElementStep
    | steps.waitForExpressionStep.WaitForExpressionStep
  ))

  | steps.uploadFileStep.UploadFileStep
  | steps.multipleClicksStep.MultipleClicksStep
  | steps.waitTimeStep.WaitTimeStep
  | steps.loopStep.LoopStep
  | steps.ifElementStep.IfElementStep
  | steps.ifExpressionStep.IfExpressionStep
  | steps.breakStep.BreakStep
  | steps.returnElementStep.ReturnElementStep
  | steps.returnExpressionStep.ReturnExpressionStep
  | steps.inputStep.InputStep
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
  result: steps.returnElementStep.ReturnElementStepReturn | steps.returnExpressionStep.ReturnExpressionStepReturn | null

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
    const enhancedStep = step as any as EnhancedStep;
    const enhancedFlow = flow as any as EnhancedUserFlow;
    const id = this.id;
    // const page = this.page
    // const senderDebuggee = this.senderDebuggee

    if(enhancedStep.type === EnhancedStepType.Change) {
      await steps.changeStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Click) {
      await steps.clickStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Close) {
      await steps.closeStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.CustomStep) {
      await steps.customStepStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.DoubleClick) {
      await steps.doubleClickStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.EmulateNetworkConditions) {
      await steps.emulateNetworkConditionsStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Hover) {
      await steps.hoverStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.KeyDown) {
      await steps.keyDownStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.KeyUp) {
      await steps.keyUpStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Navigate) {
      await steps.navigateStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Scroll) {
      await steps.scrollStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.SetViewport) {
      await steps.setViewportStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.WaitForElement) {
      await steps.waitForElementStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.WaitForExpression) {
      await steps.waitForExpressionStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.UploadFile) {
      await steps.uploadFileStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.MultipleClicks) {
      await steps.multipleClicksStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.WaitTime) {
      await steps.waitTimeStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Loop) {
      await steps.loopStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.IfElement) {
      await steps.ifElementStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    // } else if(enhancedStep.type === EnhancedStepType.IfExpression) {
    //   await ifExpression.before({
    //     id,
    //     step: enhancedStep,
    //     flow: enhancedFlow
    //   })
    } else if(enhancedStep.type === EnhancedStepType.Break) {
      await steps.breakStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
      await steps.returnElementStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    // } else if(enhancedStep.type === EnhancedStepType.ReturnExpression) {
    //   await returnExpressionStep.before({
    //     id,
    //     step: enhancedStep,
    //     flow: enhancedFlow
    //   })
    } else if(enhancedStep.type === EnhancedStepType.Input) {
      steps.inputStep.before({
        id,
        step: enhancedStep as steps.inputStep.InputStep,
        flow: enhancedFlow
      })
    }
    await super.beforeEachStep?.(step, flow);
  }

  async runStep(step: Step, flow: UserFlow) {
    const enhancedStep = step as any as EnhancedStep
    const enhancedFlow = flow as any as EnhancedUserFlow
    const id = this.id
    const page = this.page
    const senderDebuggee = this.senderDebuggee
    console.log(
      id,
      'runStep',
      {step, flow}
    );
    if(Object.values(StepType).includes(step.type)) {
      await super.runStep?.(step, flow)
    } else {
      if(enhancedStep.type === EnhancedStepType.UploadFile) {
        await steps.uploadFileStep.run({
          id,
          step: enhancedStep,
          page,
          senderDebuggee
        })
      } else if(enhancedStep.type === EnhancedStepType.MultipleClicks) {
        await steps.multipleClicksStep.run({
          id,
          step: enhancedStep,
          page,
          flow: enhancedFlow,
        })
      } else if(enhancedStep.type === EnhancedStepType.WaitTime) {
        await steps.waitTimeStep.run({
          id,
          step: enhancedStep,
        })
      } else if(enhancedStep.type === EnhancedStepType.Loop) {
        await steps.loopStep.run({
          id,
          step: enhancedStep,
          flow: enhancedFlow,
        })
      } else if(enhancedStep.type === EnhancedStepType.IfElement) {
        await steps.ifElementStep.run({
          id,
          step: enhancedStep,
          flow: enhancedFlow,
          page,
        })
      // } else if(enhancedStep.type === EnhancedStepType.IfExpression) {
      //   await runIfExpressionStep({
      //     id,
      //     step: enhancedStep,
      //     flow: enhancedFlow,
      //     page,
      //   })
      } else if(enhancedStep.type === EnhancedStepType.Break) {
        await steps.breakStep.run({
          id,
          step: enhancedStep,
          flow: enhancedFlow,
        })
      } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
        const result = await steps.returnElementStep.run({
          id,
          step: enhancedStep,
          page,
        })
        if(result) {
          this.result = result
        }
      // } else if(enhancedStep.type === EnhancedStepType.ReturnExpression) {
      //   this.result = await runReturnExpressionStep({
      //     id,
      //     step: enhancedStep,
      //     flow: enhancedFlow,
      //     page,
      //   })
      } else if(enhancedStep.type === EnhancedStepType.Input) {
        await steps.inputStep.run({
          id,
          step: enhancedStep,
          flow: enhancedFlow,
        })
      }
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
    if (enhancedStep.type === EnhancedStepType.Navigate) {
      await steps.navigateStep.after({
        id,
        step: enhancedStep,
      }) 
    } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
      await steps.returnElementStep.after({
        id,
        step: enhancedStep,
        senderDebuggee,
        result,
      }) 
    }
    console.log(
      id,
      'afterEachStep',
      {step, flow}
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
    steps.navigateStep.navigateContext.updateContextUrl(recording)
    // create first tab
    const firstNavigatorUrl = steps.navigateStep.navigateContext.getContext()[0].url
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

      steps.navigateStep.navigateContext.updateContext(0, {
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