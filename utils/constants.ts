export enum EMessageType {
  // publish to market: https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code?hl=zh-cn#chrome.debugger
  puppeteerJson, // puppeteer replay json with extend command, cover most case, no write element operation
  // puppeteerWat, // pass wat to background js
  // puppeteer, // puppeteer js function
  getCurrentOriginBlobUrl,
  returnCurrentOriginBlobUrl,
}