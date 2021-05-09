import {NotificationMessage} from "./NotificationMessage";
import {RequestCompleteMessage} from "./RequestCompleteMessage";
import {RequestDataMessage} from "./RequestDataMessage";
import {RequestErrorMessage} from "./RequestErrorMessage";
import {RequestUnsubscribeMessage} from "./RequestUnsubscribeMessage";
import {ResponseCompleteMessage} from "./ResponseCompleteMessage";
import {ResponseDataMessage} from "./ResponseDataMessage";
import {ResponseErrorMessage} from "./ResponseErrorMessage";
import {ResponseUnsubscribeMessage} from "./ResponseUnsubscribeMessage";

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
