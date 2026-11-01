import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
globalThis.__popupTestJsx = jsx;
const build = await esbuild.build({
  entryPoints: [path.join(ROOT, "src/renderer/popup/index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent",
  plugins: [{ name: "mocks", setup(api) {
    api.onResolve({ filter: /^@rchunk\// }, ({ path: request }) => ({ path: request.slice(8), namespace: "mock" }));
    api.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: request }) => ({ loader: "js", contents: request === "app-shared" ? "export const I3=()=>globalThis.__popupTestJsx;" : "export {};" }));
  } }],
});
const popup = await import(`data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString("base64")}`);
popup.n();

function source(id, initial) {
  let result = initial;
  let changed = () => {};
  const stops = [];
  return {
    id, stops,
    getSuggestions: () => result,
    set(next) { result = next; changed(); },
    start(_query, callback) { changed = callback; },
    stop(...args) { stops.push(args); },
  };
}
const inline = (value, selectionStart) => ({ value, selectionStart, selectionEnd: value.length });
const history = source("history", { suggestions: [
  { id: "substring", textMatch: "substring", content: "Substring" },
  { id: "exact", textMatch: "exact", isExistingDestination: true, canBeDefault: true, content: "Exact", preview: { inline: inline("alpha.example", 2), selected: inline("alpha.example", 0) } },
] });
const search = source("search", { suggestions: [{ id: "prefix", textMatch: "prefix", content: "Prefix" }] });
const controller = new popup.r();
let changes = 0;
controller.subscribe(() => { changes += 1; }, [history, search]);
controller.start({ value: "al", selectionStart: 2, selectionEnd: 2 }, [history, search]);
let snapshot = controller.getSnapshot();
assert.deepEqual(snapshot.suggestions.map(({ id }) => id), ["exact", "prefix", "substring"]);
assert.equal(snapshot.selectedSuggestion.id, "exact");
assert.deepEqual(snapshot.preview, inline("alpha.example", 2));
assert.equal(snapshot.isKeyboardSelection, false);

controller.moveSelection(1);
snapshot = controller.getSnapshot();
assert.equal(snapshot.selectedSuggestion.id, "prefix");
assert.equal(snapshot.isKeyboardSelection, true);
search.set({ suggestions: [{ id: "new", textMatch: "exact" }, { id: "prefix", textMatch: "substring", content: "Prefix" }] });
assert.deepEqual(controller.getSnapshot().suggestions.map(({ id }) => id), ["exact", "prefix", "substring"], "keyboard navigation freezes displayed order");

controller.stop("commit", false);
history.set({ suggestions: [{ id: "exact", textMatch: "exact", isExistingDestination: true, canBeDefault: true, preview: { inline: inline("alpha.example", 2) } }] });
controller.start({ value: "al", selectionStart: 2, selectionEnd: 2 }, [history]);
history.set({ isRetained: true, suggestions: [{ id: "exact", textMatch: "exact", isExistingDestination: true, canBeDefault: true, preview: { inline: inline("alpha.example", 2) } }] });
controller.start({ value: "alp", selectionStart: 3, selectionEnd: 3 }, [history]);
assert.deepEqual(controller.getSnapshot().preview, inline("alpha.example", 3), "typing into an inline preview retains the remaining suffix");

let deleted = false;
history.set({ suggestions: [
  { id: "one", canBeDefault: true, deleteAction: { label: "Delete one", run: () => { deleted = true; return true; } } },
  { id: "two" },
] });
controller.start({ value: "a", selectionStart: 1, selectionEnd: 1 }, [history]);
controller.moveSelection(1);
assert.equal(controller.getSnapshot().selectedSuggestion.id, "two");
controller.moveSelection(-1);
const doomed = controller.getSnapshot().selectedSuggestion;
assert.equal(controller.deleteSuggestion(doomed), true);
assert.equal(deleted, true);
history.set({ suggestions: [{ id: "two" }] });
assert.equal(controller.getSnapshot().selectedSuggestion.id, "two", "deletion moves selection to the nearest surviving suggestion");

controller.setPreventInlineAutocompleteOnNextChange(true);
assert.equal(controller.shouldPreventInlineAutocompleteOnNextChange(), true);
assert.equal(controller.consumePreventInlineAutocompleteOnNextChange(), true);
assert.equal(controller.shouldPreventInlineAutocompleteOnNextChange(), false);
assert.equal(controller.isAutocompleteSelection("a", 1, 1), true);
controller.start({ value: "   ", selectionStart: 3, selectionEnd: 3 }, [history]);
assert.equal(controller.getSnapshot().query, null);
assert.deepEqual(history.stops.at(-1), ["clobbered", false]);
assert.ok(changes >= 8);

const list = popup.t({ label: "Suggestions", listboxId: "address-list", suggestions: [{ id: "one", content: "One", deleteAction: { label: "Delete", run: () => true } }], selectedIndex: 0, onSelect() {}, onDelete() {} });
assert.equal(list.props.role, "listbox");
assert.equal(list.props.children[0].props.children[0].props.role, "option");
assert.equal(list.props.children[0].props.children[0].props["aria-selected"], true);
assert.equal(list.props.children[0].props.children[1].props["aria-label"], "Delete");
console.log("popup address suggestion assertions passed");
