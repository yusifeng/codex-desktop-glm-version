// Compatibility surface for the three operation/disposal handles used by the
// app-server manager (original q_e/Lv/Rv).  The semantic implementations live
// in their focused modules; this file preserves the original compressed exports.

export { DisposableHandle, DisposableHandle as q_e } from "../requests/elicitation-auto-approve";
export {
  AppServerOperationHandle,
  AppServerOperationHandle as Lv,
  CancellableOperationHandle as LoginOperationHandle,
  CancellableOperationHandle as Rv,
} from "../app-server/operation-handle";
