// production appcast 状态持久化：目录下 production-appcast-bootstrap.json 的
// 读写（installationId / backendAppcastEnabled）。写走原子路径
// （随机临时文件 + rename，失败清理临时文件）。
// 对应 bootstrap-C4dRql4x.ts 3884-3930 行（qt/Jt/Yt）。
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { memoizedTaggedLogger } from "@chunk/logger";
import { gf as booleanSchema, wf as objectSchema, Pf as uuidSchema } from "@chunk/shared";

/** 状态文件名（原 qt）。 */
const STATE_FILENAME = "production-appcast-bootstrap.json";

export interface ProductionAppcastStateData {
  backendAppcastEnabled?: boolean;
  installationId?: string;
}

/** 状态文件 schema（原 Jt）。 */
const stateSchema: any = objectSchema({
  backendAppcastEnabled: booleanSchema().optional(),
  installationId: uuidSchema().optional(),
});

/**
 * production appcast 状态存储（原 Yt）。构造时同步读取状态文件
 * （不存在或损坏时回退到空状态并记 warning）。
 */
export class ProductionAppcastState {
  private logger = memoizedTaggedLogger("production-appcast-state");
  private filePath: string;
  private state: ProductionAppcastStateData;

  /** @param directory 状态文件所在目录（如 appData/<bundleId>）。 */
  constructor(directory: string) {
    this.filePath = join(directory, STATE_FILENAME);
    this.state = this.readState();
  }

  get backendAppcastEnabled(): boolean {
    return this.state.backendAppcastEnabled === true;
  }

  /** 取 installationId；没有则生成一个并持久化。 */
  getOrCreateInstallationId(): string {
    if (this.state.installationId == null) {
      this.state.installationId = randomUUID();
      this.persistState();
    }
    return this.state.installationId;
  }

  setBackendAppcastEnabled(enabled: boolean): void {
    this.state.backendAppcastEnabled = enabled;
    this.persistState();
  }

  private readState(): ProductionAppcastStateData {
    if (!existsSync(this.filePath)) return {};
    try {
      return stateSchema.parse(JSON.parse(readFileSync(this.filePath, "utf8")));
    } catch (error) {
      this.logger().warning("Failed to read production appcast state", {
        safe: {},
        sensitive: { error },
      });
      return {};
    }
  }

  private persistState(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.${randomUUID()}.tmp`;
    try {
      writeFileSync(tempPath, JSON.stringify(this.state), "utf8");
      renameSync(tempPath, this.filePath);
    } catch (error) {
      rmSync(tempPath, { force: true });
      throw error;
    }
  }
}
