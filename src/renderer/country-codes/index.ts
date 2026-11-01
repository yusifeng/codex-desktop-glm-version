import "@rchunk/rolldown-runtime";

let supportedCountryCodes: Set<string>;
function initializeCountryCodes(): void {
  supportedCountryCodes = new Set(
    "AT.BE.BG.HR.CY.CZ.DK.EE.FI.FR.DE.GR.HU.IS.IE.IT.LI.LT.LU.LV.MT.NL.NO.PL.PT.RO.SK.SI.ES.SE.GB.CH.AX.PF.RS.ME.XK.MC.SM.AD.VA".split(
      ".",
    ),
  );
}
export { initializeCountryCodes as n, supportedCountryCodes as t };
