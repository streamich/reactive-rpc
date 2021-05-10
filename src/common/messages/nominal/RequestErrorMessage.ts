/**
 * @category Message
 */
export class RequestErrorMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: D) {}
}
