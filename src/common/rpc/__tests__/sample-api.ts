import {timer, of, from} from 'rxjs';
import {RpcMethodStatic, RpcMethodStreaming} from '../types';

const ping: RpcMethodStatic<object, void, 'pong'> = {
  isStreaming: false,
  call: async () => 'pong',
};

const delay: RpcMethodStatic<object, void, 'done'> = {
  isStreaming: false,
  call: async () => {
    await new Promise(r => setTimeout(r, 10));
    return 'done';
  },
};

const double: RpcMethodStatic<object, {num: number}, {num: number}> = {
  isStreaming: false,
  call: async (ctx, {num}) => ({num: num * 2}),
};

const error: RpcMethodStatic<object, void, void> = {
  isStreaming: false,
  call: async () => {
    throw 'this promise can throw';
  },
};

const getUser: RpcMethodStatic<object, {id: string}, {id: string, name: string, tags: string[]}> = {
  isStreaming: false,
  call: async (ctx, request) => {
    return {
      id: request.id,
      name: 'Mario Dragi',
      tags: ['news', 'cola', 'bcaa']
    };
  },
};

const streamError: RpcMethodStreaming<object, void, void> = {
  isStreaming: true,
  call: () => from((async () => {
    throw new Error('Stream always errors');
  })()),
};

const utilTimer: RpcMethodStreaming<object, void, number> = {
  isStreaming: true,
  call: (ctx, request$) => timer(10, 10),
};

const buildinfo: RpcMethodStreaming<object, void, {commit: string, sha1: string}> = {
  isStreaming: true,
  call: (ctx, request$) => from([{
    commit: 'AAAAAAAAAAAAAAAAAAA',
    sha1: 'BBBBBBBBBBBBBBBBBBB',
  }]),
};

export const sampleApi = {
  ping,
  delay,
  double,
  error,
  streamError,
  'auth.users.get': getUser,
  'util.info': buildinfo,
  'util.timer': utilTimer,
};
