import type {CompactResponseErrorMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class ResponseErrorMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: D) {}

  public toCompact(): CompactResponseErrorMessage {
    return [-2, this.id, this.data];
  }
}
