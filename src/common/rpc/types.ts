import type {Observable} from "rxjs";

export type RpcMethod<Context = unknown, Request = unknown, Response = unknown> =
  | RpcMethodStatic<Context, Request, Response>
  | RpcMethodStreaming<Context, Request, Response>;

export interface RpcMethodStatic<Context = unknown, Request = unknown, Response = unknown> {
  isStreaming: false;
  isRequestStreaming: false;
  isResponseStreaming: false;
  call: (ctx: Context, request: Request) => Promise<Response>;
}

export interface RpcMethodStreaming<Context = unknown, Request = unknown, Response = unknown> {
  isStreaming: true;
  isRequestStreaming: true;
  isResponseStreaming: true;
  call: (ctx: Context, request$: Observable<Request>) => Observable<Response>;
}