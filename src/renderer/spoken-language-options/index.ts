// Localized spoken-language options. Release chunk: spoken-language-options-a8b38a93da0c.js.
import "@rchunk/rolldown-runtime";

interface IntlShape {
  locale: string;
  formatMessage(descriptor: {
    id: string;
    defaultMessage: string;
    description: string;
  }): string;
}
interface LanguageOption {
  label: string;
  value: string;
}
let languageCodes: string[];

function languageLabel(
  languageCode: string,
  intl: IntlShape,
  displayNames = new Intl.DisplayNames([intl.locale], { type: "language" }),
): string {
  return (
    {
      auto: intl.formatMessage({
        id: "settings.chatGpt.voice.language.auto",
        defaultMessage: "Auto-detect",
        description: "Automatic ChatGPT voice language option",
      }),
      yue: intl.formatMessage({
        id: "settings.chatGpt.voice.language.cantonese",
        defaultMessage: "Cantonese (Traditional Chinese)",
        description: "Cantonese ChatGPT voice language option",
      }),
      zh: intl.formatMessage({
        id: "settings.chatGpt.voice.language.mandarin",
        defaultMessage: "Mandarin Chinese",
        description: "Mandarin Chinese ChatGPT voice language option",
      }),
      "zh-cn": intl.formatMessage({
        id: "settings.chatGpt.voice.language.simplifiedChinese",
        defaultMessage: "Simplified Chinese",
        description: "Simplified Chinese ChatGPT voice language option",
      }),
      "zh-hk": intl.formatMessage({
        id: "settings.chatGpt.voice.language.traditionalChineseHongKong",
        defaultMessage: "Traditional Chinese (Hong Kong)",
        description:
          "Traditional Chinese Hong Kong ChatGPT voice language option",
      }),
      "zh-tw": intl.formatMessage({
        id: "settings.chatGpt.voice.language.traditionalChineseTaiwan",
        defaultMessage: "Traditional Chinese (Taiwan)",
        description: "Traditional Chinese Taiwan ChatGPT voice language option",
      }),
    }[languageCode] ??
    displayNames.of(languageCode) ??
    languageCode
  );
}

function spokenLanguageOptions(intl: IntlShape): LanguageOption[] {
  const displayNames = new Intl.DisplayNames([intl.locale], {
    type: "language",
  });
  const collator = new Intl.Collator(intl.locale, { sensitivity: "base" });
  const labels = new Set<string>();
  return languageCodes
    .flatMap((value) => {
      const label = languageLabel(value, intl, displayNames);
      if (labels.has(label)) return [];
      labels.add(label);
      return [{ label, value }];
    })
    .sort(
      (left, right) =>
        Number(left.value !== "auto") - Number(right.value !== "auto") ||
        collator.compare(left.label, right.label),
    );
}

function initialize(): void {
  languageCodes =
    "auto.en.es.pt.fr.de.ja.id.ru.it.tr.ar.hi.ko.nl.pl.vi.uk.sv.da.nb.no.th.ro.ms.bn.mr.ta.te.gu.ur.ml.kn.sw.zh.af.hy.az.be.bs.bg.ca.hr.cs.et.fi.gl.ka.el.he.hu.is.kk.lv.lt.mk.mi.ne.fa.sr.sk.sl.tl.cy.amh.mya.yue.fil.gle.mon.som.zh-cn.zh-tw.zh-hk".split(
      ".",
    );
}

export { spokenLanguageOptions as n, initialize as r, languageLabel as t };
