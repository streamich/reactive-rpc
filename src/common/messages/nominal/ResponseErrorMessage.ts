/**
 * @category Message
 */
export class ResponseErrorMessage<D = unknown> {
  constructor(public readonly id: number, public readonly data: D) {}
}
