import {
  NotificationMessage,
  RequestCompleteMessage,
  RequestDataMessage,
  RequestErrorMessage,
  RequestUnsubscribeMessage,
  ResponseCompleteMessage,
  ResponseDataMessage,
  ResponseErrorMessage,
  ResponseUnsubscribeMessage,
} from '../../messages/nominal';
import type {Message} from '../../messages/nominal/types';
import type {
  CompactMessage,
  CompactNotificationMessage,
  CompactRequestCompleteMessage,
  CompactRequestDataMessage,
  CompactRequestErrorMessage,
  CompactRequestUnsubscribeMessage,
  CompactResponseCompleteMessage,
  CompactResponseDataMessage,
  CompactResponseErrorMessage,
  CompactResponseUnsubscribeMessage,
} from './types';

export function decodeMsg(message: CompactMessage): Message {
  const first = message[0];
  if (typeof first === 'number') {
    switch (first) {
      case 0: {
        const [, id, data] = message as CompactResponseDataMessage;
        return new ResponseDataMessage(id, data);
      }
      case -1: {
        const [, id, data] = message as CompactResponseCompleteMessage;
        return new ResponseCompleteMessage(id, data);
      }
      case -2: {
        const [, id, data] = message as CompactResponseErrorMessage;
        return new ResponseErrorMessage(id, data);
      }
      case -3: {
        const [, id] = message as CompactResponseUnsubscribeMessage;
        return new ResponseUnsubscribeMessage(id);
      }
      default: {
        const [, second] = message as
          | CompactRequestDataMessage
          | CompactRequestCompleteMessage
          | CompactRequestErrorMessage
          | CompactRequestUnsubscribeMessage;
        switch (second) {
          case 0: {
            const [, , name, data] = message as CompactRequestDataMessage;
            return new RequestDataMessage(first, name, data);
          }
          case 1: {
            const [, , name, data] = message as CompactRequestCompleteMessage;
            return new RequestCompleteMessage(first, name, data);
          }
          case 2: {
            const [, , method, data] = message as CompactRequestErrorMessage;
            return new RequestErrorMessage(first, method, data);
          }
          case 3: {
            return new RequestUnsubscribeMessage(first);
          }
        }
      }
    }
  }
  const [method, data] = message as CompactNotificationMessage;
  return new NotificationMessage(method, data);
}

export function decode(messages: CompactMessage[]): Message[] {
  const length = messages.length;
  const out: Message[] = [];
  for (let i = 0; i < length; i++) out.push(decodeMsg(messages[i]));
  return out;
}
