// Ionic-versus-covalent bond selector metadata. Release chunk: type-3d72495926ec.js.
import "@rchunk/rolldown-runtime";

type BondType = "ionic" | "covalent";
interface IonicVsCovalentSpecification {
  type: "IONIC_VS_COVALENT";
  version: 1;
  parameters: {
    bondType: {
      kind: "enum";
      defaultValue: BondType;
      allowedValues: BondType[];
    };
  };
}

let ionicVsCovalentSpecification: IonicVsCovalentSpecification;
let initialized = false;
function initializeIonicVsCovalentSpecification(): void {
  if (initialized) return;
  initialized = true;
  ionicVsCovalentSpecification = {
    type: "IONIC_VS_COVALENT",
    version: 1,
    parameters: {
      bondType: {
        kind: "enum",
        defaultValue: "ionic",
        allowedValues: ["ionic", "covalent"],
      },
    },
  };
}

export {
  ionicVsCovalentSpecification as n,
  initializeIonicVsCovalentSpecification as t,
};
