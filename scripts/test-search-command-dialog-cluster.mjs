import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

let assertions = 0;
assertions += assertReleaseOwner("command-menu-dialog", [
  /Search chats or run a command/,
  /Recently viewed chats/,
  /export \{ Mr as CommandMenuDialog \}/,
]);
assertions += assertReleaseOwner("chatgpt-search-dialog", [
  /Close global search/,
  /Loading search results…/,
  /export \{ Li as ChatGptSearchDialog \}/,
]);

console.log(`${assertions} release-faithful search and command dialog assertions passed`);
