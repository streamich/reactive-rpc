import type {CompactRequestDataMessage} from "../../codec/compact/types";

/**
 * @category Message
 */
export class RequestDataMessage<D = unknown> {
  constructor(
    public readonly id: number,
    public readonly method: string,
    public readonly data: undefined | D,
  ) {}

  public toCompact(): CompactRequestDataMessage {
    return this.data === undefined ? [this.id, 0, this.method] : [this.id, 0, this.method, this.data];
  }
}
