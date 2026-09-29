// ABO/Rh transfusion compatibility specification. Release chunk: type-99cca3d49ce0.js.
import "@rchunk/rolldown-runtime";

type BloodType = "O-" | "O+" | "A-" | "A+" | "B-" | "B+" | "AB-" | "AB+";
interface BloodTypeParameter {
  kind: "enum";
  defaultValue: BloodType;
  allowedValues: BloodType[];
}
interface Specification {
  type: "ABO_RH_TRANSFUSION_COMPATIBILITY";
  version: 1;
  thumbnailAssetKey: "abo-rh-transfusion-compatibility-v1";
  parameters: {
    donorType: BloodTypeParameter;
    recipientType: BloodTypeParameter;
  };
}
const bloodTypes: BloodType[] = [
  "O-",
  "O+",
  "A-",
  "A+",
  "B-",
  "B+",
  "AB-",
  "AB+",
];
let specification: Specification;
function initializeSpecification(): void {
  specification ??= {
    type: "ABO_RH_TRANSFUSION_COMPATIBILITY",
    version: 1,
    thumbnailAssetKey: "abo-rh-transfusion-compatibility-v1",
    parameters: {
      donorType: {
        kind: "enum",
        defaultValue: "A+",
        allowedValues: [...bloodTypes],
      },
      recipientType: {
        kind: "enum",
        defaultValue: "B-",
        allowedValues: [...bloodTypes],
      },
    },
  };
}
export { specification as n, initializeSpecification as t };
