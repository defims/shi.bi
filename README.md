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
      type: 0, // 0 for run Shi.Bi json
      payload: { // Shi.Bi json content
        title: 'Shi.Bi test',
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
Shi.Bi extended the step based on [@puppeteer/replay](https://github.com/puppeteer/replay).
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
## Flow
```json
{
  "comment": "Usually the outermost step, equivalent to a module, commen, type can be omitted.",
  "type": "flow",
  "steps": []
}
```
## Break
```json
{
  "comment": "An interrupt for the current steps, commonly used within the steps of a loop step. Type is required, others are optional.",
  "type": "break",
  "timeout": 1000,
  "assertedEvents": []
}
```
## IfElement
```json
{
  "comment": "Executes steps based on the selector conditions, otherwise executes elseSteps. type and selectors are required, other fields are optional.",
  "type": "ifElement",
  "selectors": ["#id .class tag"],
  "operator": ">=",
  "count": 1,
  "visible": true,
  "properties": {},
  "attributes": {},
  "steps": [],
  "elseSteps": [],
  "timeout": 1000,
  "assertedEvents": []
}
```
## Loop
```json
{
  "comment": "This function is designed to execute a sequence of steps multiple times. The 'type' parameter is mandatory, while others are optional. The 'count' parameter, if not specified, defaults to -1, meaning the steps will be executed indefinitely.",
  "type": "loop",
  "count": 2,
  "steps": [],
  "timeout": 1000,
  "assertedEvents": []
}
```
## MultipleClicks
```json
{
  "comment": "Similar to doubleClick and click, it allows for multiple clicks. type, offsetX, and offsetY are required, while others are optional.",
  "type": "multipleClicks",
  "count": 3,
  "selectors": [],
  "deviceType": "mouse",
  "button": "primary",
  "offsetX": 0,
  "offsetY": 10,
  "duration": 50,
  "timeout": 1000,
  "assertedEvents": []
}
```
## ReturnElement
```json
{
  "comment": "Used to obtain the outerHTML of a certain element. type and selectors are required, others are optional.",
  "type": "returnElement",
  "selectors": ["#id .class tag"],
  "operator": ">=",
  "count": 1,
  "visible": true,
  "properties": {},
  "attributes": {},
  "timeout": 1000,
  "assertedEvents": []
}
```
## Upload
```json
{
  "comment": "Used to upload files to a destination page. Shi.Bi will automatically handle cross-origin conversion for blob URLs. The parameters \"type\", \"input\", \"fileName\", and \"fileUrl\" are mandatory; others are optional.",
  "type": "upload",
  "input": "#id .class input",
  "fileType": "",
  "fileName": "",
  "fileUrl": "",
  "timeout": 1000,
  "assertedEvents": []
}
```
## WaitTime
```json
{
  "comment": "Used to delaying the execution of subsequent steps. \"type\" and \"time\" are required fields, while others are optional.",
  "type": "waitTime",
  "time": 1000,
  "assertedEvents": []
}
```
## Input
```json
{
  "comment": "The input step is syntactic sugar for a sequence of keyDown and keyUp steps. It will convert the value of the text field into a corresponding number of keyDown and keyUp steps. type and text are required fields, while others are optional.",
  "type": "input",
  "text": "text",
  "time": 1000,
  "assertedEvents": []
}
```

# ShiBi JSON Gramma
stack machine
All code in a Shi.Bi json is grouped into steps, which have the following pseudocode structure.
```json
{
  "comment": "describe shi.bi json gramma.",
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
      "comment": "ifElement example",
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
