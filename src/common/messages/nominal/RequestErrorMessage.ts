import type {CompactRequestErrorMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class RequestErrorMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: D) {}

  public toCompact(): CompactRequestErrorMessage {
    return [this.id, 2, this.data];
  }
}
