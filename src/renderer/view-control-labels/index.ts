import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

interface MessageFormatter {
  formatMessage(descriptor: { defaultMessage: string; description: string; id: string }): string;
}

interface ViewLabelContext {
  intl: MessageFormatter;
  tabIds: readonly string[];
  view: "chat" | "full" | "split" | string;
}

interface ViewLabelState {
  evaluate(context: ViewLabelContext): string;
}

function format(
  intl: MessageFormatter,
  id: string,
  defaultMessage: string,
  description: string,
): string {
  return intl.formatMessage({ id, defaultMessage, description });
}

let r: ViewLabelState;
let n: ViewLabelState;

function t(): void {
  r ??= {
    evaluate({ intl, tabIds, view }) {
      if (view === "chat") {
        return tabIds.length === 0
          ? format(intl, "threadWorkspace.layout.newTab", "New tab", "Creates a content tab in the selected layout when there are no tabs")
          : format(intl, "threadWorkspace.layout.showTabs", "Show tabs", "Restores the content tabs in the selected full or split layout");
      }
      return format(intl, "threadWorkspace.layout.hideTabs", "Hide tabs", "Hides the content tabs and leaves Chat visible");
    },
  };
  n ??= {
    evaluate({ intl, tabIds, view }) {
      if (view === "full") {
        return format(intl, "threadWorkspace.layout.exitFullView", "Exit full view", "Restores the content tabs beside Chat in split view");
      }
      return tabIds.length === 0
        ? format(intl, "threadWorkspace.layout.newTabInFullView", "New tab in full view", "Creates a content tab that fills the workspace")
        : format(intl, "threadWorkspace.layout.enterFullView", "Enter full view", "Expands the active content tab to fill the workspace");
    },
  };
}

export { n, r, t };
