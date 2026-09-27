import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { t as AddressInput } from "@rchunk/tab-address-input";

interface TabInputContext {
  conversationId?: string | null;
  id: string;
  navigate(address: string, preserveEditing?: boolean): void;
  panelTarget?: string;
  stopEditing?(): void;
  value?: string;
}

type AddressSource = Record<string, unknown>;
type AddressSourceProvider = (
  scope: unknown,
  context: TabInputContext,
) => AddressSource;

interface TabInputProps extends Record<string, unknown> {
  addressValue?: string;
  conversationId?: string | null;
  id: string;
  onNavigate(address: string, preserveEditing?: boolean): void;
  onStopAddressEditing?(): void;
  panelTarget?: string;
  providers?: AddressSourceProvider[];
  scope?: unknown;
  sources?: AddressSource[];
}

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

function t({
  conversationId,
  providers = [],
  sources = [],
  onNavigate,
  scope,
  ...inputProps
}: TabInputProps): unknown {
  const context: TabInputContext = {
    conversationId,
    id: inputProps.id,
    navigate: onNavigate,
    panelTarget: inputProps.panelTarget,
    stopEditing: inputProps.onStopAddressEditing,
    value: inputProps.addressValue,
  };
  const generatedSources = providers.map((provider) => provider(scope, context));
  return jsx().jsx(AddressInput, {
    ...inputProps,
    onCommitAddress: (address: string) => onNavigate(address, false),
    sources: [...sources, ...generatedSources],
  });
}

function n(): void {}
export { n, t };
