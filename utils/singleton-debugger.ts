export type DebuggerSession = chrome.debugger.Debuggee & {
  sessionId?: string
}
export type OnEventCallback = (source: DebuggerSession, method: string, params?: Object) => void
export type OnDetachCallback = (source: chrome.debugger.Debuggee, reason: string) => void

class SingletonDebugger {
  private debuggeeList: {
    debuggee: chrome.debugger.Debuggee,
    debuggeeIdList: number[]
  }[] = []
  private lastDebuggeeId: number = 0
  // private onEventCallbackList: OnEventCallback[] = []
  // private onDetachCallbackList: OnDetachCallback[] = []

  private findIndex(debuggee: chrome.debugger.Debuggee) {
    return this.debuggeeList.findIndex(item => (
      debuggee.tabId === item?.debuggee?.tabId //TODO
    ))
  }

  // attach first time
  async attach(debuggee: chrome.debugger.Debuggee, requiredVersion?: string, callback?: () => void) {
    const findIndex = this.findIndex(debuggee)
    const find = this.debuggeeList[findIndex]
    this.lastDebuggeeId ++
    if(find?.debuggeeIdList?.length) {
      find.debuggeeIdList.push(this.lastDebuggeeId)
    } else {
      if(callback) {
        chrome.debugger.attach(debuggee, requiredVersion ?? "1.3", callback)
      } else {
        await chrome.debugger.attach(debuggee, requiredVersion ?? "1.3")
      }
      this.debuggeeList.push({debuggee, debuggeeIdList: [this.lastDebuggeeId]})
      // chrome.debugger.onEvent.addListener(this.onEventCallback)
      // chrome.debugger.onDetach.addListener(this.onDetachCallback)
    }
  }

  // detach last time
  async detach(debuggee: chrome.debugger.Debuggee, callback?: () => void) {
    const findIndex = this.findIndex(debuggee)
    const find = this.debuggeeList[findIndex]
    if((find?.debuggeeIdList?.length ?? 0) > 1) {
      return find.debuggeeIdList.pop() // No need to specify IDs, just maintain the quantity.
    } else {
      this.debuggeeList.splice(findIndex, 1)
      if(callback) {
        chrome.debugger.detach(debuggee, callback)
      } else {
        await chrome.debugger.detach(debuggee)
      }
      // chrome.debugger.onEvent.removeListener(this.onEventCallback)
      // chrome.debugger.onDetach.removeListener(this.onDetachCallback)
    }
  }

  // private onEventCallback: OnEventCallback = (...args) => {
  //   // When a callback returns true, subsequent callbacks will be stopped.
  //   this.onEventCallbackList.some((callback) => callback(...args))
  // }

  onEvent = {
    addListener: (callback: OnEventCallback) => {
      chrome.debugger.onEvent.addListener(callback)
      // this.onEventCallbackList.push(callback)
    },
    removeListener: (callback: OnEventCallback) => {
      chrome.debugger.onEvent.removeListener(callback)
      // const callbackIndex = this.onEventCallbackList.findIndex(v => v === callback)
      // if(callbackIndex >= 0) {
      //   this.onEventCallbackList.splice(callbackIndex, 1)
      // }
    }
  }

  // private onDetachCallback: OnDetachCallback = (...args) => {
  //   // When a callback returns true, subsequent callbacks will be stopped.
  //   this.onDetachCallbackList.some(callback => callback(...args))
  // }

  onDetach = {
    addListener: (callback: OnDetachCallback) => {
      chrome.debugger.onDetach.addListener(callback)
      // this.onDetachCallbackList.push(callback)
    },
    removeListener: (callback: OnDetachCallback) => {
      chrome.debugger.onDetach.removeListener(callback)
      // const callbackIndex = this.onDetachCallbackList.findIndex(v => v === callback)
      // if(callbackIndex >= 0) {
      //   this.onDetachCallbackList.splice(callbackIndex, 1)
      // }
    }
  }

  sendCommand (
    target: DebuggerSession,
    method: string,
    commandParams?: Object,
    callback?: (result?: Object) => void,
  ) {
    // TODO Fetch.enable、Fetch.disable slice
    if(callback) {
      chrome.debugger.sendCommand(target, method, commandParams, callback)
    } else {
      return chrome.debugger.sendCommand(target, method, commandParams)
    }
  };
}

export const singletonDebugger = new SingletonDebugger()
