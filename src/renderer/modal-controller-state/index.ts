import { FX as initializeSignalRuntime } from "@rchunk/app-shared";
import {
  Bzt as hasAnyModalOpen,
  Gzt as useHasAnyModalOpen,
  Hzt as isModalOpen,
  Kzt as useIsModalOpen,
  Rzt as closeAllModals,
  Uzt as openModal,
  Vzt as initializeModalController,
  Wzt as setModalBlocking,
  qzt as useModalState,
  zzt as closeModal,
} from "@rchunk/app-initial";

initializeSignalRuntime();
initializeModalController();

export {
  closeAllModals,
  closeModal,
  hasAnyModalOpen as hasAnyModalOpen$,
  isModalOpen,
  openModal,
  setModalBlocking,
  useHasAnyModalOpen,
  useIsModalOpen,
  useModalState,
};
