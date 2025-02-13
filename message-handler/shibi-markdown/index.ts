import { marked } from 'marked';
import DOMPurify from 'dompurify';

import * as steps from '../puppeteer-json/steps';

export const parseShiBiMarkdownToPuppeteerJson = async (markdown: string) => {
  const parsedHtml = await Promise.resolve(marked.parse(DOMPurify.sanitize(markdown)));
  return parseShiBiMarkdownHtmlToPuppeteerJson(parsedHtml);
}

export const parseShiBiMarkdownHtmlToPuppeteerJson = async (html: string) => {
  let doc = new DOMParser().parseFromString(html, 'text/html');
  if(doc.body.children.length <= 0) { // markdown
    const parsedHtml = await Promise.resolve(marked.parse(DOMPurify.sanitize(html)));
    doc = new DOMParser().parseFromString(parsedHtml, 'text/html');
  }
  const root = doc.documentElement;
  let flow = {} as any
  let current = flow as any
  //TODO
  return flow;
}