import type {CompactResponseCompleteMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class ResponseCompleteMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: undefined | D) {}

  public toCompact(): CompactResponseCompleteMessage {
    return this.data === undefined
      ? [-1, this.id]
      : [-1, this.id, this.data];
  }
}
