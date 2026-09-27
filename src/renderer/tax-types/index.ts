import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

const jsxRuntime = getJsxRuntime();
export interface TaxType { country: string; description: string; placeholder?: string; region: string; stripe_type: string; supported: boolean; type: string }
export interface TaxIdentifier { country?: string; country_specific_type?: string; type: string; value: string }
export interface ControlledTextValue { onChange(value: string): void; value: string }
export interface TaxTypeEditorProps { available: TaxType[]; businessName?: ControlledTextValue | null; disabled?: boolean; enabled: boolean; onChange(value: TaxIdentifier): void; onEnabledChange(enabled: boolean): void; selected?: TaxType | null; showErrors?: boolean; taxId?: TaxIdentifier | null }

const taxTypeLabel = (type: string): string => { switch (type) { case "ca_gst_hst": return "CA GST/HST"; case "ca_pst_bc": return "CA PST-BC"; case "ca_pst_mb": return "CA PST-MB"; case "ca_pst_sk": return "CA PST-SK"; default: return type.replace("_", " ").toUpperCase(); } };
const compareTaxTypes = (left: TaxType, right: TaxType): number => taxTypeLabel(left.type).localeCompare(taxTypeLabel(right.type));
function TaxTypeEditor({ available, businessName, disabled, enabled, onChange, onEnabledChange, selected, showErrors, taxId }: TaxTypeEditorProps): unknown {
  const fallback = available[0]; if (!fallback) return null;
  const active = selected ?? fallback, missingBusinessName = Boolean(showErrors && businessName && !businessName.value.trim()), missingTaxId = Boolean(showErrors && !taxId?.value.trim());
  return jsxRuntime.jsxs("div", { className: "flex flex-col gap-3", children: [jsxRuntime.jsxs("label", { children: [jsxRuntime.jsx("input", { type: "checkbox", checked: enabled, disabled, onChange: (event: { target: { checked: boolean } }) => onEnabledChange(event.target.checked) }), "Add tax ID"] }), enabled ? jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [businessName == null ? null : jsxRuntime.jsxs("label", { children: ["Business name", jsxRuntime.jsx("input", { disabled, value: businessName.value, "aria-invalid": missingBusinessName, onChange: (event: { target: { value: string } }) => businessName.onChange(event.target.value) })] }), jsxRuntime.jsx("select", { disabled, value: active.type, onChange: (event: { target: { value: string } }) => { const next = available.find(item => item.type === event.target.value) ?? fallback; onChange({ type: next.stripe_type, country: next.country, country_specific_type: next.type, value: taxId?.value ?? "" }); }, children: [...available].sort(compareTaxTypes).map(item => jsxRuntime.jsx("option", { value: item.type, children: taxTypeLabel(item.type) }, item.type)) }), jsxRuntime.jsx("input", { disabled, value: taxId?.value ?? "", placeholder: active.placeholder ?? "Tax ID", "aria-invalid": missingTaxId, onChange: (event: { target: { value: string } }) => onChange({ type: active.stripe_type, country: active.country, country_specific_type: active.type, value: event.target.value }) })] }) : null] });
}
const supportedTaxCountries = new Set("AE.AM.AT.AU.AZ.BD.BE.BG.BH.CA.CH.CL.CY.CZ.DE.DK.EE.EG.ES.FI.FR.GB.GE.GR.HR.HU.ID.IE.IN.IS.IT.KE.KG.KH.KR.KZ.LI.LT.LU.LV.MA.MD.MT.NG.NL.NO.NZ.PE.PH.PL.PT.RO.SA.SE.SG.SI.SK.TH.TR.TW.TZ.UA.UG.UZ.ZA".split("."));
const isSupportedTaxCountry = (country: string): boolean => supportedTaxCountries.has(country);
function supportedTaxTypesForCountry(country: string, value: unknown): TaxType[] { if (!isSupportedTaxCountry(country) || value == null || typeof value !== "object") return []; const entries = Object.values(value as Record<string, unknown>).filter((entry): entry is TaxType => entry != null && typeof entry === "object" && typeof (entry as TaxType).country === "string" && typeof (entry as TaxType).region === "string" && typeof (entry as TaxType).supported === "boolean"); const regions = new Set(entries.filter(entry => entry.country === country && entry.supported).map(entry => entry.region)); return entries.filter(entry => regions.has(entry.region) && entry.supported); }
function selectTaxType(available: TaxType[], current: Partial<TaxIdentifier> | null | undefined, country: string): TaxType | undefined { return (current == null ? undefined : available.find(item => item.type === current.country_specific_type) ?? available.find(item => item.stripe_type === current.type && item.country === (current.country ?? country))) ?? available.find(item => item.country === country) ?? available[0]; }
function initializeTaxTypeEditor(): void {}
function initializeTaxTypeSchema(): void {}
export { initializeTaxTypeEditor as a, TaxTypeEditor as i, supportedTaxTypesForCountry as n, initializeTaxTypeSchema as r, selectTaxType as t };
