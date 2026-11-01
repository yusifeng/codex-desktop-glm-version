import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as presentationChunk from "@rchunk/presentation";
import { EXACT_ACTIVITY_MESSAGES } from "./exact-activity-messages";
import { EXACT_APPROVAL_MESSAGES } from "./exact-approval-messages";

interface IntlShape { formatMessage(descriptor: { defaultMessage: string; description?: string; id?: string }, values?: Record<string, unknown>): string }
interface MatchingApp { id: string; name: string; pluginDisplayNames?: string[] }
interface ToolActivityInput { appContext?: { actionName?: string; appName?: string; connectorId: string } | null; completed?: boolean; intl: IntlShape; matchingApp?: MatchingApp | null; nativeDesktopAppMetadata?: { name?: string } | null; platform?: string; serverName?: string | null; source?: { backend?: string; kind?: string } | null; toolArguments?: unknown; toolName: string; toolResult?: unknown }
interface ApprovalInput { connector_id: string; connector_name?: string | null; tool_name?: string | null; tool_params?: unknown; tool_title?: string | null }
interface ApprovalMessage { descriptor: { defaultMessage: string; description?: string; id: string }; values?: Record<string, unknown>; url?: string }

function words(value: string): string[] { return value.trim().toLowerCase().split(/[^a-z0-9]+/g).filter(Boolean); }
function sentence(value: string): string { const normalized = words(value).join(" "); return normalized.length === 0 ? "Used tool" : normalized[0].toUpperCase() + normalized.slice(1); }
function dedupeWordLists(values: string[][]): string[][] {
  return values.filter((value, index) => value.length > 0 && values.findIndex(candidate => candidate.length === value.length && candidate.every((part, partIndex) => part === value[partIndex])) === index);
}
function appendOverlappingWords(value: string[], suffix: string[]): string[] {
  for (let overlap = Math.min(value.length, suffix.length); overlap > 0; overlap -= 1) {
    if (value.slice(-overlap).every((part, index) => part === suffix[index])) return [...value, ...suffix.slice(overlap)];
  }
  return [...value, ...suffix];
}
function appPrefixes(app?: MatchingApp | null): string[][] {
  if (app == null) return [];
  const base = dedupeWordLists([words(app.name), words(app.id), words(app.id.replace(/^connector[_-]/i, "")), ...(app.pluginDisplayNames ?? []).map(words)]);
  return dedupeWordLists(base.flatMap(prefix => [prefix, appendOverlappingWords(prefix, ["mcp"]), appendOverlappingWords(prefix, ["mcp", "server"])]))
    .sort((left, right) => right.length - left.length);
}
function stripAppPrefix(toolName: string, app?: MatchingApp | null): string {
  if (app == null) return toolName;
  let toolWords = words(toolName);
  const prefixes = appPrefixes(app);
  for (;;) {
    const prefix = prefixes.find(candidate => toolWords.length >= candidate.length && candidate.every((part, index) => part === toolWords[index]));
    if (prefix == null) break;
    toolWords = toolWords.slice(prefix.length);
  }
  return toolWords.length === 0 ? toolName : toolWords.join(" ");
}
function normalizedAppKeys(app: MatchingApp): string[] {
  return [app.name, app.id, app.id.replace(/^connector[_-]/i, ""), ...(app.pluginDisplayNames ?? [])]
    .map(value => words(value).join("_"))
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index);
}
function compactString(value: unknown, maxLength = 96): string | null {
  if (typeof value !== "string") return null;
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length === 0) return null;
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}
function objectArguments(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
const RESULT_COUNT_KEYS = ["count", "total", "total_count", "totalCount"] as const;
const RESULT_ARRAY_KEYS: Record<string, string[]> = {
  figma: ["files", "nodes", "results", "suggestions", "variables"],
  github: ["items", "issues", "pull_requests", "repositories", "results", "reviews", "threads", "users", "workflow_runs"],
  gmail: ["emails", "messages", "results", "threads"],
  google_calendar: ["events", "items", "results"],
  google_drive: ["comments", "documents", "drives", "files", "items", "presentations", "results", "revisions", "rows", "spreadsheets"],
  linear: ["attachments", "comments", "customers", "cycles", "documents", "initiatives", "issues", "labels", "milestones", "projects", "results", "teams", "users"],
  notion: ["comments", "databases", "pages", "results", "teams", "users", "views"],
  sites: ["access_groups", "deployments", "projects", "results", "sites", "versions"],
  slack: ["channels", "items", "messages", "reactions", "results", "users", "workspaces"],
  vercel: ["deployments", "projects", "results", "teams"],
};
const ACTIVITY_ARGUMENT_KEYS: Record<string, Record<string, string[]>> = {
  figma: { create_new_file: ["fileName", "name"], generate_deck: ["title", "name"], generate_diagram: ["name", "description"], use_figma: ["description"] },
  github: { create_issue: ["title"], create_pull_request: ["title"], search: ["query", "q"], search_commits: ["query"], search_issues: ["query"], search_prs: ["query"], search_repositories: ["query"], update_issue: ["title"], update_pull_request: ["title"] },
  gmail: { create_draft: ["subject"], forward_emails: ["subject"], search_emails: ["query"], send_draft: ["subject"], send_email: ["subject"], update_draft: ["subject"] },
  google_calendar: { create_event: ["summary", "title"], search: ["query"], search_events: ["query"], update_event: ["summary", "title"] },
  google_drive: { create_file: ["name", "file_name"], create_folder: ["name"], search: ["query"], search_spreadsheet_rows: ["query"], upload_file: ["name", "file_name", "filename"] },
  linear: { create_document: ["title", "name"], research: ["query"], save_issue: ["title"], save_project: ["name"], search: ["query"], search_documentation: ["query"] },
  notion: { create_database: ["title", "name"], create_pages: ["title", "name"], duplicate_page: ["title", "name"], search: ["query"], update_page: ["title", "name"] },
  sites: { create_project: ["name"], create_site: ["name"], list_projects: ["query"], list_sites: ["query"], update_site_metadata: ["name", "title"] },
  slack: { create_canvas: ["title"], create_conversation: ["name"], schedule_message: ["channel_name", "channel"], search_channels: ["query"], search_public: ["query"], search_users: ["query"], send_message: ["channel_name", "channel"] },
  vercel: { check_domain_availability_and_price: ["domain"], deploy_to_vercel: ["project_name", "name"], search_vercel_documentation: ["query"] },
};
function successfulStructuredContent(result: unknown): unknown {
  const outer = objectArguments(result);
  if (outer == null || outer.type !== "success") return null;
  if (outer.structuredContent != null) return outer.structuredContent;
  const raw = objectArguments(outer.raw);
  return raw?.structuredContent ?? outer.raw ?? null;
}
function resultCount(result: unknown, appKey: string): number | null {
  const structured = successfulStructuredContent(result);
  if (Array.isArray(structured)) return structured.length;
  const object = objectArguments(structured);
  if (object == null) return null;
  for (const key of RESULT_ARRAY_KEYS[appKey] ?? ["items", "results"]) if (Array.isArray(object[key])) return object[key].length;
  for (const key of RESULT_COUNT_KEYS) {
    const count = object[key];
    if (typeof count === "number" && Number.isInteger(count) && count >= 0) return count;
  }
  const arrays = Object.values(object).filter(Array.isArray);
  return arrays.length === 1 ? arrays[0].length : null;
}
function activityArgumentContext(appKey: string, toolKey: string, value: unknown): string | null {
  const object = objectArguments(value);
  if (object == null) return null;
  for (const key of ACTIVITY_ARGUMENT_KEYS[appKey]?.[toolKey] ?? []) {
    const preview = compactString(object[key], 80);
    if (preview != null) return preview;
  }
  return null;
}
const APPROVAL_CONTEXT_KEYS: Record<string, string[]> = {
  figma: ["name", "title", "query", "node_id", "file_key"],
  github: ["title", "comment", "body", "message", "repo_full_name", "repository_full_name", "branch", "path"],
  gmail: ["subject", "to", "query", "message"],
  google_calendar: ["summary", "title", "event_id", "calendar_id"],
  google_drive: ["name", "file_name", "filename", "query", "url"],
  linear: ["title", "name", "body", "query", "filename"],
  linear_mcp_server: ["title", "name", "body", "query", "filename"],
  notion: ["title", "name", "query", "page_id", "database_id"],
  notion_mcp_server: ["title", "name", "query", "page_id", "database_id"],
  slack: ["channel_name", "channel", "message", "query", "user_name"],
};
const APPROVAL_TOOL_KEYS: Record<string, ReadonlySet<string>> = Object.fromEntries(Object.entries({
  figma: "add_code_connect_map create_new_file generate_deck generate_diagram generate_figma_design send_code_connect_mappings upload_assets use_figma",
  github: "add_comment_to_issue add_issue_assignees add_issue_labels add_reaction_to_issue_comment add_reaction_to_pr add_reaction_to_pr_review_comment add_review_to_pr convert_pull_request_to_draft create_blob create_branch create_commit create_file create_issue create_pull_request create_tree delete_file dismiss_pull_request_review enable_auto_merge label_pr lock_issue_conversation mark_pull_request_ready_for_review merge_pull_request remove_issue_assignees remove_issue_label remove_pull_request_reviewers remove_reaction_from_issue_comment remove_reaction_from_pr remove_reaction_from_pr_review_comment reply_to_review_comment request_pull_request_reviewers rerun_failed_workflow_run_jobs rerun_workflow_job resolve_review_thread unlock_issue_conversation unresolve_review_thread update_file update_issue update_issue_comment update_pull_request update_ref update_review_comment",
  gmail: "apply_labels_to_emails archive_emails batch_modify_email bulk_label_matching_emails create_draft create_label delete_emails forward_emails send_draft send_email update_draft",
  google_calendar: "create_event delete_event respond_event update_event",
  google_drive: "create_file copy_file create_folder create_presentation_from_template delete_file duplicate_sheet_in_new_spreadsheet import_document import_presentation import_spreadsheet batch_update_document update_file share_file bulk_update_file_comments batch_update_presentation batch_update_spreadsheet upload_file",
  linear: "create_attachment create_issue_label delete_attachment delete_comment delete_customer delete_customer_need delete_status_update save_comment save_customer save_customer_need save_initiative save_issue save_milestone save_project save_status_update",
  linear_mcp_server: "create_attachment create_issue_label delete_attachment delete_comment delete_customer delete_customer_need delete_status_update save_comment save_customer save_customer_need save_initiative save_issue save_milestone save_project save_status_update",
  notion: "update_data_source update_page",
  notion_mcp_server: "update_data_source update_page",
  slack: "add_reaction complete_file_upload create_canvas create_conversation delete_message edit_message get_file_upload_url invite_to_conversation join_conversation leave_conversation remove_reaction schedule_message send_message send_message_draft update_canvas",
}).map(([app, keys]) => [app, new Set(keys.split(" "))]));
const APP_TOOL_KEYS: Record<string, ReadonlySet<string>> = Object.fromEntries(Object.entries({
  browser: "run_code_unsafe",
  figma: "add_code_connect_map create_new_file download_assets generate_deck generate_diagram generate_figma_design get_code_connect_map get_code_connect_suggestions get_context_for_code_connect get_design_context get_figjam get_libraries get_metadata get_motion_context get_screenshot get_variable_defs search_design_system send_code_connect_mappings upload_assets use_figma",
  github: "add_comment_to_issue add_issue_assignees add_issue_labels add_reaction_to_issue_comment add_reaction_to_pr add_reaction_to_pr_review_comment add_review_to_pr check_repo_initialized compare_commits convert_pull_request_to_draft create_blob create_branch create_commit create_file create_issue create_pull_request create_tree delete_file download_user_content download_workflow_artifact enable_auto_merge fetch fetch_blob fetch_commit fetch_commit_workflow_runs fetch_file fetch_issue fetch_issue_comments fetch_pr fetch_pr_comments fetch_pr_file_patch fetch_pr_patch fetch_workflow_job_logs fetch_workflow_job_steps fetch_workflow_run_artifacts fetch_workflow_run_jobs get_commit_combined_status get_issue_comment_reactions get_pr_diff get_pr_info get_pr_reactions get_pr_review_comment_reactions get_profile get_repo get_repo_collaborator_permission get_user_login get_users_recent_prs_in_repo label_pr list_installations list_installed_accounts list_pr_changed_filenames list_pull_request_review_threads list_pull_request_reviews list_recent_issues list_repositories list_repositories_by_affiliation list_repositories_by_installation list_user_org_memberships list_user_orgs mark_pull_request_ready_for_review merge_pull_request remove_issue_assignees remove_issue_label remove_reaction_from_issue_comment remove_reaction_from_pr remove_reaction_from_pr_review_comment reply_to_review_comment request_pull_request_reviewers rerun_failed_workflow_run_jobs rerun_workflow_job resolve_review_thread search search_branches search_commits search_installed_repositories_streaming search_installed_repositories_v2 search_issues search_prs search_repositories update_file update_issue update_issue_comment update_pull_request update_ref update_review_comment",
  gmail: "apply_labels_to_emails archive_emails batch_modify_email batch_read_email batch_read_email_threads bulk_label_matching_emails create_draft create_label delete_emails forward_emails get_profile get_recent_emails list_drafts list_labels read_attachment read_email read_email_thread search_email_ids search_emails send_draft send_email update_draft",
  google_calendar: "batch_read_event create_event delete_event fetch get_availability get_colors get_profile read_event read_event_all_fields respond_event search search_events search_events_all_fields update_event",
  google_drive: "create_file copy_file create_folder create_presentation_from_template delete_file download_file duplicate_sheet_in_new_spreadsheet export_file import_document import_presentation import_spreadsheet list_drives list_file_revisions list_folder recent_documents get_document get_document_comments get_document_tables get_document_text get_file_comments get_file_metadata fetch_file_revision oai_admin_fetch fetch get_presentation get_presentation_comments get_presentation_outline get_presentation_tables get_presentation_text get_profile get_slide get_slide_thumbnail get_spreadsheet_cells get_spreadsheet_comments get_spreadsheet_metadata get_spreadsheet_range get_document_paragraph_range find_document_text_range oai_admin_search search search_spreadsheet_rows batch_update_document update_file share_file bulk_update_file_comments batch_update_presentation batch_update_spreadsheet upload_file",
  linear: "create_attachment create_document create_issue_label delete_attachment delete_comment delete_customer delete_customer_need delete_status_update extract_images fetch get_attachment get_document get_initiative get_issue get_issue_status get_milestone get_project get_status_updates get_team get_user list_comments list_customers list_cycles list_documents list_initiatives list_issue_labels list_issue_statuses list_issues list_milestones list_project_labels list_projects list_teams list_users research save_comment save_customer save_customer_need save_initiative save_issue save_milestone save_project save_status_update search search_documentation update_document",
  linear_mcp_server: "create_attachment create_document create_issue_label delete_attachment delete_comment delete_customer delete_customer_need delete_status_update extract_images fetch get_attachment get_document get_initiative get_issue get_issue_status get_milestone get_project get_status_updates get_team get_user list_comments list_customers list_cycles list_documents list_initiatives list_issue_labels list_issue_statuses list_issues list_milestones list_project_labels list_projects list_teams list_users research save_comment save_customer save_customer_need save_initiative save_issue save_milestone save_project save_status_update search search_documentation update_document",
  notion: "create_attachment create_comment create_database create_pages create_view download_attachment duplicate_page fetch get_comments get_teams get_users move_pages query_data_sources query_database_view query_meeting_notes search update_data_source update_page update_view",
  notion_mcp_server: "create_attachment create_comment create_database create_pages create_view download_attachment duplicate_page fetch get_comments get_teams get_users move_pages query_data_sources query_database_view query_meeting_notes search update_data_source update_page update_view",
  sites: "create_project create_project_version create_site create_source_repository_write_credential deploy_private_site_version deploy_project_version deploy_site_version execute_database_delete execute_database_insert execute_database_update generate_siwc_bypass_token get_deployment_status get_environment get_environment_variables get_project get_project_deployment get_project_version get_site get_site_version get_site_worker_logs list_access_groups list_available_access_groups list_projects list_site_versions list_sites prepare_database_delete prepare_database_insert prepare_database_update read_database_overview read_database_table_rows save_site_version update_access update_environment update_environment_variables update_site_access update_site_metadata",
  slack: "add_reaction complete_file_upload create_canvas create_conversation create_reminder delete_message edit_message get_file_upload_url get_reactions invite_to_conversation join_conversation leave_conversation list_channel_members list_starred_items list_user_conversations list_user_groups list_workspaces read_canvas read_channel read_file read_thread read_user_profile remove_reaction schedule_message search_channels search_emojis search_public search_public_and_private search_users send_message send_message_draft update_canvas update_user_profile",
  vercel: "check_domain_availability_and_price deploy_to_vercel get_access_to_vercel_url get_deployment get_deployment_build_logs get_project import_claude_design_from_url list_deployments list_projects list_teams search_vercel_documentation web_fetch_vercel_url",
  wallet: "generate_cryptogram_from_saved_card open_vgs_card_enrollment",
}).map(([app, keys]) => [app, new Set(keys.split(" "))]));
const ACTIVITY_TOOL_ALIASES: Record<string, Record<string, string>> = {
  github: {
    fetch: "fetch_file",
    list_repositories_by_affiliation: "list_repositories",
    list_repositories_by_installation: "list_repositories",
    search_installed_repositories_streaming: "search_repositories",
    search_installed_repositories_v2: "search_repositories",
  },
  gmail: { batch_read_email: "read_email", search_email_ids: "search_emails" },
  google_calendar: { batch_read_event: "read_event", search_events_all_fields: "search_events" },
  slack: { search_public_and_private: "search_public" },
};

const ACTIVE_VERBS: Record<string, string> = {
  add: "Adding", apply: "Applying", archive: "Archiving", batch: "Updating", bulk: "Updating", check: "Checking", compare: "Comparing", complete: "Completing", convert: "Converting", copy: "Copying", create: "Creating", delete: "Deleting", deploy: "Deploying", download: "Downloading", duplicate: "Duplicating", edit: "Editing", enable: "Enabling", execute: "Updating", export: "Exporting", extract: "Extracting", fetch: "Fetching", find: "Finding", forward: "Forwarding", generate: "Generating", get: "Getting", import: "Importing", invite: "Inviting", join: "Joining", label: "Labeling", leave: "Leaving", list: "Listing", mark: "Marking", merge: "Merging", move: "Moving", open: "Opening", prepare: "Preparing", query: "Querying", read: "Reading", remove: "Removing", reply: "Replying", request: "Requesting", rerun: "Rerunning", research: "Researching", resolve: "Resolving", respond: "Responding", run: "Running", save: "Saving", schedule: "Scheduling", search: "Searching", send: "Sending", set: "Setting", share: "Sharing", submit: "Submitting", unlock: "Unlocking", unresolve: "Marking", update: "Updating", upload: "Uploading", use: "Using", web: "Fetching",
};
const COMPLETED_VERBS: Record<string, string> = {
  add: "Added", apply: "Applied", archive: "Archived", batch: "Updated", bulk: "Updated", check: "Checked", compare: "Compared", complete: "Completed", convert: "Converted", copy: "Copied", create: "Created", delete: "Deleted", deploy: "Deployed", download: "Downloaded", duplicate: "Duplicated", edit: "Edited", enable: "Enabled", execute: "Updated", export: "Exported", extract: "Extracted", fetch: "Fetched", find: "Found", forward: "Forwarded", generate: "Generated", get: "Got", import: "Imported", invite: "Invited", join: "Joined", label: "Labeled", leave: "Left", list: "Listed", mark: "Marked", merge: "Merged", move: "Moved", open: "Opened", prepare: "Prepared", query: "Queried", read: "Read", remove: "Removed", reply: "Replied", request: "Requested", rerun: "Reran", research: "Researched", resolve: "Resolved", respond: "Responded", run: "Ran", save: "Saved", schedule: "Scheduled", search: "Searched", send: "Sent", set: "Set", share: "Shared", submit: "Submitted", unlock: "Unlocked", unresolve: "Marked", update: "Updated", upload: "Uploaded", use: "Used", web: "Fetched",
};
function registeredAppKey(app?: MatchingApp | null): string | null {
  if (app == null) return null;
  const identities = normalizedAppKeys(app);
  return Object.keys(APP_TOOL_KEYS).find(key => identities.some(identity => identity.includes(key))) ?? null;
}
function registryLabel(app: MatchingApp | null | undefined, toolName: string, completed: boolean | undefined, args: unknown, result: unknown, intl: IntlShape): string | null {
  const appKey = registeredAppKey(app);
  if (appKey == null) return null;
  const toolKey = words(stripAppPrefix(toolName, app)).join("_");
  if (!APP_TOOL_KEYS[appKey].has(toolKey)) return null;
  const status = completed ? "completed" : "active";
  const descriptorToolKey = ACTIVITY_TOOL_ALIASES[appKey]?.[toolKey] ?? toolKey;
  const exactDefault = EXACT_ACTIVITY_MESSAGES[appKey]?.[descriptorToolKey]?.[status];
  const idAppKey = appKey === "google_calendar" ? "googleCalendar" : appKey === "google_drive" ? "googleDrive" : appKey;
  if (exactDefault != null) {
    const context = activityArgumentContext(appKey, descriptorToolKey, args);
    const count = completed ? resultCount(result, appKey) : null;
    if (context != null) return intl.formatMessage({ id: `localConversation.mcpToolActivity.${idAppKey}.${descriptorToolKey}.${status}.withContext`, defaultMessage: `${exactDefault} “{context}”` }, { context });
    if (count != null && /^(list|search|read|batch|get_|query_)/.test(descriptorToolKey)) return intl.formatMessage({ id: `localConversation.mcpToolActivity.${idAppKey}.${descriptorToolKey}.${status}.count`, defaultMessage: `${exactDefault} ({count})` }, { count });
    return intl.formatMessage({ id: `localConversation.mcpToolActivity.${idAppKey}.${descriptorToolKey}.${status}`, defaultMessage: exactDefault });
  }
  const parts = words(toolKey);
  const verb = (completed ? COMPLETED_VERBS : ACTIVE_VERBS)[parts[0]];
  const base = verb == null ? sentence(toolKey) : [verb, ...parts.slice(1)].join(" ");
  const context = approvalContext(app!, args);
  const defaultMessage = context == null ? base : `${base} “${context}”`;
  return intl.formatMessage({ id: `localConversation.mcpToolActivity.${idAppKey}.${toolKey}.${status}`, defaultMessage });
}
function approvalContext(app: MatchingApp, params: unknown): string | null {
  const object = objectArguments(params);
  if (object == null) return null;
  const appKey = normalizedAppKeys(app).find(key => APPROVAL_CONTEXT_KEYS[key] != null);
  if (appKey == null) return null;
  for (const key of APPROVAL_CONTEXT_KEYS[appKey]) {
    const value = object[key];
    if (Array.isArray(value)) {
      const joined = compactString(value.filter(item => typeof item === "string").join(", "));
      if (joined != null) return joined;
    }
    const compact = compactString(value);
    if (compact != null) return compact;
  }
  return null;
}
function compactStringList(value: unknown): string | null {
  return Array.isArray(value) ? compactString(value.filter(item => typeof item === "string").join(", "), 120) : null;
}
function githubApprovalValues(params: unknown): Record<string, unknown> {
  const value = objectArguments(params) ?? {};
  const text = (key: string, alternate?: string): string | null => compactString(value[key] ?? (alternate == null ? null : value[alternate]), 120);
  const assignees = compactStringList(value.assignees);
  const baseBranch = text("base", "base_branch");
  const baseRef = text("base_ref");
  const body = text("body");
  const branch = text("branch");
  const branchName = text("branch_name");
  const comment = text("comment");
  const headBranch = text("head", "head_branch");
  const headRepository = text("head_repo");
  const label = text("label");
  const labels = compactStringList(value.labels);
  const message = text("message");
  const path = text("path");
  const reaction = compactString(typeof value.reaction === "string" ? value.reaction.replaceAll("_", " ") : null, 120);
  const repository = text("repo_full_name", "repository_full_name");
  const review = text("review");
  const reviewers = compactStringList(value.reviewers);
  const teamReviewers = compactStringList(value.team_reviewers);
  const title = text("title");
  const reviewAction = value.action == null ? "other" : ({ APPROVE: "approve", COMMENT: "comment", REQUEST_CHANGES: "requestChanges" } as Record<string, string>)[String(value.action)] ?? "other";
  const reviewerContext = reviewers == null ? (teamReviewers == null ? "none" : "teams") : (teamReviewers == null ? "people" : "peopleAndTeams");
  const pullRequestSourceContext = headRepository == null ? (headBranch == null ? "none" : "branch") : (headBranch == null ? "repository" : "repositoryAndBranch");
  return {
    assignees: assignees ?? "", baseBranch: baseBranch ?? "", baseRef: baseRef ?? "", body: body ?? "",
    bodyChange: value.body == null ? "unset" : body == null ? "clear" : "set", branch: branch ?? "", branchName: branchName ?? "", comment: comment ?? "",
    draft: value.draft === true ? "yes" : "no", force: value.force === true ? "yes" : "no",
    hasAssignees: assignees == null ? "no" : "yes", hasBaseBranch: baseBranch == null ? "no" : "yes", hasBaseRef: baseRef == null ? "no" : "yes",
    hasBranch: branch == null ? "no" : "yes", hasBranchName: branchName == null ? "no" : "yes", hasComment: comment == null ? "no" : "yes",
    hasHeadBranch: headBranch == null ? "no" : "yes", hasIssueNumber: value.issue_number == null ? "no" : "yes", hasLabel: label == null ? "no" : "yes",
    hasLabels: labels == null ? "no" : "yes", hasMergeMethod: value.merge_method == null ? "no" : "yes", hasMilestone: value.milestone == null ? "no" : "yes",
    hasMessage: message == null ? "no" : "yes", hasPath: path == null ? "no" : "yes", hasPullRequestNumber: value.pr_number == null ? "no" : "yes",
    hasReaction: reaction == null ? "no" : "yes", hasRepository: repository == null ? "no" : "yes", hasReview: review == null ? "no" : "yes",
    hasSourceIssueNumber: value.issue == null ? "no" : "yes", hasState: value.state == null ? "no" : "yes", hasTitle: title == null ? "no" : "yes",
    headBranch: headBranch ?? "", headRepository: headRepository ?? "", issueNumber: value.issue_number ?? 0, label: label ?? "", labels: labels ?? "",
    mergeMethod: value.merge_method ?? "other", milestone: value.milestone ?? 0, message: message ?? "", path: path ?? "", pullRequestNumber: value.pr_number ?? 0,
    pullRequestSourceContext, reaction: reaction ?? "", repository: repository ?? "", review: review ?? "", reviewAction, reviewerContext,
    reviewers: reviewers ?? "", sourceIssueNumber: value.issue ?? 0, state: value.state ?? "other", teamReviewers: teamReviewers ?? "", title: title ?? "",
  };
}
function linearApprovalValues(toolKey: string, params: unknown): Record<string, unknown> {
  const value = objectArguments(params) ?? {};
  const readable = (input: unknown, maxLength = 80): string | null => {
    const compact = compactString(input, maxLength);
    return compact == null || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(compact) ? null : compact;
  };
  const action = value.id == null ? "create" : "update";
  const stringChange = (input: unknown): { change: string; value: string } => {
    if (input === null) return { change: "clear", value: "" };
    if (input === undefined) return { change: "unchanged", value: "" };
    const result = readable(input, 200);
    return result == null ? { change: "unchanged", value: "" } : { change: "set", value: result };
  };
  const dateChange = (input: unknown): { change: string; value: number } => {
    if (input === null) return { change: "clear", value: 0 };
    if (typeof input !== "string") return { change: "unchanged", value: 0 };
    const parsed = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(input) ? `${input}T00:00:00` : input);
    return Number.isFinite(parsed) ? { change: "set", value: parsed } : { change: "unchanged", value: 0 };
  };
  const named = (key: string, hasKey: string): Record<string, unknown> => {
    const name = readable(value[key], 200);
    return { action, [hasKey]: name == null ? "no" : "yes", [key]: name ?? "" };
  };
  switch (toolKey) {
    case "create_attachment": { const filename = readable(value.filename, 500); return { filename: filename ?? "", hasFilename: filename == null ? "no" : "yes" }; }
    case "create_issue_label": return named("name", "hasName");
    case "save_customer": return named("name", "hasName");
    case "save_customer_need": { const body = readable(value.body, 10_000); const customer = readable(value.customer, 120); return { action, body: body ?? "", customer: customer ?? "", hasBody: body == null ? "no" : "yes", hasCustomer: customer == null ? "no" : "yes" }; }
    case "save_initiative": { const result = named("name", "hasName"); const target = dateChange(value.targetDate); return { ...result, targetDate: target.value, targetDateChange: target.change }; }
    case "save_issue": { const title = readable(value.title, 200); const project = stringChange(value.project); const assignee = stringChange(value.assignee); return { action, assignee: assignee.value, assigneeChange: assignee.change, hasTitle: title == null ? "no" : "yes", project: project.value, projectChange: project.change, title: title ?? "" }; }
    case "save_milestone": { const name = readable(value.name, 200); const project = readable(value.project, 200); const target = dateChange(value.targetDate); return { action, hasName: name == null ? "no" : "yes", hasProject: project == null ? "no" : "yes", name: name ?? "", project: project ?? "", targetDate: target.value, targetDateChange: target.change }; }
    case "save_project": { const result = named("name", "hasName"); const target = dateChange(value.targetDate); return { ...result, targetDate: target.value, targetDateChange: target.change }; }
    case "save_status_update": { const body = readable(value.body, 10_000); const type = typeof value.type === "string" ? value.type : "unknown"; const target = readable(type === "initiative" ? value.initiative : value.project, 200); return { action, body: body ?? "", hasBody: body == null ? "no" : "yes", hasTarget: target == null ? "no" : "yes", target: target ?? "", type }; }
    default: return {};
  }
}
function getApprovalToolContext({ approval, matchingApp }: { approval: ApprovalInput; matchingApp?: MatchingApp | null }): ApprovalMessage | null {
  const name = approval.tool_name?.trim() || approval.tool_title?.trim();
  if (!name) return null;
  const app = matchingApp ?? { id: approval.connector_id, name: approval.connector_name ?? name.split(".")[0], pluginDisplayNames: [] };
  const action = stripAppPrefix(name, app);
  const identities = normalizedAppKeys(app);
  const appKey = Object.keys(APPROVAL_TOOL_KEYS).find(key => identities.some(identity => identity.includes(key)));
  const toolKey = words(action).join("_");
  if (appKey == null || !APPROVAL_TOOL_KEYS[appKey]?.has(toolKey)) return null;
  const exactDescriptor = EXACT_APPROVAL_MESSAGES[appKey]?.[toolKey];
  if (exactDescriptor != null) return {
    descriptor: exactDescriptor,
    values: appKey === "github" ? githubApprovalValues(approval.tool_params)
      : appKey === "linear" || appKey === "linear_mcp_server" ? linearApprovalValues(toolKey, approval.tool_params)
        : undefined,
  };
  const context = approvalContext(app, approval.tool_params);
  const actionLabel = words(action).join(" ");
  return {
    descriptor: {
      id: `localConversation.mcpToolApproval.${appKey}.${toolKey}`,
      defaultMessage: context == null ? "Allow {appName} to {action}?" : "Allow {appName} to {action} “{context}”?",
      description: "Approval request for an MCP app tool action with optional readable invocation context.",
    },
    values: { action: actionLabel, appName: app.name, ...(context == null ? {} : { context }) },
  };
}
function getFallbackToolLabel({ appContext, matchingApp, toolName }: Pick<ToolActivityInput, "appContext" | "matchingApp" | "toolName">): string { return sentence(stripAppPrefix(appContext?.actionName ?? toolName, matchingApp ?? (appContext == null ? null : { id: appContext.connectorId, name: appContext.appName ?? appContext.connectorId }))); }
function toolFailed(result: unknown, isCodexAppsServer: boolean): boolean {
  const helper = (initialChunk as any).uXt;
  if (typeof helper === "function") return Boolean(helper({ result: result ?? null, isCodexAppsServer }));
  const object = objectArguments(result);
  return object?.type === "error" || object?.success === false || typeof object?.error === "string";
}
function formatToolActivityLabel(input: ToolActivityInput): string {
  const resolvePresentation = (presentationChunk as any).t;
  const formatPresentation = (presentationChunk as any).n;
  if (typeof resolvePresentation === "function" && typeof formatPresentation === "function") {
    const tool = resolvePresentation({ appContext: input.appContext, matchingApp: input.matchingApp, serverName: input.serverName, toolName: input.toolName });
    if (tool != null) {
      const descriptor = formatPresentation({
        tool,
        arguments: input.toolArguments,
        completed: input.completed,
        failed: toolFailed(input.toolResult, input.serverName === "codex_apps"),
        result: input.toolResult,
      });
      if (descriptor != null) return input.intl.formatMessage(descriptor.message, descriptor.values);
    }
  }
  const args = input.toolArguments;
  if (words(input.toolName).join("_") === "js" && args != null && typeof args === "object" && "title" in args && typeof args.title === "string") { const title = args.title.trim().replace(/\s+/g, " "); if (title) return title.length <= 80 ? title : `${title.slice(0, 79).trimEnd()}…`; }
  const matchingApp = input.matchingApp ?? (input.appContext == null ? null : { id: input.appContext.connectorId, name: input.appContext.appName ?? input.appContext.connectorId, pluginDisplayNames: [] });
  const fallback = input.source?.kind === "browserUse"
    ? input.source.backend === "chrome" ? "Used Chrome" : "Used the browser"
    : getFallbackToolLabel({ ...input, matchingApp });
  if (matchingApp == null && words(input.appContext?.actionName ?? input.toolName).join("_") === "browser_run_code_unsafe") {
    return input.intl.formatMessage({ id: `localConversation.mcpToolActivity.browser.run_code_unsafe.${input.completed ? "completed" : "active"}`, defaultMessage: input.completed ? "Ran JavaScript" : "Running JavaScript" });
  }
  if (input.serverName === "computer-use" && typeof (initialChunk as any).Orn === "function") {
    const computerUseLabel = (initialChunk as any).Orn({
      completed: input.completed,
      intl: input.intl,
      matchingApp,
      nativeDesktopAppMetadata: input.nativeDesktopAppMetadata ?? null,
      platform: input.platform ?? "macOS",
      toolArguments: input.toolArguments,
      toolKey: words(stripAppPrefix(input.appContext?.actionName ?? input.toolName, matchingApp)).join("_"),
      toolResult: input.toolResult ?? null,
    });
    return computerUseLabel ?? fallback;
  }
  return registryLabel(matchingApp, input.appContext?.actionName ?? input.toolName, input.completed, input.toolArguments, input.toolResult, input.intl) ?? fallback;
}
let initialized = false;
function initializeMcpToolActivityLabels(): void {
  if (initialized) return;
  initialized = true;
  for (const dependency of [(initialChunk as any).Vrn, (sharedChunk as any).g4, (presentationChunk as any).a,
    (initialChunk as any).krn, (initialChunk as any).lXt, (sharedChunk as any).K2]) {
    if (typeof dependency === "function") dependency();
  }
}
export { initializeMcpToolActivityLabels as i, getApprovalToolContext as n, getFallbackToolLabel as r, formatToolActivityLabel as t };
