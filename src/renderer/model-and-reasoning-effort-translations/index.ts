import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type {
  FormattedMessageProps,
  JsxRuntime,
} from "@rchunk/app-shared";

const {
  I3: getJsxRuntime,
  K2: initializeIntlRuntime,
  Y2: FormattedMessage,
} = appSharedChunk;
const {
  cc: initializeModelTranslations,
  lc: reasoningEffortMessages,
} = appPrimaryChunk;

let jsx: JsxRuntime;

export interface ReasoningEffortTranslationProps {
  effort: string;
}

function ReasoningEffortTranslation({
  effort,
}: ReasoningEffortTranslationProps): unknown {
  initializeReasoningEffortTranslations();
  const message = reasoningEffortMessages[effort];
  return jsx.jsx(FormattedMessage, { ...message } satisfies FormattedMessageProps);
}

function initializeReasoningEffortTranslations(): void {
  if (jsx != null) return;
  initializeIntlRuntime();
  initializeModelTranslations();
  jsx = getJsxRuntime();
}

initializeReasoningEffortTranslations();

export {
  initializeReasoningEffortTranslations as n,
  ReasoningEffortTranslation as t,
};
