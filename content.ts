import { marked } from 'marked';
import DOMPurify from 'dompurify';

import { parseShiBiSvgToPuppeteerJson } from './message-handler/shibi-svg';
import { parseShiBiMarkdownHtmlToPuppeteerJson } from './message-handler/shibi-markdown';

const runShiBi = async (payload: any) => {
  try {
    const result = await chrome.runtime.sendMessage({ type: 0, payload });
    console.log({payload, result});
  } catch(e: any) {
    console.error(e?.message);
  } 
}

const addHtmlShiBiButton = ({
  anchorName,
  onClick,
}: {
  anchorName: string,
  onClick: () => void,
}) => {
  const button = document.createElement('button');
  button.textContent = "Shi.Bi";
  button.style.position = "fixed";
  button.style.top = `anchor(${anchorName} top)`;
  button.style.right = `anchor(${anchorName} right)`;
  button.style.background = "rgb(255, 165, 0)";
  button.style.border = "none";
  button.style.padding = "2px 4px";
  button.style.borderRadius = "2px";
  button.style.cursor = "pointer";
  button.style.color = "rgb(48, 46, 57)";
  button.addEventListener('click', onClick);
  button.addEventListener('mouseenter', () => {
    button.style.background = 'rgba(255, 165, 0, 0.8)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.background = 'rgb(255, 165, 0)';
  });
  document.body.appendChild(button);
}

if(document.documentElement.tagName === 'svg') {
  // file:///path/to/xxx.shi.bi.svg
  const shibiSvg = document.documentElement.outerHTML ?? '';
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('transform', 'translate(-54 0)');
  rect.setAttribute('x', '100%');
  rect.setAttribute('y', '3');
  rect.setAttribute('rx', '3');
  rect.setAttribute('ry', '3');
  rect.setAttribute('width', '48');
  rect.setAttribute('height', '23');
  rect.setAttribute('fill', '#FFA500');
  rect.style.cursor = "pointer";
  rect.addEventListener('click', () => {
    runShiBi(parseShiBiSvgToPuppeteerJson(shibiSvg));
  });
  rect.addEventListener('mouseenter', () => {
    rect.style.fill = 'rgba(255, 165, 0, 0.8)';
  });
  rect.addEventListener('mouseleave', () => {
    rect.style.fill = '';
  });
  document.documentElement.appendChild(rect);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.textContent = "shi.bi";
  text.setAttribute('text-anchor', 'end');
  text.setAttribute('x', '100%');
  text.setAttribute('dx', '-10');
  text.setAttribute('dy', '20');
  text.setAttribute('fill', '#302e39');
  text.style.pointerEvents = "none";
  document.documentElement.appendChild(text);
} else {
  // https://domain.xxx/path/with/inline/shi.bi.svg
  const shibiSvgList = document.querySelectorAll('svg[xmlns\\:shibi="http://shi.bi"]');
  [].forEach.call(shibiSvgList, (shibiSvg: HTMLElement, index) => {
    const anchorName = `--shibi-flow-${index}`;

    (shibiSvg.style as any).anchorName = anchorName;
    addHtmlShiBiButton({
      anchorName,
      onClick() {
        runShiBi(parseShiBiSvgToPuppeteerJson(shibiSvg.outerHTML ?? ''));
      }
    });
  });

  // file:///path/to/shi.bi.md
  if(location.pathname.endsWith('.md')
    && document?.body?.children?.length === 1
    && document.body.children[0].tagName === 'PRE') {
      const pre = document.body.children[0] as HTMLPreElement;
      const textContent = pre.textContent;
      if(textContent) {
        Promise.resolve(marked.parse(DOMPurify.sanitize(textContent))).then(html => {
          pre.style.display = 'none';
          const anchorName = `--shibi-flow-${0}`;
          const div = document.createElement('div');
          (div.style as any).anchorName = anchorName;
          div.innerHTML = html;
          document.body.appendChild(div);

          addHtmlShiBiButton({
            anchorName,
            onClick() {
              runShiBi(parseShiBiMarkdownHtmlToPuppeteerJson(html ?? ''));
            }
          });
        });
      }
  }
}