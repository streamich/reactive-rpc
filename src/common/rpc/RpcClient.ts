import {isObservable, Observable, Observer, Subject, merge, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ReactiveRpcRequestMessage, ReactiveRpcResponseMessage, NotificationMessage, RequestCompleteMessage, RequestDataMessage, RequestErrorMessage, RequestUnsubscribeMessage, ResponseCompleteMessage, ResponseDataMessage, ResponseErrorMessage, ResponseUnsubscribeMessage} from '../messages/nominal';
import {subscribeCompleteObserver} from '../util/subscribeCompleteObserver';
import {TimedQueue} from '../util/TimedQueue';

export interface RpcClientParams<T = unknown> {
  /**
   * Method to be called by client when it wants to send messages to the server.
   * This is usually connected to your WebSocket "send" method.
   */
  send: (messages: ReactiveRpcRequestMessage<T>[]) => void;

  /**
   * Number of messages to keep in buffer before sending them to the server.
   * The buffer is flushed when the message reaches this limit or when the
   * buffering time has reached the time specified in `bufferTime` parameter.
   * Defaults to 100 messages.
   */
  bufferSize?: number;

  /**
   * Time in milliseconds for how long to buffer messages before sending them
   * to the server. Defaults to 10 milliseconds.
   */
  bufferTime?: number;
}

interface ObserverEntry<T = unknown> {
  /* In-between observable for request stream. */
  req$: Subject<T>;
  /* In-between observable for response stream. */
  res$: Subject<T>;
}

export class RpcClient<T = unknown> {
  private id: number = 1;
  private readonly buffer: TimedQueue<ReactiveRpcRequestMessage<T>>;

  /**
   * In-flight RPC calls.
   */
  private readonly calls = new Map<number, ObserverEntry<T>>();

  constructor({send, bufferSize = 100, bufferTime = 10}: RpcClientParams<T>) {
    this.buffer = new TimedQueue();
    this.buffer.itemLimit = bufferSize;
    this.buffer.timeLimit = bufferTime;
    this.buffer.onFlush = send;
  }

  /**
   * Returns the number of active in-flight calls. Useful for reporting and 
   * testing for memory leaks in unit tests.
   * 
   * @returns Number of in-flight RPC calls.
   */
  public getInflightCallCount(): number {
    return this.calls.size;
  }

  /**
   * Processes a batch of messages received from the server.
   * 
   * @param messages List of messages from server.
   */
  public onMessages(messages: ReactiveRpcResponseMessage<T>[]): void {
    const length = messages.length;
    for (let i = 0; i < length; i++) {
      const message = messages[i];
      if (message instanceof ResponseCompleteMessage) {
        const {id, data} = message;
        const call = this.calls.get(id);
        if (!call) return;
        if (data !== undefined) call.res$.next(data);
        call.res$.complete();
      } else if (message instanceof ResponseDataMessage) {
        const {id, data} = message;
        const call = this.calls.get(id);
        if (!call) return;
        call.res$.next(data);
      } else if (message instanceof ResponseErrorMessage) {
        const {id, data} = message;
        const call = this.calls.get(id);
        if (!call) return;
        call.res$.error(data);
      } else if (message instanceof RequestUnsubscribeMessage) {
        const {id} = message;
        const call = this.calls.get(id);
        if (!call) return;
        call.req$.complete();
      }
    }
  }

  /**
   * Execute remote RPC method. We use in-between `req$` and `res$` observables.
   * 
   * ```
   * +--------+      +--------+
   * |  data  |  ->  |  req$  |  ->  Server messages
   * +--------+      +--------+
   * 
   *                      +--------+      +-------------------+
   * Server messages  ->  |  res$  |  ->  |  user observable  |
   *                      +--------+      +-------------------+
   * ```
   * 
   * @param method RPC method name.
   * @param data RPC method static payload or stream of data.
   */
  public call(method: string, data: T): Observable<T>;
  public call(method: string, data: Observable<T>): Observable<T>;
  public call(method: string, data: T | Observable<T>): Observable<T> {
    const id = this.id++;
    if (this.id >= 0xffff) this.id = 1;
    if (this.calls.has(id)) return this.call(method, data as any);
    const req$ = new Subject<T>();
    const res$ = new Subject<T>();
    merge([
      req$.pipe(catchError(() => of())),
      res$.pipe(catchError(() => of())),
    ]).subscribe({
      error: () => {
        this.calls.delete(id);
      },
      complete: () => {
        this.calls.delete(id);
      },
    });
    const entry: ObserverEntry<T> = {req$, res$};
    this.calls.set(id, entry);
    if (isObservable(data)) {
      data.subscribe(req$);
      let firstMessageSent = false;
      subscribeCompleteObserver<T>(req$, {
        next: (value) => {
          const messageMethod = firstMessageSent ? '' : method;
          firstMessageSent = true;
          const message = new RequestDataMessage(id, messageMethod, value);
          this.buffer.push(message);
        },
        error: (error) => {
          const messageMethod = firstMessageSent ? '' : method;
          const message = new RequestErrorMessage<T>(id, messageMethod, error as T);
          this.buffer.push(message);
        },
        complete: (value) => {
          const messageMethod = firstMessageSent ? '' : method;
          const message = new RequestCompleteMessage<T>(id, messageMethod, value);
          this.buffer.push(message);
        },
      });
    } else {
      this.buffer.push(new RequestCompleteMessage<T>(id, method, data));
      req$.complete();
    }
    return new Observable<T>((observer: Observer<T>) => {
      res$.subscribe(observer);
      return () => {
        this.buffer.push(new ResponseUnsubscribeMessage(id));
        res$.complete();
      };
    });
  }

  /**
   * Send a one-way notification message without expecting any response.
   * 
   * @param method Remote method name.
   * @param data Static payload data.
   */
  public notify(method: string, data: undefined | T): void {
    this.buffer.push(new NotificationMessage<T>(method, data));
  }
}