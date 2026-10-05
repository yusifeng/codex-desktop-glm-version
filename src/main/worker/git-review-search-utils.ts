if (typeof module !== `undefined`) module.exports = { formatReviewSearchPath, buildSearchSnippet, findCaseInsensitiveOffsets, createLineDecoder };
import { findCaseInsensitiveOffsets } from "./git-review-search-policy";
import { buildSearchSnippet } from "./git-review-snippet-policy";
import { formatReviewSearchPath } from "./git-review-search-path-policy";
import { createLineDecoder } from "./git-review-line-decoder-policy";
