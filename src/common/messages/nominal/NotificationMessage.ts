import type {CompactNotificationMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class NotificationMessage<D = unknown> {
  constructor(public readonly method: string, public readonly data: undefined | D) {}

  public toCompact(): CompactNotificationMessage {
    return this.data === undefined ? [this.method] : [this.method, this.data];
  }
}
