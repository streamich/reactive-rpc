import {timer, of} from 'rxjs';
import {RpcMethodStatic, RpcMethodStreaming} from '../types';

const ping: RpcMethodStatic<object, void, 'pong'> = {
  isStreaming: false,
  call: async () => 'pong',
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

const utilTimer: RpcMethodStreaming<object, void, number> = {
  isStreaming: true,
  call: (ctx, request$) => timer(1e3, 1e3),
};

const buildinfo: RpcMethodStreaming<object, void, {commit: string, sha1: string}> = {
  isStreaming: true,
  call: (ctx, request$) => of({
    commit: 'AAAAAAAAAAAAAAAAAAA',
    sha1: 'BBBBBBBBBBBBBBBBBBB',
  }),
};

export const sampleApi = {
  ping,
  'auth.users.get': getUser,
  'util.info': buildinfo,
  'util.timer': utilTimer,
};
