import {
  UserFlow,
} from '@puppeteer/replay';

import { EMessageType } from './utils/constants'
import { handlePuppeteerJson } from './message-handler/puppeteer-json'
// import { handleRegisterSameOriginProxyPage } from './message-handler/register-same-origin-proxy-page'

// onMessageExternal
let onMessageExternalRequestId = 0
chrome.runtime.onMessageExternal.addListener(
  async (
    request: {
      type: EMessageType,
      payload?: UserFlow,
    },
    sender,
    sendResponse
  ) => {
    const id = String(onMessageExternalRequestId ++)
    console.log(id, 'onMessageExternal', {request, sender, sendResponse});

    // use puppeteer js script https://github.com/gajananpp/puppeteer-ide-extension/blob/ffe2955ef02a1178e4c6f5236eadd0d7a4ccf196/src/devtools/sandbox/lib/executeScript.ts#L44C24-L44C37
    try {
      let result
      if (request?.type === EMessageType.puppeteerJson) {
        result = await handlePuppeteerJson({ id, request, sender })
      } else if (request?.type === EMessageType.getCurrentOriginBlobUrl) { // regiester window.addEventListener('message', )

        // const urls = ["https://example.com/shi.bi"]

        // chrome.webRequest.onBeforeRequest.addListener(
        //   function(details) {
        //     console.log('onBeforeRequest', {details})
        //     debugger
        //     return {cancel: true};
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webRequest.onBeforeSendHeaders.addListener(
        //   function(details) {
        //     console.log('onBeforeSendHeaders', {details})
        //     debugger
        //     return {
        //       blockingResponse: {
        //         headers: details.requestHeaders,
        //         body: {
        //           encoding: "base64",
        //           text: "SGVsbG8sIHdvcmxkIQ==" // "Hello, world!" encoded in base64
        //         }
        //       }
        //     } as any
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webRequest.onSendHeaders.addListener(
        //   function(details) {
        //     console.log('onSendHeaders', {details})
        //     debugger
        //     return {cancel: true};
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webRequest.onHeadersReceived.addListener(
        //   function(details) {
        //     console.log('onHeadersReceived', {details})
        //     debugger
        //     return {cancel: true};
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webRequest.onAuthRequired.addListener(
        //   function(details) {
        //     console.log('onAuthRequired', {details})
        //     debugger
        //     return {cancel: true};
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webRequest.onBeforeRedirect.addListener(
        //   function(details) {
        //     console.log('onBeforeRedirect', {details})
        //     debugger
        //     return {cancel: true};
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webRequest.onResponseStarted.addListener(
        //   function(details) {
        //     console.log('onResponseStarted', {details})
        //     debugger
        //     return {cancel: true};
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webRequest.onCompleted.addListener(
        //   function(details) {
        //     console.log('onCompleted', {details})
        //     debugger
        //     return {cancel: true};
        //   },
        //   {urls},
        //   // ["blocking"]
        // )

        // chrome.webNavigation?.onCommitted.addListener(async (details) => {
        //   console.log({details})
        //   if(details.url === request.payload?.tab?.url) {
        //     const res = await chrome.scripting.executeScript({
        //       target: {tabId: details.tabId},
        //       func: () => {
        //         console.log('hanzi', window.addEventListener)
        //         debugger
        //         window.addEventListener("message", (e) => {
        //           console.log({e})
        //         }, false);
        //       },
        //       world: 'MAIN'
        //     })
        //     console.log({res})         
        //   }
        // })

        // chrome.tabs.onCreated.addListener((tab) => {
        //   console.log({tab})
        //   if(request.payload?.tab?.url === tab.url) {
        //     console.log({tab})
        //   }
        // })

        // chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        //   console.log({tabId, changeInfo, tab})
        //   if(changeInfo.status === "complete"
        //     && request.payload?.tab?.url === tab.url) {
        //       console.log({tab})
        //     const res = await chrome.scripting.executeScript({
        //       target: {tabId},
        //       func: () => {
        //         window.addEventListener("message", (e) => {
        //           console.log(
        //             'message',
        //             {e},
        //             e.data?.type === EMessageType.getCurrentOriginBlobUrl
        //             && (
        //               e.data?.payload?.file instanceof File
        //               || e.data?.payload?.file instanceof Blob
        //             ),
        //             e.data?.type,
        //             e.data?.payload?.file instanceof File,
        //             e.data?.payload?.file instanceof Blob
        //           )
        //           let payload = {}
        //           if(e.data?.type === EMessageType.getCurrentOriginBlobUrl
        //             && (
        //               e.data?.payload?.file instanceof File
        //               || e.data?.payload?.file instanceof Blob
        //             )
        //           ) {
        //             payload = {
        //               url: URL.createObjectURL(e.data.payload.file)
        //             }
        //           }
        //           e.source?.postMessage({
        //             type: EMessageType.returnCurrentOriginBlobUrl,
        //             payload
        //           }, { targetOrigin: e.origin })
        //         }, false);
        //       },
        //       world: 'MAIN'
        //     })
        //     console.log({res})
        //   }
        //   // ['id', 'active', 'url', 'title']
        //   // .find(key => (
        //   //   (request?.payload as any)?.[key] === (tab as any)?.[key]
        //   // ))
        // })
        console.log('not support now')
      // } else if (request?.type === EMessageType.registerSameOriginProxyPage) {
        // result = await handleRegisterSameOriginProxyPage({request, sender})
      }
      sendResponse({request, sender, response: {success: true, id, result}})
    } catch(error) {
      console.error(error)
      sendResponse({request, sender, response: {success: false, id, error}})
    }
  }
)


