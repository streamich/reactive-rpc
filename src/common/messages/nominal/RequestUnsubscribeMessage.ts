import type {CompactRequestUnsubscribeMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class RequestUnsubscribeMessage {
  constructor(public readonly id: number) {}

  public toCompact(): CompactRequestUnsubscribeMessage {
    return [this.id, 3];
  }
}
