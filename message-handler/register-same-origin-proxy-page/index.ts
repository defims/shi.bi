import { UserFlow } from '@puppeteer/replay';
import { EMessageType } from '../../utils/constants';
import { singletonDebugger } from '../../utils/singleton-debugger';

// From https://developer.mozilla.org/en-US/docs/Glossary/Base64#the_unicode_problem.
function bytesToBase64(bytes: any) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

const validUTF16StringEncoded = (validUTF16String: string) => (
  bytesToBase64(new TextEncoder().encode(validUTF16String))
)

const hookFetch = async ({
  requestId,
  tabId,
  url,
  responseCode = 200,
  responseHeaders = {},
  body,
}: {
  requestId?: string,
  tabId?: number,
  url?: string,
  responseCode: number,
  responseHeaders: { [Name: string]: string },
  body: string,
}) => {
  if(!url) {
    return
  }
  // attach fromtab
  // pause fromtab Fetch.requestPaused
  // replay in totab Fetch.getResponseBody
  // send reponse to fromtab Fetch.fulfillRequest
  // request modify referrer // Fetch.continueRequest
  // response modify cors
  // await chrome.debugger.attach({ tabId }, "1.2")
  // await attachDebuggee({ tabId })
  await singletonDebugger.attach({ tabId })
  await singletonDebugger.sendCommand({ tabId }, "Fetch.enable")
  // await chrome.debugger.sendCommand({ tabId }, "Fetch.enable")
  // 刚开的tab没触发event TODO
  const handler = async (source: chrome.debugger.Debuggee, method: string, params: any) => {
    if (source.tabId === tabId) {
      console.log(requestId, "onEvent", {source, method, params})
      if(method === "Fetch.requestPaused" && url === params?.request?.url) {
        console.log(requestId, params, params.request.url)
        await singletonDebugger.sendCommand(
        // await chrome.debugger.sendCommand(
          { tabId: source.tabId },
          "Fetch.fulfillRequest",
          {
            requestId: params.requestId,
            responseCode,
            responseHeaders: (
              Object.keys({
                // ...params.request.headers,
                ...responseHeaders,
              })
              .map(name => ({
                name,
                value: responseHeaders[name]
              }))
            ),
            body: validUTF16StringEncoded(body)
          }
        )
        singletonDebugger.onEvent.removeListener(handler)
        // chrome.debugger.onEvent.removeListener(handler)
      } else {
        await singletonDebugger.sendCommand(
        // await chrome.debugger.sendCommand(
          { tabId },
          "Fetch.continueRequest",
          { requestId: params.requestId }
        )
      }
      await singletonDebugger.sendCommand({ tabId }, "Fetch.disable")
      // await chrome.debugger.sendCommand({ tabId }, "Fetch.disable")
      // await chrome.debugger.detach({ tabId })
      singletonDebugger.onEvent.removeListener(handler)
      await singletonDebugger.detach({ tabId })
      console.groupEnd()
    }
  }
  singletonDebugger.onEvent.addListener(handler)
  // chrome.debugger.onEvent.addListener(handler)
}

export const handleRegisterSameOriginProxyPage = async ({
  request,
  sender,
}: {
  request: {
    type: EMessageType,
    payload?: {
      tab?: chrome.tabs.Tab,
      recording?: UserFlow,
      proxy?: string
    },
    id: string
  },
  sender: chrome.runtime.MessageSender,
}) => {
  console.group(request.id, 'registerSameOriginProxyPage')
  await hookFetch({
    requestId: request.id,
    tabId: sender.tab?.id,
    url: request.payload?.proxy,
    responseCode: 200,
    responseHeaders: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/html",
      "Cache-Control": "no-cache",
    },
    body: `<!Doctype html><html><body><script>+${
      function() {
        window.addEventListener('message', e => {
          console.log(e.data.id, 'message', {e})
          let payload = {}
          if(e.data?.type === EMessageType.getCurrentOriginBlobUrl
            && (
              e.data?.payload?.file instanceof File
              || e.data?.payload?.file instanceof Blob
            )
          ) {
            payload = {
              url: URL.createObjectURL(e.data.payload.file)
            }
          }
          // TODO revoke
          e.source?.postMessage({
            type: EMessageType.returnCurrentOriginBlobUrl,
            payload,
            id: e.data.id
          }, { targetOrigin: e.origin })
        })
      }.toString()
    }()</script></body></html>`,
  })
}