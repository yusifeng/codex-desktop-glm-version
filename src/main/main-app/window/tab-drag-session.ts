type Point = { x: number; y: number };

type LoadPayload = {
  grabOffset: Point;
  size: { height: number; width: number };
  [key: string]: unknown;
};

type OwnerWindow = {
  getContentBounds(): { x: number; y: number };
  getContentSize(): [number, number];
  isDestroyed(): boolean;
};

type Presentation = {
  [Symbol.dispose](): void;
  freeze(point: Point): boolean;
  load(payload: LoadPayload): Promise<boolean>;
  ready(): Promise<boolean>;
  show(): Promise<boolean>;
  updateCue(cue: unknown): Promise<boolean>;
};

export type TabDragSessionDependencies = {
  owner: OwnerWindow;
  parseCue(value: unknown): unknown | undefined;
  parseLoad(value: unknown): LoadPayload | undefined;
  parsePoint(value: unknown): Point | undefined;
  presentation: Presentation;
};

/** Owns a validated tab-drag RPC session and the lifetime of its presentation window. */
export class TabDragSession {
  private readonly dependencies: TabDragSessionDependencies;
  private disposed = false;
  private loadStarted = false;

  constructor(dependencies: TabDragSessionDependencies) {
    this.dependencies = dependencies;
  }

  async ready(): Promise<boolean> {
    return (await this.dependencies.presentation.ready()) && !this.disposed;
  }

  async updateCue(value: unknown): Promise<boolean> {
    if (this.disposed) return false;
    const cue = this.dependencies.parseCue(value);
    if (cue === undefined) {
      this[Symbol.dispose]();
      return false;
    }
    return this.dependencies.presentation.updateCue(cue);
  }

  async load(value: unknown): Promise<boolean> {
    if (this.disposed || this.loadStarted) return false;
    this.loadStarted = true;
    if (!(await this.dependencies.presentation.ready()) || this.disposed) return false;

    const payload = this.parseBoundedLoad(value);
    if (payload == null) {
      this[Symbol.dispose]();
      return false;
    }
    try {
      if (!(await this.dependencies.presentation.load(payload)) || this.disposed) {
        this[Symbol.dispose]();
        return false;
      }
      return true;
    } catch {
      this[Symbol.dispose]();
      return false;
    }
  }

  async show(): Promise<boolean> {
    return !this.disposed && this.dependencies.presentation.show();
  }

  freeze(value: unknown): boolean {
    if (this.disposed) return false;
    const point = this.dependencies.parsePoint(value);
    if (point === undefined || this.dependencies.owner.isDestroyed()) {
      this[Symbol.dispose]();
      return false;
    }
    const bounds = this.dependencies.owner.getContentBounds();
    return this.dependencies.presentation.freeze({ x: bounds.x + point.x, y: bounds.y + point.y });
  }

  [Symbol.dispose](): void {
    if (this.disposed) return;
    this.disposed = true;
    this.dependencies.presentation[Symbol.dispose]();
  }

  private parseBoundedLoad(value: unknown): LoadPayload | undefined {
    const payload = this.dependencies.parseLoad(value);
    if (payload === undefined) return undefined;
    const [width, height] = this.dependencies.owner.getContentSize();
    const { size, grabOffset } = payload;
    if (
      size.width > width ||
      size.height > height ||
      Math.abs(grabOffset.x) > width ||
      Math.abs(grabOffset.y) > height
    ) {
      return undefined;
    }
    return payload;
  }
}

if (typeof module !== "undefined") module.exports = { TabDragSession };
