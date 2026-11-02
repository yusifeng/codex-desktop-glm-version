import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const owners = [
  ["quick-chat-writing-block-adapter", [/onSuggestedFollowup/, /serverConversationId/, /onContentChange/, /export \{/]],
  ["writing-block-content-update", [/activeToneSectionId/, /toneSections/, /export \{/]],
  ["writing-block-directive-renderer", [/contentReferences/, /renderPersisted/, /renderExtension/, /export \{/]],
  ["writing-block-surface", [/--oai-wb-surface-primary/, /data-oai-writing-block-surface/, /export \{/]],
  ["codex-writing-block-directive-renderer", [/writingBlockId/, /renderPersisted/, /codex-writing-block/, /export \{/]],
  ["markdown-writing-block", [/showCopyButton/, /onAddSelectedTextToChat/, /export \{[^}]*MarkdownWritingBlock/]],
  ["dil-writing-block", [/contentReferenceIndex/, /quick-chat-writing-block-adapter/, /export \{[^}]*DilWritingBlock/]],
  ["multiplayer-writing-block", [/documentId/, /multiplayer-document-runtime/, /export \{[^}]*MultiplayerWritingBlock/]],
  ["library-writing-block", [/library-writing-block-core/, /export \{/]],
];
let assertions = 0;
for (const [owner, patterns] of owners) assertions += assertReleaseOwner(owner, patterns);
console.log(`${assertions} writing block integration owner release assertions passed`);
