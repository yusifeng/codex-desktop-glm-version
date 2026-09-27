import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__lazySurfaceTest = { jsx, writingBlock: props => ({ type: "writing-block", props }) };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "lazy-surface-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__lazySurfaceTest.jsx;" : importPath === "library-writing-block-core" ? "export const n=()=>{};export const t=globalThis.__lazySurfaceTest.writingBlock;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
const children = node => Array.isArray(node?.props?.children) ? node.props.children : [node?.props?.children];

// library-writing-block: 3
const writing = await bundle("library-writing-block");
assert.deepEqual(Object.keys(writing), ["LibraryWritingBlock"]);
assert.equal(writing.LibraryWritingBlock({ id: "w1" }).type, "writing-block");
assert.equal(writing.LibraryWritingBlock({ id: "w1" }).props.id, "w1");

// chatgpt-subagents-panel: 11
const panelModule = await bundle("chatgpt-subagents-panel");
assert.deepEqual(Object.keys(panelModule), ["ChatGptSubagentsPanelTab"]);
const subagents = [{ threadId: "active", status: "working", displayName: "Researcher", prompt: "Search" }, { threadId: "done", status: "done", displayName: "Writer", statusMessage: "Finished" }];
let selected;
const panel = panelModule.ChatGptSubagentsPanelTab({ conversationId: "c1", onSelect(value) { selected = value; }, subagents });
assert.equal(panel.type, "section");
assert.equal(panel.props["data-conversation-id"], "c1");
assert.equal(children(panel)[0].props.children[0].props.children, "Active");
assert.equal(children(panel)[1].props.children[0].props.children, "Done");
children(panel)[0].props.children[1][0].props.onClick();
assert.equal(selected, "active");
const detail = panelModule.ChatGptSubagentsPanelTab({ conversationId: "c1", onSelect(value) { selected = value; }, selectedThreadId: "done", subagents });
assert.equal(detail.props["data-selected-subagent"], "done");
assert.equal(children(detail)[1].props.children, "Writer");
assert.equal(children(detail)[2].props.children, "Finished");
children(detail)[0].props.onClick();
assert.equal(selected, null);
assert.equal(children(panelModule.ChatGptSubagentsPanelTab({ conversationId: "c", onSelect() {}, subagents: [] }))[0].props.children[1].props.children, "No active subagents");

// registered-chatgpt-subagents-thumbnail: 10
const thumbnailModule = await bundle("registered-chatgpt-subagents-thumbnail");
assert.deepEqual(Object.keys(thumbnailModule), ["RegisteredChatGptSubagentsThumbnail"]);
assert.equal(thumbnailModule.RegisteredChatGptSubagentsThumbnail({ conversationId: "c", subagents: null }), null);
assert.equal(thumbnailModule.RegisteredChatGptSubagentsThumbnail({ conversationId: "c", subagents: [] }), null);
const thumbnail = thumbnailModule.RegisteredChatGptSubagentsThumbnail({ conversationId: "c", subagents, title: "Team" });
assert.equal(thumbnail.type, "article");
assert.equal(children(thumbnail)[0].props.children, "Team");
assert.equal(children(thumbnail)[1].props.children[0].props["data-status"], "working");
assert.equal(children(thumbnail)[1].props.children[1].props["data-status"], "done");
const selectedThumb = thumbnailModule.RegisteredChatGptSubagentsThumbnail({ conversationId: "c", responseExcerpt: "Final answer", selectedThreadId: "done", subagents });
assert.equal(children(selectedThumb)[0].props.children, "Writer");
assert.equal(children(selectedThumb)[1].props.children, "Final answer");
assert.equal(selectedThumb.props["data-status"], "done");

// image-gen-loading-games: 9
const games = await bundle("image-gen-loading-games");
assert.deepEqual(Object.keys(games), ["ImageGenLoadingGames"]);
let opened; let engaged;
const game = games.ImageGenLoadingGames({ aspectRatio: 1.5, game: "snake", imageCount: 2, messageId: "m1", onGameEngaged(id) { engaged = id; }, onGameOpened(id) { opened = id; }, startedAtMs: 100 });
assert.equal(game.props["data-game"], "snake");
assert.equal(game.props["data-image-count"], 2);
assert.equal(game.props.style.aspectRatio, 1.5);
assert.equal(children(game)[0].props.children, "Generating 2 images…");
assert.match(children(game)[1].props.children, /Snake/);
children(game)[1].props.onClick();
assert.equal(opened, "m1:100");
children(game)[1].props.onKeyDown();
assert.equal(engaged, "m1:100");
assert.equal(children(games.ImageGenLoadingGames({ game: "brick-breaker", isGif: true, messageId: "m" }))[0].props.children, "Generating animation…");

// chatgpt-conversation-inline-beacon: 9
const beaconModule = await bundle("chatgpt-conversation-inline-beacon");
assert.deepEqual(Object.keys(beaconModule), ["ChatGptConversationInlineBeacon"]);
const beacon = { beacon_id: "b1", ui_info: { design: "card", primary_info_text: "Try this" }, action_items: [{ id: "a1", label: "Open" }, { id: "a2", label: "Share" }] };
assert.equal(beaconModule.ChatGptConversationInlineBeacon({ beacon, conversationId: "c", messageIds: [], sourceMessageId: "m" }), null);
const renderedBeacon = beaconModule.ChatGptConversationInlineBeacon({ beacon, conversationId: "c", messageIds: ["m"], sourceMessageId: "m" });
assert.equal(renderedBeacon.type, "article");
assert.equal(renderedBeacon.props["data-beacon-id"], "b1");
assert.equal(renderedBeacon.props["data-conversation-id"], "c");
assert.equal(children(renderedBeacon)[0].props.children[0].props.children, "Try this");
assert.equal(children(renderedBeacon)[0].props.children[1].props.children.length, 2);
const inline = beaconModule.ChatGptConversationInlineBeacon({ beacon: { ...beacon, ui_info: { design: "inline" } }, conversationId: "c", messageIds: ["m"], sourceMessageId: "m" });
assert.equal(inline.type, "section");
assert.equal(beaconModule.ChatGptConversationInlineBeacon({ conversationId: "c", messageIds: [] }), null);

// work-mode-pet-content: 9
const petModule = await bundle("work-mode-pet-content");
assert.deepEqual(Object.keys(petModule), ["WorkModePetContent"]);
assert.equal(petModule.WorkModePetContent({ enabled: false }), null);
assert.equal(petModule.WorkModePetContent({ builtInAssets: {} }), null);
const defaultPet = petModule.WorkModePetContent({ accessoryId: "unknown", builtInAssets: { default: "default.png" } });
assert.equal(defaultPet.props["data-pet-id"], "default");
assert.equal(defaultPet.props.src, "default.png");
const uploaded = petModule.WorkModePetContent({ accessoryId: "uploaded:pet_1", customPets: [{ id: "pet_1", spritesheetUrl: "pet.png" }] });
assert.equal(uploaded.props["data-pet-id"], "pet_1");
assert.equal(uploaded.props.src, "pet.png");
const expired = petModule.WorkModePetContent({ accessoryId: "pet_old", builtInAssets: { default: "fallback.png" }, customPets: [{ id: "pet_old", spritesheetUrl: "old.png", expiresAt: "2000-01-01T00:00:00Z" }] });
assert.equal(expired.props.src, "fallback.png");
assert.equal(petModule.WorkModePetContent({ accessoryId: "default", alt: "Buddy", builtInAssets: { default: "d.png" } }).props.alt, "Buddy");

console.log("51 lazy conversation surface cluster assertions passed");
