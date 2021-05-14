import {ReactiveRpcMessage} from "../../messages/nominal";
import {encode} from "../compact/encode";
import {Encoder as MessagePackEncoder} from 'json-joy/lib/json-pack';

export class Encoder {
  protected readonly msgpack = new MessagePackEncoder();

  public encode(messages: ReactiveRpcMessage[]): Uint8Array {
    const compact = encode(messages);
    return this.msgpack.encode(compact);
  }
}
