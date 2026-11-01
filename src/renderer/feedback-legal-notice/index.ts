import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Y2 as FormattedMessage,
} from "@rchunk/app-shared";
import {
  Dft as initializeExternalLinkRuntime,
  Oft as openExternalLink,
} from "@rchunk/app-initial";

interface CompilerRuntime {
  c(size: number): unknown[];
}

const LEARN_MORE_URL =
  "https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance";

let compilerRuntime: CompilerRuntime;
let jsxRuntime: ReturnType<typeof getJsxRuntime>;

function FeedbackLegalNotice(): unknown {
  const cache = compilerRuntime.c(1);
  if (cache[0] === Symbol.for("react.memo_cache_sentinel")) {
    cache[0] = jsxRuntime.jsx("div", {
      className: "text-sm text-codex-description",
      children: jsxRuntime.jsx(FormattedMessage, {
        id: "turnRatingControls.feedbackLegalNotice",
        defaultMessage:
          "Your feedback can be used to improve ChatGPT. <link>Learn more</link>.",
        description: "Legal notice shown below feedback details",
        values: { link: renderLearnMoreLink },
      }),
    });
  }
  return cache[0];
}

function renderLearnMoreLink(children: unknown): unknown {
  return jsxRuntime.jsx("a", {
    className: "underline underline-offset-2",
    href: LEARN_MORE_URL,
    rel: "noreferrer",
    target: "_blank",
    onClick: handleLearnMoreClick,
    children,
  });
}

function handleLearnMoreClick(event: unknown): void {
  openExternalLink({
    event,
    href: LEARN_MORE_URL,
    initiator: "open_in_browser_bridge",
    openTarget: "external-browser",
  });
}

function initializeFeedbackLegalNotice(): void {
  compilerRuntime = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeInternationalization();
  initializeExternalLinkRuntime();
  jsxRuntime = getJsxRuntime();
}

export {
  initializeFeedbackLegalNotice as n,
  FeedbackLegalNotice as t,
};
