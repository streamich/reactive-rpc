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

const timer: RpcMethodStreaming<object, void, number> = {
  isStreaming: true,
  call: (ctx, request$) => timer(3000),
};

const buildinfo: RpcMethodStreaming<object, void, {commit: string, sha1: string}> = {
  isStreaming: true,
  call: (ctx, request$) => of({
    commit: 'AAAAAAAAAAAAAAAAAAA',
    sha1: 'BBBBBBBBBBBBBBBBBBB',
  }),
};

export const api = {
  ping,
  'auth.users.get': getUser,
  timer,
  'util.info': buildinfo,
};
