/**
 * @category Message
 */
export class ResponseDataMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: D) {}
}
