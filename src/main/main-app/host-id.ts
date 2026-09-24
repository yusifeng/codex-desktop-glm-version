// 本地 host 的固定标识。app-server 连接注册表以此为主键。
// （原 main-C-Mhak1n.ts 8,574 `var J = 'local'`——被 desktop-fetch/account-inputs
// 等多个子系统消费，提升为独立常量模块。）
export const LOCAL_HOST_ID = "local";
