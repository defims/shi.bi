import { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page'

import { EMessageType } from '../../../utils/constants'
import { validUTF16StringEncoded } from '../../puppeteer-json/utils'
import { singletonDebugger } from '../../../utils/singleton-debugger'
import { navigateContext } from './navigate'
import { EnhancedCustomStep, CustomStepName } from '../'

export type CustomUploadStep = EnhancedCustomStep & {
  name: CustomStepName.Upload,
  parameters: {
    input: string,
    type?: string,
    name: string,
  } & ({
    file: File,
    url?: string,
  } | {
    file?: File | null,
    url: string,
  })
}

const hookFetch= async ({
  id,
  debuggee,
  url,
  responseCode = 200,
  responseHeaders = {},
  body
}: {
  id?: string,
  debuggee: chrome.debugger.Debuggee,
  url?: string,
  responseCode: number,
  responseHeaders: { [Name: string]: string },
  body: string,
}) => {
  // await page.setRequestInterception(true);
  await singletonDebugger.attach(debuggee)
  await singletonDebugger.sendCommand(debuggee, "Fetch.enable")
  const handler = async (source: chrome.debugger.Debuggee, method: string, params: any) => {
    if (source.tabId === debuggee.tabId) {
      console.log(id, "onEvent", {source, method, params})
      if(method === "Fetch.requestPaused" && url === params?.request?.url) {
        console.log(id, "Fetch.requestPaused", { params, url })
        await singletonDebugger.sendCommand(
        // await chrome.debugger.sendCommand(
          debuggee,
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
        // page.off('request', requestHandler);
        singletonDebugger.onEvent.removeListener(handler)
        // chrome.debugger.onEvent.removeListener(handler)
        // await page.setRequestInterception(false);
        await singletonDebugger.sendCommand(debuggee, "Fetch.disable")
        // await chrome.debugger.sendCommand({ tabId }, "Fetch.disable")
        await singletonDebugger.detach(debuggee)
        // await chrome.debugger.detach(debuggee)
      } else {
        await singletonDebugger.sendCommand(
        // await chrome.debugger.sendCommand(
          debuggee,
          "Fetch.continueRequest",
          ...(!params.requestId ? [{}] : [{ requestId: params.requestId }])
        )
      }
    }
  }
  // page.on('request', requestHandler);
  singletonDebugger.onEvent.addListener(handler)
}

export const before = async ({
  id,
  step,
  page,
  senderDebuggee,
}: {
  id: string,
  step: CustomUploadStep,
  page: Page,
  senderDebuggee: chrome.debugger.Debuggee
}) => {
  const {input, url, type, name} = step.parameters;
  const inputElement = await page?.$<"input">(input as any);
  console.log(id, 'before customUpload step', {input, url, type, name, inputElement});
  let fileUrl = url
  if (input && url && page && inputElement) {
    const lastNavigateUrl = navigateContext.getLastestContext()?.url
    if(url.match(/^blob:/gim) && lastNavigateUrl) { // ObjectURL
      const proxyUrl = `${new URL(lastNavigateUrl).origin}/laorenai-proxy`

      // hook proxy in senderPage
      await hookFetch({
        id,
        debuggee: senderDebuggee,
        url: proxyUrl,
        responseCode: 200,
        responseHeaders: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/html",
          "Cache-Control": "no-cache",
        },
        body: `<!Doctype html><html><body><script>+${function() {
          window.addEventListener('message', e => {
            console.log(e.data.id, 'message', {e})
            let payload = {}
            if(e.data?.type === EMessageType.getCurrentOriginBlobUrl
              && ( e.data?.payload?.file instanceof File
                || e.data?.payload?.file instanceof Blob
            )) {
              payload = { url: URL.createObjectURL(e.data.payload.file) }
            }
            e.source?.postMessage({
              type: EMessageType.returnCurrentOriginBlobUrl,
              payload,
              id: e.data.id
            }, { targetOrigin: e.origin })
          })
        }.toString()}()</script></body></html>`,
      })

      // add iframe in senderPage and get page objectUrl with sessionId
      if(senderDebuggee.tabId) {
        const objectURL = (await chrome.scripting.executeScript({
          target: { tabId: senderDebuggee.tabId! },
          world: 'MAIN', // world: 'ISOLATED' Not affected by the page hooking the window object, but window.addEventListener doesn't work because this window is not an opened window.
          args: [{ id, src: proxyUrl, blobUrl: url }],
          func: ({ id, src, blobUrl}) => {
            try {
              return new Promise<{
                iframe: HTMLIFrameElement
                file: Blob
              }>(resolve => {
                const iframe = document.createElement('iframe')
                iframe.width = "0"
                iframe.height = "0"
                iframe.style.border = "none"
                iframe.style.position = "absolute"
                iframe.style.pointerEvents = "none"
                iframe.src = src
                iframe.onload = () => {
                  fetch(blobUrl)
                  .then(res => res.blob())
                  .then(file => {
                    resolve({ iframe, file })
                  })
                }
                document.body.appendChild(iframe)
              })
              .then(({iframe, file}) => new Promise<{
                objectURL: string
              }>(resolve => {
                const callback = (e: WindowEventMap['message']) => {
                  console.log(id, "message", {e})
                  if(e.data.type === EMessageType.returnCurrentOriginBlobUrl
                    && e.data.id === id
                  ) {
                    window.removeEventListener('message', callback)
                    resolve({
                      objectURL: e.data.payload.url,
                      // revokeObjectURL: () => { document.body.removeChild(iframe) } // It's useless because it needs to be serializable. TODO domain singleton
                    })
                  }
                }
                window.addEventListener('message', callback)
                iframe.contentWindow?.postMessage({
                  type: EMessageType.getCurrentOriginBlobUrl,
                  payload: { file },
                  id
                }, "*")
              }))
            } catch(e) {
              console.error(e)
            }
          },
        }))?.[0]?.result?.objectURL
        fileUrl = objectURL || url
      }

      // restore url in page
      if(fileUrl) {
        // const ret = await chrome.debugger.sendCommand(debuggee, "Runtime.evaluate", {
        await inputElement.evaluate((upload, {name, url, type}) => {
          console.log('evaluate', {name, url, type})
          return fetch(url)
          .then(res => res.blob())
          .then(blob => {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(new File([blob], name, {type}));
            console.log({dataTransfer, blob});
            upload.files = dataTransfer.files;
            upload.dispatchEvent(
              new Event('input', {bubbles: true, composed: true})
            );
            upload.dispatchEvent(new Event('change', {bubbles: true}));
          })
          .catch(e => {
            console.error(e)
          })
        }, {name, url: fileUrl, type});
      }
      console.log(id, 'handleUploadStep', {fileUrl})
    } else { // file
      await inputElement.uploadFile(url);
    }
  }
}