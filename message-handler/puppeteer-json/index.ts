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

import * as changeStep from './step-handler/change'
import * as clickStep from './step-handler/click'
import * as closeStep from './step-handler/close'
import * as customStepStep from './step-handler/custom-step'
import * as doubleClickStep from './step-handler/double-click'
import * as emulateNetworkConditionsStep from './step-handler/emulate-network-conditions'
import * as hoverStep from './step-handler/hover'
import * as keyDownStep from './step-handler/key-down'
import * as keyUpStep from './step-handler/key-up'
import * as navigateStep from './step-handler/navigate'
import * as scrollStep from './step-handler/scroll'
import * as setViewportStep from './step-handler/set-viewport'
import * as waitForElementStep from './step-handler/wait-for-element'
import * as waitForExpressionStep from './step-handler/wait-for-expression'
import * as uploadStep from './step-handler/upload'
import * as multipleClicksStep from './step-handler/multiple-clicks'
import * as waitTimeStep from './step-handler/wait-time'
import * as loopStep from './step-handler/loop'
import * as ifElementStep from './step-handler/if-element'
import * as ifExpressionStep from './step-handler/if-expression'
import * as breakStep from './step-handler/break'
import * as returnElementStep from './step-handler/return-element'
import * as returnExpressionStep from './step-handler/return-expression'
import * as inputStep from './step-handler/input'

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
  Flow = "flow",
  MultipleClicks = "multipleClicks",
  Upload = "upload",
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
  | ({ comment?: string } & (
    | changeStep.ChangeStep
    | clickStep.ClickStep
    | closeStep.CloseStep
    | customStepStep.CustomStep
    | doubleClickStep.DoubleClickStep
    | emulateNetworkConditionsStep.EmulateNetworkConditionsStep
    | hoverStep.HoverStep
    | keyDownStep.KeyDownStep
    | keyUpStep.KeyUpStep
    | navigateStep.NavigateStep
    | scrollStep.ScrollStep
    | setViewportStep.SetViewportStep
    | waitForElementStep.WaitForElementStep
    | waitForExpressionStep.WaitForExpressionStep
  ))

  | uploadStep.UploadStep
  | multipleClicksStep.MultipleClicksStep
  | waitTimeStep.WaitTimeStep
  | loopStep.LoopStep
  | ifElementStep.IfElementStep
  | ifExpressionStep.IfExpressionStep
  | breakStep.BreakStep
  | returnElementStep.ReturnElementStep
  | returnExpressionStep.ReturnExpressionStep
  | inputStep.InputStep
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
  result: returnElementStep.ReturnElementStepReturn | returnExpressionStep.ReturnExpressionStepReturn | null

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
      await changeStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Click) {
      await clickStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Close) {
      await closeStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.CustomStep) {
      await customStepStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.DoubleClick) {
      await doubleClickStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.EmulateNetworkConditions) {
      await emulateNetworkConditionsStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Hover) {
      await hoverStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.KeyDown) {
      await keyDownStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.KeyUp) {
      await keyUpStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Navigate) {
      await navigateStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Scroll) {
      await scrollStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.SetViewport) {
      await setViewportStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.WaitForElement) {
      await waitForElementStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.WaitForExpression) {
      await waitForExpressionStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Upload) {
      await uploadStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.MultipleClicks) {
      await multipleClicksStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.WaitTime) {
      await waitTimeStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.Loop) {
      await loopStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.IfElement) {
      await ifElementStep.before({
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
      await breakStep.before({
        id,
        step: enhancedStep,
        flow: enhancedFlow
      })
    } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
      await returnElementStep.before({
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
      inputStep.before({
        id,
        step: enhancedStep as inputStep.InputStep,
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
      if(enhancedStep.type === EnhancedStepType.Upload) {
        await uploadStep.run({
          id,
          step: enhancedStep,
          page,
          senderDebuggee
        })
      } else if(enhancedStep.type === EnhancedStepType.MultipleClicks) {
        await multipleClicksStep.run({
          id,
          step: enhancedStep,
          page,
          flow: enhancedFlow,
        })
      } else if(enhancedStep.type === EnhancedStepType.WaitTime) {
        await waitTimeStep.run({
          id,
          step: enhancedStep,
        })
      } else if(enhancedStep.type === EnhancedStepType.Loop) {
        await loopStep.run({
          id,
          step: enhancedStep,
          flow: enhancedFlow,
        })
      } else if(enhancedStep.type === EnhancedStepType.IfElement) {
        await ifElementStep.run({
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
        await breakStep.run({
          id,
          step: enhancedStep,
          flow: enhancedFlow,
        })
      } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
        const result = await returnElementStep.run({
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
        await inputStep.run({
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
      await navigateStep.after({
        id,
        step: enhancedStep,
      }) 
    } else if(enhancedStep.type === EnhancedStepType.ReturnElement) {
      await returnElementStep.after({
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
    navigateStep.navigateContext.updateContextUrl(recording)
    // create first tab
    const firstNavigatorUrl = navigateStep.navigateContext.getContext()[0].url
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

      navigateStep.navigateContext.updateContext(0, {
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