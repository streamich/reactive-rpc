import {decodeFullMessages} from "../binary/decode";
import {Decoder as MessagePackDecoder} from 'json-joy/lib/json-pack';
import {ReactiveRpcBinaryMessage} from "../../messages/binary";
import {Message, ReactiveRpcMessage} from "../../messages/nominal";

export class Decoder {
  protected msgpack = new MessagePackDecoder();

  protected convertMessage(message: ReactiveRpcBinaryMessage): ReactiveRpcMessage {
    const data = (message as Message).data;
    if (data instanceof Uint8Array) {
      if (!data.byteLength) (message as Message).data = undefined;
      else (message as Message).data = this.msgpack.decode(data);
    }
    return message;
  }

  public decode(arr: Uint8Array, offset: number, end: number): ReactiveRpcMessage[] {
    const binaryMessages = decodeFullMessages(arr, offset, end);
    const messages: ReactiveRpcMessage[] = [];
    const length = binaryMessages.length;
    for (let i = 0; i < length; i++) messages.push(this.convertMessage(binaryMessages[i]));
    return messages;
  }
}
