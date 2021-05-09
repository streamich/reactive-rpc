/**
 * @category Message
 */
export class RequestDataMessage<D = unknown> {
  constructor(
    public readonly id: number,
    public readonly method: string,
    public readonly data: D,
  ) {}
}
