import { parseShiBiSvgToPuppeteerJson } from '../message-handler/shibi-svg'

document.querySelector('#run')?.addEventListener('click', async () => {
  const textareaElement = document.querySelector<HTMLTextAreaElement>('#textarea');
  try {
    const value = textareaElement?.value ?? '';
    let payload = {};
    try {
      payload = JSON.parse(value ?? '');
    } catch(e) {}
    console.log({value, payload})
    await chrome.runtime.sendMessage(
      { type: 0, payload }
    );
  } catch(e: any) {
    console.error(e?.message);
  }
})

document.querySelector('#header')?.addEventListener('click', () => {
  chrome.tabs.create({ url: "https://shi.bi" });
})

document.querySelector('#file')?.addEventListener('change', async e => {
  const target = e.target as HTMLInputElement
  if(target) {
    const file = target.files?.[0];
    if(file && file.type === 'image/svg+xml') {
      const text = await file.text();
      const flow = parseShiBiSvgToPuppeteerJson(text);
      const textarea = document.getElementById('textarea') as HTMLTextAreaElement;
      if(textarea) {
        textarea.value = JSON.stringify(flow, null, 2);
      }
      console.log({text, flow});
    }
  }
});

const droparea = document.querySelector('#droparea');
if(droparea) {
  droparea.addEventListener('dragenter', (event) => {
    event.preventDefault();
    droparea.classList.add('highlight');
  });
  droparea.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  droparea.addEventListener('dragleave', () => {
    droparea.classList.remove('highlight');
  });
  droparea.addEventListener('drop', async (event) => {
    event.preventDefault();
    droparea.classList.remove('highlight');
  
    const files = (event as any).dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if(file && file.type === 'image/svg+xml') {
        const text = await file.text();
        const flow = parseShiBiSvgToPuppeteerJson(text);
        const textarea = document.getElementById('textarea') as HTMLTextAreaElement;
        if(textarea) {
          textarea.value = JSON.stringify(flow, null, 2);
        }
        console.log({text, flow});
      } else if(file && file.type === 'application/json') {
        const text = await file.text();
        let flow = {};
        try {
          flow = JSON.parse(text);
        } catch(e) {
          console.error(e);
        }
        const textarea = document.getElementById('textarea') as HTMLTextAreaElement;
        if(textarea) {
          textarea.value = JSON.stringify(flow, null, 2);
        }
        console.log({text, flow});
      }
    }
  });
}