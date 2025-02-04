import { parseShiBiSvgToPuppeteerJson } from './message-handler/shibi-svg'

const handleClick = (value: string) => async () => {
  try {
    const payload = parseShiBiSvgToPuppeteerJson(value);
    const result = await chrome.runtime.sendMessage(
      { type: 0, payload }
    );
    console.log({value, payload, result});
  } catch(e: any) {
    console.error(e?.message);
  } 
}

if(document.documentElement.tagName === 'svg') {
  const value = document.documentElement.outerHTML ?? '';
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
  rect.addEventListener('click', handleClick(value));
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
  const shibiSvgList = document.querySelectorAll('svg[xmlns\\:shibi="http://shi.bi"]');
  [].forEach.call(shibiSvgList, (shibiSvg: HTMLElement, index) => {
    const anchorName = `--shibi-flow-${index}`;

    (shibiSvg.style as any).anchorName = anchorName;

    const button = document.createElement('button');
    button.textContent = "Shi.Bi";
    (button.style as any).positionAnchor = anchorName;
    (button.style as any).positionArea = "top right";
    button.style.position = "fixed";
    button.style.background = "rgb(255, 165, 0)";
    button.style.border = "none";
    button.style.padding = "2px 4px";
    button.style.borderRadius = "2px";
    button.style.cursor = "pointer";
    button.style.color = "rgb(48, 46, 57)";
    button.addEventListener('click', handleClick(shibiSvg.outerHTML ?? ''));
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255, 165, 0, 0.8)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgb(255, 165, 0)';
    });
    document.body.appendChild(button);
  });
}