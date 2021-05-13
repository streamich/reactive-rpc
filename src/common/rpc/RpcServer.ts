import {Observable, Subject} from 'rxjs';
import {ReactiveRpcRequestMessage, ReactiveRpcResponseMessage, NotificationMessage, RequestCompleteMessage, RequestDataMessage, RequestErrorMessage, RequestUnsubscribeMessage, ResponseCompleteMessage, ResponseDataMessage, ResponseErrorMessage, ResponseUnsubscribeMessage} from '../messages/nominal';
import {subscribeCompleteObserver} from '../util/subscribeCompleteObserver';
import {TimedQueue} from '../util/TimedQueue';
import {RpcMethod, RpcMethodStatic, RpcMethodStreaming} from './types';

export const enum RpcServerError {
  Unknown = 0,
  IdTaken = 1,
  TooManyStreams = 2,
  InvalidData = 3,
  NoMethodSpecified = 4,
  MethodNotFound = 5,
  ErrorForStaticMethod = 6,
  Stop = 7,
}

export interface RpcServerParams<Ctx = unknown, T = unknown> {
  /**
   * Method to be called by server when it wants to send messages to the client.
   * This is usually your WebSocket "send" method.
   */
  send: (messages: ReactiveRpcResponseMessage[]) => void;

  /**
   * Callback called on the server when user sends a subscription message.
   */
  getRpcMethod: (name: string) => RpcMethod<Ctx, T, T> | undefined;

  /**
   * Callback called on the server when user sends a notification message.
   */
  notify: (name: string, data: T | undefined, ctx: Ctx) => void;

  /**
   * Method to format any error thrown by application to correct format.
   */
  formatError: (error: Error | unknown) => T;

  /**
   * Method to format error into the correct format.
   */
  formatErrorCode?: (code: RpcServerError) => T;

  /**
   * Maximum number of active subscription in flight. This also includes
   * in-flight request/response subscriptions.
   */
  maxActiveStreams?: number;

  /**
   * Number of messages to keep in buffer before sending them out.
   * The buffer is flushed when the message reaches this limit or when the
   * buffering time has reached the time specified in `bufferTime` parameter.
   * Defaults to 10 messages.
   */
  bufferSize?: number;

  /**
   * Time in milliseconds for how long to buffer messages before sending them
   * out. Defaults to 1 milliseconds. Set it to zero to disable buffering.
   */
  bufferTime?: number;
}

class StreamCall<T = unknown> {
  public reqFinalized: boolean = false;
  public resFinalized: boolean = false;
  public readonly req$: Subject<T> = new Subject();
  public readonly res$: Subject<T> = new Subject();
}

export class RpcServer<Ctx = unknown, T = unknown> {
  private send: (message: ReactiveRpcResponseMessage<T>) => void;
  private getRpcMethod: RpcServerParams<Ctx, T>['getRpcMethod'];
  private notify: RpcServerParams<Ctx, T>['notify'];
  private readonly formatError: (error: Error | unknown) => T;
  private readonly formatErrorCode: (code: RpcServerError) => T;
  private readonly activeStreamCalls: Map<number, StreamCall<T>> = new Map();
  private readonly maxActiveStreams: number;

  constructor({
    send,
    getRpcMethod: call,
    notify,
    formatErrorCode,
    formatError,
    maxActiveStreams: maxActiveSubscriptions = 30,
    bufferSize = 10,
    bufferTime = 1,
  }: RpcServerParams<Ctx, T>) {
    this.getRpcMethod = call;
    this.notify = notify;
    this.formatError = formatError;
    this.formatErrorCode = formatErrorCode || formatError;
    this.maxActiveStreams = maxActiveSubscriptions;
    if (bufferTime) {
      const buffer = new TimedQueue<ReactiveRpcResponseMessage>();
      buffer.itemLimit = bufferSize;
      buffer.timeLimit = bufferTime;
      buffer.onFlush = send;
      this.send = (message) => {
        buffer.push(message);
      };
    } else {
      this.send = message => send([message]);
    }
  }

  /**
   * Returns the number of active in-flight calls. Useful for reporting and 
   * testing for memory leaks in unit tests.
   * 
   * @returns Number of in-flight RPC calls.
   */
   public getInflightCallCount(): number {
    return this.activeStreamCalls.size;
  }

  public onMessage(message: ReactiveRpcRequestMessage<T>, ctx: Ctx): void {
    if (message instanceof RequestDataMessage) this.onRequestData(message, ctx);
    else if (message instanceof RequestCompleteMessage) this.onRequestComplete(message, ctx);
    else if (message instanceof RequestErrorMessage) this.onRequestError(message, ctx);
    else if (message instanceof NotificationMessage) this.onNotification(message, ctx);
    else if (message instanceof ResponseUnsubscribeMessage) this.onUnsubscribe(message);
  }

  public onMessages(messages: ReactiveRpcRequestMessage<T>[], ctx: Ctx): void {
    const length = messages.length;
    for (let i = 0; i < length; i++) this.onMessage(messages[i], ctx);
  }

  public stop() {
    this.send = (message: ReactiveRpcResponseMessage<T>) => {};
    this.notify = (name: string, data: T | undefined, ctx: Ctx) => {};
    for (const call of this.activeStreamCalls.values()) {
      call.req$.error(this.formatErrorCode(RpcServerError.Stop));
      call.res$.error(this.formatErrorCode(RpcServerError.Stop));
    }
    this.activeStreamCalls.clear();
  }

  private sendError(id: number, code: RpcServerError): void {
    const data = this.formatErrorCode(code);
    const message = new ResponseErrorMessage<T>(id, data);
    this.send(message);
  }

  private execStaticCall(id: number, call: RpcMethodStatic<Ctx, T, T>['call'], request: T, ctx: Ctx) {
    call(ctx, request)
      .then(response => {
        this.send(new ResponseCompleteMessage<T>(id, response));
      })
      .catch(error => {
        this.send(new ResponseErrorMessage<T>(id, error));
      });
  }

  private createStreamCall(id: number, rpcMethodStreaming: RpcMethodStreaming<Ctx, T, T>, ctx: Ctx): StreamCall<T> | undefined {
    if (this.activeStreamCalls.size >= this.maxActiveStreams) {
      this.sendError(id, RpcServerError.TooManyStreams);
      return;
    }
    const streamCall = new StreamCall<T>();
    this.activeStreamCalls.set(id, streamCall);
    const request$ = new Observable<T>((observer) => {
      streamCall.req$.subscribe(observer);
      return () => {
        if (!streamCall.reqFinalized)
          this.send(new RequestUnsubscribeMessage(id));
        streamCall.req$.complete();
      };
    });
    const onReqFinalize = () => {
      if (streamCall.resFinalized) this.activeStreamCalls.delete(id);
      else streamCall.reqFinalized = true;
    };
    streamCall.req$.subscribe({error: onReqFinalize, complete: onReqFinalize});
    const response$ = rpcMethodStreaming.call(ctx, request$);
    response$.subscribe(streamCall.res$);
    subscribeCompleteObserver<T>(streamCall.res$, {
      next: (value: T) => this.send(new ResponseDataMessage<T>(id, value)),
      error: (error: unknown) => {
        if (streamCall.reqFinalized) this.activeStreamCalls.delete(id);
        else streamCall.resFinalized = true;
        this.send(new ResponseErrorMessage<T>(id, this.formatError(error)));
      },
      complete: (value: T | undefined) => {
        if (streamCall.reqFinalized) this.activeStreamCalls.delete(id);
        else streamCall.resFinalized = true;
        this.send(new ResponseCompleteMessage<T>(id, value));
      },
    });
    return streamCall;
  }

  private onRequestData(message: RequestDataMessage<T>, ctx: Ctx): void {
    const {id, method, data} = message;
    const call = this.activeStreamCalls.get(id);
    if (call) return call.req$.next(data as T);
    if (!method) return this.sendError(id, RpcServerError.NoMethodSpecified);
    const rpcMethod = this.getRpcMethod(method);
    if (!rpcMethod) return this.sendError(id, RpcServerError.MethodNotFound);
    if (!rpcMethod.isStreaming) return this.execStaticCall(id, rpcMethod.call, data as T, ctx);
    const streamCall = this.createStreamCall(id, rpcMethod, ctx);
    if (!streamCall) return;
    if (data !== undefined) streamCall.req$.next(data);
  }

  private onRequestComplete(message: RequestCompleteMessage<T>, ctx: Ctx): void {
    const {id, method, data} = message;
    const call = this.activeStreamCalls.get(id);
    if (call) {
      call.reqFinalized = true;
      const {req$} = call;
      if (data !== undefined) req$.next(data as T);
      return req$.complete();
    }
    if (!method) return this.sendError(id, RpcServerError.NoMethodSpecified);
    const rpcMethod = this.getRpcMethod(method);
    if (!rpcMethod) return this.sendError(id, RpcServerError.MethodNotFound);
    if (!rpcMethod.isStreaming) return this.execStaticCall(id, rpcMethod.call, data as T, ctx);
    const streamCall = this.createStreamCall(id, rpcMethod, ctx);
    if (!streamCall) return;
    streamCall.reqFinalized = true;
    const {req$} = streamCall;
    if (data !== undefined) req$.next(data);
    req$.complete();
  }

  private onRequestError(message: RequestErrorMessage, ctx: Ctx): void {
    const {id, method, data} = message;
    const call = this.activeStreamCalls.get(id);
    if (call) {
      call.reqFinalized = true;
      return call.req$.error(data);
    }
    if (!method) return this.sendError(id, RpcServerError.NoMethodSpecified);
    const rpcMethod = this.getRpcMethod(method);
    if (!rpcMethod) return this.sendError(id, RpcServerError.MethodNotFound);
    if (!rpcMethod.isStreaming) return this.sendError(id, RpcServerError.ErrorForStaticMethod);
    const streamCall = this.createStreamCall(id, rpcMethod, ctx);
    if (!streamCall) return;
    streamCall.req$.error(data);
  }

  private onUnsubscribe(message: ResponseUnsubscribeMessage): void {
    const {id} = message;
    const call = this.activeStreamCalls.get(id);
    if (!call) return;
    call.res$.complete();
  }

  private onNotification(message: NotificationMessage<T>, ctx: Ctx): void {
    const {method, data} = message;
    this.notify(method, data, ctx);
  }
}
