// 尚未逆向重写的 chunk 的类型声明。
//
// 源码里写作 `import ... from "@chunk/<语义名>"` 的导入由 scripts/chunk-manifest.mjs
// 映射为对输出 chunk（app/.vite/build/<文件名>）的运行时 require。已重写的 chunk
// 直接声明其命名导出；未重写的 chunk 仍以发布版的单字母导出名提供（语义见注释），
// 导入时用 `import { t as createDesktopLogArchive } from "@chunk/main"` 的方式重命名。

declare module "@chunk/desktop-open-path-queue" {
  export type OpenFilesHandler = (paths: string[]) => void;

  /** 取走所有排队的 open-url 链接（标记 URL 队列已就绪）。 */
  export function takePendingUrls(): string[];
  /** 设置文件处理器并取走排队文件；handler 为空或已设置时无操作。 */
  export function setOpenFilesHandler(handler: OpenFilesHandler): string[];
  /** 文件路径入队（有 handler 时直接回调）。 */
  export function enqueueOpenFiles(paths: string[]): boolean;
  /** 注册 open-file / open-url 早期监听（返回反注册函数）。 */
  export function installEarlyOpenPathListeners(enabled: boolean): () => void;
  /** 释放文件处理器。 */
  export function releaseOpenFilesHandler(handler: OpenFilesHandler): void;
}

declare module "@chunk/logger" {
  export interface LogTags {
    safe: Record<string, unknown>;
    sensitive: Record<string, unknown>;
  }
  export type LogLevel = "trace" | "debug" | "info" | "warning" | "error";
  export interface Logger {
    trace(message: string, tags?: LogTags): void;
    debug(message: string, tags?: LogTags): void;
    info(message: string, tags?: LogTags): void;
    warning(message: string, tags?: LogTags): void;
    error(message: string, tags?: LogTags): void;
    log(level: LogLevel, message: string, tags?: LogTags): void;
    dispose?(): void;
  }
  export function setLogger(logger: Logger): void;
  export function getLogger(): Logger;
  export function createTaggedLogger(tag: string): Logger;
  export function memoizedTaggedLogger(tag: string): () => Logger;
  export function createElapsedTimestampLogger(tag: string): Logger;
  export function formatLogTags(tags: Record<string, unknown>): string;
}

declare module "@chunk/shared" {
  // src-DldfpmrL.js —— 主进程共享库（尚未逆向重写）。
  // 692 个导出按发布版的压缩名提供；类型暂为 any，注释标注内部符号名。
  // 已识别语义的导出给了精确类型。shared 重写后本声明会逐步语义化并最终移除。
  export interface Schema<T = any> {
    safeParse(input: unknown): { success: boolean; data: T };
  }
  export interface NumberSchema<T = any> extends Schema<T> {
    positive(): NumberSchema<T>;
    min(n: number): NumberSchema<T>;
    max(n: number): NumberSchema<T>;
  }
  export interface ArraySchema<T = any> extends Schema<T> {
    length(n: number): ArraySchema<T>;
  }
  export const $: any; // 内部符号: Qie
  export const $a: any; // 内部符号: Zk
  export const $c: any; // 内部符号: Px
  export const $d: any; // 内部符号: qh
  export const $i: any; // 内部符号: $ne
  export const $l: any; // 内部符号: ine
  export const $n: any; // 内部符号: YK
  export const $o: any; // 内部符号: wE
  export const $r: any; // 内部符号: sI
  export const $s: any; // 内部符号: $w
  export const $t: any; // 内部符号: _2
  export const $u: any; // 内部符号: Pv
  export const A: any; // 内部符号: koe
  export const Aa: any; // 内部符号: One
  export const Ac: any; // 内部符号: _C
  export const Ad: any; // 内部符号: A_
  export const Af: any; // 内部符号: nm
  export const Ai: any; // 内部符号: _re
  export const Al: any; // 内部符号: Ob
  export const An: any; // 内部符号: jX
  export const Ao: any; // 内部符号: gO
  export const Ar: any; // 内部符号: LB
  export const As: any; // 内部符号: IT
  export const At: any; // 内部符号: U6
  export const Au: any; // 内部符号: Ly
  export const B: any; // 内部符号: Yae
  export const Ba: any; // 内部符号: zA
  export const Bc: any; // 内部符号: XS
  export const Bd: any; // 内部符号: Zg
  export const Bf: any; // 内部符号: mt
  export const Bi: any; // 内部符号: Bj
  export const Bl: any; // 内部符号: Lb
  export const Bn: any; // 内部符号: fY
  export const Bo: any; // 内部符号: uD
  export const Br: any; // 内部符号: oB
  export const Bs: any; // 内部符号: Fw
  export const Bt: any; // 内部符号: a6
  export const Bu: any; // 内部符号: fy
  export const C: any; // 内部符号: Pse
  export const Ca: any; // 内部符号: Lne
  export const Cc: any; // 内部符号: SC
  export const Cd: any; // 内部符号: Ute
  // 注：zod builder 导出（Cf/Of 等）在 main-app 重写中被大量链式调用
  // （.trim()/.int()/.refine()/.catchall() 等），d.ts 无法完整还原 zod 的 builder 面，
  // 故放宽为 any；内部符号名见原粗扫/深析文档。
  export const Cf: any; // 内部符号: hZ（zod number builder）
  export const Ci: any; // 内部符号: ZM
  export const Cl: any; // 内部符号: rx
  export const Cn: any; // 内部符号: OX
  export const Co: any; // 内部符号: Mk
  export const Cr: any; // 内部符号: cB
  export const Cs: any; // 内部符号: ET
  export const Ct: any; // 内部符号: n8
  export const Cu: any; // 内部符号: Xy
  export const D: any; // 内部符号: cse
  export const Da: any; // 内部符号: tj
  export const Dc: any; // 内部符号: wC
  export const Dd: any; // 内部符号: k_
  export const Df: any; // 内部符号: Gp
  export const Di: any; // 内部符号: Z
  export const Dl: any; // 内部符号: Kb
  export const Dn: any; // 内部符号: oX
  export const Do: any; // 内部符号: TO
  export const Dr: any; // 内部符号: mB
  export const Ds: any; // 内部符号: jT
  export const Dt: any; // 内部符号: j6
  export const Du: any; // 内部符号: Py
  export const E: any; // 内部符号: _se
  export const Ea: any; // 内部符号: ej
  export const Ec: any; // 内部符号: EC
  export const Ed: any; // 内部符号: j_
  export const Ef: any; // 内部符号: im
  export const Ei: any; // 内部符号: DM
  export const El: any; // 内部符号: $b
  export const En: any; // 内部符号: DX
  export const Eo: any; // 内部符号: PO
  export const Er: any; // 内部符号: kB
  export const Es: any; // 内部符号: LT
  export const Et: any; // 内部符号: M6
  export const Eu: any; // 内部符号: Jy
  export const F: any; // 内部符号: T7
  export const Fa: any; // 内部符号: qA
  export const Fc: any; // 内部符号: JS
  export const Fd: any; // 内部符号: S_
  export const Ff: any; // 内部符号: Zd
  export const Fi: any; // 内部符号: cM
  export const Fl: any; // 内部符号: jb
  export const Fn: any; // 内部符号: xY
  export const Fo: any; // 内部符号: HD
  export const Fr: any; // 内部符号: CB
  export const Fs: any; // 内部符号: bT
  export const Ft: any; // 内部符号: E6
  export const Fu: any; // 内部符号: Oy
  export const G: any; // 内部符号: k5
  export const Ga: any; // 内部符号: kA
  export const Gc: any; // 内部符号: bS
  export const Gd: any; // 内部符号: Pg
  export const Gi: any; // 内部符号: cre
  export const Gl: any; // 内部符号: _b
  export const Gn: any; // 内部符号: ZJ
  export const Go: any; // 内部符号: aD
  export const Gr: any; // 内部符号: NI
  export const Gs: any; // 内部符号: Vw
  export const Gt: any; // 内部符号: Y2
  export const Gu: any; // 内部符号: iy
  export const H: any; // 内部符号: q5
  export const Ha: any; // 内部符号: LA
  export const Hc: any; // 内部符号: yS
  export const Hd: any; // 内部符号: Ug
  export const Hf: any; // 内部符号: lt
  export const Hi: any; // 内部符号: lre
  export const Hl: any; // 内部符号: Bb
  export const Hn: any; // 内部符号: dY
  export const Ho: any; // 内部符号: fD
  export const Hr: any; // 内部符号: LI
  export const Hs: any; // 内部符号: Rw
  export const Ht: any; // 内部符号: b3
  export const Hu: any; // 内部符号: my
  export const I: any; // 内部符号: ioe
  export const Ia: any; // 内部符号: GA
  export const Ic: any; // 内部符号: YS
  export const Id: any; // 内部符号: x_
  export const If: any; // 内部符号: Gd
  export const Ii: any; // 内部符号: hre
  export const Il: any; // 内部符号: Pb
  export const In: any; // 内部符号: CY
  export const Io: any; // 内部符号: BD
  export const Ir: any; // 内部符号: wB
  export const Is: any; // 内部符号: yT
  export const It: any; // 内部符号: S6
  export const Iu: any; // 内部符号: xy
  export const J: any; // 内部符号: dae
  export const Ja: any; // 内部符号: uA
  export const Jc: any; // 内部符号: oS
  export const Jd: any; // 内部符号: kg
  export const Ji: any; // 内部符号: ore
  export const Jl: any; // 内部符号: yb
  export const Jn: any; // 内部符号: eJ
  export const Jo: any; // 内部符号: tD
  export const Jr: any; // 内部符号: hI
  export const Js: any; // 内部符号: Ww
  export const Jt: any; // 内部符号: h2
  export const Ju: any; // 内部符号: qv
  export const K: any; // 内部符号: pae
  export const Ka: any; // 内部符号: SA
  export const Kc: any; // 内部符号: cS
  export const Kd: any; // 内部符号: Mg
  export const Ki: any; // 内部符号: Nj
  export const Kl: any; // 内部符号: Sb
  export const Kn: any; // 内部符号: xJ
  export const Ko: any; // 内部符号: cD
  export const Kr: any; // 内部符号: MI
  export const Ks: any; // 内部符号: Hw
  export const Kt: any; // 内部符号: U2
  export const Ku: any; // 内部符号: ry
  export const L: any; // 内部符号: toe
  export const La: any; // 内部符号: WA
  export const Lc: any; // 内部符号: GS
  export const Ld: any; // 内部符号: s_
  export const Lf: any; // 内部符号: Ud
  export const Li: any; // 内部符号: fre
  export const Ll: any; // 内部符号: gne
  export const Ln: any; // 内部符号: vY
  export const Lo: any; // 内部符号: RD
  export const Lr: any; // 内部符号: fB
  export const Ls: any; // 内部符号: iT
  export const Lt: any; // 内部符号: u6
  export const Lu: any; // 内部符号: Sy
  export const M: any; // 内部符号: C7
  export const Ma: any; // 内部符号: XA
  export const Mc: any; // 内部符号: tC
  export const Md: any; // 内部符号: __
  export const Mf: any; // 内部符号: Fp
  export const Mi: any; // 内部符号: oM
  export const Ml: any; // 内部符号: Ab
  export const Mn: any; // 内部符号: yY
  export const Mo: any; // 内部符号: nO
  export const Mr: any; // 内部符号: pB
  export const Ms: any; // 内部符号: xT
  export const Mt: any; // 内部符号: W6
  export const Mu: any; // 内部符号: zy
  export const N: any; // 内部符号: Doe
  export const Na: any; // 内部符号: YA
  export const Nc: any; // 内部符号: eC
  export const Nd: any; // 内部符号: y_
  export const Nf: any; // 内部符号: Of
  export const Ni: any; // 内部符号: sM
  export const Nl: any; // 内部符号: Fb
  export const Nn: any; // 内部符号: bY
  export const No: any; // 内部符号: JD
  export const Nr: any; // 内部符号: SB
  export const Ns: any; // 内部符号: CT
  export const Nt: any; // 内部符号: I6
  export const Nu: any; // 内部符号: Cy
  export const O: any; // 内部符号: ise
  export const Oa: any; // 内部符号: Ane
  export const Oc: any; // 内部符号: TC
  export const Od: any; // 内部符号: E_
  export const Of: any; // 内部符号: kF（zod string builder，链式调用放宽为 any）
  export const Oi: any; // 内部符号: xM
  export const Ol: any; // 内部符号: ex
  export const On: any; // 内部符号: hX
  export const Oo: any; // 内部符号: wO
  export const Or: any; // 内部符号: uB
  export const Os: any; // 内部符号: FT
  export const Ot: any; // 内部符号: N6
  export const Ou: any; // 内部符号: Yy
  export const P: any; // 内部符号: Ooe
  export const Pa: any; // 内部符号: JA
  export const Pc: any; // 内部符号: BS
  export const Pd: any; // 内部符号: m_
  export const Pf: any; // 内部符号: Cf
  export const Pi: any; // 内部符号: mre
  export const Pl: any; // 内部符号: Nb
  export const Pn: any; // 内部符号: SY
  export const Po: any; // 内部符号: GD
  export const Pr: any; // 内部符号: KB
  export const Ps: any; // 内部符号: ST
  export const Pt: any; // 内部符号: z6
  export const Pu: any; // 内部符号: ky
  export const Q: any; // 内部符号: l5
  export const Qa: any; // 内部符号: tA
  export const Qc: any; // 内部符号: Hx
  export const Qd: any; // 内部符号: Zh
  export const Qi: any; // 内部符号: Tj
  export const Ql: any; // 内部符号: wb
  export const Qn: any; // 内部符号: XK
  export const Qo: any; // 内部符号: CE
  export const Qr: any; // 内部符号: ZF
  export const Qs: any; // 内部符号: Bw
  export const Qt: any; // 内部符号: g2
  export const Qu: any; // 内部符号: Lv
  export const R: any; // 内部符号: noe
  export const Ra: any; // 内部符号: HA
  export const Rc: any; // 内部符号: US
  export const Rd: any; // 内部符号: i_
  export const Rf: any; // 内部符号: Id
  export const Ri: any; // 内部符号: aM
  export const Rl: any; // 内部符号: Mb
  export const Rn: any; // 内部符号: _Y
  export const Ro: any; // 内部符号: MD
  export const Rr: any; // 内部符号: TB
  export const Rs: any; // 内部符号: oT
  export const Rt: any; // 内部符号: i6
  export const Ru: any; // 内部符号: dy
  export const S: any; // 内部符号: Fse
  export const Sa: any; // 内部符号: sj
  export const Sc: any; // 内部符号: DC
  export const Sd: any; // 内部符号: P_
  export const Sf: any; // 内部符号: Lp
  export const Si: any; // 内部符号: eN
  export const Sl: any; // 内部符号: ix
  export const Sn: any; // 内部符号: wX
  export const So: any; // 内部符号: kk
  export const Sr: any; // 内部符号: dB
  export const Ss: any; // 内部符号: AT
  export const St: any; // 内部符号: t8
  export const Su: any; // 内部符号: Uy
  export const T: any; // 内部符号: Dse
  export const Ta: any; // 内部符号: nj
  export const Tc: any; // 内部符号: CC
  export const Td: any; // 内部符号: Rte
  export const Tf: any; // 内部符号: lh
  export const Ti: any; // 内部符号: EM
  export const Tl: any; // 内部符号: Gb
  export const Tn: any; // 内部符号: kX
  export const To: any; // 内部符号: WO
  export const Tr: any; // 内部符号: AB
  export const Ts: any; // 内部符号: PT
  export const Tt: any; // 内部符号: s8
  export const Tu: any; // 内部符号: Ry
  export const U: any; // 内部符号: B5
  export const Ua: any; // 内部符号: FA
  export const Uc: any; // 内部符号: hS
  export const Ud: any; // 内部符号: Hg
  export const Uf: any; // 内部符号: dt
  export const Ui: any; // 内部符号: Ij
  export const Ul: any; // 内部符号: _ne
  export const Un: any; // 内部符号: tY
  export const Uo: any; // 内部符号: sD
  export const Ur: any; // 内部符号: RI
  export const Us: any; // 内部符号: Nw
  export const Ut: any; // 内部符号: U4
  export const Uu: any; // 内部符号: uy
  export const V: any; // 内部符号: Jae
  export const Va: any; // 内部符号: RA
  export const Vc: any; // 内部符号: uS
  export const Vd: any; // 内部符号: Xg
  export const Vf: any; // 内部符号: ut
  export const Vi: any; // 内部符号: Rj
  export const Vl: any; // 内部符号: Eb
  export const Vn: any; // 内部符号: mY
  export const Vo: any; // 内部符号: gD
  export const Vr: any; // 内部符号: HB
  export const Vs: any; // 内部符号: Iw
  export const Vt: any; // 内部符号: F3
  export const Vu: any; // 内部符号: hy
  export const W: any; // 内部符号: z5
  export const Wa: any; // 内部符号: PA
  export const Wc: any; // 内部符号: _S
  export const Wd: any; // 内部符号: Rg
  export const Wf: any; // 内部符号: ft
  export const Wi: any; // 内部符号: Pj
  export const Wl: any; // 内部符号: Rb
  export const Wn: any; // 内部符号: XJ
  export const Wo: any; // 内部符号: oD
  export const Wr: any; // 内部符号: II
  export const Ws: any; // 内部符号: Pw
  export const Wt: any; // 内部符号: e3
  export const Wu: any; // 内部符号: ny
  export const X: any; // 内部符号: n5
  export const Xa: any; // 内部符号: oA
  export const Xc: any; // 内部符号: nS
  export const Xd: any; // 内部符号: Dg
  export const Xi: any; // 内部符号: Oj
  export const Xl: any; // 内部符号: xb
  export const Xn: any; // 内部符号: $q
  export const Xo: any; // 内部符号: XE
  export const Xr: any; // 内部符号: gI
  export const Xs: any; // 内部符号: Xw
  export const Xt: any; // 内部符号: v2
  export const Xu: any; // 内部符号: Bv
  export const Y: any; // 内部符号: fae
  export const Ya: any; // 内部符号: dA
  export const Yc: any; // 内部符号: eS
  export const Yd: any; // 内部符号: Og
  export const Yi: any; // 内部符号: Aj
  export const Yl: any; // 内部符号: bb
  export const Yn: any; // 内部符号: Qq
  export const Yo: any; // 内部符号: $E
  export const Yr: any; // 内部符号: _I
  export const Ys: any; // 内部符号: Gw
  export const Yt: any; // 内部符号: W2
  export const Yu: any; // 内部符号: Qv
  export const Z: any; // 内部符号: eae
  export const Za: any; // 内部符号: rA
  export const Zc: any; // 内部符号: tS
  export const Zd: any; // 内部符号: xg
  export const Zi: any; // 内部符号: kj
  export const Zl: any; // 内部符号: Cb
  export const Zn: any; // 内部符号: Uq
  export const Zo: any; // 内部符号: KE
  export const Zr: any; // 内部符号: aI
  export const Zs: any; // 内部符号: qw
  export const Zt: any; // 内部符号: m2
  export const Zu: any; // 内部符号: Iv
  export const _: any; // 内部符号: v9
  export const _a: any; // 内部符号: Une
  export const _c: any; // 内部符号: KC
  export const _d: any; // 内部符号: R_
  export const _f: any; // 内部符号: th
  export const _i: any; // 内部符号: UN
  export const _l: any; // 内部符号: qb
  export const _n: any; // 内部符号: _Q
  export const _o: any; // 内部符号: Hk
  export const _r: any; // 内部符号: WB
  export const _s: any; // 内部符号: wT
  export const _t: any; // 内部符号: Gre
  export const _u: any; // 内部符号: Gy
  export const a: any; // 内部符号: Wce
  export const aa: any; // 内部符号: wj
  export const ac: any; // 内部符号: Tw
  export const ad: any; // 内部符号: hv
  export const af: any; // 内部符号: Hp
  export const ai: any; // 内部符号: JF
  export const al: any; // 内部符号: wx
  export const an: any; // 内部符号: I1
  export const ao: any; // 内部符号: sk
  export const ar: any; // 内部符号: uK
  export const as: any; // 内部符号: RE
  export const at: any; // 内部符号: Sie
  export const au: any; // 内部符号: tne
  export const b: any; // 内部符号: Lse
  export const ba: any; // 内部符号: oj
  export const bc: any; // 内部符号: NC
  export const bd: any; // 内部符号: H_
  export const bf: any; // 内部符号: Jx（zod literal builder，链式调用放宽为 any）
  export const bi: any; // 内部符号: dN
  export const bl: any; // 内部符号: Jb
  export const bn: any; // 内部符号: pX
  export const bo: any; // 内部符号: Vk
  export const br: any; // 内部符号: UB
  export const bs: any; // 内部符号: OT
  export const bt: any; // 内部符号: a8
  export const bu: any; // 内部符号: Wy
  export const c: any; // 内部符号: Ace
  export const ca: any; // 内部符号: Xne
  export const cc: any; // 内部符号: hw
  export const cd: any; // 内部符号: sv
  export const cf: any; // 内部符号: Wp
  export const ci: any; // 内部符号: qF
  export const cl: any; // 内部符号: Tx
  export const cn: any; // 内部符号: i1
  export const co: any; // 内部符号: nk
  export const cr: any; // 内部符号: EW
  export const cs: any; // 内部符号: PE
  export const ct: any; // 内部符号: Tie
  export const cu: any; // 内部符号: fb
  export const d: any; // 内部符号: lce
  export const da: any; // 内部符号: dj
  export const dc: any; // 内部符号: tw
  export const dd: any; // 内部符号: $_
  export const df: any; // 内部符号: J
  export const di: any; // 内部符号: IP
  export const dl: any; // 内部符号: Ax
  export const dn: any; // 内部符号: GQ
  declare const do_: any; // 内部符号: wk（保留字导出）
  export { do_ as "do" };
  export const dr: any; // 内部符号: zU
  export const ds: any; // 内部符号: iE
  export const dt: any; // 内部符号: hie
  export const du: any; // 内部符号: nb
  export const ea: any; // 内部符号: yj
  export const ec: any; // 内部符号: Sw
  export const ed: any; // 内部符号: Nv
  export const ef: any; // 内部符号: Lh
  export const ei: any; // 内部符号: cI
  export const el: any; // 内部符号: bx
  export const en: any; // 内部符号: G1
  export const eo: any; // 内部符号: Qk
  export const er: any; // 内部符号: JK
  export const es: any; // 内部符号: LE
  export const et: any; // 内部符号: Zie
  export const eu: any; // 内部符号: one
  export const f: any; // 内部符号: sce
  export const fa: any; // 内部符号: Gne
  export const fc: any; // 内部符号: $C
  export const fd: any; // 内部符号: Z_
  export const ff: any; // 内部符号: oh
  export const fi: any; // 内部符号: SP
  export const fl: any; // 内部符号: cx
  export const fn: any; // 内部符号: QQ
  export const fo: any; // 内部符号: Ok
  export const fr: any; // 内部符号: AV
  export const fs: any; // 内部符号: tE
  export const ft: any; // 内部符号: fie
  export const fu: any; // 内部符号: Qy
  export const g: any; // 内部符号: nce
  export const ga: any; // 内部符号: lj
  export const gc: any; // 内部符号: qC
  export const gd: any; // 内部符号: L_
  export const gf: any; // 内部符号: G
  export const gi: any; // 内部符号: CP
  export const gl: any; // 内部符号: tx
  export const gn: any; // 内部符号: vQ
  export const go: any; // 内部符号: Dk
  export const gr: any; // 内部符号: yV
  export const gs: any; // 内部符号: ZT
  export const gt: any; // 内部符号: Kre
  export const gu: any; // 内部符号: My
  export const h: any; // 内部符号: b9
  export const ha: any; // 内部符号: fj
  export const hc: any; // 内部符号: JC
  export const hd: any; // 内部符号: B_
  export const hf: any; // 内部符号: cj（zod array builder，链式调用放宽为 any）
  export const hi: any; // 内部符号: wP
  export const hl: any; // 内部符号: sx
  export const hn: any; // 内部符号: xQ
  export const ho: any; // 内部符号: Ck
  export const hr: any; // 内部符号: vV
  export const hs: any; // 内部符号: QT
  export const ht: any; // 内部符号: qre
  export const hu: any; // 内部符号: cb
  export const i: any; // 内部符号: Kce
  export const ia: any; // 内部符号: nre
  export const ic: any; // 内部符号: Aw
  export const id: any; // 内部符号: yv
  declare const if_: any; // 内部符号: ph（保留字导出）
  export { if_ as "if" };
  export const ii: any; // 内部符号: eI
  export const il: any; // 内部符号: Sx
  declare const in_: any; // 内部符号: v1（保留字导出）
  export { in_ as "in" };
  export const io: any; // 内部符号: Xk
  export const ir: any; // 内部符号: dK
  export const is: any; // 内部符号: IE
  export const it: any; // 内部符号: bie
  export const iu: any; // 内部符号: gb
  export const j: any; // 内部符号: Aoe
  export const ja: any; // 内部符号: ZA
  export const jc: any; // 内部符号: mC
  export const jd: any; // 内部符号: b_
  export const jf: any; // 内部符号: Jp
  export const ji: any; // 内部符号: bM
  export const jl: any; // 内部符号: kb
  export const jn: any; // 内部符号: gX
  export const jo: any; // 内部符号: lO
  export const jr: any; // 内部符号: GB
  export const js: any; // 内部符号: gT
  export const jt: any; // 内部符号: V6
  export const ju: any; // 内部符号: Iy
  export const k: any; // 内部符号: Uoe
  export const ka: any; // 内部符号: $A
  export const kc: any; // 内部符号: vC
  export const kd: any; // 内部符号: T_
  export const kf: any; // 内部符号: Km
  export const ki: any; // 内部符号: SM
  export const kl: any; // 内部符号: Db
  export const kn: any; // 内部符号: EX
  export const ko: any; // 内部符号: xO
  export const kr: any; // 内部符号: jB
  export const ks: any; // 内部符号: MT
  export const kt: any; // 内部符号: H6
  export const ku: any; // 内部符号: By
  export const l: any; // 内部符号: T9
  export const la: any; // 内部符号: pj
  export const lc: any; // 内部符号: cw
  export const ld: any; // 内部符号: ov
  export const lf: any; // 内部符号: vm
  export const li: any; // 内部符号: TP
  export const ll: any; // 内部符号: Ox
  export const ln: any; // 内部符号: a1
  export const lo: any; // 内部符号: Tk
  export const lr: any; // 内部符号: TW
  export const ls: any; // 内部符号: hE
  export const lt: any; // 内部符号: X8
  export const lu: any; // 内部符号: tb
  export const m: any; // 内部符号: y9
  export const ma: any; // 内部符号: Kne
  export const mc: any; // 内部符号: XC
  export const md: any; // 内部符号: Wte
  export const mf: any; // 内部符号: kp
  export const mi: any; // 内部符号: EP
  export const ml: any; // 内部符号: px
  export const mn: any; // 内部符号: wQ
  export const mo: any; // 内部符号: jk
  export const mr: any; // 内部符号: DV
  export const ms: any; // 内部符号: $T
  export const mt: any; // 内部符号: P8
  export const mu: any; // 内部符号: ib
  export const n: any; // 内部符号: Yce
  export const na: any; // 内部符号: tre
  export const nc: any; // 内部符号: jw
  export const nd: any; // 内部符号: Cv
  export const nf: any; // 内部符号: bte
  export const ni: any; // 内部符号: oI
  export const nl: any; // 内部符号: _x
  export const nn: any; // 内部符号: x1
  export const no: any; // 内部符号: Yk
  export const nr: any; // 内部符号: bK
  export const ns: any; // 内部符号: BE
  export const nt: any; // 内部符号: Mie
  export const nu: any; // 内部符号: Tb
  export const o: any; // 内部符号: Lce
  export const oa: any; // 内部符号: hj
  export const oc: any; // 内部符号: Ow
  export const od: any; // 内部符号: mv
  export const of: any; // 内部符号: Tm
  export const oi: any; // 内部符号: GF
  export const ol: any; // 内部符号: Cx
  export const on: any; // 内部符号: l1
  export const oo: any; // 内部符号: ik
  export const or: any; // 内部符号: HW
  export const os: any; // 内部符号: jE
  export const ot: any; // 内部符号: H8
  export const ou: any; // 内部符号: pb
  export const p: any; // 内部符号: tce
  export const pa: any; // 内部符号: uj
  export const pc: any; // 内部符号: ZC
  export const pd: any; // 内部符号: I_
  export const pf: any; // 内部符号: jp
  export const pi: any; // 内部符号: xP
  export const pl: any; // 内部符号: mx
  export const pn: any; // 内部符号: CQ
  export const po: any; // 内部符号: Ak
  export const pr: any; // 内部符号: jV
  export const ps: any; // 内部符号: nE
  export const pt: any; // 内部符号: N8
  export const pu: any; // 内部符号: $y
  export const q: any; // 内部符号: x5
  export const qa: any; // 内部符号: lA
  export const qc: any; // 内部符号: sS
  export const qd: any; // 内部符号: jg
  export const qi: any; // 内部符号: Mj
  export const ql: any; // 内部符号: vb
  /** 按名字解析 PATH 上的可执行文件（带缓存），找不到返回 undefined。 */
  export const qn: {
    resolve(executable: string, opts?: { cwd?: string; env?: Record<string, string | undefined> }): string | undefined;
  };
  export const qo: any; // 内部符号: iD
  export const qr: any; // 内部符号: AI
  export const qs: any; // 内部符号: Uw
  export const qt: any; // 内部符号: A2
  export const qu: any; // 内部符号: Vv
  export const r: any; // 内部符号: Gce
  export const ra: any; // 内部符号: Ej
  export const rc: any; // 内部符号: Ew
  export const rd: any; // 内部符号: bv
  export const rf: any; // 内部符号: mh
  export const ri: any; // 内部符号: nI
  export const rl: any; // 内部符号: vx
  export const rn: any; // 内部符号: S1
  export const ro: any; // 内部符号: Jk
  export const rr: any; // 内部符号: vK
  export const rs: any; // 内部符号: FE
  export const rt: any; // 内部符号: Aie
  export const ru: any; // 内部符号: mb
  export const s: any; // 内部符号: jce
  export const sa: any; // 内部符号: gj
  export const sc: any; // 内部符号: gw
  export const sd: any; // 内部符号: fv
  export const sf: any; // 内部符号: Sm
  export const si: any; // 内部符号: KF
  export const sl: any; // 内部符号: Dx
  export const sn: any; // 内部符号: o1
  export const so: any; // 内部符号: ak
  export const sr: any; // 内部符号: FW
  export const ss: any; // 内部符号: NE
  export const st: any; // 内部符号: wie
  export const su: any; // 内部符号: $te
  export const t: any; // 内部符号: Zce
  export const ta: any; // 内部符号: ere
  export const tc: any; // 内部符号: Dw
  export const td: any; // 内部符号: Av
  /** 线程状态 → RGB 颜色码（内部符号 Cte，switch 返回各状态颜色常量）。 */
  export const tf: (status: string) => number;
  export const ti: any; // 内部符号: tI
  export const tl: any; // 内部符号: xx
  export const tn: any; // 内部符号: W1
  export const to: any; // 内部符号: $k
  export const tr: any; // 内部符号: jK
  export const ts: any; // 内部符号: zE
  export const tt: any; // 内部符号: Pie
  export const tu: any; // 内部符号: ane
  export const u: any; // 内部符号: dce
  export const ua: any; // 内部符号: Wne
  export const uc: any; // 内部符号: iw
  export const ud: any; // 内部符号: rv
  export const uf: any; // 内部符号: rm
  export const ui: any; // 内部符号: LP
  export const ul: any; // 内部符号: jx
  export const un: any; // 内部符号: r1
  export const uo: any; // 内部符号: Ek
  export const ur: any; // 内部符号: cW
  export const us: any; // 内部符号: _E
  export const ut: any; // 内部符号: R8
  export const uu: any; // 内部符号: lb
  export const v: any; // 内部符号: Qse
  export const va: any; // 内部符号: Hne
  export const vc: any; // 内部符号: GC
  export const vd: any; // 内部符号: K_
  export const vf: any; // 内部符号: h9（zod discriminated-union builder，放宽为 any）
  export const vi: any; // 内部符号: HN
  export const vl: any; // 内部符号: Zb
  export const vn: any; // 内部符号: ZY
  export const vo: any; // 内部符号: Rk
  export const vr: any; // 内部符号: xB
  export const vs: any; // 内部符号: TT
  export const vt: any; // 内部符号: w8
  export const vu: any; // 内部符号: Vy
  export const w: any; // 内部符号: Nse
  export const wa: any; // 内部符号: Rne
  export const wc: any; // 内部符号: bC
  export const wd: any; // 内部符号: M_
  export const wf: any; // 内部符号: j3（zod object builder，链式调用放宽为 any）
  export const wi: any; // 内部符号: YM
  export const wl: any; // 内部符号: Qb
  export const wn: any; // 内部符号: TX
  export const wo: any; // 内部符号: JO
  export const wr: any; // 内部符号: MB
  export const ws: any; // 内部符号: NT
  export const wt: any; // 内部符号: c8
  export const wu: any; // 内部符号: jy
  export const x: any; // 内部符号: Ise
  export const xa: any; // 内部符号: Vne
  export const xc: any; // 内部符号: FC
  export const xd: any; // 内部符号: U_
  export const xf: any; // 内部符号: Kp
  export const xi: any; // 内部符号: sN
  export const xl: any; // 内部符号: Yb
  export const xn: any; // 内部符号: CX
  export const xo: any; // 内部符号: Fk
  export const xr: any; // 内部符号: RB
  export const xs: any; // 内部符号: kT
  export const xt: any; // 内部符号: o8
  export const xu: any; // 内部符号: Zy
  export const y: any; // 内部符号: s9
  export const ya: any; // 内部符号: cj
  export const yc: any; // 内部符号: MC
  export const yd: any; // 内部符号: Y_
  export const yf: any; // 内部符号: ch
  export const yi: any; // 内部符号: CN
  export const yl: any; // 内部符号: Xb
  export const yn: any; // 内部符号: XY
  export const yo: any; // 内部符号: Bk
  export const yr: any; // 内部符号: VB
  export const ys: any; // 内部符号: DT
  export const yt: any; // 内部符号: C8
  export const yu: any; // 内部符号: Hy
  export const z: any; // 内部符号: i7
  export const za: any; // 内部符号: VA
  export const zc: any; // 内部符号: qS
  export const zd: any; // 内部符号: Qg
  export const zf: any; // 内部符号: tn
  export const zi: any; // 内部符号: pre
  export const zl: any; // 内部符号: Ib
  export const zn: any; // 内部符号: gY
  export const zo: any; // 内部符号: ND
  export const zr: any; // 内部符号: qB
  export const zs: any; // 内部符号: sT
  export const zt: any; // 内部符号: r6
  export const zu: any; // 内部符号: py
}
declare module "@chunk/electron-resources-path" {
  // electron-resources-path-BDLw2lp0.js —— 已重写 chunk（src/main/electron-resources-path/）。
  export interface ElectronResourcesPathInput {
    env: Record<string, string | undefined>;
    resourcesPath: string;
  }
  /** 解析 resources 目录（CODEX_ELECTRON_RESOURCES_PATH 覆盖，否则 resourcesPath）。 */
  export function resolveElectronResourcesPath(input: ElectronResourcesPathInput): string;
}

declare module "@chunk/main" {
  // main-C-Mhak1n.js —— 主进程主体。
  /** 创建桌面日志归档（feedback desktop log archive）。 */
  export const t: (
    now?: Date,
    extraPaths?: string[],
    opts?: { includeDesktopLogs?: boolean },
  ) => Promise<{ archiveId: string; filePaths: string[] } | null>;
  /** 删除桌面日志归档。 */
  export const n: (archiveId: string) => Promise<boolean>;
  export const runMainAppStartup: unknown;
}

declare module "@chunk/bootstrap" {
  // bootstrap-C4dRql4x.js —— 已重写 chunk（src/main/bootstrap/，见
  // chunk-manifest.mjs 的 REWRITTEN）。兼容导出（单字母名，如 "in"/"R"/"bn"）
  // 与语义导出均由真实源码提供，直接转发真实模块的导出面。
  // `export *` 不转发字符串命名的导出（TS 限制），128 个兼容导出逐个转发
  //（语义名见 docs/bootstrap-export-table.txt 与 bootstrap/index.ts 的映射）。
  export { "$" as "$" } from "../../bootstrap/index";
  export { "$t" as "$t" } from "../../bootstrap/index";
  export { "A" as "A" } from "../../bootstrap/index";
  export { "At" as "At" } from "../../bootstrap/index";
  export { "B" as "B" } from "../../bootstrap/index";
  export { "Bt" as "Bt" } from "../../bootstrap/index";
  export { "C" as "C" } from "../../bootstrap/index";
  export { "Ct" as "Ct" } from "../../bootstrap/index";
  export { "D" as "D" } from "../../bootstrap/index";
  export { "Dt" as "Dt" } from "../../bootstrap/index";
  export { "E" as "E" } from "../../bootstrap/index";
  export { "Et" as "Et" } from "../../bootstrap/index";
  export { "F" as "F" } from "../../bootstrap/index";
  export { "Ft" as "Ft" } from "../../bootstrap/index";
  export { "G" as "G" } from "../../bootstrap/index";
  export { "Gt" as "Gt" } from "../../bootstrap/index";
  export { "H" as "H" } from "../../bootstrap/index";
  export { "Ht" as "Ht" } from "../../bootstrap/index";
  export { "I" as "I" } from "../../bootstrap/index";
  export { "It" as "It" } from "../../bootstrap/index";
  export { "J" as "J" } from "../../bootstrap/index";
  export { "Jt" as "Jt" } from "../../bootstrap/index";
  export { "K" as "K" } from "../../bootstrap/index";
  export { "Kt" as "Kt" } from "../../bootstrap/index";
  export { "L" as "L" } from "../../bootstrap/index";
  export { "Lt" as "Lt" } from "../../bootstrap/index";
  export { "M" as "M" } from "../../bootstrap/index";
  export { "Mt" as "Mt" } from "../../bootstrap/index";
  export { "N" as "N" } from "../../bootstrap/index";
  export { "Nt" as "Nt" } from "../../bootstrap/index";
  export { "O" as "O" } from "../../bootstrap/index";
  export { "Ot" as "Ot" } from "../../bootstrap/index";
  export { "P" as "P" } from "../../bootstrap/index";
  export { "Pt" as "Pt" } from "../../bootstrap/index";
  export { "Q" as "Q" } from "../../bootstrap/index";
  export { "Qt" as "Qt" } from "../../bootstrap/index";
  export { "R" as "R" } from "../../bootstrap/index";
  export { "Rt" as "Rt" } from "../../bootstrap/index";
  export { "S" as "S" } from "../../bootstrap/index";
  export { "St" as "St" } from "../../bootstrap/index";
  export { "T" as "T" } from "../../bootstrap/index";
  export { "Tt" as "Tt" } from "../../bootstrap/index";
  export { "U" as "U" } from "../../bootstrap/index";
  export { "Ut" as "Ut" } from "../../bootstrap/index";
  export { "V" as "V" } from "../../bootstrap/index";
  export { "Vt" as "Vt" } from "../../bootstrap/index";
  export { "W" as "W" } from "../../bootstrap/index";
  export { "Wt" as "Wt" } from "../../bootstrap/index";
  export { "X" as "X" } from "../../bootstrap/index";
  export { "Xt" as "Xt" } from "../../bootstrap/index";
  export { "Y" as "Y" } from "../../bootstrap/index";
  export { "Yt" as "Yt" } from "../../bootstrap/index";
  export { "Z" as "Z" } from "../../bootstrap/index";
  export { "Zt" as "Zt" } from "../../bootstrap/index";
  export { "_" as "_" } from "../../bootstrap/index";
  export { "_n" as "_n" } from "../../bootstrap/index";
  export { "_t" as "_t" } from "../../bootstrap/index";
  export { "a" as "a" } from "../../bootstrap/index";
  export { "an" as "an" } from "../../bootstrap/index";
  export { "at" as "at" } from "../../bootstrap/index";
  export { "b" as "b" } from "../../bootstrap/index";
  export { "bn" as "bn" } from "../../bootstrap/index";
  export { "bt" as "bt" } from "../../bootstrap/index";
  export { "c" as "c" } from "../../bootstrap/index";
  export { "cn" as "cn" } from "../../bootstrap/index";
  export { "ct" as "ct" } from "../../bootstrap/index";
  export { "d" as "d" } from "../../bootstrap/index";
  export { "dn" as "dn" } from "../../bootstrap/index";
  export { "dt" as "dt" } from "../../bootstrap/index";
  export { "en" as "en" } from "../../bootstrap/index";
  export { "et" as "et" } from "../../bootstrap/index";
  export { "f" as "f" } from "../../bootstrap/index";
  export { "fn" as "fn" } from "../../bootstrap/index";
  export { "ft" as "ft" } from "../../bootstrap/index";
  export { "g" as "g" } from "../../bootstrap/index";
  export { "gn" as "gn" } from "../../bootstrap/index";
  export { "gt" as "gt" } from "../../bootstrap/index";
  export { "h" as "h" } from "../../bootstrap/index";
  export { "hn" as "hn" } from "../../bootstrap/index";
  export { "ht" as "ht" } from "../../bootstrap/index";
  export { "i" as "i" } from "../../bootstrap/index";
  export { "in" as "in" } from "../../bootstrap/index";
  export { "it" as "it" } from "../../bootstrap/index";
  export { "j" as "j" } from "../../bootstrap/index";
  export { "jt" as "jt" } from "../../bootstrap/index";
  export { "k" as "k" } from "../../bootstrap/index";
  export { "kt" as "kt" } from "../../bootstrap/index";
  export { "l" as "l" } from "../../bootstrap/index";
  export { "ln" as "ln" } from "../../bootstrap/index";
  export { "lt" as "lt" } from "../../bootstrap/index";
  export { "m" as "m" } from "../../bootstrap/index";
  export { "mn" as "mn" } from "../../bootstrap/index";
  export { "mt" as "mt" } from "../../bootstrap/index";
  export { "n" as "n" } from "../../bootstrap/index";
  export { "nn" as "nn" } from "../../bootstrap/index";
  export { "nt" as "nt" } from "../../bootstrap/index";
  export { "o" as "o" } from "../../bootstrap/index";
  export { "on" as "on" } from "../../bootstrap/index";
  export { "ot" as "ot" } from "../../bootstrap/index";
  export { "p" as "p" } from "../../bootstrap/index";
  export { "pn" as "pn" } from "../../bootstrap/index";
  export { "pt" as "pt" } from "../../bootstrap/index";
  export { "q" as "q" } from "../../bootstrap/index";
  export { "qt" as "qt" } from "../../bootstrap/index";
  export { "r" as "r" } from "../../bootstrap/index";
  export { "rn" as "rn" } from "../../bootstrap/index";
  export { "rt" as "rt" } from "../../bootstrap/index";
  export { "s" as "s" } from "../../bootstrap/index";
  export { "sn" as "sn" } from "../../bootstrap/index";
  export { "st" as "st" } from "../../bootstrap/index";
  export { "t" as "t" } from "../../bootstrap/index";
  export { "tn" as "tn" } from "../../bootstrap/index";
  export { "tt" as "tt" } from "../../bootstrap/index";
  export { "u" as "u" } from "../../bootstrap/index";
  export { "un" as "un" } from "../../bootstrap/index";
  export { "ut" as "ut" } from "../../bootstrap/index";
  export { "v" as "v" } from "../../bootstrap/index";
  export { "vn" as "vn" } from "../../bootstrap/index";
  export { "vt" as "vt" } from "../../bootstrap/index";
  export { "w" as "w" } from "../../bootstrap/index";
  export { "wt" as "wt" } from "../../bootstrap/index";
  export { "x" as "x" } from "../../bootstrap/index";
  export { "xt" as "xt" } from "../../bootstrap/index";
  export { "y" as "y" } from "../../bootstrap/index";
  export { "yn" as "yn" } from "../../bootstrap/index";
  export { "yt" as "yt" } from "../../bootstrap/index";
  export { "z" as "z" } from "../../bootstrap/index";
  export { "zt" as "zt" } from "../../bootstrap/index";
}
declare module "@chunk/windows-file-copy" {
  // windows-file-copy-B0DNtkPq.js —— 已重写 chunk（src/main/windows-file-copy/）。
  /** 复制目录；源目录加密且目标盘不支持加密时回退为「解密后复制」。 */
  export function copyDirectoryAllowDecryptedDestinationOnEncryptionFailure(input: {
    copy: () => Promise<void>;
    source: string;
    destination: string;
  }): Promise<void>;
  /** 复制文件；同上的加密回退策略。 */
  export function copyFileAllowDecryptedDestinationOnEncryptionFailure(input: {
    copy: () => Promise<void>;
    source: string;
    destination: string;
  }): Promise<void>;
}
declare module "@chunk/main-shared" {
  // src-C9YLnbgY.js —— 主进程小工具 chunk（尚未逆向重写）。
  // deep-equal（fast-equals CJS 模块；main-C 中 `G = e.a(n.Ld())` 后
  // `(0, G.default)(a, b)` 的来源，即深度相等比较）。
  const deepEqual: (a: unknown, b: unknown) => boolean;
  export default deepEqual;
  /** 与 util.isDeepStrictEqual 同源的深度严格相等（fast-equals re-export）。 */
  export const isDeepStrictEqual: (a: unknown, b: unknown) => boolean;
}

declare module "@chunk/css-selector" {
  // dist-wQAv1pJP.js —— 未重写（css-select 引擎 + 惰性 HTML DOM parser 模块）。
  // t：rolldown 惰性 CJS 模块访问器——调用一次返回 parser 模块对象，其
  // parse(html) 产出带 querySelectorAll / structuredText 的 DOM 树
  // （main-C-Mhak1n.ts 26,445 `Bme = s.t()`，线程标题 markdown 纯文本化用）。
  export const t: () => {
    parse(
      html: string,
      options?: unknown,
    ): {
      querySelectorAll(selector: string): { remove(): void }[];
      structuredText: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

// main chunk 内嵌 vendored 库的临时声明（main 集成阶段会提取 main-vendor.ts）。
declare module "@main-vendor/statsig" {
  // @statsig/js-client（js-mono v3.33.4）入口的三符号（原 main chunk `Yw`）。
  export class StatsigClient {
    constructor(sdkKey: string, user: unknown, options?: unknown);
    dataAdapter: { setData(data: string): void };
    initializeSync(opts?: unknown): { success: boolean };
    getContext(): { user: unknown; values: unknown };
    shutdown(): void;
  }
  /** PublishedStatsig 持有的 client 形状（实际是上面的 StatsigClient）。 */
  export type StatsigClientLike = {
    dataAdapter: { setData(data: string): void };
    initializeSync(opts?: unknown): { success: boolean };
    getContext(): { user: unknown; values: unknown };
    shutdown(): void;
  };
  export function djb2Hash(value: string): string;
  export function makeTypedGet(name: string, value: unknown): (key: string) => unknown;
}

// main chunk 内嵌 vendored yaml（eemeli/yaml ~2.x）的临时声明（73,181-79,294 带）。
// 集成阶段提取 main-vendor.ts 时替换；长期方案为 npm i yaml。
declare module "@main-vendor/yaml" {
  export function parse(input: string): unknown;
  export function parseAllDocuments(input: string): unknown[];
  export function parseDocument(input: string): unknown;
  export function stringify(value: unknown): string;
}
