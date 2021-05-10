import type {CompactResponseDataMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class ResponseDataMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: D) {}

  public toCompact(): CompactResponseDataMessage {
    return [0, this.id, this.data];
  }
}
