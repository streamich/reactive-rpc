/**
 * @category Message
 */
export class NotificationMessage<D = unknown> {
  constructor(public readonly method: string, public readonly data: undefined | D) {}
}
