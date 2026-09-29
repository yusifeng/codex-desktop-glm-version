// Newton's third-law learning model: normalize and index the contact-force example.
import "@rchunk/rolldown-runtime";

type ContactExample = "boxOnTable" | "collidingBalls" | "pushingBox";
interface ContactExampleValues { example?: string | null }

const defaultContactExample: ContactExample = "pushingBox";

function normalizeContactExample(values: ContactExampleValues): { example: ContactExample } {
  switch (values.example) {
    case "pushingBox":
    case "collidingBalls":
    case "boxOnTable":
      return { example: values.example };
    default:
      return { example: defaultContactExample };
  }
}

function contactExampleToIndex(example: ContactExample): number {
  switch (example) {
    case "pushingBox": return 0;
    case "collidingBalls": return 1;
    case "boxOnTable": return 2;
  }
}

function contactExampleFromIndex(index: number): ContactExample {
  switch (index) {
    case 1: return "collidingBalls";
    case 2: return "boxOnTable";
    default: return "pushingBox";
  }
}

function initializeNewtonsThirdLawModel(): void {}

export {
  normalizeContactExample as a,
  initializeNewtonsThirdLawModel as i,
  contactExampleFromIndex as n,
  contactExampleToIndex as r,
  defaultContactExample as t,
};
