import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

export interface AudioSummaryDialogRequest { conversationId: string; format?: "executive_briefing" | "podcast" | "study_guide"; instructions?: string }
export interface AudioSummaryDialogHost { openDialog?(id: string, request: AudioSummaryDialogRequest): void }
function openAudioSummaryDialog(host: AudioSummaryDialogHost, conversationId: string): void { host.openDialog?.("audio-summary", { conversationId }); }
export { openAudioSummaryDialog };
