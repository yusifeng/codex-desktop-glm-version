import "@rchunk/app-shared";
import {
  $st as reviewFileSourceTabType,
  Qst as openReviewFileSourceTab,
  Xst as getReviewFileSourceTabId,
  Zst as initializeReviewFileSourceTab,
  ect as toggleReviewFileSourceTab,
} from "@rchunk/app-initial";

initializeReviewFileSourceTab();

export {
  getReviewFileSourceTabId,
  openReviewFileSourceTab,
  reviewFileSourceTabType,
  toggleReviewFileSourceTab,
};
