import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";
import "@rchunk/use-visible-settings-sections";

export interface VisibleSettingsSection {
  disabled?: boolean;
  externalUrl?: string;
  label: string;
  slug: string;
}

export interface VisibleSettingsCommandMenuSectionItemsProps {
  close(): void;
  isSelectedHostLocal: boolean;
  selectedHostId: string;
  sections?: readonly VisibleSettingsSection[];
  onNavigate?(path: string): void;
  onOpenExternal?(url: string): void;
}

let jsx: JsxRuntime;

function VisibleSettingsCommandMenuSectionItems(
  props: VisibleSettingsCommandMenuSectionItemsProps,
): unknown {
  const sections = (props.sections ?? []).filter((section) => !section.disabled);
  if (sections.length === 0) return null;
  return jsx.jsxs("section", {
    "data-host-id": props.selectedHostId,
    "data-local-host": props.isSelectedHostLocal,
    children: [
      jsx.jsx("h3", { children: "Settings" }),
      jsx.jsx("ul", {
        children: sections.map((section) =>
          jsx.jsx("li", {
            children: jsx.jsx("button", {
              type: "button",
              onClick: () => {
                if (section.externalUrl) props.onOpenExternal?.(section.externalUrl);
                else props.onNavigate?.(`/settings/${section.slug}`);
                props.close();
              },
              children: section.label,
            }),
          }, section.slug),
        ),
      }),
    ],
  });
}

function initializeVisibleSettingsCommandMenuSectionItems(): void {
  jsx = getJsxRuntime();
}

initializeVisibleSettingsCommandMenuSectionItems();

export { VisibleSettingsCommandMenuSectionItems };
