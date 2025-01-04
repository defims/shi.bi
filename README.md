<img src="images/logo.png" width="128" height="128" />

# shi.bi: Your Automated Browser Maid

shi.bi (pronounced Shì'Bì) is a powerful browser automation tool that allows you to command your browser to perform various tasks automatically using JSON instructions from any webpage. It's like having a personal maid for your browser! What's more, it's fully compatible with Chrome DevTools Recorder recordings, so you can easily record your manual actions and turn them into automation scripts.

# Features
- JSON Commands: Use clear and concise JSON to describe automation tasks, making it easy to write and extend with other services (like ChatGPT).
- Chrome DevTools Recorder Compatibility: Directly import recording files from Chrome DevTools Recorder to quickly automate tasks.
- Highly Flexible: Beyond compatibility with Chrome DevTools Recorder instructions, it introduces new commands such as ifElement, loop, break, multipleClicks, returnElement, upload, and waitTime, greatly simplifying browser automation.

# Usage
1. Install shi.bi Chrome Extension: [Shi.Bi](https://chromewebstore.google.com/detail/shibi/padmogncdghipfgnfbmidiggofeaahno)
2. Send commands from any webpage or developer tools.

# Example
```javascript
console.log(
  await chrome.runtime.sendMessage(
    await (await fetch("https://shi.bi/id")).text(), // Extension ID, handwritten or obtained via https://shi.bi/id.
    {
      type: 0, // 0 for run shibi json
      payload: { // shibi json content
        title: 'shibi test',
        steps: [
          { type: "navigate", url: "https://shi.bi" },
          { type: "waitForElement", selectors: ["#repo-content-pjax-container"] },
          { type: "returnElement", selectors: ["#repo-content-pjax-container"] }
        ]
      }
    }
  )
)
```
![screenshot](images/screenshot.png)
![screenshot2](images/screenshot2.png)

# Step Type
shibi extended the step based on [@puppeteer/replay](https://github.com/puppeteer/replay).
## [Change](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ChangeStep.md)
## [Click](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ClickStep.md)
## [Close](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CloseStep.md)
## [DoubleClick](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.DoubleClickStep.md)
## [EmulateNetworkConditions](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.EmulateNetworkConditionsStep.md)
## [Hover](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.HoverStep.md)
## [KeyDown](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyDownStep.md)
## [KeyUp](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.KeyUpStep.md)
## [Navigate](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.NavigateStep.md)
## [Scroll](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.ScrollPageStep.md)
## [SetViewport](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.SetViewportStep.md)
## [WaitForElement](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForElementStep.md)
## [WaitForExpression](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.WaitForExpressionStep.md) (Not recommended for use)
## [CustomStep](https://github.com/puppeteer/replay/blob/main/docs/api/interfaces/Schema.CustomStepParams.md)
## Break
## IfElement
## Loop
## MultipleClicks
## ReturnElement
## Upload
## WaitTime

# ShiBi JSON Gramma
stack machine
All code in a shibi json is grouped into steps, which have the following pseudocode structure.
```json
{
  "comment": "describe shi.bi json gramma.",
  "type": "flow",
  "title": "shi.bi json gramma example",
  "steps": [
    {
      "comment": "A step is an object.",
      "type": "stepName",
      "presetParameter1": "param1",
      "presetParameter2": "param2",
      "presetParameterN": "paramN",
      "parameters": {
        "userDefined1": 1,
        "userDefined2": 2,
        "userDefinedN": "N"
      },
      "steps": []
    },
    {
      "comment": "Navigate example",
      "type": "navigate",
      "url": "https://shi.bi"
    },
    {
      "comment": "CustomStep example",
      "type": "ifElement",
      "selectors": ["#id .class div"],
      "steps": [
        { "type": "click", "selectors": ["#id"] }
      ],
      "elseSteps": [
        { "type": "click", "selectors": ["#id2"] }
      ]
    }
  ]
}
```

# Contributing
Contributions are welcome! Please refer to the CONTRIBUTING.md file for more information.

# License
This project is licensed under the Apache 2.0 License.
