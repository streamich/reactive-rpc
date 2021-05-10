# Reactive-RPC

Reactive RPC over WebSocket and HTTP. Both, request and response can be an
observable (a stream of data).

```ts
type RpcCall = (method: string, payload: Observable<unknown>) => Observable<unknown>;
```

---

*README-driven-development (stuff below is what it should be like, not what is already implemented:*


## RPC method types

Similar to gRPC, [Reactive-RPC](https://onp4.com/@vadim/p/qgzwgi42cz) lets you define four kinds of RPC methods:

1. Unary RPCs where the client sends a single request to the server and gets a
   single response back, just like a normal RPC call.

```ts
type RpcCall = (method: string, payload: unknown) => Promise<unknown>;
```

2. Server streaming, where the client sends a request to the server and gets a
   stream to read a sequence of messages back.

```ts
type RpcCall = (method: string, payload: unknown) => Observable<unknown>;
```

3. Client streaming RPCs request payload, where the client writes a sequence of
   messages and sends them to the server.

```ts
type RpcCall = (method: string, payload: Observable<unknown>) => Promise<unknown>;
```

4. Bi-directional request and response streaming RPCs, where both sides send a
   sequence of messages using a read-write stream. The two streams operate
   independently, so clients and servers can read and write in whatever order
   they like.

```ts
type RpcCall = (method: string, payload: Observable<unknown>) => Observable<unknown>;
```
