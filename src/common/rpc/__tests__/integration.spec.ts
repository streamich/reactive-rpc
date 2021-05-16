import {runIntegrationTests, sampleApi} from './api';
import {RpcServer, RpcServerError} from '../RpcServer';
import {RpcClient} from '../RpcClient';

const setup = () => {
  const ctx = {ip: '127.0.0.1'};
  const server = RpcServer.fromApi<any, any>({
    send: (messages) => {
      setTimeout(() => {
        client.onMessages(messages);
      }, 1);
    },
    notify: () => {},
    api: sampleApi,
    bufferSize: 2,
    bufferTime: 1,
    maxActiveCalls: 3,
    formatError: (error: unknown) => {
      if (error instanceof Error) return {message: error.message};
      return error;
    },
    formatErrorCode: (code: RpcServerError) => {
      return {
        message: 'PROTOCOL',
        code,
      };
    },
  });
  const client = new RpcClient({
    send: (messages) => {
      setTimeout(() => {
        server.onMessages(messages, ctx);
      }, 1);
    },
    bufferSize: 2,
    bufferTime: 1,
  });
  return {server, client};
};

runIntegrationTests(setup);
