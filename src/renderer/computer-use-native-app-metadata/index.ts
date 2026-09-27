import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

interface NativeAppMetadata { appId?: string; displayName?: string; [key: string]: unknown }
type NativeAppReference = { kind: "appId"; appId: string; metadata?: NativeAppMetadata } | { kind: "displayName"; displayName: string; metadata?: NativeAppMetadata } | null;
function getNativeAppMetadata(reference: NativeAppReference): NativeAppMetadata | null { return reference?.metadata ?? null; }
function initializeNativeAppMetadata(): void {}
export { getNativeAppMetadata as n, initializeNativeAppMetadata as t };
