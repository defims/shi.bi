import * as steps from '../puppeteer-json/steps';

export const parseShiBiSvgToPuppeteerJson = (text: string) => {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const root = doc.documentElement;
  let flow = {} as any
  let current = flow as any
  const treeWalker = document.createTreeWalker(
    doc,
    NodeFilter.SHOW_ELEMENT,
  );
  const handleValue = (type: string, keyPath: string[], value: any) => {
    const stepType = (steps as any)[`${type}Step`].type ?? {};
    const find = keyPath.reduce((acc, curr) => (
      acc[curr] ?? null
    ), stepType);
    return find?.(value) ?? value;
  }
  // convert hyphen-separated to camel case
  const getAttribute = (element: Element, attribute: string) => {
    return element.getAttribute(attribute)
      || element.getAttribute(attribute.replace(/([A-Z])/g, '-$1').toLowerCase());
  }
  const getShibiKey = (text: string) => {
    return /^shibi:([\w-]+)/gim.exec(text)?.[1]?.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  }
  
  while (treeWalker.nextNode()) {
    const element = treeWalker.currentNode as HTMLElement;

    let type = element.getAttribute('shibi:type');
    if(!type) {
      [].forEach.call(element.children, (child: HTMLElement | null) => {
        if(
          child?.tagName === 'set'
          && child.getAttribute('attributeName') === 'shibi:type'
        ) { // <set attributeName="shibi:type" to />
          type = child.getAttribute('to') ?? type;
        } else if(
          child?.tagName === 'text'
          && getAttribute(child, 'shibi:attributeName') === 'shibi:type'
        ) { // <text shibi:attributeName="shibi:type"></text>
          type = child.textContent?.trim() ?? type;
        } else if(
          child?.tagName === 'use'
          && getAttribute(child, 'shibi:attributeName') === 'shibi:type'
        ) { // <use shibi:attributeName="shibi:type" xlink:href="#type-navigate" />
          const href = child.getAttribute('xlink:href');
          if(href) {
            const target = doc.querySelector(href);
            if(target && target.children[0].tagName === 'switch') {
              type = target.children[0].querySelector(`[systemLanguage=${navigator.language}]`)?.textContent
              ?? target.children[0].querySelector(`:not([systemLanguage])`)?.textContent
              ?? type;
            }
          }
        }
      });
    }
    if(!type && element === root) {
      // <svg xmlns="http://www.w3.org/2000/svg"></svg>
      type = 'flow';
    }
    // other attributes
    if(type) {
      let step = { type } as any;
      // <g shibi:xx></g>
      for (let i = 0; i < element.attributes.length; i++) {
        const attribute = element.attributes[i];
        const key = getShibiKey(attribute.name);
        if(key) {
          step[key] = handleValue(type, [key], attribute.value);
        }
      }
      const handleChild = (child: HTMLElement | null) => {
        if(child?.tagName === 'set') {
          // <set attributeName="shibi:xx" to />
          const attributeName = getAttribute(child, 'shibi:attributeName') || child.getAttribute('attributeName');
          if(attributeName) {
            const key = getShibiKey(attributeName);
            if(key) {
              return { key, value: child.getAttribute('to') };
            }
          }
        } else if(child?.tagName === 'text') {
          // <text shibi:attributeName="shibi:xx"></text>
          const attributeName = getAttribute(child, 'shibi:attributeName');
          if(attributeName) {
            const key = getShibiKey(attributeName);
            if(key) {
              return { key, value: child.textContent?.trim() };
            }
          }
        } else if(child?.tagName === 'use') {
          // <use shibi:attributeName="shibi:xx" xlink:href="#type-navigate" />
          const attributeName = getAttribute(child, 'shibi:attributeName');
          if(attributeName) {
            const key = getShibiKey(attributeName);
            if(key) {
              const href = child.getAttribute('xlink:href');
              if(href) {
                const target = doc.querySelector(href);
                if(target && target.children[0].tagName === 'switch') {
                  return {
                    key,
                    value: target.children[0].querySelector(`[systemLanguage=${navigator.language}]`)?.textContent
                    ?? target.children[0].querySelector(`:not([systemLanguage])`)?.textContent
                  };
                }
              }
            }
          }
        } else if(child?.tagName === 'title') {
          // <title>title</title>
          return {
            key: 'title',
            value: child.textContent
          };
        } else if(child?.tagName === 'desc') {
          // <desc>{}</desc>
          return {
            key: 'source',
            value: child.textContent
          };
        } else if(child?.tagName === 'g') {
          // <g shibi:attributeName="shibi:selectors"></g>
          const attributeName = getAttribute(child, 'shibi:attributeName');
          if(attributeName) {
            const key = getShibiKey(attributeName);
            if(key) {
              let value: any[] = [];
              [].forEach.call(child.children, (child: HTMLElement | null) => {
                const childResult = handleChild(child);
                if(childResult && childResult.key) {
                  value[Number(childResult.key)] = childResult.value;
                }
              });
              return {
                key,
                value
              };
            }
          }
        }
      };
      [].forEach.call(element.children, (child: HTMLElement | null) => {
        const childResult = handleChild(child);
        if(childResult && childResult.key) {
          step[childResult.key] = handleValue(type!, [childResult.key], childResult.value);
        }
      });
      console.log({element, step});
      if(type === 'flow') {
        Object.keys(step).forEach(key => {
          current[key] = step[key];
        })
      } else {
        current.steps = current.steps || [];
        current.steps.push(step);
      }
    }
  }
  return flow;
}