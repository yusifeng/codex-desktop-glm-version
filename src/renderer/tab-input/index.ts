// tab-input —— 浏览器标签页地址输入框及会话作用域的地址源装配。
// 原版：app/webview/assets/tab-input-63d87e5c3c7b.js。

import "@rchunk/rolldown-runtime";
import {
  $3 as getCompilerRuntime, FX as initializeSignalRuntime, I3 as getJsxRuntime,
  LX as useScope, __ as useStableCallback, e6 as getReactRuntime,
  g_ as initializeStableCallbackRuntime, type JsxRuntime,
} from "@rchunk/app-shared";
import { $en as conversationScope, itn as initializeConversationScope } from "@rchunk/app-initial";
import { n as initializeAddressInput, t as AddressInput } from "@rchunk/tab-address-input";

interface CompilerRuntime { c(size: number): unknown[] }
interface ReactRuntime { useState<T>(initializer: () => T): [T, unknown] }
interface TabInputContext {
  conversationId?: string | null; id: string;
  navigate(address: string, preserveEditing?: boolean): void;
  panelTarget?: string; stopEditing?(): void; value?: string;
}
type AddressSource = Record<string, unknown>;
type AddressSourceProvider = (scope: unknown, getContext: () => TabInputContext) => AddressSource;
interface TabInputProps extends Record<string, unknown> {
  addressValue?: string; conversationId?: string | null; id: string;
  onNavigate(address: string, preserveEditing?: boolean): void;
  onStopAddressEditing?(): void; panelTarget?: string;
  providers: AddressSourceProvider[]; sources?: AddressSource[];
}

let compiler: CompilerRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function TabInput(props: TabInputProps): unknown {
  initializeTabInput();
  const cache = compiler.c(28);
  let conversationId: string | null | undefined;
  let onNavigate: TabInputProps["onNavigate"];
  let inputProps: Omit<TabInputProps, "conversationId" | "providers" | "sources" | "onNavigate">;
  let providers: AddressSourceProvider[];
  let sources: AddressSource[] | undefined;
  if (cache[0] === props) {
    conversationId = cache[1] as typeof conversationId; onNavigate = cache[2] as typeof onNavigate;
    inputProps = cache[3] as typeof inputProps; providers = cache[4] as typeof providers; sources = cache[5] as typeof sources;
  } else {
    ({ conversationId, providers, sources, onNavigate, ...inputProps } = props);
    cache[0] = props; cache[1] = conversationId; cache[2] = onNavigate; cache[3] = inputProps; cache[4] = providers; cache[5] = sources;
  }
  const scope = useScope(conversationScope);
  let createContext: () => TabInputContext;
  if (cache[6] !== conversationId || cache[7] !== onNavigate || cache[8] !== inputProps.addressValue || cache[9] !== inputProps.id || cache[10] !== inputProps.onStopAddressEditing || cache[11] !== inputProps.panelTarget) {
    createContext = () => ({
      id: inputProps.id as string,
      conversationId,
      panelTarget: inputProps.panelTarget as string | undefined,
      value: inputProps.addressValue as string | undefined,
      navigate: onNavigate,
      stopEditing: inputProps.onStopAddressEditing as (() => void) | undefined,
    });
    cache[6] = conversationId; cache[7] = onNavigate; cache[8] = inputProps.addressValue; cache[9] = inputProps.id; cache[10] = inputProps.onStopAddressEditing; cache[11] = inputProps.panelTarget; cache[12] = createContext;
  } else createContext = cache[12] as typeof createContext;
  const getContext = (useStableCallback as unknown as <T>(callback: () => T) => () => T)(createContext);
  let createProviderSources: () => AddressSource[];
  if (cache[13] !== getContext || cache[14] !== providers || cache[15] !== scope) {
    createProviderSources = () => providers.map((provider) => provider(scope, getContext));
    cache[13] = getContext; cache[14] = providers; cache[15] = scope; cache[16] = createProviderSources;
  } else createProviderSources = cache[16] as typeof createProviderSources;
  const [providerSources] = React.useState(createProviderSources);
  let baseSources: AddressSource[];
  if (cache[17] === sources) baseSources = cache[18] as AddressSource[];
  else { baseSources = sources ?? []; cache[17] = sources; cache[18] = baseSources; }
  let combinedSources: AddressSource[];
  if (cache[19] === providerSources && cache[20] === baseSources) combinedSources = cache[21] as AddressSource[];
  else { combinedSources = [...baseSources, ...providerSources]; cache[19] = providerSources; cache[20] = baseSources; cache[21] = combinedSources; }
  let commitAddress: (address: string) => void;
  if (cache[22] === onNavigate) commitAddress = cache[23] as typeof commitAddress;
  else { commitAddress = (address) => onNavigate(address, false); cache[22] = onNavigate; cache[23] = commitAddress; }
  if (cache[24] !== inputProps || cache[25] !== combinedSources || cache[26] !== commitAddress) {
    cache[24] = inputProps; cache[25] = combinedSources; cache[26] = commitAddress;
    cache[27] = jsx.jsx(AddressInput, { ...inputProps, sources: combinedSources, onCommitAddress: commitAddress });
  }
  return cache[27];
}

function initializeTabInput(): void {
  if (initialized) return;
  compiler = getCompilerRuntime() as unknown as CompilerRuntime;
  initializeSignalRuntime(); React = getReactRuntime() as unknown as ReactRuntime;
  initializeConversationScope(); initializeStableCallbackRuntime(); initializeAddressInput();
  jsx = getJsxRuntime(); initialized = true;
}

export { initializeTabInput as n, TabInput as t };
