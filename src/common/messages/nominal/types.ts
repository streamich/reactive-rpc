import type {CompactMessage} from "../../codec/compact/types";
import type {NotificationMessage} from "./NotificationMessage";
import type {RequestCompleteMessage} from "./RequestCompleteMessage";
import type {RequestDataMessage} from "./RequestDataMessage";
import type {RequestErrorMessage} from "./RequestErrorMessage";
import type {RequestUnsubscribeMessage} from "./RequestUnsubscribeMessage";
import type {ResponseCompleteMessage} from "./ResponseCompleteMessage";
import type {ResponseDataMessage} from "./ResponseDataMessage";
import type {ResponseErrorMessage} from "./ResponseErrorMessage";
import type {ResponseUnsubscribeMessage} from "./ResponseUnsubscribeMessage";

export type ReactiveRpcMessage =
  | NotificationMessage
  | RequestDataMessage
  | RequestCompleteMessage
  | RequestErrorMessage
  | RequestUnsubscribeMessage
  | ResponseDataMessage
  | ResponseCompleteMessage
  | ResponseErrorMessage
  | ResponseUnsubscribeMessage;

export interface Message {
  toCompact(): CompactMessage;
}
