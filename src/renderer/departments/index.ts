import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import { rJt as chatGptApi } from "@rchunk/app-initial";

interface DepartmentIdentity { accountId: string; userId: string }
interface DepartmentScope { currentIdentity?(): DepartmentIdentity | null; invalidate?(queryKey: readonly unknown[]): Promise<unknown> | unknown; setOnboardingData?(identity: DepartmentIdentity, data: DepartmentOnboarding): void }
interface DepartmentOnboarding { departments: string[]; role: string; [key: string]: unknown }
const a = "oai/apps/hasSeenOnboarding";
const medicalDepartments = "allergy_immunology.anesthesiology.cardiology.critical_care.dermatology.emergency_medicine.endocrinology.family_medicine_primary_care.geriatric_medicine.gastroenterology.general_surgery.hematology.infectious_disease.internal_medicine.interventional_radiology.oral_maxillofacial_surgery.medical_genetics_genomics.oncology_hematology.nuclear_medicine.nephrology.neurology.neurosurgery.obstetrics_gynecology.occupational_environmental_medicine.osteopathic_neuromusculoskeletal_medicine.ophthalmology.orthopedic_surgery.otolaryngology.pathology_laboratory_medicine.pediatrics.physical_medicine_rehabilitation.plastic_surgery.pulmonology.preventive_medicine.psychiatry_behavioral_health.radiology_imaging.rheumatology.radiation_oncology.thoracic_surgery.urology.vascular_surgery".split(".");
const t: Record<string, string[]> = {
  physician: medicalDepartments,
  np_pa: medicalDepartments,
  registered_nurse: ["bedside_rn", "icu_rn", "outpatient_clinic_rn", "nurse_manager_charge_nurse", "clinical_nurse_specialist", "case_management_care_coordination"],
  allied_health_professional: ["physical_therapist", "occupational_therapist", "speech_language_pathologist", "respiratory_therapist_role", "pharmacist_role", "psychologist", "dietitian", "social_worker", "medical_assistant", "imaging_radiology_tech", "lab_path_tech", "cardiac_neuro_tech"],
  student: ["undergraduate_student", "medical_student", "np_pa_student", "nursing_student", "allied_health_student", "graduate_student"],
};
function assertIdentity(scope: DepartmentScope, identity: DepartmentIdentity): void { const current = scope.currentIdentity?.(); if (current != null && (current.accountId !== identity.accountId || current.userId !== identity.userId)) throw new DOMException("Workspace settings changed", "AbortError"); }
async function s(scope: DepartmentScope, identity: DepartmentIdentity, onboarding: DepartmentOnboarding, systemMessage?: Record<string, unknown> | null, signal?: AbortSignal): Promise<void> {
  assertIdentity(scope, identity); signal?.throwIfAborted();
  await chatGptApi.safePatch(`/accounts/{account_id}/users/{user_id}`, { parameters: { path: { account_id: identity.accountId, user_id: identity.userId } }, requestBody: { onboarding_information: onboarding }, additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, signal });
  if (systemMessage != null) await chatGptApi.safePatch("/user_system_messages", { requestBody: systemMessage, additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, signal });
  assertIdentity(scope, identity); scope.setOnboardingData?.(identity, onboarding);
  await Promise.all([scope.invalidate?.(["quorum-starter-prompts", identity.accountId, identity.userId]), scope.invalidate?.(["chatgpt-user-system-message", identity.accountId])]);
}
function o(scope: DepartmentScope, identity: DepartmentIdentity, signal?: AbortSignal): Promise<void> { return s(scope, identity, { role: "", departments: [] }, { role_user_message: "", other_user_message: "" }, signal); }
async function r(scope: DepartmentScope, identity: DepartmentIdentity, signal?: AbortSignal): Promise<void> { assertIdentity(scope, identity); await chatGptApi.safePost("/settings/announcement_viewed", { parameters: { query: { announcement_id: a } }, additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, signal }); assertIdentity(scope, identity); }
const i = { getOptions(identity: DepartmentIdentity) { return { queryKey: ["health-onboarding-info", identity.accountId, identity.userId], queryFn: ({ signal }: { signal?: AbortSignal }) => chatGptApi.safeGet<DepartmentOnboarding>(`/accounts/{account_id}/users/{user_id}/onboarding_information`, { parameters: { path: { account_id: identity.accountId, user_id: identity.userId } }, additionalHeaders: { "ChatGPT-Account-ID": identity.accountId }, signal }), retry: false, staleTime: 60_000 }; } };
function n(): void {}
export { a, i, n, o, r, s, t };
