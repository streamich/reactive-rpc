/**
 * @category Message
 */
export class ResponseCompleteMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: D) {}
}
