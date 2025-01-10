import {
  WaitForElementStep,
} from '@puppeteer/replay';
import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'
import { Frame } from 'puppeteer-core/lib/esm/puppeteer/api/Frame'
import { STATUS_TEXTS } from 'puppeteer-core/lib/esm/puppeteer/api/HTTPRequest.js'

import { EnhancedBaseStep, EnhancedStepType, EnhancedUserFlow } from '../index'
import { querySelectorsAll, getFrame } from '../utils'
import { comparators } from '../constants'
import { singletonDebugger } from '../../../utils/singleton-debugger'
import { ReturnExpressionStepReturn } from './return-expression'

export type ReturnElementStep = EnhancedBaseStep & Omit<
  WaitForElementStep,
  'type'
> & {
  comment?: string,
  type: EnhancedStepType.ReturnElement,
  waitForElement?: boolean,
}
export type ReturnElementStepReturn = {
  elements?: string[],
  styles?: string[],
  urls?: {[Url: string]: number[]},
  type: EnhancedStepType.ReturnElement
}

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
export const before = async ({
  id,
  step,
  flow,
}: {
  id: string,
  step: ReturnElementStep,
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
  page,
}: {
  id: string,
  step: ReturnElementStep,
  page: Page,
}): Promise<ReturnElementStepReturn | undefined> => {
  // refer to https://github.com/puppeteer/replay/blob/e2c85b98e497c9191eae5a2d23429588fcd5849e/src/PuppeteerRunnerExtension.ts#L356
  async function getElementsOuterHTML(
    step: ReturnElementStep,
    frame: Frame | Page,
  ): Promise<Omit<ReturnElementStepReturn, 'type'>> {
    const {
      count = 1,
      operator = '>=',
      visible = true,
      properties,
      attributes,
    } = step;
    const compFn = comparators[operator];

    // get all element tags
    const elements = await querySelectorsAll(step.selectors, frame);
    const isCountMatch = compFn(elements.length, count);
    const elementsHandle = await frame.evaluateHandle(
      (...elements) => {
        return elements;
      },
      ...elements
    );
    await Promise.all(elements.map((element) => element.dispose()));
    if (!isCountMatch) {
      return {}
    }
    const {
      outerHTML: elementsOuterHTML,
      urls: elementsUrls,
    } = await elementsHandle.evaluate(
      (elements, properties, attributes) => {
        let result = [...elements]
        if (attributes) {
          result = result.filter(element => {
            for (const [name, value] of Object.entries(attributes)) {
              if (element.getAttribute(name) !== value) {
                return false;
              }
            }
            return true
          })
        }
        if (properties) {
          result = result.filter(element => {
            if (!isDeepMatch(properties, element)) {
              return false;
            }
            return true
          })
        }
        return {
          outerHTML: result.map(element => element.outerHTML),
          urls: result
            .reduce<NonNullable<ReturnElementStepReturn['urls']>>((acc, element, index) => {
              // <img src="xxx" />
              Array
                .from(element.querySelectorAll('[src]'))
                .concat(element)
                .forEach(v => {
                  const url = v.getAttribute('src')
                  if(url) {
                    (acc[url] = acc[url] || []).push(index)
                  }
                })
              // style='url(xxx)'
              Array
                .from(element.querySelectorAll('[style*="url("]'))
                .concat(element)
                .forEach((v: Element) => {
                  const attr = v.getAttribute('style')
                  const reg = /url\s*\(\s*['"]\s*([^\)]+?)\s*['"]\s*\)/gim
                  if(attr) {
                    let result
                    while ((result = reg.exec(attr)) !== null) {
                      const url = result?.[1]
                      ;(acc[url] = acc[url] || []).push(index)
                    }
                  }
                })
              return acc
            }, {})
        }

        function isDeepMatch<T>(a: T, b: unknown): b is T {
          if (a === b) {
            return true;
          }
          if ((a && !b) || (!a && b)) {
            return false;
          }
          if (!(a instanceof Object) || !(b instanceof Object)) {
            return false;
          }
          for (const [key, value] of Object.entries(a)) {
            if (!isDeepMatch(value, (b as Record<string, unknown>)[key])) {
              return false;
            }
          }
          return true;
        }
      },
      properties,
      attributes,
    );
    await elementsHandle.dispose();

    // get all style tags
    const styles = await querySelectorsAll(['style'], frame);
    const stylesHandle = await frame.evaluateHandle(
      (...styles) => styles,
      ...styles
    );
    await Promise.all(styles.map(style => style.dispose()));
    const {
      outerHTML: stylesOuterHTML,
      urls: stylesUrls,
    } = await stylesHandle.evaluate(
      (styles ) => {
        const result = [...styles]
        return {
          outerHTML: result.map(style => style.outerHTML),
          urls: result.reduce<NonNullable<ReturnElementStepReturn['urls']>>((acc, style, index) => {
            const outerHTML = style.outerHTML
            const reg = /url\s*\(\s*['"]\s*([^\)]+?)\s*['"]\s*\)/gim
            if(outerHTML) {
              let result
              while ((result = reg.exec(outerHTML)) !== null) {
                const url = result?.[1]
                ;(acc[url] = acc[url] || []).push(index)
              }
            }
            return acc
          }, {})
        };
      },
    );

    return visible !== !!elementsOuterHTML.length 
      ? {}
      : {
        elements: elementsOuterHTML,
        styles: stylesOuterHTML,
        urls: {...stylesUrls, ...elementsUrls}
      };
  }

  const targetPageOrFrame = page; //TODO
  const localFrame = await getFrame(targetPageOrFrame, step);
  const {
    elements,
    styles,
    urls
  } = await getElementsOuterHTML(step, localFrame);

  console.log(id, 'before customReturnElement step', {elements, styles, urls})

  return {
    elements,
    styles,
    urls,
    type: EnhancedStepType.ReturnElement
  }
}

export const after = async ({
  id,
  step,
  senderDebuggee,
  result,
}: {
  id: string,
  step: ReturnElementStep,
  senderDebuggee: chrome.debugger.Debuggee,
  result: ReturnElementStepReturn | ReturnExpressionStepReturn | null
}) => {
  // Handling CORS for returnElement
  const {elements, styles, urls} = result as ReturnElementStepReturn // TODO
  console.log(id, "after customReturnElement step", {elements, urls})

  const findElements = (requestUrl: string) => (
    Object.keys(urls ?? {})
      .filter(url => (url === requestUrl))
      .reduce<string[]>((acc, curr) => {
        urls![curr].forEach(index => {
          if(elements?.[index]) {
            acc.push(elements[index])
          }
        })
        return acc
      }, [])
  )

  await hookFetchResponse({
    debuggee: senderDebuggee,
    match: (params) => !!findElements(params?.request?.url)?.length,
    handler: async (params) => {
      let responseHeaders
      if(params.responseHeaders) {
        responseHeaders = [...params.responseHeaders]
        const findIndex = params.responseHeaders
          .findIndex(({name}: any) => name === "access-control-allow-origin")
          ?? params.responseHeaders.length
        responseHeaders[findIndex] = {
          name: 'access-control-allow-origin',
          // value: 'http://localhost'
          value: '*'
        }
      }
      console.log({responseHeaders})
      await singletonDebugger.sendCommand(senderDebuggee, "Fetch.continueResponse", {
      // await chrome.debugger.sendCommand(senderDebuggee, "Fetch.continueResponse", {
      // senderTransport.send(JSON.stringify({
      //   method: 'Fetch.continueResponse',
      //   params: {
          requestId: params.requestId,
          ...(!params.responseHeaders ? {} : {
            responseCode: params.responseStatusCode,
            responsePhrase: STATUS_TEXTS[params.responseStatusCode],
            // responsePhrase: params.responseStatusText, // empty string will cause error
            responseHeaders
          })
        }
      // })
      )
      // const responseBody = await chrome.debugger.sendCommand(senderDebuggee, "Fetch.getResponseBody", {
      //   requestId: params.requestId
      // }) as {body: string}
      // console.log({responseBody})
      // await chrome.debugger.sendCommand(senderDebuggee, "Fetch.fulfillRequest", {
      //   requestId: params.requestId,
      //   responseCode: params.responseCode,
      //   responseHeaders,
      //   body: responseBody?.body ?? '',
      // });
    }
  })


  // chrome.debugger.onEvent.addListener(handler)
  // const client = await senderPage.createCDPSession() // not working

  // await senderPage.setRequestInterception(true); // senderTransport.send('Fetch.enable')
  // senderPage.on('request', async senderRequest => {
  //   const senderRequestUrl = senderRequest.url()
  //   const senderHeaders = senderRequest.headers()

  //   // The result of video.outerHTML might be different from the result of video.getAttribute('src'). e.g.
  //   // `<video autoplay="" class="video_f72aac" playsinline="" height="369" poster="https://example.com/video.mp4?ex=66ba2a97&amp;is=66b8d917&amp;hm=71701d5699cb3c75dbb35862f4835d9b19565da285c94a98597059b5e5925650&amp;format=webp&amp;width=1312&amp;height=738" preload="metadata" width="656" src="https://example.com/video.mp4?ex=66ba2a97&amp;is=66b8d917&amp;hm=71701d5699cb3c75dbb35862f4835d9b19565da285c94a98597059b5e5925650&amp;"></video>`.includes('https://example.com/video.mp4?ex=66ba2a97&is=66b8d917&hm=71701d5699cb3c75dbb35862f4835d9b19565da285c94a98597059b5e5925650&') // false
  //   // Because the latter is hooked in the end, the latter shall prevail.
  //   const senderElements = findElements(senderRequestUrl)
  //   // range header error: range: "bytes=0-"
  //   console.log('senderPage', {senderRequestUrl, senderRequest, senderElements, senderHeaders})
  //   if (senderElements?.length) {
  //     // just modify request header
  //     // senderRequest.continue({
  //     //   headers: {
  //     //     referer: page.url()
  //     //   }
  //     // });

  //     const senderClient = senderRequest.client
  //     const senderRequestId = senderRequest._interceptionId
  //     console.log({senderClient, senderRequestId})

  //     if(senderRequestId) {
  //       // await page.setRequestInterception(true);
  //       // page.on('request', async request => {
  //       //   const requestUrl = senderRequest.url()
  //       //   const requestHeaders = senderRequest.headers()
  //       //   const elements = findElements(requestUrl)
  //       //   console.log('page', {requestUrl, elements, requestHeaders})
  //       //   if (elements?.length) {
  //       //     const client = request.client
  //       //     const requestId = request._interceptionId
  //       //     console.log({client, requestId})
  //       //   } else {
  //       //     request.continue();
  //       //   }
  //       // })
  //       // TODO get response headers
  //       // interceptedRequest.responseHeaders https://github.com/ChromeDevTools/devtools-frontend/blob/8f84ac088281cc26c07ba4bbf98ce2b9c238c2d7/front_end/models/persistence/NetworkPersistenceManager.ts#L908C48-L908C82
  //       const senderResponseHeaders = senderRequest.response()?.headers()
  //       console.log({senderResponseHeaders})
  //       senderClient.send('Fetch.continueResponse', {
  //         requestId: senderRequestId,
  //         responseCode: 206,
  //         responsePhrase: STATUS_TEXTS[206],
  //         responseHeaders: headersArray({
  //           ...senderHeaders,
  //           "Access-Control-Allow-Origin": "*",
  //           "test-hanzi": 'is',
  //         })
  //         .filter(({name}) => name !== "set-cookie"),
  //       })
  //     }

  //     // const responseHandler = async (response: HTTPResponse) => {
  //     //   if (requestUrl === response.url()) {
  //     //     page.off('response', responseHandler)
  //     //     console.log({requestUrl, response})
  //     //     // proxy response
  //     //     const status = response.status()
  //     //     const headers = response.headers()
  //     //     // const content = await response.content()
  //     //     // senderRequest.respond({
  //     //     //   status,
  //     //     //   headers: {
  //     //     //     ...headers,
  //     //     //     "Access-Control-Allow-Origin": "*", //TODO
  //     //     //     "test-hanzi": 'is',
  //     //     //   },
  //     //     //   contentType: headers['content-type'], //TODO
  //     //     //   body: content, //TODO
  //     //     // })

  //     //     const senderClient = senderRequest.client
  //     //     const requestId = senderRequest._interceptionId
  //     //     console.log({status, headers, senderClient, requestId},headersArray({
  //     //       ...headers,
  //     //       // "Access-Control-Allow-Origin": "*", //TODO
  //     //       // "test-hanzi": 'is',
  //     //     }))

  //     //     if(requestId) {
  //     //       senderClient.send('Fetch.continueResponse', {
  //     //         requestId,
  //     //         responseCode: status,
  //     //         responsePhrase: STATUS_TEXTS[status],
  //     //         responseHeaders: headersArray({
  //     //           ...headers,
  //     //           "Access-Control-Allow-Origin": "*",
  //     //           "test-hanzi": 'is',
  //     //         }).filter(({name}) => name !== "set-cookie"),
  //     //       })
  //     //     }
  //     //   }
  //     // }
  //     // page.on('response', responseHandler)
  //     // send request
  //     // page.evaluate(
  //     //   (element) => {
  //     //     const div = document.createElement('div')
  //     //     div.style.position = 'absolute'
  //     //     div.style.visibility = 'hidden'
  //     //     div.style.pointerEvents = 'none'
  //     //     div.innerHTML = element ?? ''
  //     //     // console.log(div)
  //     //     document.body.appendChild(div)
  //     //   },
  //     //   senderElements[0]
  //     // )
  //   } else {
  //     senderRequest.continue();
  //   }
  // });
}