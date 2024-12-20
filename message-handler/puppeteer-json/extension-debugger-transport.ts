// https://github.com/puppeteer/puppeteer/blob/b3c1138c29cb2cfb29f71155a476d4ae5f0257d2/packages/puppeteer-core/src/cdp/ExtensionTransport.ts#L34
import {ConnectionTransport} from 'puppeteer-core';
// eslint-disable-next-line node/no-unpublished-import
import type {ProtocolMapping} from 'devtools-protocol/types/protocol-mapping';
import { singletonDebugger, OnEventCallback, OnDetachCallback } from '../../utils/singleton-debugger'

type CommandMethod = keyof ProtocolMapping.Commands;

type Command<M extends CommandMethod> = {
  id?: number;
  method: M;
  params?: Object;
  sessionId?: string;
};

interface CommandResponse<M extends CommandMethod> extends Command<M> {
  error?: chrome.runtime.LastError;
  result?: any;
}

export class ExtensionDebuggerTransport implements ConnectionTransport {
  static readonly REQUIRED_DEBUGGING_PROTOCOL_VERSION = '1.3';

  /**
   * If required, adjust this value to increase or decrese delay in ms between subsequent commands.
   * Note decreasing it too much can give issues.
   */
  delay = 0.04 * 1000;

  /**
   * Set to `true` to log protocol messages.
   */
  debug = false;

  /**
   * A target is a specific debuggee
   */
  private target: chrome.debugger.TargetInfo;
  private debugee: chrome.debugger.Debuggee;
  private sessionId?: string;

  static create(
    debugee: chrome.debugger.Debuggee,
    functionSerializer?: FunctionConstructor
  ): Promise<ExtensionDebuggerTransport> {
    if (!chrome.debugger) {
      throw new Error('missing debugger permission!');
    }
    return new Promise((resolve, reject) => {
      singletonDebugger.attach(
      // chrome.debugger.attach(
        debugee,
        ExtensionDebuggerTransport.REQUIRED_DEBUGGING_PROTOCOL_VERSION,
        async () => {
          const error = chrome.runtime.lastError;
          if (error) {
            reject(error);
          }
          // const target = await this.getTargetInfo(debugee);
          const target: chrome.debugger.TargetInfo = await new Promise((resolve, reject) => {
            chrome.debugger.getTargets(targets => {
              for (const target of targets) {
                if (target.attached && target.tabId === debugee.tabId) {
                  resolve(target);
                  return;
                }
              }
              reject(new Error('target not found'));
            });
          });
          const transport = new ExtensionDebuggerTransport(target, debugee);
          // transport._initialize(functionSerializer);
          if (functionSerializer) {
            Function = functionSerializer;
          } else {
            try {
              new Function();
            } catch (e) {
              Function = function () {
                return () => {};
              } as any as FunctionConstructor;
            }
          }
          resolve(transport);
        }
      );
    });
  }

  private onEventCallback: OnEventCallback = (source, method, params) => {
    // chrome.debugger.onEvent.addListener((source, method, params) => {
    if (source.tabId === this.target.tabId) {
    // if (source.tabId === this.target.tabId && source.sessionId === this.debuggerSession.sessionId) {
      // console.log('chrome debugger onEvent', (params as any)?.response?.headers, {method, source, params})
      this.receive({
        method: method,
        params: params,
        sessionId: this.sessionId,
      });
    }
  }

  private onDetachCallback: OnDetachCallback = source => {
    // chrome.debugger.onDetach.addListener(source => {
      if (source.tabId === this.target.tabId) {
        this.closeTarget();
      }
    }

  private constructor(target: chrome.debugger.TargetInfo, debuggee: chrome.debugger.Debuggee) {
    this.target = target;
    this.debugee = debuggee;

    singletonDebugger.onEvent.addListener(this.onEventCallback);
    singletonDebugger.onDetach.addListener(this.onDetachCallback);
  }

  // Send a message to CDP.
  send(message: string): void {
    if (this.debug) {
      console.debug('SEND', message);
    }
    const parsedMessage = JSON.parse(message);
    const method: CommandMethod = parsedMessage.method;
    if (method === 'Browser.getVersion') {
      const command: Command<typeof method> = parsedMessage;
      this.respondToCommand(command, {
        product: 'chrome',
        protocolVersion:
          ExtensionDebuggerTransport.REQUIRED_DEBUGGING_PROTOCOL_VERSION,
        // Where should these come from? Don't seem to matter tho...
        jsVersion: '',
        revision: '',
        userAgent: '',
      });
      return;
    }

    if (method === 'Target.getBrowserContexts') {
      const command: Command<typeof method> = parsedMessage;
      this.respondToCommand(command, {browserContextIds: []});
      return;
    }

    if (method === 'Target.setDiscoverTargets') {
      this.receive({ method: 'Target.targetCreated', params: {
        targetInfo: {
          ...this.target,
          targetId: this.target.id,
          canAccessOpener: false,
        },
      }});
      const command: Command<typeof method> = parsedMessage;
      this.respondToCommand(command, undefined);
      return;
    }

    // target (tab)
    // executionContext (excution frame in tab), Add a listener for the `Target.attachedToTarget` event, Then, enable auto attach by sending the `Target.setAutoAttach` command.
    if (method === 'Target.setAutoAttach') {
      if (!this.sessionId) {
        const sessionId = `session-${this.target.id}`; // UUID this?
        this.sessionId = sessionId;
        this.receive({ method: 'Target.attachedToTarget', params: {
          sessionId,
          targetInfo: {
            ...this.target,
            targetId: this.target.id,
            canAccessOpener: false,
          },
          waitingForDebugger: false,
        }});
      }
      const command: Command<typeof method> = parsedMessage;
      this.respondToCommand(command, undefined);
      return;
    }

    if (method === 'Target.activateTarget') {
      const command: Command<typeof method> = parsedMessage;
      this.respondToCommand(command, undefined);
      return;
    }

    if (method === 'Target.closeTarget') {
      setTimeout(() => this.close(), this.delay);
      const command: Command<typeof method> = parsedMessage;
      this.respondToCommand(command, undefined);
      return;
    }

    if (method.startsWith('Target')) {
      throw new Error(`unhandled target command: ${message}`);
    }

    singletonDebugger.sendCommand(
      this.debugee,
      method,
      parsedMessage.params,
      result => {
        this.respondToCommand(parsedMessage, result);
      }
    );
  }

  // Trigger on new message from CDP.
  onmessage?: (message: string) => void;
  private receive<Event = unknown>(event: Event) {
    const json = JSON.stringify(event);
    if (this.debug) {
      console.debug('RECV', json);
    }
    this?.onmessage?.(json);
  }

  private respondToCommand<M extends CommandMethod>(
    command: Command<M>,
    result: ProtocolMapping.Commands[M]['returnType'] = {}
  ) {
    const error = chrome.runtime.lastError;
    const response: CommandResponse<M> = {
      ...command,
      error: error,
      result,
    };
    setTimeout(() => {
      this.receive(response);
    }, this.delay);
  }

  onclose?: () => void;
  private closeTarget() {
    if (this.sessionId) {
      this.receive({ method: 'Target.detachedFromTarget', params: {
        sessionId: this.sessionId,
      }});
    }
    this.onclose?.();
  }

  close(): void {
    singletonDebugger.onEvent.removeListener(this.onEventCallback);
    singletonDebugger.onDetach.removeListener(this.onDetachCallback);
    singletonDebugger.detach(this.debugee, () => {
    // chrome.debugger.detach(this.debugee, () => {
      this.closeTarget();
    });
  }
}
