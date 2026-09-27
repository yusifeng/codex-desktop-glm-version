import "@rchunk/rolldown-runtime";
import { N3 as getReactDomRuntime } from "@rchunk/app-shared";
import { Dt as loadApplication, Et as initializeApplication } from "@rchunk/app-initial";
interface Root { render(node: unknown): void }
interface RootWindow extends Window { __codexRoot?: Root }
async function initialize(): Promise<void> { initializeApplication(); if (typeof document === "undefined") return; const container = document.getElementById("root"); if (container == null) throw new Error("Root container not found"); const reactDom = getReactDomRuntime() as { createRoot(element: HTMLElement): Root }; const rootWindow = window as RootWindow; rootWindow.__codexRoot ??= reactDom.createRoot(container); rootWindow.__codexRoot.render(await loadApplication()); }
void initialize();
