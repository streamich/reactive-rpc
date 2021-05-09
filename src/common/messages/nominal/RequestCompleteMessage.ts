/**
 * @category Message
 */
export class RequestCompleteMessage<D = unknown> {
  constructor(
    public readonly id: number,
    public readonly method: string,
    public readonly data: undefined | D,
  ) {}
}
