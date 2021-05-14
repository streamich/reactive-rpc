import {decodeFullMessages} from "../binary/decode";
import {Decoder as MessagePackDecoder} from 'json-joy/lib/json-pack';
import {ReactiveRpcBinaryMessage} from "../../messages/binary";
import {Message, ReactiveRpcMessage} from "../../messages/nominal";

export class Decoder {
  protected msgpack = new MessagePackDecoder();

  protected convertMessage(message: ReactiveRpcBinaryMessage): ReactiveRpcMessage {
    if ((message as Message).data !== undefined)
      (message as Message).data = this.msgpack.decode((message as Message).data as Uint8Array);
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
