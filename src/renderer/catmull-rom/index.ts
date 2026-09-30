// Cardinal and Catmull–Rom curve factories. Release chunk: catmullRom-b244076d0269.js.
import "@rchunk/rolldown-runtime";
import * as mathChunk from "@rchunk/math-lazy-runtime";

interface CurveContext {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bezierCurveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number,
  ): void;
  closePath(): void;
}
interface CardinalFactory {
  (context: CurveContext): CardinalCurve;
  tension(value: number): CardinalFactory;
}
interface CatmullFactory {
  (context: CurveContext): CardinalCurve | CatmullRomCurve;
  alpha(value: number): CatmullFactory;
}

function cardinalPoint(curve: CardinalCurve, x: number, y: number): void {
  curve._context.bezierCurveTo(
    curve._x1 + curve._k * (curve._x2 - curve._x0),
    curve._y1 + curve._k * (curve._y2 - curve._y0),
    curve._x2 + curve._k * (curve._x1 - x),
    curve._y2 + curve._k * (curve._y1 - y),
    curve._x2,
    curve._y2,
  );
}
class CardinalCurve {
  _line = Number.NaN;
  _point = 0;
  _x0 = Number.NaN;
  _x1 = Number.NaN;
  _x2 = Number.NaN;
  _y0 = Number.NaN;
  _y1 = Number.NaN;
  _y2 = Number.NaN;
  readonly _k: number;
  constructor(
    readonly _context: CurveContext,
    tension: number,
  ) {
    this._k = (1 - tension) / 6;
  }
  areaStart(): void {
    this._line = 0;
  }
  areaEnd(): void {
    this._line = Number.NaN;
  }
  lineStart(): void {
    this._x0 =
      this._x1 =
      this._x2 =
      this._y0 =
      this._y1 =
      this._y2 =
        Number.NaN;
    this._point = 0;
  }
  lineEnd(): void {
    if (this._point === 2) this._context.lineTo(this._x2, this._y2);
    else if (this._point === 3) cardinalPoint(this, this._x1, this._y1);
    if (this._line || (this._line !== 0 && this._point === 1))
      this._context.closePath();
    this._line = 1 - this._line;
  }
  point(x: number, y: number): void {
    x = +x;
    y = +y;
    if (this._point === 0) {
      this._point = 1;
      if (this._line) this._context.lineTo(x, y);
      else this._context.moveTo(x, y);
    } else if (this._point === 1) {
      this._point = 2;
      this._x1 = x;
      this._y1 = y;
    } else {
      if (this._point === 2) this._point = 3;
      cardinalPoint(this, x, y);
    }
    this._x0 = this._x1;
    this._x1 = this._x2;
    this._x2 = x;
    this._y0 = this._y1;
    this._y1 = this._y2;
    this._y2 = y;
  }
}

function catmullPoint(curve: CatmullRomCurve, x: number, y: number): void {
  let x1 = curve._x1;
  let y1 = curve._y1;
  let x2 = curve._x2;
  let y2 = curve._y2;
  if (curve._l01_a > 1e-12) {
    const a =
      2 * curve._l01_2a + 3 * curve._l01_a * curve._l12_a + curve._l12_2a;
    const b = 3 * curve._l01_a * (curve._l01_a + curve._l12_a);
    x1 = (x1 * a - curve._x0 * curve._l12_2a + curve._x2 * curve._l01_2a) / b;
    y1 = (y1 * a - curve._y0 * curve._l12_2a + curve._y2 * curve._l01_2a) / b;
  }
  if (curve._l23_a > 1e-12) {
    const a =
      2 * curve._l23_2a + 3 * curve._l23_a * curve._l12_a + curve._l12_2a;
    const b = 3 * curve._l23_a * (curve._l23_a + curve._l12_a);
    x2 = (x2 * a + curve._x1 * curve._l23_2a - x * curve._l12_2a) / b;
    y2 = (y2 * a + curve._y1 * curve._l23_2a - y * curve._l12_2a) / b;
  }
  curve._context.bezierCurveTo(x1, y1, x2, y2, curve._x2, curve._y2);
}
class CatmullRomCurve {
  _line = Number.NaN;
  _point = 0;
  _x0 = Number.NaN;
  _x1 = Number.NaN;
  _x2 = Number.NaN;
  _y0 = Number.NaN;
  _y1 = Number.NaN;
  _y2 = Number.NaN;
  _l01_a = 0;
  _l12_a = 0;
  _l23_a = 0;
  _l01_2a = 0;
  _l12_2a = 0;
  _l23_2a = 0;
  constructor(
    readonly _context: CurveContext,
    readonly _alpha: number,
  ) {}
  areaStart(): void {
    this._line = 0;
  }
  areaEnd(): void {
    this._line = Number.NaN;
  }
  lineStart(): void {
    this._x0 =
      this._x1 =
      this._x2 =
      this._y0 =
      this._y1 =
      this._y2 =
        Number.NaN;
    this._l01_a =
      this._l12_a =
      this._l23_a =
      this._l01_2a =
      this._l12_2a =
      this._l23_2a =
      this._point =
        0;
  }
  lineEnd(): void {
    if (this._point === 2) this._context.lineTo(this._x2, this._y2);
    else if (this._point === 3) this.point(this._x2, this._y2);
    if (this._line || (this._line !== 0 && this._point === 1))
      this._context.closePath();
    this._line = 1 - this._line;
  }
  point(x: number, y: number): void {
    x = +x;
    y = +y;
    if (this._point) {
      const dx = this._x2 - x;
      const dy = this._y2 - y;
      this._l23_a = Math.sqrt(
        (this._l23_2a = (dx * dx + dy * dy) ** this._alpha),
      );
    }
    if (this._point === 0) {
      this._point = 1;
      if (this._line) this._context.lineTo(x, y);
      else this._context.moveTo(x, y);
    } else if (this._point === 1) this._point = 2;
    else {
      if (this._point === 2) this._point = 3;
      catmullPoint(this, x, y);
    }
    this._l01_a = this._l12_a;
    this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a;
    this._l12_2a = this._l23_2a;
    this._x0 = this._x1;
    this._x1 = this._x2;
    this._x2 = x;
    this._y0 = this._y1;
    this._y1 = this._y2;
    this._y2 = y;
  }
}

let cardinal: CardinalFactory;
let catmullRom: CatmullFactory;
function initializeCardinal(): void {
  const factory = (tension: number): CardinalFactory => {
    const create = ((context: CurveContext) =>
      new CardinalCurve(context, tension)) as CardinalFactory;
    create.tension = (value) => factory(+value);
    return create;
  };
  cardinal = factory(0);
}
function initializeCatmullRom(): void {
  const init = (mathChunk as unknown as { c?: () => void }).c;
  init?.();
  initializeCardinal();
  const factory = (alpha: number): CatmullFactory => {
    const create = ((context: CurveContext) =>
      alpha
        ? new CatmullRomCurve(context, alpha)
        : new CardinalCurve(context, 0)) as CatmullFactory;
    create.alpha = (value) => factory(+value);
    return create;
  };
  catmullRom = factory(0.5);
}

export {
  initializeCardinal as a,
  cardinal as i,
  initializeCatmullRom as n,
  cardinalPoint as o,
  catmullPoint as r,
  catmullRom as t,
};
