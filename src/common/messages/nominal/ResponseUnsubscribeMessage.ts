import type {CompactResponseUnsubscribeMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class ResponseUnsubscribeMessage {
  constructor(public readonly id: number) {}

  public toCompact(): CompactResponseUnsubscribeMessage {
    return [-3, this.id];
  }
}
