// ============================================================
// bootstrap chunk 内嵌的 vendored 第三方库（整体搬运，未重写）。
// 行区间与包识别详见 docs/bootstrap-analysis.md §2：
//   434-3317    mime-db + mime-types
//   3931-9390   @opentelemetry/api 1.9.0 + @opentelemetry/core（含 semver、shimmer）
//   9391-16916  @sentry/core + @sentry/node 10.29.0 + @sentry/opentelemetry
//               + @opentelemetry/instrumentation-undici 0.19.0
//   16931-18907 @sentry/electron 7.5.0
//   18917-18976 TS using/Symbol.asyncDispose 降级 helper
//   21993-22015 lodash clamp
//   22864-23027 OTLP JSON 序列化
// 代码保持发布版原样（仅删去应用代码区段），符号名维持压缩名，
// 供 bootstrap 的应用模块（src/main/bootstrap/**）按需 import。
// 头部的 chunk require 已改写为 @chunk/* 形式（构建时映射回原路径）。
// ============================================================
// @ts-nocheck
const e = require("@chunk/bundler-runtime"),
  t = require("@chunk/desktop-open-path-queue"),
  n = require("@chunk/shared"),
  r = require("@chunk/logger"),
  i = require("@chunk/main-shared");
let a = require("node:url"),
  o = require("electron");
o = e.a(o);
let s = require("node:util"),
  c = require("path");
c = e.a(c);
let l = require("node:os");
l = e.a(l);
let u = require("node:path");
u = e.a(u);
let d = require("node:crypto"),
  f = require("node:fs");
f = e.a(f);
let p = require("node:fs/promises");
p = e.a(p);
let m = require("node:stream"),
  h = require("node:timers/promises"),
  g = require("fs"),
  _ = require("stream"),
  v = require("util"),
  y = require("node:child_process"),
  b = require("url");
b = e.a(b);
let x = require("zlib"),
  S = require("node:readline"),
  C = require("perf_hooks"),
  w = require("module"),
  T = require("worker_threads"),
  E = require("node:diagnostics_channel");
E = e.a(E);
let D = require("diagnostics_channel");
D = e.a(D);
let O = require("node:worker_threads"),
  ee = require("node:zlib");
var Xe = e.r({ default: () => Ze }),
  Ze,
  Qe = e.n(() => {
    Ze = {
      "application/1d-interleaved-parityfec": { source: `iana` },
      "application/3gpdash-qoe-report+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/3gpp-ims+xml": { source: `iana`, compressible: !0 },
      "application/3gpphal+json": { source: `iana`, compressible: !0 },
      "application/3gpphalforms+json": { source: `iana`, compressible: !0 },
      "application/a2l": { source: `iana` },
      "application/ace+cbor": { source: `iana` },
      "application/activemessage": { source: `iana` },
      "application/activity+json": { source: `iana`, compressible: !0 },
      "application/alto-costmap+json": { source: `iana`, compressible: !0 },
      "application/alto-costmapfilter+json": { source: `iana`, compressible: !0 },
      "application/alto-directory+json": { source: `iana`, compressible: !0 },
      "application/alto-endpointcost+json": { source: `iana`, compressible: !0 },
      "application/alto-endpointcostparams+json": { source: `iana`, compressible: !0 },
      "application/alto-endpointprop+json": { source: `iana`, compressible: !0 },
      "application/alto-endpointpropparams+json": { source: `iana`, compressible: !0 },
      "application/alto-error+json": { source: `iana`, compressible: !0 },
      "application/alto-networkmap+json": { source: `iana`, compressible: !0 },
      "application/alto-networkmapfilter+json": { source: `iana`, compressible: !0 },
      "application/alto-updatestreamcontrol+json": { source: `iana`, compressible: !0 },
      "application/alto-updatestreamparams+json": { source: `iana`, compressible: !0 },
      "application/aml": { source: `iana` },
      "application/andrew-inset": { source: `iana`, extensions: [`ez`] },
      "application/applefile": { source: `iana` },
      "application/applixware": { source: `apache`, extensions: [`aw`] },
      "application/at+jwt": { source: `iana` },
      "application/atf": { source: `iana` },
      "application/atfx": { source: `iana` },
      "application/atom+xml": { source: `iana`, compressible: !0, extensions: [`atom`] },
      "application/atomcat+xml": { source: `iana`, compressible: !0, extensions: [`atomcat`] },
      "application/atomdeleted+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`atomdeleted`],
      },
      "application/atomicmail": { source: `iana` },
      "application/atomsvc+xml": { source: `iana`, compressible: !0, extensions: [`atomsvc`] },
      "application/atsc-dwd+xml": { source: `iana`, compressible: !0, extensions: [`dwd`] },
      "application/atsc-dynamic-event-message": { source: `iana` },
      "application/atsc-held+xml": { source: `iana`, compressible: !0, extensions: [`held`] },
      "application/atsc-rdt+json": { source: `iana`, compressible: !0 },
      "application/atsc-rsat+xml": { source: `iana`, compressible: !0, extensions: [`rsat`] },
      "application/atxml": { source: `iana` },
      "application/auth-policy+xml": { source: `iana`, compressible: !0 },
      "application/bacnet-xdd+zip": { source: `iana`, compressible: !1 },
      "application/batch-smtp": { source: `iana` },
      "application/bdoc": { compressible: !1, extensions: [`bdoc`] },
      "application/beep+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/calendar+json": { source: `iana`, compressible: !0 },
      "application/calendar+xml": { source: `iana`, compressible: !0, extensions: [`xcs`] },
      "application/call-completion": { source: `iana` },
      "application/cals-1840": { source: `iana` },
      "application/captive+json": { source: `iana`, compressible: !0 },
      "application/cbor": { source: `iana` },
      "application/cbor-seq": { source: `iana` },
      "application/cccex": { source: `iana` },
      "application/ccmp+xml": { source: `iana`, compressible: !0 },
      "application/ccxml+xml": { source: `iana`, compressible: !0, extensions: [`ccxml`] },
      "application/cdfx+xml": { source: `iana`, compressible: !0, extensions: [`cdfx`] },
      "application/cdmi-capability": { source: `iana`, extensions: [`cdmia`] },
      "application/cdmi-container": { source: `iana`, extensions: [`cdmic`] },
      "application/cdmi-domain": { source: `iana`, extensions: [`cdmid`] },
      "application/cdmi-object": { source: `iana`, extensions: [`cdmio`] },
      "application/cdmi-queue": { source: `iana`, extensions: [`cdmiq`] },
      "application/cdni": { source: `iana` },
      "application/cea": { source: `iana` },
      "application/cea-2018+xml": { source: `iana`, compressible: !0 },
      "application/cellml+xml": { source: `iana`, compressible: !0 },
      "application/cfw": { source: `iana` },
      "application/city+json": { source: `iana`, compressible: !0 },
      "application/clr": { source: `iana` },
      "application/clue+xml": { source: `iana`, compressible: !0 },
      "application/clue_info+xml": { source: `iana`, compressible: !0 },
      "application/cms": { source: `iana` },
      "application/cnrp+xml": { source: `iana`, compressible: !0 },
      "application/coap-group+json": { source: `iana`, compressible: !0 },
      "application/coap-payload": { source: `iana` },
      "application/commonground": { source: `iana` },
      "application/conference-info+xml": { source: `iana`, compressible: !0 },
      "application/cose": { source: `iana` },
      "application/cose-key": { source: `iana` },
      "application/cose-key-set": { source: `iana` },
      "application/cpl+xml": { source: `iana`, compressible: !0, extensions: [`cpl`] },
      "application/csrattrs": { source: `iana` },
      "application/csta+xml": { source: `iana`, compressible: !0 },
      "application/cstadata+xml": { source: `iana`, compressible: !0 },
      "application/csvm+json": { source: `iana`, compressible: !0 },
      "application/cu-seeme": { source: `apache`, extensions: [`cu`] },
      "application/cwt": { source: `iana` },
      "application/cybercash": { source: `iana` },
      "application/dart": { compressible: !0 },
      "application/dash+xml": { source: `iana`, compressible: !0, extensions: [`mpd`] },
      "application/dash-patch+xml": { source: `iana`, compressible: !0, extensions: [`mpp`] },
      "application/dashdelta": { source: `iana` },
      "application/davmount+xml": { source: `iana`, compressible: !0, extensions: [`davmount`] },
      "application/dca-rft": { source: `iana` },
      "application/dcd": { source: `iana` },
      "application/dec-dx": { source: `iana` },
      "application/dialog-info+xml": { source: `iana`, compressible: !0 },
      "application/dicom": { source: `iana` },
      "application/dicom+json": { source: `iana`, compressible: !0 },
      "application/dicom+xml": { source: `iana`, compressible: !0 },
      "application/dii": { source: `iana` },
      "application/dit": { source: `iana` },
      "application/dns": { source: `iana` },
      "application/dns+json": { source: `iana`, compressible: !0 },
      "application/dns-message": { source: `iana` },
      "application/docbook+xml": { source: `apache`, compressible: !0, extensions: [`dbk`] },
      "application/dots+cbor": { source: `iana` },
      "application/dskpp+xml": { source: `iana`, compressible: !0 },
      "application/dssc+der": { source: `iana`, extensions: [`dssc`] },
      "application/dssc+xml": { source: `iana`, compressible: !0, extensions: [`xdssc`] },
      "application/dvcs": { source: `iana` },
      "application/ecmascript": { source: `iana`, compressible: !0, extensions: [`es`, `ecma`] },
      "application/edi-consent": { source: `iana` },
      "application/edi-x12": { source: `iana`, compressible: !1 },
      "application/edifact": { source: `iana`, compressible: !1 },
      "application/efi": { source: `iana` },
      "application/elm+json": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/elm+xml": { source: `iana`, compressible: !0 },
      "application/emergencycalldata.cap+xml": {
        source: `iana`,
        charset: `UTF-8`,
        compressible: !0,
      },
      "application/emergencycalldata.comment+xml": { source: `iana`, compressible: !0 },
      "application/emergencycalldata.control+xml": { source: `iana`, compressible: !0 },
      "application/emergencycalldata.deviceinfo+xml": { source: `iana`, compressible: !0 },
      "application/emergencycalldata.ecall.msd": { source: `iana` },
      "application/emergencycalldata.providerinfo+xml": { source: `iana`, compressible: !0 },
      "application/emergencycalldata.serviceinfo+xml": { source: `iana`, compressible: !0 },
      "application/emergencycalldata.subscriberinfo+xml": { source: `iana`, compressible: !0 },
      "application/emergencycalldata.veds+xml": { source: `iana`, compressible: !0 },
      "application/emma+xml": { source: `iana`, compressible: !0, extensions: [`emma`] },
      "application/emotionml+xml": { source: `iana`, compressible: !0, extensions: [`emotionml`] },
      "application/encaprtp": { source: `iana` },
      "application/epp+xml": { source: `iana`, compressible: !0 },
      "application/epub+zip": { source: `iana`, compressible: !1, extensions: [`epub`] },
      "application/eshop": { source: `iana` },
      "application/exi": { source: `iana`, extensions: [`exi`] },
      "application/expect-ct-report+json": { source: `iana`, compressible: !0 },
      "application/express": { source: `iana`, extensions: [`exp`] },
      "application/fastinfoset": { source: `iana` },
      "application/fastsoap": { source: `iana` },
      "application/fdt+xml": { source: `iana`, compressible: !0, extensions: [`fdt`] },
      "application/fhir+json": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/fhir+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/fido.trusted-apps+json": { compressible: !0 },
      "application/fits": { source: `iana` },
      "application/flexfec": { source: `iana` },
      "application/font-sfnt": { source: `iana` },
      "application/font-tdpfr": { source: `iana`, extensions: [`pfr`] },
      "application/font-woff": { source: `iana`, compressible: !1 },
      "application/framework-attributes+xml": { source: `iana`, compressible: !0 },
      "application/geo+json": { source: `iana`, compressible: !0, extensions: [`geojson`] },
      "application/geo+json-seq": { source: `iana` },
      "application/geopackage+sqlite3": { source: `iana` },
      "application/geoxacml+xml": { source: `iana`, compressible: !0 },
      "application/gltf-buffer": { source: `iana` },
      "application/gml+xml": { source: `iana`, compressible: !0, extensions: [`gml`] },
      "application/gpx+xml": { source: `apache`, compressible: !0, extensions: [`gpx`] },
      "application/gxf": { source: `apache`, extensions: [`gxf`] },
      "application/gzip": { source: `iana`, compressible: !1, extensions: [`gz`] },
      "application/h224": { source: `iana` },
      "application/held+xml": { source: `iana`, compressible: !0 },
      "application/hjson": { extensions: [`hjson`] },
      "application/http": { source: `iana` },
      "application/hyperstudio": { source: `iana`, extensions: [`stk`] },
      "application/ibe-key-request+xml": { source: `iana`, compressible: !0 },
      "application/ibe-pkg-reply+xml": { source: `iana`, compressible: !0 },
      "application/ibe-pp-data": { source: `iana` },
      "application/iges": { source: `iana` },
      "application/im-iscomposing+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/index": { source: `iana` },
      "application/index.cmd": { source: `iana` },
      "application/index.obj": { source: `iana` },
      "application/index.response": { source: `iana` },
      "application/index.vnd": { source: `iana` },
      "application/inkml+xml": { source: `iana`, compressible: !0, extensions: [`ink`, `inkml`] },
      "application/iotp": { source: `iana` },
      "application/ipfix": { source: `iana`, extensions: [`ipfix`] },
      "application/ipp": { source: `iana` },
      "application/isup": { source: `iana` },
      "application/its+xml": { source: `iana`, compressible: !0, extensions: [`its`] },
      "application/java-archive": {
        source: `apache`,
        compressible: !1,
        extensions: [`jar`, `war`, `ear`],
      },
      "application/java-serialized-object": {
        source: `apache`,
        compressible: !1,
        extensions: [`ser`],
      },
      "application/java-vm": { source: `apache`, compressible: !1, extensions: [`class`] },
      "application/javascript": {
        source: `iana`,
        charset: `UTF-8`,
        compressible: !0,
        extensions: [`js`, `mjs`],
      },
      "application/jf2feed+json": { source: `iana`, compressible: !0 },
      "application/jose": { source: `iana` },
      "application/jose+json": { source: `iana`, compressible: !0 },
      "application/jrd+json": { source: `iana`, compressible: !0 },
      "application/jscalendar+json": { source: `iana`, compressible: !0 },
      "application/json": {
        source: `iana`,
        charset: `UTF-8`,
        compressible: !0,
        extensions: [`json`, `map`],
      },
      "application/json-patch+json": { source: `iana`, compressible: !0 },
      "application/json-seq": { source: `iana` },
      "application/json5": { extensions: [`json5`] },
      "application/jsonml+json": { source: `apache`, compressible: !0, extensions: [`jsonml`] },
      "application/jwk+json": { source: `iana`, compressible: !0 },
      "application/jwk-set+json": { source: `iana`, compressible: !0 },
      "application/jwt": { source: `iana` },
      "application/kpml-request+xml": { source: `iana`, compressible: !0 },
      "application/kpml-response+xml": { source: `iana`, compressible: !0 },
      "application/ld+json": { source: `iana`, compressible: !0, extensions: [`jsonld`] },
      "application/lgr+xml": { source: `iana`, compressible: !0, extensions: [`lgr`] },
      "application/link-format": { source: `iana` },
      "application/load-control+xml": { source: `iana`, compressible: !0 },
      "application/lost+xml": { source: `iana`, compressible: !0, extensions: [`lostxml`] },
      "application/lostsync+xml": { source: `iana`, compressible: !0 },
      "application/lpf+zip": { source: `iana`, compressible: !1 },
      "application/lxf": { source: `iana` },
      "application/mac-binhex40": { source: `iana`, extensions: [`hqx`] },
      "application/mac-compactpro": { source: `apache`, extensions: [`cpt`] },
      "application/macwriteii": { source: `iana` },
      "application/mads+xml": { source: `iana`, compressible: !0, extensions: [`mads`] },
      "application/manifest+json": {
        source: `iana`,
        charset: `UTF-8`,
        compressible: !0,
        extensions: [`webmanifest`],
      },
      "application/marc": { source: `iana`, extensions: [`mrc`] },
      "application/marcxml+xml": { source: `iana`, compressible: !0, extensions: [`mrcx`] },
      "application/mathematica": { source: `iana`, extensions: [`ma`, `nb`, `mb`] },
      "application/mathml+xml": { source: `iana`, compressible: !0, extensions: [`mathml`] },
      "application/mathml-content+xml": { source: `iana`, compressible: !0 },
      "application/mathml-presentation+xml": { source: `iana`, compressible: !0 },
      "application/mbms-associated-procedure-description+xml": { source: `iana`, compressible: !0 },
      "application/mbms-deregister+xml": { source: `iana`, compressible: !0 },
      "application/mbms-envelope+xml": { source: `iana`, compressible: !0 },
      "application/mbms-msk+xml": { source: `iana`, compressible: !0 },
      "application/mbms-msk-response+xml": { source: `iana`, compressible: !0 },
      "application/mbms-protection-description+xml": { source: `iana`, compressible: !0 },
      "application/mbms-reception-report+xml": { source: `iana`, compressible: !0 },
      "application/mbms-register+xml": { source: `iana`, compressible: !0 },
      "application/mbms-register-response+xml": { source: `iana`, compressible: !0 },
      "application/mbms-schedule+xml": { source: `iana`, compressible: !0 },
      "application/mbms-user-service-description+xml": { source: `iana`, compressible: !0 },
      "application/mbox": { source: `iana`, extensions: [`mbox`] },
      "application/media-policy-dataset+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`mpf`],
      },
      "application/media_control+xml": { source: `iana`, compressible: !0 },
      "application/mediaservercontrol+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`mscml`],
      },
      "application/merge-patch+json": { source: `iana`, compressible: !0 },
      "application/metalink+xml": { source: `apache`, compressible: !0, extensions: [`metalink`] },
      "application/metalink4+xml": { source: `iana`, compressible: !0, extensions: [`meta4`] },
      "application/mets+xml": { source: `iana`, compressible: !0, extensions: [`mets`] },
      "application/mf4": { source: `iana` },
      "application/mikey": { source: `iana` },
      "application/mipc": { source: `iana` },
      "application/missing-blocks+cbor-seq": { source: `iana` },
      "application/mmt-aei+xml": { source: `iana`, compressible: !0, extensions: [`maei`] },
      "application/mmt-usd+xml": { source: `iana`, compressible: !0, extensions: [`musd`] },
      "application/mods+xml": { source: `iana`, compressible: !0, extensions: [`mods`] },
      "application/moss-keys": { source: `iana` },
      "application/moss-signature": { source: `iana` },
      "application/mosskey-data": { source: `iana` },
      "application/mosskey-request": { source: `iana` },
      "application/mp21": { source: `iana`, extensions: [`m21`, `mp21`] },
      "application/mp4": { source: `iana`, extensions: [`mp4s`, `m4p`] },
      "application/mpeg4-generic": { source: `iana` },
      "application/mpeg4-iod": { source: `iana` },
      "application/mpeg4-iod-xmt": { source: `iana` },
      "application/mrb-consumer+xml": { source: `iana`, compressible: !0 },
      "application/mrb-publish+xml": { source: `iana`, compressible: !0 },
      "application/msc-ivr+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/msc-mixer+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/msword": { source: `iana`, compressible: !1, extensions: [`doc`, `dot`] },
      "application/mud+json": { source: `iana`, compressible: !0 },
      "application/multipart-core": { source: `iana` },
      "application/mxf": { source: `iana`, extensions: [`mxf`] },
      "application/n-quads": { source: `iana`, extensions: [`nq`] },
      "application/n-triples": { source: `iana`, extensions: [`nt`] },
      "application/nasdata": { source: `iana` },
      "application/news-checkgroups": { source: `iana`, charset: `US-ASCII` },
      "application/news-groupinfo": { source: `iana`, charset: `US-ASCII` },
      "application/news-transmission": { source: `iana` },
      "application/nlsml+xml": { source: `iana`, compressible: !0 },
      "application/node": { source: `iana`, extensions: [`cjs`] },
      "application/nss": { source: `iana` },
      "application/oauth-authz-req+jwt": { source: `iana` },
      "application/oblivious-dns-message": { source: `iana` },
      "application/ocsp-request": { source: `iana` },
      "application/ocsp-response": { source: `iana` },
      "application/octet-stream": {
        source: `iana`,
        compressible: !1,
        extensions: [
          `bin`,
          `dms`,
          `lrf`,
          `mar`,
          `so`,
          `dist`,
          `distz`,
          `pkg`,
          `bpk`,
          `dump`,
          `elc`,
          `deploy`,
          `exe`,
          `dll`,
          `deb`,
          `dmg`,
          `iso`,
          `img`,
          `msi`,
          `msp`,
          `msm`,
          `buffer`,
        ],
      },
      "application/oda": { source: `iana`, extensions: [`oda`] },
      "application/odm+xml": { source: `iana`, compressible: !0 },
      "application/odx": { source: `iana` },
      "application/oebps-package+xml": { source: `iana`, compressible: !0, extensions: [`opf`] },
      "application/ogg": { source: `iana`, compressible: !1, extensions: [`ogx`] },
      "application/omdoc+xml": { source: `apache`, compressible: !0, extensions: [`omdoc`] },
      "application/onenote": {
        source: `apache`,
        extensions: [`onetoc`, `onetoc2`, `onetmp`, `onepkg`],
      },
      "application/opc-nodeset+xml": { source: `iana`, compressible: !0 },
      "application/oscore": { source: `iana` },
      "application/oxps": { source: `iana`, extensions: [`oxps`] },
      "application/p21": { source: `iana` },
      "application/p21+zip": { source: `iana`, compressible: !1 },
      "application/p2p-overlay+xml": { source: `iana`, compressible: !0, extensions: [`relo`] },
      "application/parityfec": { source: `iana` },
      "application/passport": { source: `iana` },
      "application/patch-ops-error+xml": { source: `iana`, compressible: !0, extensions: [`xer`] },
      "application/pdf": { source: `iana`, compressible: !1, extensions: [`pdf`] },
      "application/pdx": { source: `iana` },
      "application/pem-certificate-chain": { source: `iana` },
      "application/pgp-encrypted": { source: `iana`, compressible: !1, extensions: [`pgp`] },
      "application/pgp-keys": { source: `iana`, extensions: [`asc`] },
      "application/pgp-signature": { source: `iana`, extensions: [`asc`, `sig`] },
      "application/pics-rules": { source: `apache`, extensions: [`prf`] },
      "application/pidf+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/pidf-diff+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/pkcs10": { source: `iana`, extensions: [`p10`] },
      "application/pkcs12": { source: `iana` },
      "application/pkcs7-mime": { source: `iana`, extensions: [`p7m`, `p7c`] },
      "application/pkcs7-signature": { source: `iana`, extensions: [`p7s`] },
      "application/pkcs8": { source: `iana`, extensions: [`p8`] },
      "application/pkcs8-encrypted": { source: `iana` },
      "application/pkix-attr-cert": { source: `iana`, extensions: [`ac`] },
      "application/pkix-cert": { source: `iana`, extensions: [`cer`] },
      "application/pkix-crl": { source: `iana`, extensions: [`crl`] },
      "application/pkix-pkipath": { source: `iana`, extensions: [`pkipath`] },
      "application/pkixcmp": { source: `iana`, extensions: [`pki`] },
      "application/pls+xml": { source: `iana`, compressible: !0, extensions: [`pls`] },
      "application/poc-settings+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/postscript": {
        source: `iana`,
        compressible: !0,
        extensions: [`ai`, `eps`, `ps`],
      },
      "application/ppsp-tracker+json": { source: `iana`, compressible: !0 },
      "application/problem+json": { source: `iana`, compressible: !0 },
      "application/problem+xml": { source: `iana`, compressible: !0 },
      "application/provenance+xml": { source: `iana`, compressible: !0, extensions: [`provx`] },
      "application/prs.alvestrand.titrax-sheet": { source: `iana` },
      "application/prs.cww": { source: `iana`, extensions: [`cww`] },
      "application/prs.cyn": { source: `iana`, charset: `7-BIT` },
      "application/prs.hpub+zip": { source: `iana`, compressible: !1 },
      "application/prs.nprend": { source: `iana` },
      "application/prs.plucker": { source: `iana` },
      "application/prs.rdf-xml-crypt": { source: `iana` },
      "application/prs.xsf+xml": { source: `iana`, compressible: !0 },
      "application/pskc+xml": { source: `iana`, compressible: !0, extensions: [`pskcxml`] },
      "application/pvd+json": { source: `iana`, compressible: !0 },
      "application/qsig": { source: `iana` },
      "application/raml+yaml": { compressible: !0, extensions: [`raml`] },
      "application/raptorfec": { source: `iana` },
      "application/rdap+json": { source: `iana`, compressible: !0 },
      "application/rdf+xml": { source: `iana`, compressible: !0, extensions: [`rdf`, `owl`] },
      "application/reginfo+xml": { source: `iana`, compressible: !0, extensions: [`rif`] },
      "application/relax-ng-compact-syntax": { source: `iana`, extensions: [`rnc`] },
      "application/remote-printing": { source: `iana` },
      "application/reputon+json": { source: `iana`, compressible: !0 },
      "application/resource-lists+xml": { source: `iana`, compressible: !0, extensions: [`rl`] },
      "application/resource-lists-diff+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`rld`],
      },
      "application/rfc+xml": { source: `iana`, compressible: !0 },
      "application/riscos": { source: `iana` },
      "application/rlmi+xml": { source: `iana`, compressible: !0 },
      "application/rls-services+xml": { source: `iana`, compressible: !0, extensions: [`rs`] },
      "application/route-apd+xml": { source: `iana`, compressible: !0, extensions: [`rapd`] },
      "application/route-s-tsid+xml": { source: `iana`, compressible: !0, extensions: [`sls`] },
      "application/route-usd+xml": { source: `iana`, compressible: !0, extensions: [`rusd`] },
      "application/rpki-ghostbusters": { source: `iana`, extensions: [`gbr`] },
      "application/rpki-manifest": { source: `iana`, extensions: [`mft`] },
      "application/rpki-publication": { source: `iana` },
      "application/rpki-roa": { source: `iana`, extensions: [`roa`] },
      "application/rpki-updown": { source: `iana` },
      "application/rsd+xml": { source: `apache`, compressible: !0, extensions: [`rsd`] },
      "application/rss+xml": { source: `apache`, compressible: !0, extensions: [`rss`] },
      "application/rtf": { source: `iana`, compressible: !0, extensions: [`rtf`] },
      "application/rtploopback": { source: `iana` },
      "application/rtx": { source: `iana` },
      "application/samlassertion+xml": { source: `iana`, compressible: !0 },
      "application/samlmetadata+xml": { source: `iana`, compressible: !0 },
      "application/sarif+json": { source: `iana`, compressible: !0 },
      "application/sarif-external-properties+json": { source: `iana`, compressible: !0 },
      "application/sbe": { source: `iana` },
      "application/sbml+xml": { source: `iana`, compressible: !0, extensions: [`sbml`] },
      "application/scaip+xml": { source: `iana`, compressible: !0 },
      "application/scim+json": { source: `iana`, compressible: !0 },
      "application/scvp-cv-request": { source: `iana`, extensions: [`scq`] },
      "application/scvp-cv-response": { source: `iana`, extensions: [`scs`] },
      "application/scvp-vp-request": { source: `iana`, extensions: [`spq`] },
      "application/scvp-vp-response": { source: `iana`, extensions: [`spp`] },
      "application/sdp": { source: `iana`, extensions: [`sdp`] },
      "application/secevent+jwt": { source: `iana` },
      "application/senml+cbor": { source: `iana` },
      "application/senml+json": { source: `iana`, compressible: !0 },
      "application/senml+xml": { source: `iana`, compressible: !0, extensions: [`senmlx`] },
      "application/senml-etch+cbor": { source: `iana` },
      "application/senml-etch+json": { source: `iana`, compressible: !0 },
      "application/senml-exi": { source: `iana` },
      "application/sensml+cbor": { source: `iana` },
      "application/sensml+json": { source: `iana`, compressible: !0 },
      "application/sensml+xml": { source: `iana`, compressible: !0, extensions: [`sensmlx`] },
      "application/sensml-exi": { source: `iana` },
      "application/sep+xml": { source: `iana`, compressible: !0 },
      "application/sep-exi": { source: `iana` },
      "application/session-info": { source: `iana` },
      "application/set-payment": { source: `iana` },
      "application/set-payment-initiation": { source: `iana`, extensions: [`setpay`] },
      "application/set-registration": { source: `iana` },
      "application/set-registration-initiation": { source: `iana`, extensions: [`setreg`] },
      "application/sgml": { source: `iana` },
      "application/sgml-open-catalog": { source: `iana` },
      "application/shf+xml": { source: `iana`, compressible: !0, extensions: [`shf`] },
      "application/sieve": { source: `iana`, extensions: [`siv`, `sieve`] },
      "application/simple-filter+xml": { source: `iana`, compressible: !0 },
      "application/simple-message-summary": { source: `iana` },
      "application/simplesymbolcontainer": { source: `iana` },
      "application/sipc": { source: `iana` },
      "application/slate": { source: `iana` },
      "application/smil": { source: `iana` },
      "application/smil+xml": { source: `iana`, compressible: !0, extensions: [`smi`, `smil`] },
      "application/smpte336m": { source: `iana` },
      "application/soap+fastinfoset": { source: `iana` },
      "application/soap+xml": { source: `iana`, compressible: !0 },
      "application/sparql-query": { source: `iana`, extensions: [`rq`] },
      "application/sparql-results+xml": { source: `iana`, compressible: !0, extensions: [`srx`] },
      "application/spdx+json": { source: `iana`, compressible: !0 },
      "application/spirits-event+xml": { source: `iana`, compressible: !0 },
      "application/sql": { source: `iana` },
      "application/srgs": { source: `iana`, extensions: [`gram`] },
      "application/srgs+xml": { source: `iana`, compressible: !0, extensions: [`grxml`] },
      "application/sru+xml": { source: `iana`, compressible: !0, extensions: [`sru`] },
      "application/ssdl+xml": { source: `apache`, compressible: !0, extensions: [`ssdl`] },
      "application/ssml+xml": { source: `iana`, compressible: !0, extensions: [`ssml`] },
      "application/stix+json": { source: `iana`, compressible: !0 },
      "application/swid+xml": { source: `iana`, compressible: !0, extensions: [`swidtag`] },
      "application/tamp-apex-update": { source: `iana` },
      "application/tamp-apex-update-confirm": { source: `iana` },
      "application/tamp-community-update": { source: `iana` },
      "application/tamp-community-update-confirm": { source: `iana` },
      "application/tamp-error": { source: `iana` },
      "application/tamp-sequence-adjust": { source: `iana` },
      "application/tamp-sequence-adjust-confirm": { source: `iana` },
      "application/tamp-status-query": { source: `iana` },
      "application/tamp-status-response": { source: `iana` },
      "application/tamp-update": { source: `iana` },
      "application/tamp-update-confirm": { source: `iana` },
      "application/tar": { compressible: !0 },
      "application/taxii+json": { source: `iana`, compressible: !0 },
      "application/td+json": { source: `iana`, compressible: !0 },
      "application/tei+xml": { source: `iana`, compressible: !0, extensions: [`tei`, `teicorpus`] },
      "application/tetra_isi": { source: `iana` },
      "application/thraud+xml": { source: `iana`, compressible: !0, extensions: [`tfi`] },
      "application/timestamp-query": { source: `iana` },
      "application/timestamp-reply": { source: `iana` },
      "application/timestamped-data": { source: `iana`, extensions: [`tsd`] },
      "application/tlsrpt+gzip": { source: `iana` },
      "application/tlsrpt+json": { source: `iana`, compressible: !0 },
      "application/tnauthlist": { source: `iana` },
      "application/token-introspection+jwt": { source: `iana` },
      "application/toml": { compressible: !0, extensions: [`toml`] },
      "application/trickle-ice-sdpfrag": { source: `iana` },
      "application/trig": { source: `iana`, extensions: [`trig`] },
      "application/ttml+xml": { source: `iana`, compressible: !0, extensions: [`ttml`] },
      "application/tve-trigger": { source: `iana` },
      "application/tzif": { source: `iana` },
      "application/tzif-leap": { source: `iana` },
      "application/ubjson": { compressible: !1, extensions: [`ubj`] },
      "application/ulpfec": { source: `iana` },
      "application/urc-grpsheet+xml": { source: `iana`, compressible: !0 },
      "application/urc-ressheet+xml": { source: `iana`, compressible: !0, extensions: [`rsheet`] },
      "application/urc-targetdesc+xml": { source: `iana`, compressible: !0, extensions: [`td`] },
      "application/urc-uisocketdesc+xml": { source: `iana`, compressible: !0 },
      "application/vcard+json": { source: `iana`, compressible: !0 },
      "application/vcard+xml": { source: `iana`, compressible: !0 },
      "application/vemmi": { source: `iana` },
      "application/vividence.scriptfile": { source: `apache` },
      "application/vnd.1000minds.decision-model+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`1km`],
      },
      "application/vnd.3gpp-prose+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp-prose-pc3ch+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp-v2x-local-service-information": { source: `iana` },
      "application/vnd.3gpp.5gnas": { source: `iana` },
      "application/vnd.3gpp.access-transfer-events+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.bsf+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.gmop+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.gtpc": { source: `iana` },
      "application/vnd.3gpp.interworking-data": { source: `iana` },
      "application/vnd.3gpp.lpp": { source: `iana` },
      "application/vnd.3gpp.mc-signalling-ear": { source: `iana` },
      "application/vnd.3gpp.mcdata-affiliation-command+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcdata-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcdata-payload": { source: `iana` },
      "application/vnd.3gpp.mcdata-service-config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcdata-signalling": { source: `iana` },
      "application/vnd.3gpp.mcdata-ue-config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcdata-user-profile+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-affiliation-command+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-floor-request+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-location-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-mbms-usage-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-service-config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-signed+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-ue-config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-ue-init-config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcptt-user-profile+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-affiliation-command+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-affiliation-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-location-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-service-config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-transmission-request+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-ue-config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mcvideo-user-profile+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.mid-call+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.ngap": { source: `iana` },
      "application/vnd.3gpp.pfcp": { source: `iana` },
      "application/vnd.3gpp.pic-bw-large": { source: `iana`, extensions: [`plb`] },
      "application/vnd.3gpp.pic-bw-small": { source: `iana`, extensions: [`psb`] },
      "application/vnd.3gpp.pic-bw-var": { source: `iana`, extensions: [`pvb`] },
      "application/vnd.3gpp.s1ap": { source: `iana` },
      "application/vnd.3gpp.sms": { source: `iana` },
      "application/vnd.3gpp.sms+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.srvcc-ext+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.srvcc-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.state-and-event-info+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp.ussd+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp2.bcmcsinfo+xml": { source: `iana`, compressible: !0 },
      "application/vnd.3gpp2.sms": { source: `iana` },
      "application/vnd.3gpp2.tcap": { source: `iana`, extensions: [`tcap`] },
      "application/vnd.3lightssoftware.imagescal": { source: `iana` },
      "application/vnd.3m.post-it-notes": { source: `iana`, extensions: [`pwn`] },
      "application/vnd.accpac.simply.aso": { source: `iana`, extensions: [`aso`] },
      "application/vnd.accpac.simply.imp": { source: `iana`, extensions: [`imp`] },
      "application/vnd.acucobol": { source: `iana`, extensions: [`acu`] },
      "application/vnd.acucorp": { source: `iana`, extensions: [`atc`, `acutc`] },
      "application/vnd.adobe.air-application-installer-package+zip": {
        source: `apache`,
        compressible: !1,
        extensions: [`air`],
      },
      "application/vnd.adobe.flash.movie": { source: `iana` },
      "application/vnd.adobe.formscentral.fcdt": { source: `iana`, extensions: [`fcdt`] },
      "application/vnd.adobe.fxp": { source: `iana`, extensions: [`fxp`, `fxpl`] },
      "application/vnd.adobe.partial-upload": { source: `iana` },
      "application/vnd.adobe.xdp+xml": { source: `iana`, compressible: !0, extensions: [`xdp`] },
      "application/vnd.adobe.xfdf": { source: `iana`, extensions: [`xfdf`] },
      "application/vnd.aether.imp": { source: `iana` },
      "application/vnd.afpc.afplinedata": { source: `iana` },
      "application/vnd.afpc.afplinedata-pagedef": { source: `iana` },
      "application/vnd.afpc.cmoca-cmresource": { source: `iana` },
      "application/vnd.afpc.foca-charset": { source: `iana` },
      "application/vnd.afpc.foca-codedfont": { source: `iana` },
      "application/vnd.afpc.foca-codepage": { source: `iana` },
      "application/vnd.afpc.modca": { source: `iana` },
      "application/vnd.afpc.modca-cmtable": { source: `iana` },
      "application/vnd.afpc.modca-formdef": { source: `iana` },
      "application/vnd.afpc.modca-mediummap": { source: `iana` },
      "application/vnd.afpc.modca-objectcontainer": { source: `iana` },
      "application/vnd.afpc.modca-overlay": { source: `iana` },
      "application/vnd.afpc.modca-pagesegment": { source: `iana` },
      "application/vnd.age": { source: `iana`, extensions: [`age`] },
      "application/vnd.ah-barcode": { source: `iana` },
      "application/vnd.ahead.space": { source: `iana`, extensions: [`ahead`] },
      "application/vnd.airzip.filesecure.azf": { source: `iana`, extensions: [`azf`] },
      "application/vnd.airzip.filesecure.azs": { source: `iana`, extensions: [`azs`] },
      "application/vnd.amadeus+json": { source: `iana`, compressible: !0 },
      "application/vnd.amazon.ebook": { source: `apache`, extensions: [`azw`] },
      "application/vnd.amazon.mobi8-ebook": { source: `iana` },
      "application/vnd.americandynamics.acc": { source: `iana`, extensions: [`acc`] },
      "application/vnd.amiga.ami": { source: `iana`, extensions: [`ami`] },
      "application/vnd.amundsen.maze+xml": { source: `iana`, compressible: !0 },
      "application/vnd.android.ota": { source: `iana` },
      "application/vnd.android.package-archive": {
        source: `apache`,
        compressible: !1,
        extensions: [`apk`],
      },
      "application/vnd.anki": { source: `iana` },
      "application/vnd.anser-web-certificate-issue-initiation": {
        source: `iana`,
        extensions: [`cii`],
      },
      "application/vnd.anser-web-funds-transfer-initiation": {
        source: `apache`,
        extensions: [`fti`],
      },
      "application/vnd.antix.game-component": { source: `iana`, extensions: [`atx`] },
      "application/vnd.apache.arrow.file": { source: `iana` },
      "application/vnd.apache.arrow.stream": { source: `iana` },
      "application/vnd.apache.thrift.binary": { source: `iana` },
      "application/vnd.apache.thrift.compact": { source: `iana` },
      "application/vnd.apache.thrift.json": { source: `iana` },
      "application/vnd.api+json": { source: `iana`, compressible: !0 },
      "application/vnd.aplextor.warrp+json": { source: `iana`, compressible: !0 },
      "application/vnd.apothekende.reservation+json": { source: `iana`, compressible: !0 },
      "application/vnd.apple.installer+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`mpkg`],
      },
      "application/vnd.apple.keynote": { source: `iana`, extensions: [`key`] },
      "application/vnd.apple.mpegurl": { source: `iana`, extensions: [`m3u8`] },
      "application/vnd.apple.numbers": { source: `iana`, extensions: [`numbers`] },
      "application/vnd.apple.pages": { source: `iana`, extensions: [`pages`] },
      "application/vnd.apple.pkpass": { compressible: !1, extensions: [`pkpass`] },
      "application/vnd.arastra.swi": { source: `iana` },
      "application/vnd.aristanetworks.swi": { source: `iana`, extensions: [`swi`] },
      "application/vnd.artisan+json": { source: `iana`, compressible: !0 },
      "application/vnd.artsquare": { source: `iana` },
      "application/vnd.astraea-software.iota": { source: `iana`, extensions: [`iota`] },
      "application/vnd.audiograph": { source: `iana`, extensions: [`aep`] },
      "application/vnd.autopackage": { source: `iana` },
      "application/vnd.avalon+json": { source: `iana`, compressible: !0 },
      "application/vnd.avistar+xml": { source: `iana`, compressible: !0 },
      "application/vnd.balsamiq.bmml+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`bmml`],
      },
      "application/vnd.balsamiq.bmpr": { source: `iana` },
      "application/vnd.banana-accounting": { source: `iana` },
      "application/vnd.bbf.usp.error": { source: `iana` },
      "application/vnd.bbf.usp.msg": { source: `iana` },
      "application/vnd.bbf.usp.msg+json": { source: `iana`, compressible: !0 },
      "application/vnd.bekitzur-stech+json": { source: `iana`, compressible: !0 },
      "application/vnd.bint.med-content": { source: `iana` },
      "application/vnd.biopax.rdf+xml": { source: `iana`, compressible: !0 },
      "application/vnd.blink-idb-value-wrapper": { source: `iana` },
      "application/vnd.blueice.multipass": { source: `iana`, extensions: [`mpm`] },
      "application/vnd.bluetooth.ep.oob": { source: `iana` },
      "application/vnd.bluetooth.le.oob": { source: `iana` },
      "application/vnd.bmi": { source: `iana`, extensions: [`bmi`] },
      "application/vnd.bpf": { source: `iana` },
      "application/vnd.bpf3": { source: `iana` },
      "application/vnd.businessobjects": { source: `iana`, extensions: [`rep`] },
      "application/vnd.byu.uapi+json": { source: `iana`, compressible: !0 },
      "application/vnd.cab-jscript": { source: `iana` },
      "application/vnd.canon-cpdl": { source: `iana` },
      "application/vnd.canon-lips": { source: `iana` },
      "application/vnd.capasystems-pg+json": { source: `iana`, compressible: !0 },
      "application/vnd.cendio.thinlinc.clientconf": { source: `iana` },
      "application/vnd.century-systems.tcp_stream": { source: `iana` },
      "application/vnd.chemdraw+xml": { source: `iana`, compressible: !0, extensions: [`cdxml`] },
      "application/vnd.chess-pgn": { source: `iana` },
      "application/vnd.chipnuts.karaoke-mmd": { source: `iana`, extensions: [`mmd`] },
      "application/vnd.ciedi": { source: `iana` },
      "application/vnd.cinderella": { source: `iana`, extensions: [`cdy`] },
      "application/vnd.cirpack.isdn-ext": { source: `iana` },
      "application/vnd.citationstyles.style+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`csl`],
      },
      "application/vnd.claymore": { source: `iana`, extensions: [`cla`] },
      "application/vnd.cloanto.rp9": { source: `iana`, extensions: [`rp9`] },
      "application/vnd.clonk.c4group": {
        source: `iana`,
        extensions: [`c4g`, `c4d`, `c4f`, `c4p`, `c4u`],
      },
      "application/vnd.cluetrust.cartomobile-config": { source: `iana`, extensions: [`c11amc`] },
      "application/vnd.cluetrust.cartomobile-config-pkg": {
        source: `iana`,
        extensions: [`c11amz`],
      },
      "application/vnd.coffeescript": { source: `iana` },
      "application/vnd.collabio.xodocuments.document": { source: `iana` },
      "application/vnd.collabio.xodocuments.document-template": { source: `iana` },
      "application/vnd.collabio.xodocuments.presentation": { source: `iana` },
      "application/vnd.collabio.xodocuments.presentation-template": { source: `iana` },
      "application/vnd.collabio.xodocuments.spreadsheet": { source: `iana` },
      "application/vnd.collabio.xodocuments.spreadsheet-template": { source: `iana` },
      "application/vnd.collection+json": { source: `iana`, compressible: !0 },
      "application/vnd.collection.doc+json": { source: `iana`, compressible: !0 },
      "application/vnd.collection.next+json": { source: `iana`, compressible: !0 },
      "application/vnd.comicbook+zip": { source: `iana`, compressible: !1 },
      "application/vnd.comicbook-rar": { source: `iana` },
      "application/vnd.commerce-battelle": { source: `iana` },
      "application/vnd.commonspace": { source: `iana`, extensions: [`csp`] },
      "application/vnd.contact.cmsg": { source: `iana`, extensions: [`cdbcmsg`] },
      "application/vnd.coreos.ignition+json": { source: `iana`, compressible: !0 },
      "application/vnd.cosmocaller": { source: `iana`, extensions: [`cmc`] },
      "application/vnd.crick.clicker": { source: `iana`, extensions: [`clkx`] },
      "application/vnd.crick.clicker.keyboard": { source: `iana`, extensions: [`clkk`] },
      "application/vnd.crick.clicker.palette": { source: `iana`, extensions: [`clkp`] },
      "application/vnd.crick.clicker.template": { source: `iana`, extensions: [`clkt`] },
      "application/vnd.crick.clicker.wordbank": { source: `iana`, extensions: [`clkw`] },
      "application/vnd.criticaltools.wbs+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`wbs`],
      },
      "application/vnd.cryptii.pipe+json": { source: `iana`, compressible: !0 },
      "application/vnd.crypto-shade-file": { source: `iana` },
      "application/vnd.cryptomator.encrypted": { source: `iana` },
      "application/vnd.cryptomator.vault": { source: `iana` },
      "application/vnd.ctc-posml": { source: `iana`, extensions: [`pml`] },
      "application/vnd.ctct.ws+xml": { source: `iana`, compressible: !0 },
      "application/vnd.cups-pdf": { source: `iana` },
      "application/vnd.cups-postscript": { source: `iana` },
      "application/vnd.cups-ppd": { source: `iana`, extensions: [`ppd`] },
      "application/vnd.cups-raster": { source: `iana` },
      "application/vnd.cups-raw": { source: `iana` },
      "application/vnd.curl": { source: `iana` },
      "application/vnd.curl.car": { source: `apache`, extensions: [`car`] },
      "application/vnd.curl.pcurl": { source: `apache`, extensions: [`pcurl`] },
      "application/vnd.cyan.dean.root+xml": { source: `iana`, compressible: !0 },
      "application/vnd.cybank": { source: `iana` },
      "application/vnd.cyclonedx+json": { source: `iana`, compressible: !0 },
      "application/vnd.cyclonedx+xml": { source: `iana`, compressible: !0 },
      "application/vnd.d2l.coursepackage1p0+zip": { source: `iana`, compressible: !1 },
      "application/vnd.d3m-dataset": { source: `iana` },
      "application/vnd.d3m-problem": { source: `iana` },
      "application/vnd.dart": { source: `iana`, compressible: !0, extensions: [`dart`] },
      "application/vnd.data-vision.rdz": { source: `iana`, extensions: [`rdz`] },
      "application/vnd.datapackage+json": { source: `iana`, compressible: !0 },
      "application/vnd.dataresource+json": { source: `iana`, compressible: !0 },
      "application/vnd.dbf": { source: `iana`, extensions: [`dbf`] },
      "application/vnd.debian.binary-package": { source: `iana` },
      "application/vnd.dece.data": { source: `iana`, extensions: [`uvf`, `uvvf`, `uvd`, `uvvd`] },
      "application/vnd.dece.ttml+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`uvt`, `uvvt`],
      },
      "application/vnd.dece.unspecified": { source: `iana`, extensions: [`uvx`, `uvvx`] },
      "application/vnd.dece.zip": { source: `iana`, extensions: [`uvz`, `uvvz`] },
      "application/vnd.denovo.fcselayout-link": { source: `iana`, extensions: [`fe_launch`] },
      "application/vnd.desmume.movie": { source: `iana` },
      "application/vnd.dir-bi.plate-dl-nosuffix": { source: `iana` },
      "application/vnd.dm.delegation+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dna": { source: `iana`, extensions: [`dna`] },
      "application/vnd.document+json": { source: `iana`, compressible: !0 },
      "application/vnd.dolby.mlp": { source: `apache`, extensions: [`mlp`] },
      "application/vnd.dolby.mobile.1": { source: `iana` },
      "application/vnd.dolby.mobile.2": { source: `iana` },
      "application/vnd.doremir.scorecloud-binary-document": { source: `iana` },
      "application/vnd.dpgraph": { source: `iana`, extensions: [`dpg`] },
      "application/vnd.dreamfactory": { source: `iana`, extensions: [`dfac`] },
      "application/vnd.drive+json": { source: `iana`, compressible: !0 },
      "application/vnd.ds-keypoint": { source: `apache`, extensions: [`kpxx`] },
      "application/vnd.dtg.local": { source: `iana` },
      "application/vnd.dtg.local.flash": { source: `iana` },
      "application/vnd.dtg.local.html": { source: `iana` },
      "application/vnd.dvb.ait": { source: `iana`, extensions: [`ait`] },
      "application/vnd.dvb.dvbisl+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dvb.dvbj": { source: `iana` },
      "application/vnd.dvb.esgcontainer": { source: `iana` },
      "application/vnd.dvb.ipdcdftnotifaccess": { source: `iana` },
      "application/vnd.dvb.ipdcesgaccess": { source: `iana` },
      "application/vnd.dvb.ipdcesgaccess2": { source: `iana` },
      "application/vnd.dvb.ipdcesgpdd": { source: `iana` },
      "application/vnd.dvb.ipdcroaming": { source: `iana` },
      "application/vnd.dvb.iptv.alfec-base": { source: `iana` },
      "application/vnd.dvb.iptv.alfec-enhancement": { source: `iana` },
      "application/vnd.dvb.notif-aggregate-root+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dvb.notif-container+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dvb.notif-generic+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dvb.notif-ia-msglist+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dvb.notif-ia-registration-request+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dvb.notif-ia-registration-response+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.dvb.notif-init+xml": { source: `iana`, compressible: !0 },
      "application/vnd.dvb.pfr": { source: `iana` },
      "application/vnd.dvb.service": { source: `iana`, extensions: [`svc`] },
      "application/vnd.dxr": { source: `iana` },
      "application/vnd.dynageo": { source: `iana`, extensions: [`geo`] },
      "application/vnd.dzr": { source: `iana` },
      "application/vnd.easykaraoke.cdgdownload": { source: `iana` },
      "application/vnd.ecdis-update": { source: `iana` },
      "application/vnd.ecip.rlp": { source: `iana` },
      "application/vnd.eclipse.ditto+json": { source: `iana`, compressible: !0 },
      "application/vnd.ecowin.chart": { source: `iana`, extensions: [`mag`] },
      "application/vnd.ecowin.filerequest": { source: `iana` },
      "application/vnd.ecowin.fileupdate": { source: `iana` },
      "application/vnd.ecowin.series": { source: `iana` },
      "application/vnd.ecowin.seriesrequest": { source: `iana` },
      "application/vnd.ecowin.seriesupdate": { source: `iana` },
      "application/vnd.efi.img": { source: `iana` },
      "application/vnd.efi.iso": { source: `iana` },
      "application/vnd.emclient.accessrequest+xml": { source: `iana`, compressible: !0 },
      "application/vnd.enliven": { source: `iana`, extensions: [`nml`] },
      "application/vnd.enphase.envoy": { source: `iana` },
      "application/vnd.eprints.data+xml": { source: `iana`, compressible: !0 },
      "application/vnd.epson.esf": { source: `iana`, extensions: [`esf`] },
      "application/vnd.epson.msf": { source: `iana`, extensions: [`msf`] },
      "application/vnd.epson.quickanime": { source: `iana`, extensions: [`qam`] },
      "application/vnd.epson.salt": { source: `iana`, extensions: [`slt`] },
      "application/vnd.epson.ssf": { source: `iana`, extensions: [`ssf`] },
      "application/vnd.ericsson.quickcall": { source: `iana` },
      "application/vnd.espass-espass+zip": { source: `iana`, compressible: !1 },
      "application/vnd.eszigno3+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`es3`, `et3`],
      },
      "application/vnd.etsi.aoc+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.asic-e+zip": { source: `iana`, compressible: !1 },
      "application/vnd.etsi.asic-s+zip": { source: `iana`, compressible: !1 },
      "application/vnd.etsi.cug+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvcommand+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvdiscovery+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvprofile+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvsad-bc+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvsad-cod+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvsad-npvr+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvservice+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvsync+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.iptvueprofile+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.mcid+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.mheg5": { source: `iana` },
      "application/vnd.etsi.overload-control-policy-dataset+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.etsi.pstn+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.sci+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.simservs+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.timestamp-token": { source: `iana` },
      "application/vnd.etsi.tsl+xml": { source: `iana`, compressible: !0 },
      "application/vnd.etsi.tsl.der": { source: `iana` },
      "application/vnd.eu.kasparian.car+json": { source: `iana`, compressible: !0 },
      "application/vnd.eudora.data": { source: `iana` },
      "application/vnd.evolv.ecig.profile": { source: `iana` },
      "application/vnd.evolv.ecig.settings": { source: `iana` },
      "application/vnd.evolv.ecig.theme": { source: `iana` },
      "application/vnd.exstream-empower+zip": { source: `iana`, compressible: !1 },
      "application/vnd.exstream-package": { source: `iana` },
      "application/vnd.ezpix-album": { source: `iana`, extensions: [`ez2`] },
      "application/vnd.ezpix-package": { source: `iana`, extensions: [`ez3`] },
      "application/vnd.f-secure.mobile": { source: `iana` },
      "application/vnd.familysearch.gedcom+zip": { source: `iana`, compressible: !1 },
      "application/vnd.fastcopy-disk-image": { source: `iana` },
      "application/vnd.fdf": { source: `iana`, extensions: [`fdf`] },
      "application/vnd.fdsn.mseed": { source: `iana`, extensions: [`mseed`] },
      "application/vnd.fdsn.seed": { source: `iana`, extensions: [`seed`, `dataless`] },
      "application/vnd.ffsns": { source: `iana` },
      "application/vnd.ficlab.flb+zip": { source: `iana`, compressible: !1 },
      "application/vnd.filmit.zfc": { source: `iana` },
      "application/vnd.fints": { source: `iana` },
      "application/vnd.firemonkeys.cloudcell": { source: `iana` },
      "application/vnd.flographit": { source: `iana`, extensions: [`gph`] },
      "application/vnd.fluxtime.clip": { source: `iana`, extensions: [`ftc`] },
      "application/vnd.font-fontforge-sfd": { source: `iana` },
      "application/vnd.framemaker": {
        source: `iana`,
        extensions: [`fm`, `frame`, `maker`, `book`],
      },
      "application/vnd.frogans.fnc": { source: `iana`, extensions: [`fnc`] },
      "application/vnd.frogans.ltf": { source: `iana`, extensions: [`ltf`] },
      "application/vnd.fsc.weblaunch": { source: `iana`, extensions: [`fsc`] },
      "application/vnd.fujifilm.fb.docuworks": { source: `iana` },
      "application/vnd.fujifilm.fb.docuworks.binder": { source: `iana` },
      "application/vnd.fujifilm.fb.docuworks.container": { source: `iana` },
      "application/vnd.fujifilm.fb.jfi+xml": { source: `iana`, compressible: !0 },
      "application/vnd.fujitsu.oasys": { source: `iana`, extensions: [`oas`] },
      "application/vnd.fujitsu.oasys2": { source: `iana`, extensions: [`oa2`] },
      "application/vnd.fujitsu.oasys3": { source: `iana`, extensions: [`oa3`] },
      "application/vnd.fujitsu.oasysgp": { source: `iana`, extensions: [`fg5`] },
      "application/vnd.fujitsu.oasysprs": { source: `iana`, extensions: [`bh2`] },
      "application/vnd.fujixerox.art-ex": { source: `iana` },
      "application/vnd.fujixerox.art4": { source: `iana` },
      "application/vnd.fujixerox.ddd": { source: `iana`, extensions: [`ddd`] },
      "application/vnd.fujixerox.docuworks": { source: `iana`, extensions: [`xdw`] },
      "application/vnd.fujixerox.docuworks.binder": { source: `iana`, extensions: [`xbd`] },
      "application/vnd.fujixerox.docuworks.container": { source: `iana` },
      "application/vnd.fujixerox.hbpl": { source: `iana` },
      "application/vnd.fut-misnet": { source: `iana` },
      "application/vnd.futoin+cbor": { source: `iana` },
      "application/vnd.futoin+json": { source: `iana`, compressible: !0 },
      "application/vnd.fuzzysheet": { source: `iana`, extensions: [`fzs`] },
      "application/vnd.genomatix.tuxedo": { source: `iana`, extensions: [`txd`] },
      "application/vnd.gentics.grd+json": { source: `iana`, compressible: !0 },
      "application/vnd.geo+json": { source: `iana`, compressible: !0 },
      "application/vnd.geocube+xml": { source: `iana`, compressible: !0 },
      "application/vnd.geogebra.file": { source: `iana`, extensions: [`ggb`] },
      "application/vnd.geogebra.slides": { source: `iana` },
      "application/vnd.geogebra.tool": { source: `iana`, extensions: [`ggt`] },
      "application/vnd.geometry-explorer": { source: `iana`, extensions: [`gex`, `gre`] },
      "application/vnd.geonext": { source: `iana`, extensions: [`gxt`] },
      "application/vnd.geoplan": { source: `iana`, extensions: [`g2w`] },
      "application/vnd.geospace": { source: `iana`, extensions: [`g3w`] },
      "application/vnd.gerber": { source: `iana` },
      "application/vnd.globalplatform.card-content-mgt": { source: `iana` },
      "application/vnd.globalplatform.card-content-mgt-response": { source: `iana` },
      "application/vnd.gmx": { source: `iana`, extensions: [`gmx`] },
      "application/vnd.google-apps.document": { compressible: !1, extensions: [`gdoc`] },
      "application/vnd.google-apps.presentation": { compressible: !1, extensions: [`gslides`] },
      "application/vnd.google-apps.spreadsheet": { compressible: !1, extensions: [`gsheet`] },
      "application/vnd.google-earth.kml+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`kml`],
      },
      "application/vnd.google-earth.kmz": { source: `iana`, compressible: !1, extensions: [`kmz`] },
      "application/vnd.gov.sk.e-form+xml": { source: `iana`, compressible: !0 },
      "application/vnd.gov.sk.e-form+zip": { source: `iana`, compressible: !1 },
      "application/vnd.gov.sk.xmldatacontainer+xml": { source: `iana`, compressible: !0 },
      "application/vnd.grafeq": { source: `iana`, extensions: [`gqf`, `gqs`] },
      "application/vnd.gridmp": { source: `iana` },
      "application/vnd.groove-account": { source: `iana`, extensions: [`gac`] },
      "application/vnd.groove-help": { source: `iana`, extensions: [`ghf`] },
      "application/vnd.groove-identity-message": { source: `iana`, extensions: [`gim`] },
      "application/vnd.groove-injector": { source: `iana`, extensions: [`grv`] },
      "application/vnd.groove-tool-message": { source: `iana`, extensions: [`gtm`] },
      "application/vnd.groove-tool-template": { source: `iana`, extensions: [`tpl`] },
      "application/vnd.groove-vcard": { source: `iana`, extensions: [`vcg`] },
      "application/vnd.hal+json": { source: `iana`, compressible: !0 },
      "application/vnd.hal+xml": { source: `iana`, compressible: !0, extensions: [`hal`] },
      "application/vnd.handheld-entertainment+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`zmm`],
      },
      "application/vnd.hbci": { source: `iana`, extensions: [`hbci`] },
      "application/vnd.hc+json": { source: `iana`, compressible: !0 },
      "application/vnd.hcl-bireports": { source: `iana` },
      "application/vnd.hdt": { source: `iana` },
      "application/vnd.heroku+json": { source: `iana`, compressible: !0 },
      "application/vnd.hhe.lesson-player": { source: `iana`, extensions: [`les`] },
      "application/vnd.hl7cda+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/vnd.hl7v2+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/vnd.hp-hpgl": { source: `iana`, extensions: [`hpgl`] },
      "application/vnd.hp-hpid": { source: `iana`, extensions: [`hpid`] },
      "application/vnd.hp-hps": { source: `iana`, extensions: [`hps`] },
      "application/vnd.hp-jlyt": { source: `iana`, extensions: [`jlt`] },
      "application/vnd.hp-pcl": { source: `iana`, extensions: [`pcl`] },
      "application/vnd.hp-pclxl": { source: `iana`, extensions: [`pclxl`] },
      "application/vnd.httphone": { source: `iana` },
      "application/vnd.hydrostatix.sof-data": { source: `iana`, extensions: [`sfd-hdstx`] },
      "application/vnd.hyper+json": { source: `iana`, compressible: !0 },
      "application/vnd.hyper-item+json": { source: `iana`, compressible: !0 },
      "application/vnd.hyperdrive+json": { source: `iana`, compressible: !0 },
      "application/vnd.hzn-3d-crossword": { source: `iana` },
      "application/vnd.ibm.afplinedata": { source: `iana` },
      "application/vnd.ibm.electronic-media": { source: `iana` },
      "application/vnd.ibm.minipay": { source: `iana`, extensions: [`mpy`] },
      "application/vnd.ibm.modcap": { source: `iana`, extensions: [`afp`, `listafp`, `list3820`] },
      "application/vnd.ibm.rights-management": { source: `iana`, extensions: [`irm`] },
      "application/vnd.ibm.secure-container": { source: `iana`, extensions: [`sc`] },
      "application/vnd.iccprofile": { source: `iana`, extensions: [`icc`, `icm`] },
      "application/vnd.ieee.1905": { source: `iana` },
      "application/vnd.igloader": { source: `iana`, extensions: [`igl`] },
      "application/vnd.imagemeter.folder+zip": { source: `iana`, compressible: !1 },
      "application/vnd.imagemeter.image+zip": { source: `iana`, compressible: !1 },
      "application/vnd.immervision-ivp": { source: `iana`, extensions: [`ivp`] },
      "application/vnd.immervision-ivu": { source: `iana`, extensions: [`ivu`] },
      "application/vnd.ims.imsccv1p1": { source: `iana` },
      "application/vnd.ims.imsccv1p2": { source: `iana` },
      "application/vnd.ims.imsccv1p3": { source: `iana` },
      "application/vnd.ims.lis.v2.result+json": { source: `iana`, compressible: !0 },
      "application/vnd.ims.lti.v2.toolconsumerprofile+json": { source: `iana`, compressible: !0 },
      "application/vnd.ims.lti.v2.toolproxy+json": { source: `iana`, compressible: !0 },
      "application/vnd.ims.lti.v2.toolproxy.id+json": { source: `iana`, compressible: !0 },
      "application/vnd.ims.lti.v2.toolsettings+json": { source: `iana`, compressible: !0 },
      "application/vnd.ims.lti.v2.toolsettings.simple+json": { source: `iana`, compressible: !0 },
      "application/vnd.informedcontrol.rms+xml": { source: `iana`, compressible: !0 },
      "application/vnd.informix-visionary": { source: `iana` },
      "application/vnd.infotech.project": { source: `iana` },
      "application/vnd.infotech.project+xml": { source: `iana`, compressible: !0 },
      "application/vnd.innopath.wamp.notification": { source: `iana` },
      "application/vnd.insors.igm": { source: `iana`, extensions: [`igm`] },
      "application/vnd.intercon.formnet": { source: `iana`, extensions: [`xpw`, `xpx`] },
      "application/vnd.intergeo": { source: `iana`, extensions: [`i2g`] },
      "application/vnd.intertrust.digibox": { source: `iana` },
      "application/vnd.intertrust.nncp": { source: `iana` },
      "application/vnd.intu.qbo": { source: `iana`, extensions: [`qbo`] },
      "application/vnd.intu.qfx": { source: `iana`, extensions: [`qfx`] },
      "application/vnd.iptc.g2.catalogitem+xml": { source: `iana`, compressible: !0 },
      "application/vnd.iptc.g2.conceptitem+xml": { source: `iana`, compressible: !0 },
      "application/vnd.iptc.g2.knowledgeitem+xml": { source: `iana`, compressible: !0 },
      "application/vnd.iptc.g2.newsitem+xml": { source: `iana`, compressible: !0 },
      "application/vnd.iptc.g2.newsmessage+xml": { source: `iana`, compressible: !0 },
      "application/vnd.iptc.g2.packageitem+xml": { source: `iana`, compressible: !0 },
      "application/vnd.iptc.g2.planningitem+xml": { source: `iana`, compressible: !0 },
      "application/vnd.ipunplugged.rcprofile": { source: `iana`, extensions: [`rcprofile`] },
      "application/vnd.irepository.package+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`irp`],
      },
      "application/vnd.is-xpr": { source: `iana`, extensions: [`xpr`] },
      "application/vnd.isac.fcs": { source: `iana`, extensions: [`fcs`] },
      "application/vnd.iso11783-10+zip": { source: `iana`, compressible: !1 },
      "application/vnd.jam": { source: `iana`, extensions: [`jam`] },
      "application/vnd.japannet-directory-service": { source: `iana` },
      "application/vnd.japannet-jpnstore-wakeup": { source: `iana` },
      "application/vnd.japannet-payment-wakeup": { source: `iana` },
      "application/vnd.japannet-registration": { source: `iana` },
      "application/vnd.japannet-registration-wakeup": { source: `iana` },
      "application/vnd.japannet-setstore-wakeup": { source: `iana` },
      "application/vnd.japannet-verification": { source: `iana` },
      "application/vnd.japannet-verification-wakeup": { source: `iana` },
      "application/vnd.jcp.javame.midlet-rms": { source: `iana`, extensions: [`rms`] },
      "application/vnd.jisp": { source: `iana`, extensions: [`jisp`] },
      "application/vnd.joost.joda-archive": { source: `iana`, extensions: [`joda`] },
      "application/vnd.jsk.isdn-ngn": { source: `iana` },
      "application/vnd.kahootz": { source: `iana`, extensions: [`ktz`, `ktr`] },
      "application/vnd.kde.karbon": { source: `iana`, extensions: [`karbon`] },
      "application/vnd.kde.kchart": { source: `iana`, extensions: [`chrt`] },
      "application/vnd.kde.kformula": { source: `iana`, extensions: [`kfo`] },
      "application/vnd.kde.kivio": { source: `iana`, extensions: [`flw`] },
      "application/vnd.kde.kontour": { source: `iana`, extensions: [`kon`] },
      "application/vnd.kde.kpresenter": { source: `iana`, extensions: [`kpr`, `kpt`] },
      "application/vnd.kde.kspread": { source: `iana`, extensions: [`ksp`] },
      "application/vnd.kde.kword": { source: `iana`, extensions: [`kwd`, `kwt`] },
      "application/vnd.kenameaapp": { source: `iana`, extensions: [`htke`] },
      "application/vnd.kidspiration": { source: `iana`, extensions: [`kia`] },
      "application/vnd.kinar": { source: `iana`, extensions: [`kne`, `knp`] },
      "application/vnd.koan": { source: `iana`, extensions: [`skp`, `skd`, `skt`, `skm`] },
      "application/vnd.kodak-descriptor": { source: `iana`, extensions: [`sse`] },
      "application/vnd.las": { source: `iana` },
      "application/vnd.las.las+json": { source: `iana`, compressible: !0 },
      "application/vnd.las.las+xml": { source: `iana`, compressible: !0, extensions: [`lasxml`] },
      "application/vnd.laszip": { source: `iana` },
      "application/vnd.leap+json": { source: `iana`, compressible: !0 },
      "application/vnd.liberty-request+xml": { source: `iana`, compressible: !0 },
      "application/vnd.llamagraphics.life-balance.desktop": { source: `iana`, extensions: [`lbd`] },
      "application/vnd.llamagraphics.life-balance.exchange+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`lbe`],
      },
      "application/vnd.logipipe.circuit+zip": { source: `iana`, compressible: !1 },
      "application/vnd.loom": { source: `iana` },
      "application/vnd.lotus-1-2-3": { source: `iana`, extensions: [`123`] },
      "application/vnd.lotus-approach": { source: `iana`, extensions: [`apr`] },
      "application/vnd.lotus-freelance": { source: `iana`, extensions: [`pre`] },
      "application/vnd.lotus-notes": { source: `iana`, extensions: [`nsf`] },
      "application/vnd.lotus-organizer": { source: `iana`, extensions: [`org`] },
      "application/vnd.lotus-screencam": { source: `iana`, extensions: [`scm`] },
      "application/vnd.lotus-wordpro": { source: `iana`, extensions: [`lwp`] },
      "application/vnd.macports.portpkg": { source: `iana`, extensions: [`portpkg`] },
      "application/vnd.mapbox-vector-tile": { source: `iana`, extensions: [`mvt`] },
      "application/vnd.marlin.drm.actiontoken+xml": { source: `iana`, compressible: !0 },
      "application/vnd.marlin.drm.conftoken+xml": { source: `iana`, compressible: !0 },
      "application/vnd.marlin.drm.license+xml": { source: `iana`, compressible: !0 },
      "application/vnd.marlin.drm.mdcf": { source: `iana` },
      "application/vnd.mason+json": { source: `iana`, compressible: !0 },
      "application/vnd.maxar.archive.3tz+zip": { source: `iana`, compressible: !1 },
      "application/vnd.maxmind.maxmind-db": { source: `iana` },
      "application/vnd.mcd": { source: `iana`, extensions: [`mcd`] },
      "application/vnd.medcalcdata": { source: `iana`, extensions: [`mc1`] },
      "application/vnd.mediastation.cdkey": { source: `iana`, extensions: [`cdkey`] },
      "application/vnd.meridian-slingshot": { source: `iana` },
      "application/vnd.mfer": { source: `iana`, extensions: [`mwf`] },
      "application/vnd.mfmp": { source: `iana`, extensions: [`mfm`] },
      "application/vnd.micro+json": { source: `iana`, compressible: !0 },
      "application/vnd.micrografx.flo": { source: `iana`, extensions: [`flo`] },
      "application/vnd.micrografx.igx": { source: `iana`, extensions: [`igx`] },
      "application/vnd.microsoft.portable-executable": { source: `iana` },
      "application/vnd.microsoft.windows.thumbnail-cache": { source: `iana` },
      "application/vnd.miele+json": { source: `iana`, compressible: !0 },
      "application/vnd.mif": { source: `iana`, extensions: [`mif`] },
      "application/vnd.minisoft-hp3000-save": { source: `iana` },
      "application/vnd.mitsubishi.misty-guard.trustweb": { source: `iana` },
      "application/vnd.mobius.daf": { source: `iana`, extensions: [`daf`] },
      "application/vnd.mobius.dis": { source: `iana`, extensions: [`dis`] },
      "application/vnd.mobius.mbk": { source: `iana`, extensions: [`mbk`] },
      "application/vnd.mobius.mqy": { source: `iana`, extensions: [`mqy`] },
      "application/vnd.mobius.msl": { source: `iana`, extensions: [`msl`] },
      "application/vnd.mobius.plc": { source: `iana`, extensions: [`plc`] },
      "application/vnd.mobius.txf": { source: `iana`, extensions: [`txf`] },
      "application/vnd.mophun.application": { source: `iana`, extensions: [`mpn`] },
      "application/vnd.mophun.certificate": { source: `iana`, extensions: [`mpc`] },
      "application/vnd.motorola.flexsuite": { source: `iana` },
      "application/vnd.motorola.flexsuite.adsi": { source: `iana` },
      "application/vnd.motorola.flexsuite.fis": { source: `iana` },
      "application/vnd.motorola.flexsuite.gotap": { source: `iana` },
      "application/vnd.motorola.flexsuite.kmr": { source: `iana` },
      "application/vnd.motorola.flexsuite.ttc": { source: `iana` },
      "application/vnd.motorola.flexsuite.wem": { source: `iana` },
      "application/vnd.motorola.iprm": { source: `iana` },
      "application/vnd.mozilla.xul+xml": { source: `iana`, compressible: !0, extensions: [`xul`] },
      "application/vnd.ms-3mfdocument": { source: `iana` },
      "application/vnd.ms-artgalry": { source: `iana`, extensions: [`cil`] },
      "application/vnd.ms-asf": { source: `iana` },
      "application/vnd.ms-cab-compressed": { source: `iana`, extensions: [`cab`] },
      "application/vnd.ms-color.iccprofile": { source: `apache` },
      "application/vnd.ms-excel": {
        source: `iana`,
        compressible: !1,
        extensions: [`xls`, `xlm`, `xla`, `xlc`, `xlt`, `xlw`],
      },
      "application/vnd.ms-excel.addin.macroenabled.12": { source: `iana`, extensions: [`xlam`] },
      "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
        source: `iana`,
        extensions: [`xlsb`],
      },
      "application/vnd.ms-excel.sheet.macroenabled.12": { source: `iana`, extensions: [`xlsm`] },
      "application/vnd.ms-excel.template.macroenabled.12": { source: `iana`, extensions: [`xltm`] },
      "application/vnd.ms-fontobject": { source: `iana`, compressible: !0, extensions: [`eot`] },
      "application/vnd.ms-htmlhelp": { source: `iana`, extensions: [`chm`] },
      "application/vnd.ms-ims": { source: `iana`, extensions: [`ims`] },
      "application/vnd.ms-lrm": { source: `iana`, extensions: [`lrm`] },
      "application/vnd.ms-office.activex+xml": { source: `iana`, compressible: !0 },
      "application/vnd.ms-officetheme": { source: `iana`, extensions: [`thmx`] },
      "application/vnd.ms-opentype": { source: `apache`, compressible: !0 },
      "application/vnd.ms-outlook": { compressible: !1, extensions: [`msg`] },
      "application/vnd.ms-package.obfuscated-opentype": { source: `apache` },
      "application/vnd.ms-pki.seccat": { source: `apache`, extensions: [`cat`] },
      "application/vnd.ms-pki.stl": { source: `apache`, extensions: [`stl`] },
      "application/vnd.ms-playready.initiator+xml": { source: `iana`, compressible: !0 },
      "application/vnd.ms-powerpoint": {
        source: `iana`,
        compressible: !1,
        extensions: [`ppt`, `pps`, `pot`],
      },
      "application/vnd.ms-powerpoint.addin.macroenabled.12": {
        source: `iana`,
        extensions: [`ppam`],
      },
      "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
        source: `iana`,
        extensions: [`pptm`],
      },
      "application/vnd.ms-powerpoint.slide.macroenabled.12": {
        source: `iana`,
        extensions: [`sldm`],
      },
      "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
        source: `iana`,
        extensions: [`ppsm`],
      },
      "application/vnd.ms-powerpoint.template.macroenabled.12": {
        source: `iana`,
        extensions: [`potm`],
      },
      "application/vnd.ms-printdevicecapabilities+xml": { source: `iana`, compressible: !0 },
      "application/vnd.ms-printing.printticket+xml": { source: `apache`, compressible: !0 },
      "application/vnd.ms-printschematicket+xml": { source: `iana`, compressible: !0 },
      "application/vnd.ms-project": { source: `iana`, extensions: [`mpp`, `mpt`] },
      "application/vnd.ms-tnef": { source: `iana` },
      "application/vnd.ms-windows.devicepairing": { source: `iana` },
      "application/vnd.ms-windows.nwprinting.oob": { source: `iana` },
      "application/vnd.ms-windows.printerpairing": { source: `iana` },
      "application/vnd.ms-windows.wsd.oob": { source: `iana` },
      "application/vnd.ms-wmdrm.lic-chlg-req": { source: `iana` },
      "application/vnd.ms-wmdrm.lic-resp": { source: `iana` },
      "application/vnd.ms-wmdrm.meter-chlg-req": { source: `iana` },
      "application/vnd.ms-wmdrm.meter-resp": { source: `iana` },
      "application/vnd.ms-word.document.macroenabled.12": { source: `iana`, extensions: [`docm`] },
      "application/vnd.ms-word.template.macroenabled.12": { source: `iana`, extensions: [`dotm`] },
      "application/vnd.ms-works": { source: `iana`, extensions: [`wps`, `wks`, `wcm`, `wdb`] },
      "application/vnd.ms-wpl": { source: `iana`, extensions: [`wpl`] },
      "application/vnd.ms-xpsdocument": { source: `iana`, compressible: !1, extensions: [`xps`] },
      "application/vnd.msa-disk-image": { source: `iana` },
      "application/vnd.mseq": { source: `iana`, extensions: [`mseq`] },
      "application/vnd.msign": { source: `iana` },
      "application/vnd.multiad.creator": { source: `iana` },
      "application/vnd.multiad.creator.cif": { source: `iana` },
      "application/vnd.music-niff": { source: `iana` },
      "application/vnd.musician": { source: `iana`, extensions: [`mus`] },
      "application/vnd.muvee.style": { source: `iana`, extensions: [`msty`] },
      "application/vnd.mynfc": { source: `iana`, extensions: [`taglet`] },
      "application/vnd.nacamar.ybrid+json": { source: `iana`, compressible: !0 },
      "application/vnd.ncd.control": { source: `iana` },
      "application/vnd.ncd.reference": { source: `iana` },
      "application/vnd.nearst.inv+json": { source: `iana`, compressible: !0 },
      "application/vnd.nebumind.line": { source: `iana` },
      "application/vnd.nervana": { source: `iana` },
      "application/vnd.netfpx": { source: `iana` },
      "application/vnd.neurolanguage.nlu": { source: `iana`, extensions: [`nlu`] },
      "application/vnd.nimn": { source: `iana` },
      "application/vnd.nintendo.nitro.rom": { source: `iana` },
      "application/vnd.nintendo.snes.rom": { source: `iana` },
      "application/vnd.nitf": { source: `iana`, extensions: [`ntf`, `nitf`] },
      "application/vnd.noblenet-directory": { source: `iana`, extensions: [`nnd`] },
      "application/vnd.noblenet-sealer": { source: `iana`, extensions: [`nns`] },
      "application/vnd.noblenet-web": { source: `iana`, extensions: [`nnw`] },
      "application/vnd.nokia.catalogs": { source: `iana` },
      "application/vnd.nokia.conml+wbxml": { source: `iana` },
      "application/vnd.nokia.conml+xml": { source: `iana`, compressible: !0 },
      "application/vnd.nokia.iptv.config+xml": { source: `iana`, compressible: !0 },
      "application/vnd.nokia.isds-radio-presets": { source: `iana` },
      "application/vnd.nokia.landmark+wbxml": { source: `iana` },
      "application/vnd.nokia.landmark+xml": { source: `iana`, compressible: !0 },
      "application/vnd.nokia.landmarkcollection+xml": { source: `iana`, compressible: !0 },
      "application/vnd.nokia.n-gage.ac+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`ac`],
      },
      "application/vnd.nokia.n-gage.data": { source: `iana`, extensions: [`ngdat`] },
      "application/vnd.nokia.n-gage.symbian.install": { source: `iana`, extensions: [`n-gage`] },
      "application/vnd.nokia.ncd": { source: `iana` },
      "application/vnd.nokia.pcd+wbxml": { source: `iana` },
      "application/vnd.nokia.pcd+xml": { source: `iana`, compressible: !0 },
      "application/vnd.nokia.radio-preset": { source: `iana`, extensions: [`rpst`] },
      "application/vnd.nokia.radio-presets": { source: `iana`, extensions: [`rpss`] },
      "application/vnd.novadigm.edm": { source: `iana`, extensions: [`edm`] },
      "application/vnd.novadigm.edx": { source: `iana`, extensions: [`edx`] },
      "application/vnd.novadigm.ext": { source: `iana`, extensions: [`ext`] },
      "application/vnd.ntt-local.content-share": { source: `iana` },
      "application/vnd.ntt-local.file-transfer": { source: `iana` },
      "application/vnd.ntt-local.ogw_remote-access": { source: `iana` },
      "application/vnd.ntt-local.sip-ta_remote": { source: `iana` },
      "application/vnd.ntt-local.sip-ta_tcp_stream": { source: `iana` },
      "application/vnd.oasis.opendocument.chart": { source: `iana`, extensions: [`odc`] },
      "application/vnd.oasis.opendocument.chart-template": { source: `iana`, extensions: [`otc`] },
      "application/vnd.oasis.opendocument.database": { source: `iana`, extensions: [`odb`] },
      "application/vnd.oasis.opendocument.formula": { source: `iana`, extensions: [`odf`] },
      "application/vnd.oasis.opendocument.formula-template": {
        source: `iana`,
        extensions: [`odft`],
      },
      "application/vnd.oasis.opendocument.graphics": {
        source: `iana`,
        compressible: !1,
        extensions: [`odg`],
      },
      "application/vnd.oasis.opendocument.graphics-template": {
        source: `iana`,
        extensions: [`otg`],
      },
      "application/vnd.oasis.opendocument.image": { source: `iana`, extensions: [`odi`] },
      "application/vnd.oasis.opendocument.image-template": { source: `iana`, extensions: [`oti`] },
      "application/vnd.oasis.opendocument.presentation": {
        source: `iana`,
        compressible: !1,
        extensions: [`odp`],
      },
      "application/vnd.oasis.opendocument.presentation-template": {
        source: `iana`,
        extensions: [`otp`],
      },
      "application/vnd.oasis.opendocument.spreadsheet": {
        source: `iana`,
        compressible: !1,
        extensions: [`ods`],
      },
      "application/vnd.oasis.opendocument.spreadsheet-template": {
        source: `iana`,
        extensions: [`ots`],
      },
      "application/vnd.oasis.opendocument.text": {
        source: `iana`,
        compressible: !1,
        extensions: [`odt`],
      },
      "application/vnd.oasis.opendocument.text-master": { source: `iana`, extensions: [`odm`] },
      "application/vnd.oasis.opendocument.text-template": { source: `iana`, extensions: [`ott`] },
      "application/vnd.oasis.opendocument.text-web": { source: `iana`, extensions: [`oth`] },
      "application/vnd.obn": { source: `iana` },
      "application/vnd.ocf+cbor": { source: `iana` },
      "application/vnd.oci.image.manifest.v1+json": { source: `iana`, compressible: !0 },
      "application/vnd.oftn.l10n+json": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.contentaccessdownload+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.contentaccessstreaming+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.cspg-hexbinary": { source: `iana` },
      "application/vnd.oipf.dae.svg+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.dae.xhtml+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.mippvcontrolmessage+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.pae.gem": { source: `iana` },
      "application/vnd.oipf.spdiscovery+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.spdlist+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.ueprofile+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oipf.userprofile+xml": { source: `iana`, compressible: !0 },
      "application/vnd.olpc-sugar": { source: `iana`, extensions: [`xo`] },
      "application/vnd.oma-scws-config": { source: `iana` },
      "application/vnd.oma-scws-http-request": { source: `iana` },
      "application/vnd.oma-scws-http-response": { source: `iana` },
      "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.oma.bcast.drm-trigger+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.bcast.imd+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.bcast.ltkm": { source: `iana` },
      "application/vnd.oma.bcast.notification+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.bcast.provisioningtrigger": { source: `iana` },
      "application/vnd.oma.bcast.sgboot": { source: `iana` },
      "application/vnd.oma.bcast.sgdd+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.bcast.sgdu": { source: `iana` },
      "application/vnd.oma.bcast.simple-symbol-container": { source: `iana` },
      "application/vnd.oma.bcast.smartcard-trigger+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.bcast.sprov+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.bcast.stkm": { source: `iana` },
      "application/vnd.oma.cab-address-book+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.cab-feature-handler+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.cab-pcc+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.cab-subs-invite+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.cab-user-prefs+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.dcd": { source: `iana` },
      "application/vnd.oma.dcdc": { source: `iana` },
      "application/vnd.oma.dd2+xml": { source: `iana`, compressible: !0, extensions: [`dd2`] },
      "application/vnd.oma.drm.risd+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.group-usage-list+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.lwm2m+cbor": { source: `iana` },
      "application/vnd.oma.lwm2m+json": { source: `iana`, compressible: !0 },
      "application/vnd.oma.lwm2m+tlv": { source: `iana` },
      "application/vnd.oma.pal+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.poc.detailed-progress-report+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.poc.final-report+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.poc.groups+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.poc.invocation-descriptor+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.poc.optimized-progress-report+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.push": { source: `iana` },
      "application/vnd.oma.scidm.messages+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oma.xcap-directory+xml": { source: `iana`, compressible: !0 },
      "application/vnd.omads-email+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/vnd.omads-file+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/vnd.omads-folder+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/vnd.omaloc-supl-init": { source: `iana` },
      "application/vnd.onepager": { source: `iana` },
      "application/vnd.onepagertamp": { source: `iana` },
      "application/vnd.onepagertamx": { source: `iana` },
      "application/vnd.onepagertat": { source: `iana` },
      "application/vnd.onepagertatp": { source: `iana` },
      "application/vnd.onepagertatx": { source: `iana` },
      "application/vnd.openblox.game+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`obgx`],
      },
      "application/vnd.openblox.game-binary": { source: `iana` },
      "application/vnd.openeye.oeb": { source: `iana` },
      "application/vnd.openofficeorg.extension": { source: `apache`, extensions: [`oxt`] },
      "application/vnd.openstreetmap.data+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`osm`],
      },
      "application/vnd.opentimestamps.ots": { source: `iana` },
      "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.drawing+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        source: `iana`,
        compressible: !1,
        extensions: [`pptx`],
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide": {
        source: `iana`,
        extensions: [`sldx`],
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
        source: `iana`,
        extensions: [`ppsx`],
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template": {
        source: `iana`,
        extensions: [`potx`],
      },
      "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        source: `iana`,
        compressible: !1,
        extensions: [`xlsx`],
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
        source: `iana`,
        extensions: [`xltx`],
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.theme+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.vmldrawing": { source: `iana` },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        source: `iana`,
        compressible: !1,
        extensions: [`docx`],
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
        source: `iana`,
        extensions: [`dotx`],
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-package.core-properties+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.openxmlformats-package.relationships+xml": {
        source: `iana`,
        compressible: !0,
      },
      "application/vnd.oracle.resource+json": { source: `iana`, compressible: !0 },
      "application/vnd.orange.indata": { source: `iana` },
      "application/vnd.osa.netdeploy": { source: `iana` },
      "application/vnd.osgeo.mapguide.package": { source: `iana`, extensions: [`mgp`] },
      "application/vnd.osgi.bundle": { source: `iana` },
      "application/vnd.osgi.dp": { source: `iana`, extensions: [`dp`] },
      "application/vnd.osgi.subsystem": { source: `iana`, extensions: [`esa`] },
      "application/vnd.otps.ct-kip+xml": { source: `iana`, compressible: !0 },
      "application/vnd.oxli.countgraph": { source: `iana` },
      "application/vnd.pagerduty+json": { source: `iana`, compressible: !0 },
      "application/vnd.palm": { source: `iana`, extensions: [`pdb`, `pqa`, `oprc`] },
      "application/vnd.panoply": { source: `iana` },
      "application/vnd.paos.xml": { source: `iana` },
      "application/vnd.patentdive": { source: `iana` },
      "application/vnd.patientecommsdoc": { source: `iana` },
      "application/vnd.pawaafile": { source: `iana`, extensions: [`paw`] },
      "application/vnd.pcos": { source: `iana` },
      "application/vnd.pg.format": { source: `iana`, extensions: [`str`] },
      "application/vnd.pg.osasli": { source: `iana`, extensions: [`ei6`] },
      "application/vnd.piaccess.application-licence": { source: `iana` },
      "application/vnd.picsel": { source: `iana`, extensions: [`efif`] },
      "application/vnd.pmi.widget": { source: `iana`, extensions: [`wg`] },
      "application/vnd.poc.group-advertisement+xml": { source: `iana`, compressible: !0 },
      "application/vnd.pocketlearn": { source: `iana`, extensions: [`plf`] },
      "application/vnd.powerbuilder6": { source: `iana`, extensions: [`pbd`] },
      "application/vnd.powerbuilder6-s": { source: `iana` },
      "application/vnd.powerbuilder7": { source: `iana` },
      "application/vnd.powerbuilder7-s": { source: `iana` },
      "application/vnd.powerbuilder75": { source: `iana` },
      "application/vnd.powerbuilder75-s": { source: `iana` },
      "application/vnd.preminet": { source: `iana` },
      "application/vnd.previewsystems.box": { source: `iana`, extensions: [`box`] },
      "application/vnd.proteus.magazine": { source: `iana`, extensions: [`mgz`] },
      "application/vnd.psfs": { source: `iana` },
      "application/vnd.publishare-delta-tree": { source: `iana`, extensions: [`qps`] },
      "application/vnd.pvi.ptid1": { source: `iana`, extensions: [`ptid`] },
      "application/vnd.pwg-multiplexed": { source: `iana` },
      "application/vnd.pwg-xhtml-print+xml": { source: `iana`, compressible: !0 },
      "application/vnd.qualcomm.brew-app-res": { source: `iana` },
      "application/vnd.quarantainenet": { source: `iana` },
      "application/vnd.quark.quarkxpress": {
        source: `iana`,
        extensions: [`qxd`, `qxt`, `qwd`, `qwt`, `qxl`, `qxb`],
      },
      "application/vnd.quobject-quoxdocument": { source: `iana` },
      "application/vnd.radisys.moml+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-audit+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-audit-conf+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-audit-conn+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-audit-dialog+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-audit-stream+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-conf+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-dialog+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-dialog-base+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-dialog-fax-detect+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-dialog-group+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-dialog-speech+xml": { source: `iana`, compressible: !0 },
      "application/vnd.radisys.msml-dialog-transform+xml": { source: `iana`, compressible: !0 },
      "application/vnd.rainstor.data": { source: `iana` },
      "application/vnd.rapid": { source: `iana` },
      "application/vnd.rar": { source: `iana`, extensions: [`rar`] },
      "application/vnd.realvnc.bed": { source: `iana`, extensions: [`bed`] },
      "application/vnd.recordare.musicxml": { source: `iana`, extensions: [`mxl`] },
      "application/vnd.recordare.musicxml+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`musicxml`],
      },
      "application/vnd.renlearn.rlprint": { source: `iana` },
      "application/vnd.resilient.logic": { source: `iana` },
      "application/vnd.restful+json": { source: `iana`, compressible: !0 },
      "application/vnd.rig.cryptonote": { source: `iana`, extensions: [`cryptonote`] },
      "application/vnd.rim.cod": { source: `apache`, extensions: [`cod`] },
      "application/vnd.rn-realmedia": { source: `apache`, extensions: [`rm`] },
      "application/vnd.rn-realmedia-vbr": { source: `apache`, extensions: [`rmvb`] },
      "application/vnd.route66.link66+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`link66`],
      },
      "application/vnd.rs-274x": { source: `iana` },
      "application/vnd.ruckus.download": { source: `iana` },
      "application/vnd.s3sms": { source: `iana` },
      "application/vnd.sailingtracker.track": { source: `iana`, extensions: [`st`] },
      "application/vnd.sar": { source: `iana` },
      "application/vnd.sbm.cid": { source: `iana` },
      "application/vnd.sbm.mid2": { source: `iana` },
      "application/vnd.scribus": { source: `iana` },
      "application/vnd.sealed.3df": { source: `iana` },
      "application/vnd.sealed.csf": { source: `iana` },
      "application/vnd.sealed.doc": { source: `iana` },
      "application/vnd.sealed.eml": { source: `iana` },
      "application/vnd.sealed.mht": { source: `iana` },
      "application/vnd.sealed.net": { source: `iana` },
      "application/vnd.sealed.ppt": { source: `iana` },
      "application/vnd.sealed.tiff": { source: `iana` },
      "application/vnd.sealed.xls": { source: `iana` },
      "application/vnd.sealedmedia.softseal.html": { source: `iana` },
      "application/vnd.sealedmedia.softseal.pdf": { source: `iana` },
      "application/vnd.seemail": { source: `iana`, extensions: [`see`] },
      "application/vnd.seis+json": { source: `iana`, compressible: !0 },
      "application/vnd.sema": { source: `iana`, extensions: [`sema`] },
      "application/vnd.semd": { source: `iana`, extensions: [`semd`] },
      "application/vnd.semf": { source: `iana`, extensions: [`semf`] },
      "application/vnd.shade-save-file": { source: `iana` },
      "application/vnd.shana.informed.formdata": { source: `iana`, extensions: [`ifm`] },
      "application/vnd.shana.informed.formtemplate": { source: `iana`, extensions: [`itp`] },
      "application/vnd.shana.informed.interchange": { source: `iana`, extensions: [`iif`] },
      "application/vnd.shana.informed.package": { source: `iana`, extensions: [`ipk`] },
      "application/vnd.shootproof+json": { source: `iana`, compressible: !0 },
      "application/vnd.shopkick+json": { source: `iana`, compressible: !0 },
      "application/vnd.shp": { source: `iana` },
      "application/vnd.shx": { source: `iana` },
      "application/vnd.sigrok.session": { source: `iana` },
      "application/vnd.simtech-mindmapper": { source: `iana`, extensions: [`twd`, `twds`] },
      "application/vnd.siren+json": { source: `iana`, compressible: !0 },
      "application/vnd.smaf": { source: `iana`, extensions: [`mmf`] },
      "application/vnd.smart.notebook": { source: `iana` },
      "application/vnd.smart.teacher": { source: `iana`, extensions: [`teacher`] },
      "application/vnd.snesdev-page-table": { source: `iana` },
      "application/vnd.software602.filler.form+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`fo`],
      },
      "application/vnd.software602.filler.form-xml-zip": { source: `iana` },
      "application/vnd.solent.sdkm+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`sdkm`, `sdkd`],
      },
      "application/vnd.spotfire.dxp": { source: `iana`, extensions: [`dxp`] },
      "application/vnd.spotfire.sfs": { source: `iana`, extensions: [`sfs`] },
      "application/vnd.sqlite3": { source: `iana` },
      "application/vnd.sss-cod": { source: `iana` },
      "application/vnd.sss-dtf": { source: `iana` },
      "application/vnd.sss-ntf": { source: `iana` },
      "application/vnd.stardivision.calc": { source: `apache`, extensions: [`sdc`] },
      "application/vnd.stardivision.draw": { source: `apache`, extensions: [`sda`] },
      "application/vnd.stardivision.impress": { source: `apache`, extensions: [`sdd`] },
      "application/vnd.stardivision.math": { source: `apache`, extensions: [`smf`] },
      "application/vnd.stardivision.writer": { source: `apache`, extensions: [`sdw`, `vor`] },
      "application/vnd.stardivision.writer-global": { source: `apache`, extensions: [`sgl`] },
      "application/vnd.stepmania.package": { source: `iana`, extensions: [`smzip`] },
      "application/vnd.stepmania.stepchart": { source: `iana`, extensions: [`sm`] },
      "application/vnd.street-stream": { source: `iana` },
      "application/vnd.sun.wadl+xml": { source: `iana`, compressible: !0, extensions: [`wadl`] },
      "application/vnd.sun.xml.calc": { source: `apache`, extensions: [`sxc`] },
      "application/vnd.sun.xml.calc.template": { source: `apache`, extensions: [`stc`] },
      "application/vnd.sun.xml.draw": { source: `apache`, extensions: [`sxd`] },
      "application/vnd.sun.xml.draw.template": { source: `apache`, extensions: [`std`] },
      "application/vnd.sun.xml.impress": { source: `apache`, extensions: [`sxi`] },
      "application/vnd.sun.xml.impress.template": { source: `apache`, extensions: [`sti`] },
      "application/vnd.sun.xml.math": { source: `apache`, extensions: [`sxm`] },
      "application/vnd.sun.xml.writer": { source: `apache`, extensions: [`sxw`] },
      "application/vnd.sun.xml.writer.global": { source: `apache`, extensions: [`sxg`] },
      "application/vnd.sun.xml.writer.template": { source: `apache`, extensions: [`stw`] },
      "application/vnd.sus-calendar": { source: `iana`, extensions: [`sus`, `susp`] },
      "application/vnd.svd": { source: `iana`, extensions: [`svd`] },
      "application/vnd.swiftview-ics": { source: `iana` },
      "application/vnd.sycle+xml": { source: `iana`, compressible: !0 },
      "application/vnd.syft+json": { source: `iana`, compressible: !0 },
      "application/vnd.symbian.install": { source: `apache`, extensions: [`sis`, `sisx`] },
      "application/vnd.syncml+xml": {
        source: `iana`,
        charset: `UTF-8`,
        compressible: !0,
        extensions: [`xsm`],
      },
      "application/vnd.syncml.dm+wbxml": { source: `iana`, charset: `UTF-8`, extensions: [`bdm`] },
      "application/vnd.syncml.dm+xml": {
        source: `iana`,
        charset: `UTF-8`,
        compressible: !0,
        extensions: [`xdm`],
      },
      "application/vnd.syncml.dm.notification": { source: `iana` },
      "application/vnd.syncml.dmddf+wbxml": { source: `iana` },
      "application/vnd.syncml.dmddf+xml": {
        source: `iana`,
        charset: `UTF-8`,
        compressible: !0,
        extensions: [`ddf`],
      },
      "application/vnd.syncml.dmtnds+wbxml": { source: `iana` },
      "application/vnd.syncml.dmtnds+xml": { source: `iana`, charset: `UTF-8`, compressible: !0 },
      "application/vnd.syncml.ds.notification": { source: `iana` },
      "application/vnd.tableschema+json": { source: `iana`, compressible: !0 },
      "application/vnd.tao.intent-module-archive": { source: `iana`, extensions: [`tao`] },
      "application/vnd.tcpdump.pcap": { source: `iana`, extensions: [`pcap`, `cap`, `dmp`] },
      "application/vnd.think-cell.ppttc+json": { source: `iana`, compressible: !0 },
      "application/vnd.tmd.mediaflex.api+xml": { source: `iana`, compressible: !0 },
      "application/vnd.tml": { source: `iana` },
      "application/vnd.tmobile-livetv": { source: `iana`, extensions: [`tmo`] },
      "application/vnd.tri.onesource": { source: `iana` },
      "application/vnd.trid.tpt": { source: `iana`, extensions: [`tpt`] },
      "application/vnd.triscape.mxs": { source: `iana`, extensions: [`mxs`] },
      "application/vnd.trueapp": { source: `iana`, extensions: [`tra`] },
      "application/vnd.truedoc": { source: `iana` },
      "application/vnd.ubisoft.webplayer": { source: `iana` },
      "application/vnd.ufdl": { source: `iana`, extensions: [`ufd`, `ufdl`] },
      "application/vnd.uiq.theme": { source: `iana`, extensions: [`utz`] },
      "application/vnd.umajin": { source: `iana`, extensions: [`umj`] },
      "application/vnd.unity": { source: `iana`, extensions: [`unityweb`] },
      "application/vnd.uoml+xml": { source: `iana`, compressible: !0, extensions: [`uoml`] },
      "application/vnd.uplanet.alert": { source: `iana` },
      "application/vnd.uplanet.alert-wbxml": { source: `iana` },
      "application/vnd.uplanet.bearer-choice": { source: `iana` },
      "application/vnd.uplanet.bearer-choice-wbxml": { source: `iana` },
      "application/vnd.uplanet.cacheop": { source: `iana` },
      "application/vnd.uplanet.cacheop-wbxml": { source: `iana` },
      "application/vnd.uplanet.channel": { source: `iana` },
      "application/vnd.uplanet.channel-wbxml": { source: `iana` },
      "application/vnd.uplanet.list": { source: `iana` },
      "application/vnd.uplanet.list-wbxml": { source: `iana` },
      "application/vnd.uplanet.listcmd": { source: `iana` },
      "application/vnd.uplanet.listcmd-wbxml": { source: `iana` },
      "application/vnd.uplanet.signal": { source: `iana` },
      "application/vnd.uri-map": { source: `iana` },
      "application/vnd.valve.source.material": { source: `iana` },
      "application/vnd.vcx": { source: `iana`, extensions: [`vcx`] },
      "application/vnd.vd-study": { source: `iana` },
      "application/vnd.vectorworks": { source: `iana` },
      "application/vnd.vel+json": { source: `iana`, compressible: !0 },
      "application/vnd.verimatrix.vcas": { source: `iana` },
      "application/vnd.veritone.aion+json": { source: `iana`, compressible: !0 },
      "application/vnd.veryant.thin": { source: `iana` },
      "application/vnd.ves.encrypted": { source: `iana` },
      "application/vnd.vidsoft.vidconference": { source: `iana` },
      "application/vnd.visio": { source: `iana`, extensions: [`vsd`, `vst`, `vss`, `vsw`] },
      "application/vnd.visionary": { source: `iana`, extensions: [`vis`] },
      "application/vnd.vividence.scriptfile": { source: `iana` },
      "application/vnd.vsf": { source: `iana`, extensions: [`vsf`] },
      "application/vnd.wap.sic": { source: `iana` },
      "application/vnd.wap.slc": { source: `iana` },
      "application/vnd.wap.wbxml": { source: `iana`, charset: `UTF-8`, extensions: [`wbxml`] },
      "application/vnd.wap.wmlc": { source: `iana`, extensions: [`wmlc`] },
      "application/vnd.wap.wmlscriptc": { source: `iana`, extensions: [`wmlsc`] },
      "application/vnd.webturbo": { source: `iana`, extensions: [`wtb`] },
      "application/vnd.wfa.dpp": { source: `iana` },
      "application/vnd.wfa.p2p": { source: `iana` },
      "application/vnd.wfa.wsc": { source: `iana` },
      "application/vnd.windows.devicepairing": { source: `iana` },
      "application/vnd.wmc": { source: `iana` },
      "application/vnd.wmf.bootstrap": { source: `iana` },
      "application/vnd.wolfram.mathematica": { source: `iana` },
      "application/vnd.wolfram.mathematica.package": { source: `iana` },
      "application/vnd.wolfram.player": { source: `iana`, extensions: [`nbp`] },
      "application/vnd.wordperfect": { source: `iana`, extensions: [`wpd`] },
      "application/vnd.wqd": { source: `iana`, extensions: [`wqd`] },
      "application/vnd.wrq-hp3000-labelled": { source: `iana` },
      "application/vnd.wt.stf": { source: `iana`, extensions: [`stf`] },
      "application/vnd.wv.csp+wbxml": { source: `iana` },
      "application/vnd.wv.csp+xml": { source: `iana`, compressible: !0 },
      "application/vnd.wv.ssp+xml": { source: `iana`, compressible: !0 },
      "application/vnd.xacml+json": { source: `iana`, compressible: !0 },
      "application/vnd.xara": { source: `iana`, extensions: [`xar`] },
      "application/vnd.xfdl": { source: `iana`, extensions: [`xfdl`] },
      "application/vnd.xfdl.webform": { source: `iana` },
      "application/vnd.xmi+xml": { source: `iana`, compressible: !0 },
      "application/vnd.xmpie.cpkg": { source: `iana` },
      "application/vnd.xmpie.dpkg": { source: `iana` },
      "application/vnd.xmpie.plan": { source: `iana` },
      "application/vnd.xmpie.ppkg": { source: `iana` },
      "application/vnd.xmpie.xlim": { source: `iana` },
      "application/vnd.yamaha.hv-dic": { source: `iana`, extensions: [`hvd`] },
      "application/vnd.yamaha.hv-script": { source: `iana`, extensions: [`hvs`] },
      "application/vnd.yamaha.hv-voice": { source: `iana`, extensions: [`hvp`] },
      "application/vnd.yamaha.openscoreformat": { source: `iana`, extensions: [`osf`] },
      "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`osfpvg`],
      },
      "application/vnd.yamaha.remote-setup": { source: `iana` },
      "application/vnd.yamaha.smaf-audio": { source: `iana`, extensions: [`saf`] },
      "application/vnd.yamaha.smaf-phrase": { source: `iana`, extensions: [`spf`] },
      "application/vnd.yamaha.through-ngn": { source: `iana` },
      "application/vnd.yamaha.tunnel-udpencap": { source: `iana` },
      "application/vnd.yaoweme": { source: `iana` },
      "application/vnd.yellowriver-custom-menu": { source: `iana`, extensions: [`cmp`] },
      "application/vnd.youtube.yt": { source: `iana` },
      "application/vnd.zul": { source: `iana`, extensions: [`zir`, `zirz`] },
      "application/vnd.zzazz.deck+xml": { source: `iana`, compressible: !0, extensions: [`zaz`] },
      "application/voicexml+xml": { source: `iana`, compressible: !0, extensions: [`vxml`] },
      "application/voucher-cms+json": { source: `iana`, compressible: !0 },
      "application/vq-rtcpxr": { source: `iana` },
      "application/wasm": { source: `iana`, compressible: !0, extensions: [`wasm`] },
      "application/watcherinfo+xml": { source: `iana`, compressible: !0, extensions: [`wif`] },
      "application/webpush-options+json": { source: `iana`, compressible: !0 },
      "application/whoispp-query": { source: `iana` },
      "application/whoispp-response": { source: `iana` },
      "application/widget": { source: `iana`, extensions: [`wgt`] },
      "application/winhlp": { source: `apache`, extensions: [`hlp`] },
      "application/wita": { source: `iana` },
      "application/wordperfect5.1": { source: `iana` },
      "application/wsdl+xml": { source: `iana`, compressible: !0, extensions: [`wsdl`] },
      "application/wspolicy+xml": { source: `iana`, compressible: !0, extensions: [`wspolicy`] },
      "application/x-7z-compressed": { source: `apache`, compressible: !1, extensions: [`7z`] },
      "application/x-abiword": { source: `apache`, extensions: [`abw`] },
      "application/x-ace-compressed": { source: `apache`, extensions: [`ace`] },
      "application/x-amf": { source: `apache` },
      "application/x-apple-diskimage": { source: `apache`, extensions: [`dmg`] },
      "application/x-arj": { compressible: !1, extensions: [`arj`] },
      "application/x-authorware-bin": {
        source: `apache`,
        extensions: [`aab`, `x32`, `u32`, `vox`],
      },
      "application/x-authorware-map": { source: `apache`, extensions: [`aam`] },
      "application/x-authorware-seg": { source: `apache`, extensions: [`aas`] },
      "application/x-bcpio": { source: `apache`, extensions: [`bcpio`] },
      "application/x-bdoc": { compressible: !1, extensions: [`bdoc`] },
      "application/x-bittorrent": { source: `apache`, extensions: [`torrent`] },
      "application/x-blorb": { source: `apache`, extensions: [`blb`, `blorb`] },
      "application/x-bzip": { source: `apache`, compressible: !1, extensions: [`bz`] },
      "application/x-bzip2": { source: `apache`, compressible: !1, extensions: [`bz2`, `boz`] },
      "application/x-cbr": { source: `apache`, extensions: [`cbr`, `cba`, `cbt`, `cbz`, `cb7`] },
      "application/x-cdlink": { source: `apache`, extensions: [`vcd`] },
      "application/x-cfs-compressed": { source: `apache`, extensions: [`cfs`] },
      "application/x-chat": { source: `apache`, extensions: [`chat`] },
      "application/x-chess-pgn": { source: `apache`, extensions: [`pgn`] },
      "application/x-chrome-extension": { extensions: [`crx`] },
      "application/x-cocoa": { source: `nginx`, extensions: [`cco`] },
      "application/x-compress": { source: `apache` },
      "application/x-conference": { source: `apache`, extensions: [`nsc`] },
      "application/x-cpio": { source: `apache`, extensions: [`cpio`] },
      "application/x-csh": { source: `apache`, extensions: [`csh`] },
      "application/x-deb": { compressible: !1 },
      "application/x-debian-package": { source: `apache`, extensions: [`deb`, `udeb`] },
      "application/x-dgc-compressed": { source: `apache`, extensions: [`dgc`] },
      "application/x-director": {
        source: `apache`,
        extensions: [`dir`, `dcr`, `dxr`, `cst`, `cct`, `cxt`, `w3d`, `fgd`, `swa`],
      },
      "application/x-doom": { source: `apache`, extensions: [`wad`] },
      "application/x-dtbncx+xml": { source: `apache`, compressible: !0, extensions: [`ncx`] },
      "application/x-dtbook+xml": { source: `apache`, compressible: !0, extensions: [`dtb`] },
      "application/x-dtbresource+xml": { source: `apache`, compressible: !0, extensions: [`res`] },
      "application/x-dvi": { source: `apache`, compressible: !1, extensions: [`dvi`] },
      "application/x-envoy": { source: `apache`, extensions: [`evy`] },
      "application/x-eva": { source: `apache`, extensions: [`eva`] },
      "application/x-font-bdf": { source: `apache`, extensions: [`bdf`] },
      "application/x-font-dos": { source: `apache` },
      "application/x-font-framemaker": { source: `apache` },
      "application/x-font-ghostscript": { source: `apache`, extensions: [`gsf`] },
      "application/x-font-libgrx": { source: `apache` },
      "application/x-font-linux-psf": { source: `apache`, extensions: [`psf`] },
      "application/x-font-pcf": { source: `apache`, extensions: [`pcf`] },
      "application/x-font-snf": { source: `apache`, extensions: [`snf`] },
      "application/x-font-speedo": { source: `apache` },
      "application/x-font-sunos-news": { source: `apache` },
      "application/x-font-type1": { source: `apache`, extensions: [`pfa`, `pfb`, `pfm`, `afm`] },
      "application/x-font-vfont": { source: `apache` },
      "application/x-freearc": { source: `apache`, extensions: [`arc`] },
      "application/x-futuresplash": { source: `apache`, extensions: [`spl`] },
      "application/x-gca-compressed": { source: `apache`, extensions: [`gca`] },
      "application/x-glulx": { source: `apache`, extensions: [`ulx`] },
      "application/x-gnumeric": { source: `apache`, extensions: [`gnumeric`] },
      "application/x-gramps-xml": { source: `apache`, extensions: [`gramps`] },
      "application/x-gtar": { source: `apache`, extensions: [`gtar`] },
      "application/x-gzip": { source: `apache` },
      "application/x-hdf": { source: `apache`, extensions: [`hdf`] },
      "application/x-httpd-php": { compressible: !0, extensions: [`php`] },
      "application/x-install-instructions": { source: `apache`, extensions: [`install`] },
      "application/x-iso9660-image": { source: `apache`, extensions: [`iso`] },
      "application/x-iwork-keynote-sffkey": { extensions: [`key`] },
      "application/x-iwork-numbers-sffnumbers": { extensions: [`numbers`] },
      "application/x-iwork-pages-sffpages": { extensions: [`pages`] },
      "application/x-java-archive-diff": { source: `nginx`, extensions: [`jardiff`] },
      "application/x-java-jnlp-file": { source: `apache`, compressible: !1, extensions: [`jnlp`] },
      "application/x-javascript": { compressible: !0 },
      "application/x-keepass2": { extensions: [`kdbx`] },
      "application/x-latex": { source: `apache`, compressible: !1, extensions: [`latex`] },
      "application/x-lua-bytecode": { extensions: [`luac`] },
      "application/x-lzh-compressed": { source: `apache`, extensions: [`lzh`, `lha`] },
      "application/x-makeself": { source: `nginx`, extensions: [`run`] },
      "application/x-mie": { source: `apache`, extensions: [`mie`] },
      "application/x-mobipocket-ebook": { source: `apache`, extensions: [`prc`, `mobi`] },
      "application/x-mpegurl": { compressible: !1 },
      "application/x-ms-application": { source: `apache`, extensions: [`application`] },
      "application/x-ms-shortcut": { source: `apache`, extensions: [`lnk`] },
      "application/x-ms-wmd": { source: `apache`, extensions: [`wmd`] },
      "application/x-ms-wmz": { source: `apache`, extensions: [`wmz`] },
      "application/x-ms-xbap": { source: `apache`, extensions: [`xbap`] },
      "application/x-msaccess": { source: `apache`, extensions: [`mdb`] },
      "application/x-msbinder": { source: `apache`, extensions: [`obd`] },
      "application/x-mscardfile": { source: `apache`, extensions: [`crd`] },
      "application/x-msclip": { source: `apache`, extensions: [`clp`] },
      "application/x-msdos-program": { extensions: [`exe`] },
      "application/x-msdownload": {
        source: `apache`,
        extensions: [`exe`, `dll`, `com`, `bat`, `msi`],
      },
      "application/x-msmediaview": { source: `apache`, extensions: [`mvb`, `m13`, `m14`] },
      "application/x-msmetafile": { source: `apache`, extensions: [`wmf`, `wmz`, `emf`, `emz`] },
      "application/x-msmoney": { source: `apache`, extensions: [`mny`] },
      "application/x-mspublisher": { source: `apache`, extensions: [`pub`] },
      "application/x-msschedule": { source: `apache`, extensions: [`scd`] },
      "application/x-msterminal": { source: `apache`, extensions: [`trm`] },
      "application/x-mswrite": { source: `apache`, extensions: [`wri`] },
      "application/x-netcdf": { source: `apache`, extensions: [`nc`, `cdf`] },
      "application/x-ns-proxy-autoconfig": { compressible: !0, extensions: [`pac`] },
      "application/x-nzb": { source: `apache`, extensions: [`nzb`] },
      "application/x-perl": { source: `nginx`, extensions: [`pl`, `pm`] },
      "application/x-pilot": { source: `nginx`, extensions: [`prc`, `pdb`] },
      "application/x-pkcs12": { source: `apache`, compressible: !1, extensions: [`p12`, `pfx`] },
      "application/x-pkcs7-certificates": { source: `apache`, extensions: [`p7b`, `spc`] },
      "application/x-pkcs7-certreqresp": { source: `apache`, extensions: [`p7r`] },
      "application/x-pki-message": { source: `iana` },
      "application/x-rar-compressed": { source: `apache`, compressible: !1, extensions: [`rar`] },
      "application/x-redhat-package-manager": { source: `nginx`, extensions: [`rpm`] },
      "application/x-research-info-systems": { source: `apache`, extensions: [`ris`] },
      "application/x-sea": { source: `nginx`, extensions: [`sea`] },
      "application/x-sh": { source: `apache`, compressible: !0, extensions: [`sh`] },
      "application/x-shar": { source: `apache`, extensions: [`shar`] },
      "application/x-shockwave-flash": { source: `apache`, compressible: !1, extensions: [`swf`] },
      "application/x-silverlight-app": { source: `apache`, extensions: [`xap`] },
      "application/x-sql": { source: `apache`, extensions: [`sql`] },
      "application/x-stuffit": { source: `apache`, compressible: !1, extensions: [`sit`] },
      "application/x-stuffitx": { source: `apache`, extensions: [`sitx`] },
      "application/x-subrip": { source: `apache`, extensions: [`srt`] },
      "application/x-sv4cpio": { source: `apache`, extensions: [`sv4cpio`] },
      "application/x-sv4crc": { source: `apache`, extensions: [`sv4crc`] },
      "application/x-t3vm-image": { source: `apache`, extensions: [`t3`] },
      "application/x-tads": { source: `apache`, extensions: [`gam`] },
      "application/x-tar": { source: `apache`, compressible: !0, extensions: [`tar`] },
      "application/x-tcl": { source: `apache`, extensions: [`tcl`, `tk`] },
      "application/x-tex": { source: `apache`, extensions: [`tex`] },
      "application/x-tex-tfm": { source: `apache`, extensions: [`tfm`] },
      "application/x-texinfo": { source: `apache`, extensions: [`texinfo`, `texi`] },
      "application/x-tgif": { source: `apache`, extensions: [`obj`] },
      "application/x-ustar": { source: `apache`, extensions: [`ustar`] },
      "application/x-virtualbox-hdd": { compressible: !0, extensions: [`hdd`] },
      "application/x-virtualbox-ova": { compressible: !0, extensions: [`ova`] },
      "application/x-virtualbox-ovf": { compressible: !0, extensions: [`ovf`] },
      "application/x-virtualbox-vbox": { compressible: !0, extensions: [`vbox`] },
      "application/x-virtualbox-vbox-extpack": { compressible: !1, extensions: [`vbox-extpack`] },
      "application/x-virtualbox-vdi": { compressible: !0, extensions: [`vdi`] },
      "application/x-virtualbox-vhd": { compressible: !0, extensions: [`vhd`] },
      "application/x-virtualbox-vmdk": { compressible: !0, extensions: [`vmdk`] },
      "application/x-wais-source": { source: `apache`, extensions: [`src`] },
      "application/x-web-app-manifest+json": { compressible: !0, extensions: [`webapp`] },
      "application/x-www-form-urlencoded": { source: `iana`, compressible: !0 },
      "application/x-x509-ca-cert": { source: `iana`, extensions: [`der`, `crt`, `pem`] },
      "application/x-x509-ca-ra-cert": { source: `iana` },
      "application/x-x509-next-ca-cert": { source: `iana` },
      "application/x-xfig": { source: `apache`, extensions: [`fig`] },
      "application/x-xliff+xml": { source: `apache`, compressible: !0, extensions: [`xlf`] },
      "application/x-xpinstall": { source: `apache`, compressible: !1, extensions: [`xpi`] },
      "application/x-xz": { source: `apache`, extensions: [`xz`] },
      "application/x-zmachine": {
        source: `apache`,
        extensions: [`z1`, `z2`, `z3`, `z4`, `z5`, `z6`, `z7`, `z8`],
      },
      "application/x400-bp": { source: `iana` },
      "application/xacml+xml": { source: `iana`, compressible: !0 },
      "application/xaml+xml": { source: `apache`, compressible: !0, extensions: [`xaml`] },
      "application/xcap-att+xml": { source: `iana`, compressible: !0, extensions: [`xav`] },
      "application/xcap-caps+xml": { source: `iana`, compressible: !0, extensions: [`xca`] },
      "application/xcap-diff+xml": { source: `iana`, compressible: !0, extensions: [`xdf`] },
      "application/xcap-el+xml": { source: `iana`, compressible: !0, extensions: [`xel`] },
      "application/xcap-error+xml": { source: `iana`, compressible: !0 },
      "application/xcap-ns+xml": { source: `iana`, compressible: !0, extensions: [`xns`] },
      "application/xcon-conference-info+xml": { source: `iana`, compressible: !0 },
      "application/xcon-conference-info-diff+xml": { source: `iana`, compressible: !0 },
      "application/xenc+xml": { source: `iana`, compressible: !0, extensions: [`xenc`] },
      "application/xhtml+xml": { source: `iana`, compressible: !0, extensions: [`xhtml`, `xht`] },
      "application/xhtml-voice+xml": { source: `apache`, compressible: !0 },
      "application/xliff+xml": { source: `iana`, compressible: !0, extensions: [`xlf`] },
      "application/xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`xml`, `xsl`, `xsd`, `rng`],
      },
      "application/xml-dtd": { source: `iana`, compressible: !0, extensions: [`dtd`] },
      "application/xml-external-parsed-entity": { source: `iana` },
      "application/xml-patch+xml": { source: `iana`, compressible: !0 },
      "application/xmpp+xml": { source: `iana`, compressible: !0 },
      "application/xop+xml": { source: `iana`, compressible: !0, extensions: [`xop`] },
      "application/xproc+xml": { source: `apache`, compressible: !0, extensions: [`xpl`] },
      "application/xslt+xml": { source: `iana`, compressible: !0, extensions: [`xsl`, `xslt`] },
      "application/xspf+xml": { source: `apache`, compressible: !0, extensions: [`xspf`] },
      "application/xv+xml": {
        source: `iana`,
        compressible: !0,
        extensions: [`mxml`, `xhvml`, `xvml`, `xvm`],
      },
      "application/yang": { source: `iana`, extensions: [`yang`] },
      "application/yang-data+json": { source: `iana`, compressible: !0 },
      "application/yang-data+xml": { source: `iana`, compressible: !0 },
      "application/yang-patch+json": { source: `iana`, compressible: !0 },
      "application/yang-patch+xml": { source: `iana`, compressible: !0 },
      "application/yin+xml": { source: `iana`, compressible: !0, extensions: [`yin`] },
      "application/zip": { source: `iana`, compressible: !1, extensions: [`zip`] },
      "application/zlib": { source: `iana` },
      "application/zstd": { source: `iana` },
      "audio/1d-interleaved-parityfec": { source: `iana` },
      "audio/32kadpcm": { source: `iana` },
      "audio/3gpp": { source: `iana`, compressible: !1, extensions: [`3gpp`] },
      "audio/3gpp2": { source: `iana` },
      "audio/aac": { source: `iana` },
      "audio/ac3": { source: `iana` },
      "audio/adpcm": { source: `apache`, extensions: [`adp`] },
      "audio/amr": { source: `iana`, extensions: [`amr`] },
      "audio/amr-wb": { source: `iana` },
      "audio/amr-wb+": { source: `iana` },
      "audio/aptx": { source: `iana` },
      "audio/asc": { source: `iana` },
      "audio/atrac-advanced-lossless": { source: `iana` },
      "audio/atrac-x": { source: `iana` },
      "audio/atrac3": { source: `iana` },
      "audio/basic": { source: `iana`, compressible: !1, extensions: [`au`, `snd`] },
      "audio/bv16": { source: `iana` },
      "audio/bv32": { source: `iana` },
      "audio/clearmode": { source: `iana` },
      "audio/cn": { source: `iana` },
      "audio/dat12": { source: `iana` },
      "audio/dls": { source: `iana` },
      "audio/dsr-es201108": { source: `iana` },
      "audio/dsr-es202050": { source: `iana` },
      "audio/dsr-es202211": { source: `iana` },
      "audio/dsr-es202212": { source: `iana` },
      "audio/dv": { source: `iana` },
      "audio/dvi4": { source: `iana` },
      "audio/eac3": { source: `iana` },
      "audio/encaprtp": { source: `iana` },
      "audio/evrc": { source: `iana` },
      "audio/evrc-qcp": { source: `iana` },
      "audio/evrc0": { source: `iana` },
      "audio/evrc1": { source: `iana` },
      "audio/evrcb": { source: `iana` },
      "audio/evrcb0": { source: `iana` },
      "audio/evrcb1": { source: `iana` },
      "audio/evrcnw": { source: `iana` },
      "audio/evrcnw0": { source: `iana` },
      "audio/evrcnw1": { source: `iana` },
      "audio/evrcwb": { source: `iana` },
      "audio/evrcwb0": { source: `iana` },
      "audio/evrcwb1": { source: `iana` },
      "audio/evs": { source: `iana` },
      "audio/flexfec": { source: `iana` },
      "audio/fwdred": { source: `iana` },
      "audio/g711-0": { source: `iana` },
      "audio/g719": { source: `iana` },
      "audio/g722": { source: `iana` },
      "audio/g7221": { source: `iana` },
      "audio/g723": { source: `iana` },
      "audio/g726-16": { source: `iana` },
      "audio/g726-24": { source: `iana` },
      "audio/g726-32": { source: `iana` },
      "audio/g726-40": { source: `iana` },
      "audio/g728": { source: `iana` },
      "audio/g729": { source: `iana` },
      "audio/g7291": { source: `iana` },
      "audio/g729d": { source: `iana` },
      "audio/g729e": { source: `iana` },
      "audio/gsm": { source: `iana` },
      "audio/gsm-efr": { source: `iana` },
      "audio/gsm-hr-08": { source: `iana` },
      "audio/ilbc": { source: `iana` },
      "audio/ip-mr_v2.5": { source: `iana` },
      "audio/isac": { source: `apache` },
      "audio/l16": { source: `iana` },
      "audio/l20": { source: `iana` },
      "audio/l24": { source: `iana`, compressible: !1 },
      "audio/l8": { source: `iana` },
      "audio/lpc": { source: `iana` },
      "audio/melp": { source: `iana` },
      "audio/melp1200": { source: `iana` },
      "audio/melp2400": { source: `iana` },
      "audio/melp600": { source: `iana` },
      "audio/mhas": { source: `iana` },
      "audio/midi": { source: `apache`, extensions: [`mid`, `midi`, `kar`, `rmi`] },
      "audio/mobile-xmf": { source: `iana`, extensions: [`mxmf`] },
      "audio/mp3": { compressible: !1, extensions: [`mp3`] },
      "audio/mp4": { source: `iana`, compressible: !1, extensions: [`m4a`, `mp4a`] },
      "audio/mp4a-latm": { source: `iana` },
      "audio/mpa": { source: `iana` },
      "audio/mpa-robust": { source: `iana` },
      "audio/mpeg": {
        source: `iana`,
        compressible: !1,
        extensions: [`mpga`, `mp2`, `mp2a`, `mp3`, `m2a`, `m3a`],
      },
      "audio/mpeg4-generic": { source: `iana` },
      "audio/musepack": { source: `apache` },
      "audio/ogg": { source: `iana`, compressible: !1, extensions: [`oga`, `ogg`, `spx`, `opus`] },
      "audio/opus": { source: `iana` },
      "audio/parityfec": { source: `iana` },
      "audio/pcma": { source: `iana` },
      "audio/pcma-wb": { source: `iana` },
      "audio/pcmu": { source: `iana` },
      "audio/pcmu-wb": { source: `iana` },
      "audio/prs.sid": { source: `iana` },
      "audio/qcelp": { source: `iana` },
      "audio/raptorfec": { source: `iana` },
      "audio/red": { source: `iana` },
      "audio/rtp-enc-aescm128": { source: `iana` },
      "audio/rtp-midi": { source: `iana` },
      "audio/rtploopback": { source: `iana` },
      "audio/rtx": { source: `iana` },
      "audio/s3m": { source: `apache`, extensions: [`s3m`] },
      "audio/scip": { source: `iana` },
      "audio/silk": { source: `apache`, extensions: [`sil`] },
      "audio/smv": { source: `iana` },
      "audio/smv-qcp": { source: `iana` },
      "audio/smv0": { source: `iana` },
      "audio/sofa": { source: `iana` },
      "audio/sp-midi": { source: `iana` },
      "audio/speex": { source: `iana` },
      "audio/t140c": { source: `iana` },
      "audio/t38": { source: `iana` },
      "audio/telephone-event": { source: `iana` },
      "audio/tetra_acelp": { source: `iana` },
      "audio/tetra_acelp_bb": { source: `iana` },
      "audio/tone": { source: `iana` },
      "audio/tsvcis": { source: `iana` },
      "audio/uemclip": { source: `iana` },
      "audio/ulpfec": { source: `iana` },
      "audio/usac": { source: `iana` },
      "audio/vdvi": { source: `iana` },
      "audio/vmr-wb": { source: `iana` },
      "audio/vnd.3gpp.iufp": { source: `iana` },
      "audio/vnd.4sb": { source: `iana` },
      "audio/vnd.audiokoz": { source: `iana` },
      "audio/vnd.celp": { source: `iana` },
      "audio/vnd.cisco.nse": { source: `iana` },
      "audio/vnd.cmles.radio-events": { source: `iana` },
      "audio/vnd.cns.anp1": { source: `iana` },
      "audio/vnd.cns.inf1": { source: `iana` },
      "audio/vnd.dece.audio": { source: `iana`, extensions: [`uva`, `uvva`] },
      "audio/vnd.digital-winds": { source: `iana`, extensions: [`eol`] },
      "audio/vnd.dlna.adts": { source: `iana` },
      "audio/vnd.dolby.heaac.1": { source: `iana` },
      "audio/vnd.dolby.heaac.2": { source: `iana` },
      "audio/vnd.dolby.mlp": { source: `iana` },
      "audio/vnd.dolby.mps": { source: `iana` },
      "audio/vnd.dolby.pl2": { source: `iana` },
      "audio/vnd.dolby.pl2x": { source: `iana` },
      "audio/vnd.dolby.pl2z": { source: `iana` },
      "audio/vnd.dolby.pulse.1": { source: `iana` },
      "audio/vnd.dra": { source: `iana`, extensions: [`dra`] },
      "audio/vnd.dts": { source: `iana`, extensions: [`dts`] },
      "audio/vnd.dts.hd": { source: `iana`, extensions: [`dtshd`] },
      "audio/vnd.dts.uhd": { source: `iana` },
      "audio/vnd.dvb.file": { source: `iana` },
      "audio/vnd.everad.plj": { source: `iana` },
      "audio/vnd.hns.audio": { source: `iana` },
      "audio/vnd.lucent.voice": { source: `iana`, extensions: [`lvp`] },
      "audio/vnd.ms-playready.media.pya": { source: `iana`, extensions: [`pya`] },
      "audio/vnd.nokia.mobile-xmf": { source: `iana` },
      "audio/vnd.nortel.vbk": { source: `iana` },
      "audio/vnd.nuera.ecelp4800": { source: `iana`, extensions: [`ecelp4800`] },
      "audio/vnd.nuera.ecelp7470": { source: `iana`, extensions: [`ecelp7470`] },
      "audio/vnd.nuera.ecelp9600": { source: `iana`, extensions: [`ecelp9600`] },
      "audio/vnd.octel.sbc": { source: `iana` },
      "audio/vnd.presonus.multitrack": { source: `iana` },
      "audio/vnd.qcelp": { source: `iana` },
      "audio/vnd.rhetorex.32kadpcm": { source: `iana` },
      "audio/vnd.rip": { source: `iana`, extensions: [`rip`] },
      "audio/vnd.rn-realaudio": { compressible: !1 },
      "audio/vnd.sealedmedia.softseal.mpeg": { source: `iana` },
      "audio/vnd.vmx.cvsd": { source: `iana` },
      "audio/vnd.wave": { compressible: !1 },
      "audio/vorbis": { source: `iana`, compressible: !1 },
      "audio/vorbis-config": { source: `iana` },
      "audio/wav": { compressible: !1, extensions: [`wav`] },
      "audio/wave": { compressible: !1, extensions: [`wav`] },
      "audio/webm": { source: `apache`, compressible: !1, extensions: [`weba`] },
      "audio/x-aac": { source: `apache`, compressible: !1, extensions: [`aac`] },
      "audio/x-aiff": { source: `apache`, extensions: [`aif`, `aiff`, `aifc`] },
      "audio/x-caf": { source: `apache`, compressible: !1, extensions: [`caf`] },
      "audio/x-flac": { source: `apache`, extensions: [`flac`] },
      "audio/x-m4a": { source: `nginx`, extensions: [`m4a`] },
      "audio/x-matroska": { source: `apache`, extensions: [`mka`] },
      "audio/x-mpegurl": { source: `apache`, extensions: [`m3u`] },
      "audio/x-ms-wax": { source: `apache`, extensions: [`wax`] },
      "audio/x-ms-wma": { source: `apache`, extensions: [`wma`] },
      "audio/x-pn-realaudio": { source: `apache`, extensions: [`ram`, `ra`] },
      "audio/x-pn-realaudio-plugin": { source: `apache`, extensions: [`rmp`] },
      "audio/x-realaudio": { source: `nginx`, extensions: [`ra`] },
      "audio/x-tta": { source: `apache` },
      "audio/x-wav": { source: `apache`, extensions: [`wav`] },
      "audio/xm": { source: `apache`, extensions: [`xm`] },
      "chemical/x-cdx": { source: `apache`, extensions: [`cdx`] },
      "chemical/x-cif": { source: `apache`, extensions: [`cif`] },
      "chemical/x-cmdf": { source: `apache`, extensions: [`cmdf`] },
      "chemical/x-cml": { source: `apache`, extensions: [`cml`] },
      "chemical/x-csml": { source: `apache`, extensions: [`csml`] },
      "chemical/x-pdb": { source: `apache` },
      "chemical/x-xyz": { source: `apache`, extensions: [`xyz`] },
      "font/collection": { source: `iana`, extensions: [`ttc`] },
      "font/otf": { source: `iana`, compressible: !0, extensions: [`otf`] },
      "font/sfnt": { source: `iana` },
      "font/ttf": { source: `iana`, compressible: !0, extensions: [`ttf`] },
      "font/woff": { source: `iana`, extensions: [`woff`] },
      "font/woff2": { source: `iana`, extensions: [`woff2`] },
      "image/aces": { source: `iana`, extensions: [`exr`] },
      "image/apng": { compressible: !1, extensions: [`apng`] },
      "image/avci": { source: `iana`, extensions: [`avci`] },
      "image/avcs": { source: `iana`, extensions: [`avcs`] },
      "image/avif": { source: `iana`, compressible: !1, extensions: [`avif`] },
      "image/bmp": { source: `iana`, compressible: !0, extensions: [`bmp`] },
      "image/cgm": { source: `iana`, extensions: [`cgm`] },
      "image/dicom-rle": { source: `iana`, extensions: [`drle`] },
      "image/emf": { source: `iana`, extensions: [`emf`] },
      "image/fits": { source: `iana`, extensions: [`fits`] },
      "image/g3fax": { source: `iana`, extensions: [`g3`] },
      "image/gif": { source: `iana`, compressible: !1, extensions: [`gif`] },
      "image/heic": { source: `iana`, extensions: [`heic`] },
      "image/heic-sequence": { source: `iana`, extensions: [`heics`] },
      "image/heif": { source: `iana`, extensions: [`heif`] },
      "image/heif-sequence": { source: `iana`, extensions: [`heifs`] },
      "image/hej2k": { source: `iana`, extensions: [`hej2`] },
      "image/hsj2": { source: `iana`, extensions: [`hsj2`] },
      "image/ief": { source: `iana`, extensions: [`ief`] },
      "image/jls": { source: `iana`, extensions: [`jls`] },
      "image/jp2": { source: `iana`, compressible: !1, extensions: [`jp2`, `jpg2`] },
      "image/jpeg": { source: `iana`, compressible: !1, extensions: [`jpeg`, `jpg`, `jpe`] },
      "image/jph": { source: `iana`, extensions: [`jph`] },
      "image/jphc": { source: `iana`, extensions: [`jhc`] },
      "image/jpm": { source: `iana`, compressible: !1, extensions: [`jpm`] },
      "image/jpx": { source: `iana`, compressible: !1, extensions: [`jpx`, `jpf`] },
      "image/jxr": { source: `iana`, extensions: [`jxr`] },
      "image/jxra": { source: `iana`, extensions: [`jxra`] },
      "image/jxrs": { source: `iana`, extensions: [`jxrs`] },
      "image/jxs": { source: `iana`, extensions: [`jxs`] },
      "image/jxsc": { source: `iana`, extensions: [`jxsc`] },
      "image/jxsi": { source: `iana`, extensions: [`jxsi`] },
      "image/jxss": { source: `iana`, extensions: [`jxss`] },
      "image/ktx": { source: `iana`, extensions: [`ktx`] },
      "image/ktx2": { source: `iana`, extensions: [`ktx2`] },
      "image/naplps": { source: `iana` },
      "image/pjpeg": { compressible: !1 },
      "image/png": { source: `iana`, compressible: !1, extensions: [`png`] },
      "image/prs.btif": { source: `iana`, extensions: [`btif`] },
      "image/prs.pti": { source: `iana`, extensions: [`pti`] },
      "image/pwg-raster": { source: `iana` },
      "image/sgi": { source: `apache`, extensions: [`sgi`] },
      "image/svg+xml": { source: `iana`, compressible: !0, extensions: [`svg`, `svgz`] },
      "image/t38": { source: `iana`, extensions: [`t38`] },
      "image/tiff": { source: `iana`, compressible: !1, extensions: [`tif`, `tiff`] },
      "image/tiff-fx": { source: `iana`, extensions: [`tfx`] },
      "image/vnd.adobe.photoshop": { source: `iana`, compressible: !0, extensions: [`psd`] },
      "image/vnd.airzip.accelerator.azv": { source: `iana`, extensions: [`azv`] },
      "image/vnd.cns.inf2": { source: `iana` },
      "image/vnd.dece.graphic": { source: `iana`, extensions: [`uvi`, `uvvi`, `uvg`, `uvvg`] },
      "image/vnd.djvu": { source: `iana`, extensions: [`djvu`, `djv`] },
      "image/vnd.dvb.subtitle": { source: `iana`, extensions: [`sub`] },
      "image/vnd.dwg": { source: `iana`, extensions: [`dwg`] },
      "image/vnd.dxf": { source: `iana`, extensions: [`dxf`] },
      "image/vnd.fastbidsheet": { source: `iana`, extensions: [`fbs`] },
      "image/vnd.fpx": { source: `iana`, extensions: [`fpx`] },
      "image/vnd.fst": { source: `iana`, extensions: [`fst`] },
      "image/vnd.fujixerox.edmics-mmr": { source: `iana`, extensions: [`mmr`] },
      "image/vnd.fujixerox.edmics-rlc": { source: `iana`, extensions: [`rlc`] },
      "image/vnd.globalgraphics.pgb": { source: `iana` },
      "image/vnd.microsoft.icon": { source: `iana`, compressible: !0, extensions: [`ico`] },
      "image/vnd.mix": { source: `iana` },
      "image/vnd.mozilla.apng": { source: `iana` },
      "image/vnd.ms-dds": { compressible: !0, extensions: [`dds`] },
      "image/vnd.ms-modi": { source: `iana`, extensions: [`mdi`] },
      "image/vnd.ms-photo": { source: `apache`, extensions: [`wdp`] },
      "image/vnd.net-fpx": { source: `iana`, extensions: [`npx`] },
      "image/vnd.pco.b16": { source: `iana`, extensions: [`b16`] },
      "image/vnd.radiance": { source: `iana` },
      "image/vnd.sealed.png": { source: `iana` },
      "image/vnd.sealedmedia.softseal.gif": { source: `iana` },
      "image/vnd.sealedmedia.softseal.jpg": { source: `iana` },
      "image/vnd.svf": { source: `iana` },
      "image/vnd.tencent.tap": { source: `iana`, extensions: [`tap`] },
      "image/vnd.valve.source.texture": { source: `iana`, extensions: [`vtf`] },
      "image/vnd.wap.wbmp": { source: `iana`, extensions: [`wbmp`] },
      "image/vnd.xiff": { source: `iana`, extensions: [`xif`] },
      "image/vnd.zbrush.pcx": { source: `iana`, extensions: [`pcx`] },
      "image/webp": { source: `apache`, extensions: [`webp`] },
      "image/wmf": { source: `iana`, extensions: [`wmf`] },
      "image/x-3ds": { source: `apache`, extensions: [`3ds`] },
      "image/x-cmu-raster": { source: `apache`, extensions: [`ras`] },
      "image/x-cmx": { source: `apache`, extensions: [`cmx`] },
      "image/x-freehand": { source: `apache`, extensions: [`fh`, `fhc`, `fh4`, `fh5`, `fh7`] },
      "image/x-icon": { source: `apache`, compressible: !0, extensions: [`ico`] },
      "image/x-jng": { source: `nginx`, extensions: [`jng`] },
      "image/x-mrsid-image": { source: `apache`, extensions: [`sid`] },
      "image/x-ms-bmp": { source: `nginx`, compressible: !0, extensions: [`bmp`] },
      "image/x-pcx": { source: `apache`, extensions: [`pcx`] },
      "image/x-pict": { source: `apache`, extensions: [`pic`, `pct`] },
      "image/x-portable-anymap": { source: `apache`, extensions: [`pnm`] },
      "image/x-portable-bitmap": { source: `apache`, extensions: [`pbm`] },
      "image/x-portable-graymap": { source: `apache`, extensions: [`pgm`] },
      "image/x-portable-pixmap": { source: `apache`, extensions: [`ppm`] },
      "image/x-rgb": { source: `apache`, extensions: [`rgb`] },
      "image/x-tga": { source: `apache`, extensions: [`tga`] },
      "image/x-xbitmap": { source: `apache`, extensions: [`xbm`] },
      "image/x-xcf": { compressible: !1 },
      "image/x-xpixmap": { source: `apache`, extensions: [`xpm`] },
      "image/x-xwindowdump": { source: `apache`, extensions: [`xwd`] },
      "message/cpim": { source: `iana` },
      "message/delivery-status": { source: `iana` },
      "message/disposition-notification": {
        source: `iana`,
        extensions: [`disposition-notification`],
      },
      "message/external-body": { source: `iana` },
      "message/feedback-report": { source: `iana` },
      "message/global": { source: `iana`, extensions: [`u8msg`] },
      "message/global-delivery-status": { source: `iana`, extensions: [`u8dsn`] },
      "message/global-disposition-notification": { source: `iana`, extensions: [`u8mdn`] },
      "message/global-headers": { source: `iana`, extensions: [`u8hdr`] },
      "message/http": { source: `iana`, compressible: !1 },
      "message/imdn+xml": { source: `iana`, compressible: !0 },
      "message/news": { source: `iana` },
      "message/partial": { source: `iana`, compressible: !1 },
      "message/rfc822": { source: `iana`, compressible: !0, extensions: [`eml`, `mime`] },
      "message/s-http": { source: `iana` },
      "message/sip": { source: `iana` },
      "message/sipfrag": { source: `iana` },
      "message/tracking-status": { source: `iana` },
      "message/vnd.si.simp": { source: `iana` },
      "message/vnd.wfa.wsc": { source: `iana`, extensions: [`wsc`] },
      "model/3mf": { source: `iana`, extensions: [`3mf`] },
      "model/e57": { source: `iana` },
      "model/gltf+json": { source: `iana`, compressible: !0, extensions: [`gltf`] },
      "model/gltf-binary": { source: `iana`, compressible: !0, extensions: [`glb`] },
      "model/iges": { source: `iana`, compressible: !1, extensions: [`igs`, `iges`] },
      "model/mesh": { source: `iana`, compressible: !1, extensions: [`msh`, `mesh`, `silo`] },
      "model/mtl": { source: `iana`, extensions: [`mtl`] },
      "model/obj": { source: `iana`, extensions: [`obj`] },
      "model/step": { source: `iana` },
      "model/step+xml": { source: `iana`, compressible: !0, extensions: [`stpx`] },
      "model/step+zip": { source: `iana`, compressible: !1, extensions: [`stpz`] },
      "model/step-xml+zip": { source: `iana`, compressible: !1, extensions: [`stpxz`] },
      "model/stl": { source: `iana`, extensions: [`stl`] },
      "model/vnd.collada+xml": { source: `iana`, compressible: !0, extensions: [`dae`] },
      "model/vnd.dwf": { source: `iana`, extensions: [`dwf`] },
      "model/vnd.flatland.3dml": { source: `iana` },
      "model/vnd.gdl": { source: `iana`, extensions: [`gdl`] },
      "model/vnd.gs-gdl": { source: `apache` },
      "model/vnd.gs.gdl": { source: `iana` },
      "model/vnd.gtw": { source: `iana`, extensions: [`gtw`] },
      "model/vnd.moml+xml": { source: `iana`, compressible: !0 },
      "model/vnd.mts": { source: `iana`, extensions: [`mts`] },
      "model/vnd.opengex": { source: `iana`, extensions: [`ogex`] },
      "model/vnd.parasolid.transmit.binary": { source: `iana`, extensions: [`x_b`] },
      "model/vnd.parasolid.transmit.text": { source: `iana`, extensions: [`x_t`] },
      "model/vnd.pytha.pyox": { source: `iana` },
      "model/vnd.rosette.annotated-data-model": { source: `iana` },
      "model/vnd.sap.vds": { source: `iana`, extensions: [`vds`] },
      "model/vnd.usdz+zip": { source: `iana`, compressible: !1, extensions: [`usdz`] },
      "model/vnd.valve.source.compiled-map": { source: `iana`, extensions: [`bsp`] },
      "model/vnd.vtu": { source: `iana`, extensions: [`vtu`] },
      "model/vrml": { source: `iana`, compressible: !1, extensions: [`wrl`, `vrml`] },
      "model/x3d+binary": { source: `apache`, compressible: !1, extensions: [`x3db`, `x3dbz`] },
      "model/x3d+fastinfoset": { source: `iana`, extensions: [`x3db`] },
      "model/x3d+vrml": { source: `apache`, compressible: !1, extensions: [`x3dv`, `x3dvz`] },
      "model/x3d+xml": { source: `iana`, compressible: !0, extensions: [`x3d`, `x3dz`] },
      "model/x3d-vrml": { source: `iana`, extensions: [`x3dv`] },
      "multipart/alternative": { source: `iana`, compressible: !1 },
      "multipart/appledouble": { source: `iana` },
      "multipart/byteranges": { source: `iana` },
      "multipart/digest": { source: `iana` },
      "multipart/encrypted": { source: `iana`, compressible: !1 },
      "multipart/form-data": { source: `iana`, compressible: !1 },
      "multipart/header-set": { source: `iana` },
      "multipart/mixed": { source: `iana` },
      "multipart/multilingual": { source: `iana` },
      "multipart/parallel": { source: `iana` },
      "multipart/related": { source: `iana`, compressible: !1 },
      "multipart/report": { source: `iana` },
      "multipart/signed": { source: `iana`, compressible: !1 },
      "multipart/vnd.bint.med-plus": { source: `iana` },
      "multipart/voice-message": { source: `iana` },
      "multipart/x-mixed-replace": { source: `iana` },
      "text/1d-interleaved-parityfec": { source: `iana` },
      "text/cache-manifest": {
        source: `iana`,
        compressible: !0,
        extensions: [`appcache`, `manifest`],
      },
      "text/calendar": { source: `iana`, extensions: [`ics`, `ifb`] },
      "text/calender": { compressible: !0 },
      "text/cmd": { compressible: !0 },
      "text/coffeescript": { extensions: [`coffee`, `litcoffee`] },
      "text/cql": { source: `iana` },
      "text/cql-expression": { source: `iana` },
      "text/cql-identifier": { source: `iana` },
      "text/css": { source: `iana`, charset: `UTF-8`, compressible: !0, extensions: [`css`] },
      "text/csv": { source: `iana`, compressible: !0, extensions: [`csv`] },
      "text/csv-schema": { source: `iana` },
      "text/directory": { source: `iana` },
      "text/dns": { source: `iana` },
      "text/ecmascript": { source: `iana` },
      "text/encaprtp": { source: `iana` },
      "text/enriched": { source: `iana` },
      "text/fhirpath": { source: `iana` },
      "text/flexfec": { source: `iana` },
      "text/fwdred": { source: `iana` },
      "text/gff3": { source: `iana` },
      "text/grammar-ref-list": { source: `iana` },
      "text/html": { source: `iana`, compressible: !0, extensions: [`html`, `htm`, `shtml`] },
      "text/jade": { extensions: [`jade`] },
      "text/javascript": { source: `iana`, compressible: !0 },
      "text/jcr-cnd": { source: `iana` },
      "text/jsx": { compressible: !0, extensions: [`jsx`] },
      "text/less": { compressible: !0, extensions: [`less`] },
      "text/markdown": { source: `iana`, compressible: !0, extensions: [`markdown`, `md`] },
      "text/mathml": { source: `nginx`, extensions: [`mml`] },
      "text/mdx": { compressible: !0, extensions: [`mdx`] },
      "text/mizar": { source: `iana` },
      "text/n3": { source: `iana`, charset: `UTF-8`, compressible: !0, extensions: [`n3`] },
      "text/parameters": { source: `iana`, charset: `UTF-8` },
      "text/parityfec": { source: `iana` },
      "text/plain": {
        source: `iana`,
        compressible: !0,
        extensions: [`txt`, `text`, `conf`, `def`, `list`, `log`, `in`, `ini`],
      },
      "text/provenance-notation": { source: `iana`, charset: `UTF-8` },
      "text/prs.fallenstein.rst": { source: `iana` },
      "text/prs.lines.tag": { source: `iana`, extensions: [`dsc`] },
      "text/prs.prop.logic": { source: `iana` },
      "text/raptorfec": { source: `iana` },
      "text/red": { source: `iana` },
      "text/rfc822-headers": { source: `iana` },
      "text/richtext": { source: `iana`, compressible: !0, extensions: [`rtx`] },
      "text/rtf": { source: `iana`, compressible: !0, extensions: [`rtf`] },
      "text/rtp-enc-aescm128": { source: `iana` },
      "text/rtploopback": { source: `iana` },
      "text/rtx": { source: `iana` },
      "text/sgml": { source: `iana`, extensions: [`sgml`, `sgm`] },
      "text/shaclc": { source: `iana` },
      "text/shex": { source: `iana`, extensions: [`shex`] },
      "text/slim": { extensions: [`slim`, `slm`] },
      "text/spdx": { source: `iana`, extensions: [`spdx`] },
      "text/strings": { source: `iana` },
      "text/stylus": { extensions: [`stylus`, `styl`] },
      "text/t140": { source: `iana` },
      "text/tab-separated-values": { source: `iana`, compressible: !0, extensions: [`tsv`] },
      "text/troff": { source: `iana`, extensions: [`t`, `tr`, `roff`, `man`, `me`, `ms`] },
      "text/turtle": { source: `iana`, charset: `UTF-8`, extensions: [`ttl`] },
      "text/ulpfec": { source: `iana` },
      "text/uri-list": { source: `iana`, compressible: !0, extensions: [`uri`, `uris`, `urls`] },
      "text/vcard": { source: `iana`, compressible: !0, extensions: [`vcard`] },
      "text/vnd.a": { source: `iana` },
      "text/vnd.abc": { source: `iana` },
      "text/vnd.ascii-art": { source: `iana` },
      "text/vnd.curl": { source: `iana`, extensions: [`curl`] },
      "text/vnd.curl.dcurl": { source: `apache`, extensions: [`dcurl`] },
      "text/vnd.curl.mcurl": { source: `apache`, extensions: [`mcurl`] },
      "text/vnd.curl.scurl": { source: `apache`, extensions: [`scurl`] },
      "text/vnd.debian.copyright": { source: `iana`, charset: `UTF-8` },
      "text/vnd.dmclientscript": { source: `iana` },
      "text/vnd.dvb.subtitle": { source: `iana`, extensions: [`sub`] },
      "text/vnd.esmertec.theme-descriptor": { source: `iana`, charset: `UTF-8` },
      "text/vnd.familysearch.gedcom": { source: `iana`, extensions: [`ged`] },
      "text/vnd.ficlab.flt": { source: `iana` },
      "text/vnd.fly": { source: `iana`, extensions: [`fly`] },
      "text/vnd.fmi.flexstor": { source: `iana`, extensions: [`flx`] },
      "text/vnd.gml": { source: `iana` },
      "text/vnd.graphviz": { source: `iana`, extensions: [`gv`] },
      "text/vnd.hans": { source: `iana` },
      "text/vnd.hgl": { source: `iana` },
      "text/vnd.in3d.3dml": { source: `iana`, extensions: [`3dml`] },
      "text/vnd.in3d.spot": { source: `iana`, extensions: [`spot`] },
      "text/vnd.iptc.newsml": { source: `iana` },
      "text/vnd.iptc.nitf": { source: `iana` },
      "text/vnd.latex-z": { source: `iana` },
      "text/vnd.motorola.reflex": { source: `iana` },
      "text/vnd.ms-mediapackage": { source: `iana` },
      "text/vnd.net2phone.commcenter.command": { source: `iana` },
      "text/vnd.radisys.msml-basic-layout": { source: `iana` },
      "text/vnd.senx.warpscript": { source: `iana` },
      "text/vnd.si.uricatalogue": { source: `iana` },
      "text/vnd.sosi": { source: `iana` },
      "text/vnd.sun.j2me.app-descriptor": { source: `iana`, charset: `UTF-8`, extensions: [`jad`] },
      "text/vnd.trolltech.linguist": { source: `iana`, charset: `UTF-8` },
      "text/vnd.wap.si": { source: `iana` },
      "text/vnd.wap.sl": { source: `iana` },
      "text/vnd.wap.wml": { source: `iana`, extensions: [`wml`] },
      "text/vnd.wap.wmlscript": { source: `iana`, extensions: [`wmls`] },
      "text/vtt": { source: `iana`, charset: `UTF-8`, compressible: !0, extensions: [`vtt`] },
      "text/x-asm": { source: `apache`, extensions: [`s`, `asm`] },
      "text/x-c": { source: `apache`, extensions: [`c`, `cc`, `cxx`, `cpp`, `h`, `hh`, `dic`] },
      "text/x-component": { source: `nginx`, extensions: [`htc`] },
      "text/x-fortran": { source: `apache`, extensions: [`f`, `for`, `f77`, `f90`] },
      "text/x-gwt-rpc": { compressible: !0 },
      "text/x-handlebars-template": { extensions: [`hbs`] },
      "text/x-java-source": { source: `apache`, extensions: [`java`] },
      "text/x-jquery-tmpl": { compressible: !0 },
      "text/x-lua": { extensions: [`lua`] },
      "text/x-markdown": { compressible: !0, extensions: [`mkd`] },
      "text/x-nfo": { source: `apache`, extensions: [`nfo`] },
      "text/x-opml": { source: `apache`, extensions: [`opml`] },
      "text/x-org": { compressible: !0, extensions: [`org`] },
      "text/x-pascal": { source: `apache`, extensions: [`p`, `pas`] },
      "text/x-processing": { compressible: !0, extensions: [`pde`] },
      "text/x-sass": { extensions: [`sass`] },
      "text/x-scss": { extensions: [`scss`] },
      "text/x-setext": { source: `apache`, extensions: [`etx`] },
      "text/x-sfv": { source: `apache`, extensions: [`sfv`] },
      "text/x-suse-ymp": { compressible: !0, extensions: [`ymp`] },
      "text/x-uuencode": { source: `apache`, extensions: [`uu`] },
      "text/x-vcalendar": { source: `apache`, extensions: [`vcs`] },
      "text/x-vcard": { source: `apache`, extensions: [`vcf`] },
      "text/xml": { source: `iana`, compressible: !0, extensions: [`xml`] },
      "text/xml-external-parsed-entity": { source: `iana` },
      "text/yaml": { compressible: !0, extensions: [`yaml`, `yml`] },
      "video/1d-interleaved-parityfec": { source: `iana` },
      "video/3gpp": { source: `iana`, extensions: [`3gp`, `3gpp`] },
      "video/3gpp-tt": { source: `iana` },
      "video/3gpp2": { source: `iana`, extensions: [`3g2`] },
      "video/av1": { source: `iana` },
      "video/bmpeg": { source: `iana` },
      "video/bt656": { source: `iana` },
      "video/celb": { source: `iana` },
      "video/dv": { source: `iana` },
      "video/encaprtp": { source: `iana` },
      "video/ffv1": { source: `iana` },
      "video/flexfec": { source: `iana` },
      "video/h261": { source: `iana`, extensions: [`h261`] },
      "video/h263": { source: `iana`, extensions: [`h263`] },
      "video/h263-1998": { source: `iana` },
      "video/h263-2000": { source: `iana` },
      "video/h264": { source: `iana`, extensions: [`h264`] },
      "video/h264-rcdo": { source: `iana` },
      "video/h264-svc": { source: `iana` },
      "video/h265": { source: `iana` },
      "video/iso.segment": { source: `iana`, extensions: [`m4s`] },
      "video/jpeg": { source: `iana`, extensions: [`jpgv`] },
      "video/jpeg2000": { source: `iana` },
      "video/jpm": { source: `apache`, extensions: [`jpm`, `jpgm`] },
      "video/jxsv": { source: `iana` },
      "video/mj2": { source: `iana`, extensions: [`mj2`, `mjp2`] },
      "video/mp1s": { source: `iana` },
      "video/mp2p": { source: `iana` },
      "video/mp2t": { source: `iana`, extensions: [`ts`] },
      "video/mp4": { source: `iana`, compressible: !1, extensions: [`mp4`, `mp4v`, `mpg4`] },
      "video/mp4v-es": { source: `iana` },
      "video/mpeg": {
        source: `iana`,
        compressible: !1,
        extensions: [`mpeg`, `mpg`, `mpe`, `m1v`, `m2v`],
      },
      "video/mpeg4-generic": { source: `iana` },
      "video/mpv": { source: `iana` },
      "video/nv": { source: `iana` },
      "video/ogg": { source: `iana`, compressible: !1, extensions: [`ogv`] },
      "video/parityfec": { source: `iana` },
      "video/pointer": { source: `iana` },
      "video/quicktime": { source: `iana`, compressible: !1, extensions: [`qt`, `mov`] },
      "video/raptorfec": { source: `iana` },
      "video/raw": { source: `iana` },
      "video/rtp-enc-aescm128": { source: `iana` },
      "video/rtploopback": { source: `iana` },
      "video/rtx": { source: `iana` },
      "video/scip": { source: `iana` },
      "video/smpte291": { source: `iana` },
      "video/smpte292m": { source: `iana` },
      "video/ulpfec": { source: `iana` },
      "video/vc1": { source: `iana` },
      "video/vc2": { source: `iana` },
      "video/vnd.cctv": { source: `iana` },
      "video/vnd.dece.hd": { source: `iana`, extensions: [`uvh`, `uvvh`] },
      "video/vnd.dece.mobile": { source: `iana`, extensions: [`uvm`, `uvvm`] },
      "video/vnd.dece.mp4": { source: `iana` },
      "video/vnd.dece.pd": { source: `iana`, extensions: [`uvp`, `uvvp`] },
      "video/vnd.dece.sd": { source: `iana`, extensions: [`uvs`, `uvvs`] },
      "video/vnd.dece.video": { source: `iana`, extensions: [`uvv`, `uvvv`] },
      "video/vnd.directv.mpeg": { source: `iana` },
      "video/vnd.directv.mpeg-tts": { source: `iana` },
      "video/vnd.dlna.mpeg-tts": { source: `iana` },
      "video/vnd.dvb.file": { source: `iana`, extensions: [`dvb`] },
      "video/vnd.fvt": { source: `iana`, extensions: [`fvt`] },
      "video/vnd.hns.video": { source: `iana` },
      "video/vnd.iptvforum.1dparityfec-1010": { source: `iana` },
      "video/vnd.iptvforum.1dparityfec-2005": { source: `iana` },
      "video/vnd.iptvforum.2dparityfec-1010": { source: `iana` },
      "video/vnd.iptvforum.2dparityfec-2005": { source: `iana` },
      "video/vnd.iptvforum.ttsavc": { source: `iana` },
      "video/vnd.iptvforum.ttsmpeg2": { source: `iana` },
      "video/vnd.motorola.video": { source: `iana` },
      "video/vnd.motorola.videop": { source: `iana` },
      "video/vnd.mpegurl": { source: `iana`, extensions: [`mxu`, `m4u`] },
      "video/vnd.ms-playready.media.pyv": { source: `iana`, extensions: [`pyv`] },
      "video/vnd.nokia.interleaved-multimedia": { source: `iana` },
      "video/vnd.nokia.mp4vr": { source: `iana` },
      "video/vnd.nokia.videovoip": { source: `iana` },
      "video/vnd.objectvideo": { source: `iana` },
      "video/vnd.radgamettools.bink": { source: `iana` },
      "video/vnd.radgamettools.smacker": { source: `iana` },
      "video/vnd.sealed.mpeg1": { source: `iana` },
      "video/vnd.sealed.mpeg4": { source: `iana` },
      "video/vnd.sealed.swf": { source: `iana` },
      "video/vnd.sealedmedia.softseal.mov": { source: `iana` },
      "video/vnd.uvvu.mp4": { source: `iana`, extensions: [`uvu`, `uvvu`] },
      "video/vnd.vivo": { source: `iana`, extensions: [`viv`] },
      "video/vnd.youtube.yt": { source: `iana` },
      "video/vp8": { source: `iana` },
      "video/vp9": { source: `iana` },
      "video/webm": { source: `apache`, compressible: !1, extensions: [`webm`] },
      "video/x-f4v": { source: `apache`, extensions: [`f4v`] },
      "video/x-fli": { source: `apache`, extensions: [`fli`] },
      "video/x-flv": { source: `apache`, compressible: !1, extensions: [`flv`] },
      "video/x-m4v": { source: `apache`, extensions: [`m4v`] },
      "video/x-matroska": {
        source: `apache`,
        compressible: !1,
        extensions: [`mkv`, `mk3d`, `mks`],
      },
      "video/x-mng": { source: `apache`, extensions: [`mng`] },
      "video/x-ms-asf": { source: `apache`, extensions: [`asf`, `asx`] },
      "video/x-ms-vob": { source: `apache`, extensions: [`vob`] },
      "video/x-ms-wm": { source: `apache`, extensions: [`wm`] },
      "video/x-ms-wmv": { source: `apache`, compressible: !1, extensions: [`wmv`] },
      "video/x-ms-wmx": { source: `apache`, extensions: [`wmx`] },
      "video/x-ms-wvx": { source: `apache`, extensions: [`wvx`] },
      "video/x-msvideo": { source: `apache`, extensions: [`avi`] },
      "video/x-sgi-movie": { source: `apache`, extensions: [`movie`] },
      "video/x-smv": { source: `apache`, extensions: [`smv`] },
      "x-conference/x-cooltalk": { source: `apache`, extensions: [`ice`] },
      "x-shader/x-fragment": { compressible: !0 },
      "x-shader/x-vertex": { compressible: !0 },
    };
  }),
  $e = e.t((t, n) => {
    n.exports = (Qe(), e.i(Xe).default);
  }),
  et = e.t((e) => {
    var t = $e(),
      n = require("path").extname,
      r = /^\s*([^;\s]*)(?:;|\s|$)/,
      i = /^text\//i;
    ((e.charset = a),
      (e.charsets = { lookup: a }),
      (e.contentType = o),
      (e.extension = s),
      (e.extensions = Object.create(null)),
      (e.lookup = c),
      (e.types = Object.create(null)),
      l(e.extensions, e.types));
    function a(e) {
      if (!e || typeof e != `string`) return !1;
      var n = r.exec(e),
        a = n && t[n[1].toLowerCase()];
      return a && a.charset ? a.charset : n && i.test(n[1]) ? `UTF-8` : !1;
    }
    function o(t) {
      if (!t || typeof t != `string`) return !1;
      var n = t.indexOf(`/`) === -1 ? e.lookup(t) : t;
      if (!n) return !1;
      if (n.indexOf(`charset`) === -1) {
        var r = e.charset(n);
        r && (n += `; charset=` + r.toLowerCase());
      }
      return n;
    }
    function s(t) {
      if (!t || typeof t != `string`) return !1;
      var n = r.exec(t),
        i = n && e.extensions[n[1].toLowerCase()];
      return !i || !i.length ? !1 : i[0];
    }
    function c(t) {
      if (!t || typeof t != `string`) return !1;
      var r = n(`x.` + t)
        .toLowerCase()
        .substr(1);
      return (r && e.types[r]) || !1;
    }
    function l(e, n) {
      var r = [`nginx`, `apache`, void 0, `iana`];
      Object.keys(t).forEach(function (i) {
        var a = t[i],
          o = a.extensions;
        if (o && o.length) {
          e[i] = o;
          for (var s = 0; s < o.length; s++) {
            var c = o[s];
            if (n[c]) {
              var l = r.indexOf(t[n[c]].source),
                u = r.indexOf(a.source);
              if (
                n[c] !== `application/octet-stream` &&
                (l > u || (l === u && n[c].substr(0, 12) === `application/`))
              )
                continue;
            }
            n[c] = i;
          }
        }
      });
    }
  }),
  tt = et(),
  nt = `-`,
  rt = `fs`,
  it = `index.html`,
  at = `detached-window.html`,
  ot = `/@fs`,
  st = `app://${nt}`,
  ct = `app://${rt}`;
  Xt = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e._globalThis = void 0),
      (e._globalThis = typeof globalThis == `object` ? globalThis : global));
  }),
  Zt = e.t((e) => {
    var t =
        (e && e.__createBinding) ||
        (Object.create
          ? function (e, t, n, r) {
              (r === void 0 && (r = n),
                Object.defineProperty(e, r, {
                  enumerable: !0,
                  get: function () {
                    return t[n];
                  },
                }));
            }
          : function (e, t, n, r) {
              (r === void 0 && (r = n), (e[r] = t[n]));
            }),
      n =
        (e && e.__exportStar) ||
        function (e, n) {
          for (var r in e)
            r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
        };
    (Object.defineProperty(e, "__esModule", { value: !0 }), n(Xt(), e));
  }),
  Qt = e.t((e) => {
    var t =
        (e && e.__createBinding) ||
        (Object.create
          ? function (e, t, n, r) {
              (r === void 0 && (r = n),
                Object.defineProperty(e, r, {
                  enumerable: !0,
                  get: function () {
                    return t[n];
                  },
                }));
            }
          : function (e, t, n, r) {
              (r === void 0 && (r = n), (e[r] = t[n]));
            }),
      n =
        (e && e.__exportStar) ||
        function (e, n) {
          for (var r in e)
            r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
        };
    (Object.defineProperty(e, "__esModule", { value: !0 }), n(Zt(), e));
  }),
  $t = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.VERSION = void 0),
      (e.VERSION = `1.9.0`));
  }),
  en = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.isCompatible = e._makeCompatibilityCheck = void 0));
    var t = $t(),
      n = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
    function r(e) {
      let t = new Set([e]),
        r = new Set(),
        i = e.match(n);
      if (!i) return () => !1;
      let a = { major: +i[1], minor: +i[2], patch: +i[3], prerelease: i[4] };
      if (a.prerelease != null)
        return function (t) {
          return t === e;
        };
      function o(e) {
        return (r.add(e), !1);
      }
      function s(e) {
        return (t.add(e), !0);
      }
      return function (e) {
        if (t.has(e)) return !0;
        if (r.has(e)) return !1;
        let i = e.match(n);
        if (!i) return o(e);
        let c = { major: +i[1], minor: +i[2], patch: +i[3], prerelease: i[4] };
        return c.prerelease != null || a.major !== c.major
          ? o(e)
          : a.major === 0
            ? a.minor === c.minor && a.patch <= c.patch
              ? s(e)
              : o(e)
            : a.minor <= c.minor
              ? s(e)
              : o(e);
      };
    }
    ((e._makeCompatibilityCheck = r), (e.isCompatible = r(t.VERSION)));
  }),
  tn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.unregisterGlobal = e.getGlobal = e.registerGlobal = void 0));
    var t = Qt(),
      n = $t(),
      r = en(),
      i = n.VERSION.split(`.`)[0],
      a = Symbol.for(`opentelemetry.js.api.${i}`),
      o = t._globalThis;
    function s(e, t, r, i = !1) {
      let s = (o[a] = o[a] ?? { version: n.VERSION });
      if (!i && s[e]) {
        let t = Error(`@opentelemetry/api: Attempted duplicate registration of API: ${e}`);
        return (r.error(t.stack || t.message), !1);
      }
      if (s.version !== n.VERSION) {
        let t = Error(
          `@opentelemetry/api: Registration of version v${s.version} for ${e} does not match previously registered API v${n.VERSION}`,
        );
        return (r.error(t.stack || t.message), !1);
      }
      return (
        (s[e] = t),
        r.debug(`@opentelemetry/api: Registered a global for ${e} v${n.VERSION}.`),
        !0
      );
    }
    e.registerGlobal = s;
    function c(e) {
      let t = o[a]?.version;
      if (t && (0, r.isCompatible)(t)) return o[a]?.[e];
    }
    e.getGlobal = c;
    function l(e, t) {
      t.debug(`@opentelemetry/api: Unregistering a global for ${e} v${n.VERSION}.`);
      let r = o[a];
      r && delete r[e];
    }
    e.unregisterGlobal = l;
  }),
  nn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.DiagComponentLogger = void 0));
    var t = tn();
    e.DiagComponentLogger = class {
      constructor(e) {
        this._namespace = e.namespace || `DiagComponentLogger`;
      }
      debug(...e) {
        return n(`debug`, this._namespace, e);
      }
      error(...e) {
        return n(`error`, this._namespace, e);
      }
      info(...e) {
        return n(`info`, this._namespace, e);
      }
      warn(...e) {
        return n(`warn`, this._namespace, e);
      }
      verbose(...e) {
        return n(`verbose`, this._namespace, e);
      }
    };
    function n(e, n, r) {
      let i = (0, t.getGlobal)(`diag`);
      if (i) return (r.unshift(n), i[e](...r));
    }
  }),
  rn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.DiagLogLevel = void 0),
      (function (e) {
        ((e[(e.NONE = 0)] = `NONE`),
          (e[(e.ERROR = 30)] = `ERROR`),
          (e[(e.WARN = 50)] = `WARN`),
          (e[(e.INFO = 60)] = `INFO`),
          (e[(e.DEBUG = 70)] = `DEBUG`),
          (e[(e.VERBOSE = 80)] = `VERBOSE`),
          (e[(e.ALL = 9999)] = `ALL`));
      })((e.DiagLogLevel ||= {})));
  }),
  an = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.createLogLevelDiagLogger = void 0));
    var t = rn();
    function n(e, n) {
      (e < t.DiagLogLevel.NONE
        ? (e = t.DiagLogLevel.NONE)
        : e > t.DiagLogLevel.ALL && (e = t.DiagLogLevel.ALL),
        (n ||= {}));
      function r(t, r) {
        let i = n[t];
        return typeof i == `function` && e >= r ? i.bind(n) : function () {};
      }
      return {
        error: r(`error`, t.DiagLogLevel.ERROR),
        warn: r(`warn`, t.DiagLogLevel.WARN),
        info: r(`info`, t.DiagLogLevel.INFO),
        debug: r(`debug`, t.DiagLogLevel.DEBUG),
        verbose: r(`verbose`, t.DiagLogLevel.VERBOSE),
      };
    }
    e.createLogLevelDiagLogger = n;
  }),
  on = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.DiagAPI = void 0));
    var t = nn(),
      n = an(),
      r = rn(),
      i = tn(),
      a = `diag`;
    e.DiagAPI = class e {
      constructor() {
        function e(e) {
          return function (...t) {
            let n = (0, i.getGlobal)(`diag`);
            if (n) return n[e](...t);
          };
        }
        let o = this;
        ((o.setLogger = (e, t = { logLevel: r.DiagLogLevel.INFO }) => {
          if (e === o) {
            let e = Error(
              `Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation`,
            );
            return (o.error(e.stack ?? e.message), !1);
          }
          typeof t == `number` && (t = { logLevel: t });
          let a = (0, i.getGlobal)(`diag`),
            s = (0, n.createLogLevelDiagLogger)(t.logLevel ?? r.DiagLogLevel.INFO, e);
          if (a && !t.suppressOverrideMessage) {
            let e = Error().stack ?? `<failed to generate stacktrace>`;
            (a.warn(`Current logger will be overwritten from ${e}`),
              s.warn(`Current logger will overwrite one already registered from ${e}`));
          }
          return (0, i.registerGlobal)(`diag`, s, o, !0);
        }),
          (o.disable = () => {
            (0, i.unregisterGlobal)(a, o);
          }),
          (o.createComponentLogger = (e) => new t.DiagComponentLogger(e)),
          (o.verbose = e(`verbose`)),
          (o.debug = e(`debug`)),
          (o.info = e(`info`)),
          (o.warn = e(`warn`)),
          (o.error = e(`error`)));
      }
      static instance() {
        return ((this._instance ||= new e()), this._instance);
      }
    };
  }),
  sn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.BaggageImpl = void 0),
      (e.BaggageImpl = class e {
        constructor(e) {
          this._entries = e ? new Map(e) : new Map();
        }
        getEntry(e) {
          let t = this._entries.get(e);
          if (t) return Object.assign({}, t);
        }
        getAllEntries() {
          return Array.from(this._entries.entries()).map(([e, t]) => [e, t]);
        }
        setEntry(t, n) {
          let r = new e(this._entries);
          return (r._entries.set(t, n), r);
        }
        removeEntry(t) {
          let n = new e(this._entries);
          return (n._entries.delete(t), n);
        }
        removeEntries(...t) {
          let n = new e(this._entries);
          for (let e of t) n._entries.delete(e);
          return n;
        }
        clear() {
          return new e();
        }
      }));
  }),
  cn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.baggageEntryMetadataSymbol = void 0),
      (e.baggageEntryMetadataSymbol = Symbol(`BaggageEntryMetadata`)));
  }),
  ln = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.baggageEntryMetadataFromString = e.createBaggage = void 0));
    var t = on(),
      n = sn(),
      r = cn(),
      i = t.DiagAPI.instance();
    function a(e = {}) {
      return new n.BaggageImpl(new Map(Object.entries(e)));
    }
    e.createBaggage = a;
    function o(e) {
      return (
        typeof e != `string` &&
          (i.error(`Cannot create baggage metadata from unknown type: ${typeof e}`), (e = ``)),
        {
          __TYPE__: r.baggageEntryMetadataSymbol,
          toString() {
            return e;
          },
        }
      );
    }
    e.baggageEntryMetadataFromString = o;
  }),
  un = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.ROOT_CONTEXT = e.createContextKey = void 0));
    function t(e) {
      return Symbol.for(e);
    }
    ((e.createContextKey = t),
      (e.ROOT_CONTEXT = new (class e {
        constructor(t) {
          let n = this;
          ((n._currentContext = t ? new Map(t) : new Map()),
            (n.getValue = (e) => n._currentContext.get(e)),
            (n.setValue = (t, r) => {
              let i = new e(n._currentContext);
              return (i._currentContext.set(t, r), i);
            }),
            (n.deleteValue = (t) => {
              let r = new e(n._currentContext);
              return (r._currentContext.delete(t), r);
            }));
        }
      })()));
  }),
  dn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.DiagConsoleLogger = void 0));
    var t = [
      { n: `error`, c: `error` },
      { n: `warn`, c: `warn` },
      { n: `info`, c: `info` },
      { n: `debug`, c: `debug` },
      { n: `verbose`, c: `trace` },
    ];
    e.DiagConsoleLogger = class {
      constructor() {
        function e(e) {
          return function (...t) {
            if (console) {
              let n = console[e];
              if ((typeof n != `function` && (n = console.log), typeof n == `function`))
                return n.apply(console, t);
            }
          };
        }
        for (let n = 0; n < t.length; n++) this[t[n].n] = e(t[n].c);
      }
    };
  }),
  fn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.createNoopMeter =
        e.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC =
        e.NOOP_OBSERVABLE_GAUGE_METRIC =
        e.NOOP_OBSERVABLE_COUNTER_METRIC =
        e.NOOP_UP_DOWN_COUNTER_METRIC =
        e.NOOP_HISTOGRAM_METRIC =
        e.NOOP_GAUGE_METRIC =
        e.NOOP_COUNTER_METRIC =
        e.NOOP_METER =
        e.NoopObservableUpDownCounterMetric =
        e.NoopObservableGaugeMetric =
        e.NoopObservableCounterMetric =
        e.NoopObservableMetric =
        e.NoopHistogramMetric =
        e.NoopGaugeMetric =
        e.NoopUpDownCounterMetric =
        e.NoopCounterMetric =
        e.NoopMetric =
        e.NoopMeter =
          void 0));
    var t = class {
      constructor() {}
      createGauge(t, n) {
        return e.NOOP_GAUGE_METRIC;
      }
      createHistogram(t, n) {
        return e.NOOP_HISTOGRAM_METRIC;
      }
      createCounter(t, n) {
        return e.NOOP_COUNTER_METRIC;
      }
      createUpDownCounter(t, n) {
        return e.NOOP_UP_DOWN_COUNTER_METRIC;
      }
      createObservableGauge(t, n) {
        return e.NOOP_OBSERVABLE_GAUGE_METRIC;
      }
      createObservableCounter(t, n) {
        return e.NOOP_OBSERVABLE_COUNTER_METRIC;
      }
      createObservableUpDownCounter(t, n) {
        return e.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
      }
      addBatchObservableCallback(e, t) {}
      removeBatchObservableCallback(e) {}
    };
    e.NoopMeter = t;
    var n = class {};
    e.NoopMetric = n;
    var r = class extends n {
      add(e, t) {}
    };
    e.NoopCounterMetric = r;
    var i = class extends n {
      add(e, t) {}
    };
    e.NoopUpDownCounterMetric = i;
    var a = class extends n {
      record(e, t) {}
    };
    e.NoopGaugeMetric = a;
    var o = class extends n {
      record(e, t) {}
    };
    e.NoopHistogramMetric = o;
    var s = class {
      addCallback(e) {}
      removeCallback(e) {}
    };
    e.NoopObservableMetric = s;
    var c = class extends s {};
    e.NoopObservableCounterMetric = c;
    var l = class extends s {};
    e.NoopObservableGaugeMetric = l;
    var u = class extends s {};
    ((e.NoopObservableUpDownCounterMetric = u),
      (e.NOOP_METER = new t()),
      (e.NOOP_COUNTER_METRIC = new r()),
      (e.NOOP_GAUGE_METRIC = new a()),
      (e.NOOP_HISTOGRAM_METRIC = new o()),
      (e.NOOP_UP_DOWN_COUNTER_METRIC = new i()),
      (e.NOOP_OBSERVABLE_COUNTER_METRIC = new c()),
      (e.NOOP_OBSERVABLE_GAUGE_METRIC = new l()),
      (e.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new u()));
    function d() {
      return e.NOOP_METER;
    }
    e.createNoopMeter = d;
  }),
  pn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.ValueType = void 0),
      (function (e) {
        ((e[(e.INT = 0)] = `INT`), (e[(e.DOUBLE = 1)] = `DOUBLE`));
      })((e.ValueType ||= {})));
  }),
  mn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.defaultTextMapSetter = e.defaultTextMapGetter = void 0),
      (e.defaultTextMapGetter = {
        get(e, t) {
          if (e != null) return e[t];
        },
        keys(e) {
          return e == null ? [] : Object.keys(e);
        },
      }),
      (e.defaultTextMapSetter = {
        set(e, t, n) {
          e != null && (e[t] = n);
        },
      }));
  }),
  hn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.NoopContextManager = void 0));
    var t = un();
    e.NoopContextManager = class {
      active() {
        return t.ROOT_CONTEXT;
      }
      with(e, t, n, ...r) {
        return t.call(n, ...r);
      }
      bind(e, t) {
        return t;
      }
      enable() {
        return this;
      }
      disable() {
        return this;
      }
    };
  }),
  gn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.ContextAPI = void 0));
    var t = hn(),
      n = tn(),
      r = on(),
      i = `context`,
      a = new t.NoopContextManager();
    e.ContextAPI = class e {
      constructor() {}
      static getInstance() {
        return ((this._instance ||= new e()), this._instance);
      }
      setGlobalContextManager(e) {
        return (0, n.registerGlobal)(i, e, r.DiagAPI.instance());
      }
      active() {
        return this._getContextManager().active();
      }
      with(e, t, n, ...r) {
        return this._getContextManager().with(e, t, n, ...r);
      }
      bind(e, t) {
        return this._getContextManager().bind(e, t);
      }
      _getContextManager() {
        return (0, n.getGlobal)(i) || a;
      }
      disable() {
        (this._getContextManager().disable(), (0, n.unregisterGlobal)(i, r.DiagAPI.instance()));
      }
    };
  }),
  _n = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.TraceFlags = void 0),
      (function (e) {
        ((e[(e.NONE = 0)] = `NONE`), (e[(e.SAMPLED = 1)] = `SAMPLED`));
      })((e.TraceFlags ||= {})));
  }),
  vn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.INVALID_SPAN_CONTEXT = e.INVALID_TRACEID = e.INVALID_SPANID = void 0));
    var t = _n();
    ((e.INVALID_SPANID = `0000000000000000`),
      (e.INVALID_TRACEID = `00000000000000000000000000000000`),
      (e.INVALID_SPAN_CONTEXT = {
        traceId: e.INVALID_TRACEID,
        spanId: e.INVALID_SPANID,
        traceFlags: t.TraceFlags.NONE,
      }));
  }),
  yn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.NonRecordingSpan = void 0));
    var t = vn();
    e.NonRecordingSpan = class {
      constructor(e = t.INVALID_SPAN_CONTEXT) {
        this._spanContext = e;
      }
      spanContext() {
        return this._spanContext;
      }
      setAttribute(e, t) {
        return this;
      }
      setAttributes(e) {
        return this;
      }
      addEvent(e, t) {
        return this;
      }
      addLink(e) {
        return this;
      }
      addLinks(e) {
        return this;
      }
      setStatus(e) {
        return this;
      }
      updateName(e) {
        return this;
      }
      end(e) {}
      isRecording() {
        return !1;
      }
      recordException(e, t) {}
    };
  }),
  bn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.getSpanContext =
        e.setSpanContext =
        e.deleteSpan =
        e.setSpan =
        e.getActiveSpan =
        e.getSpan =
          void 0));
    var t = un(),
      n = yn(),
      r = gn(),
      i = (0, t.createContextKey)(`OpenTelemetry Context Key SPAN`);
    function a(e) {
      return e.getValue(i) || void 0;
    }
    e.getSpan = a;
    function o() {
      return a(r.ContextAPI.getInstance().active());
    }
    e.getActiveSpan = o;
    function s(e, t) {
      return e.setValue(i, t);
    }
    e.setSpan = s;
    function c(e) {
      return e.deleteValue(i);
    }
    e.deleteSpan = c;
    function l(e, t) {
      return s(e, new n.NonRecordingSpan(t));
    }
    e.setSpanContext = l;
    function u(e) {
      return a(e)?.spanContext();
    }
    e.getSpanContext = u;
  }),
  xn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.wrapSpanContext = e.isSpanContextValid = e.isValidSpanId = e.isValidTraceId = void 0));
    var t = vn(),
      n = yn(),
      r = /^([0-9a-f]{32})$/i,
      i = /^[0-9a-f]{16}$/i;
    function a(e) {
      return r.test(e) && e !== t.INVALID_TRACEID;
    }
    e.isValidTraceId = a;
    function o(e) {
      return i.test(e) && e !== t.INVALID_SPANID;
    }
    e.isValidSpanId = o;
    function s(e) {
      return a(e.traceId) && o(e.spanId);
    }
    e.isSpanContextValid = s;
    function c(e) {
      return new n.NonRecordingSpan(e);
    }
    e.wrapSpanContext = c;
  }),
  Sn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.NoopTracer = void 0));
    var t = gn(),
      n = bn(),
      r = yn(),
      i = xn(),
      a = t.ContextAPI.getInstance();
    e.NoopTracer = class {
      startSpan(e, t, s = a.active()) {
        if (t?.root) return new r.NonRecordingSpan();
        let c = s && (0, n.getSpanContext)(s);
        return o(c) && (0, i.isSpanContextValid)(c)
          ? new r.NonRecordingSpan(c)
          : new r.NonRecordingSpan();
      }
      startActiveSpan(e, t, r, i) {
        let o, s, c;
        if (arguments.length < 2) return;
        arguments.length === 2
          ? (c = t)
          : arguments.length === 3
            ? ((o = t), (c = r))
            : ((o = t), (s = r), (c = i));
        let l = s ?? a.active(),
          u = this.startSpan(e, o, l),
          d = (0, n.setSpan)(l, u);
        return a.with(d, c, void 0, u);
      }
    };
    function o(e) {
      return (
        typeof e == `object` &&
        typeof e.spanId == `string` &&
        typeof e.traceId == `string` &&
        typeof e.traceFlags == `number`
      );
    }
  }),
  Cn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.ProxyTracer = void 0));
    var t = new (Sn().NoopTracer)();
    e.ProxyTracer = class {
      constructor(e, t, n, r) {
        ((this._provider = e), (this.name = t), (this.version = n), (this.options = r));
      }
      startSpan(e, t, n) {
        return this._getTracer().startSpan(e, t, n);
      }
      startActiveSpan(e, t, n, r) {
        let i = this._getTracer();
        return Reflect.apply(i.startActiveSpan, i, arguments);
      }
      _getTracer() {
        if (this._delegate) return this._delegate;
        let e = this._provider.getDelegateTracer(this.name, this.version, this.options);
        return e ? ((this._delegate = e), this._delegate) : t;
      }
    };
  }),
  wn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.NoopTracerProvider = void 0));
    var t = Sn();
    e.NoopTracerProvider = class {
      getTracer(e, n, r) {
        return new t.NoopTracer();
      }
    };
  }),
  Tn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.ProxyTracerProvider = void 0));
    var t = Cn(),
      n = new (wn().NoopTracerProvider)();
    e.ProxyTracerProvider = class {
      getTracer(e, n, r) {
        return this.getDelegateTracer(e, n, r) ?? new t.ProxyTracer(this, e, n, r);
      }
      getDelegate() {
        return this._delegate ?? n;
      }
      setDelegate(e) {
        this._delegate = e;
      }
      getDelegateTracer(e, t, n) {
        return this._delegate?.getTracer(e, t, n);
      }
    };
  }),
  En = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.SamplingDecision = void 0),
      (function (e) {
        ((e[(e.NOT_RECORD = 0)] = `NOT_RECORD`),
          (e[(e.RECORD = 1)] = `RECORD`),
          (e[(e.RECORD_AND_SAMPLED = 2)] = `RECORD_AND_SAMPLED`));
      })((e.SamplingDecision ||= {})));
  }),
  Dn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.SpanKind = void 0),
      (function (e) {
        ((e[(e.INTERNAL = 0)] = `INTERNAL`),
          (e[(e.SERVER = 1)] = `SERVER`),
          (e[(e.CLIENT = 2)] = `CLIENT`),
          (e[(e.PRODUCER = 3)] = `PRODUCER`),
          (e[(e.CONSUMER = 4)] = `CONSUMER`));
      })((e.SpanKind ||= {})));
  }),
  On = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.SpanStatusCode = void 0),
      (function (e) {
        ((e[(e.UNSET = 0)] = `UNSET`), (e[(e.OK = 1)] = `OK`), (e[(e.ERROR = 2)] = `ERROR`));
      })((e.SpanStatusCode ||= {})));
  }),
  kn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.validateValue = e.validateKey = void 0));
    var t = `[_0-9a-z-*/]`,
      n = RegExp(`^(?:${`[a-z]${t}{0,255}`}|${`[a-z0-9]${t}{0,240}@[a-z]${t}{0,13}`})$`),
      r = /^[ -~]{0,255}[!-~]$/,
      i = /,|=/;
    function a(e) {
      return n.test(e);
    }
    e.validateKey = a;
    function o(e) {
      return r.test(e) && !i.test(e);
    }
    e.validateValue = o;
  }),
  An = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.TraceStateImpl = void 0));
    var t = kn(),
      n = 32,
      r = 512,
      i = `,`,
      a = `=`;
    e.TraceStateImpl = class e {
      constructor(e) {
        ((this._internalState = new Map()), e && this._parse(e));
      }
      set(e, t) {
        let n = this._clone();
        return (
          n._internalState.has(e) && n._internalState.delete(e),
          n._internalState.set(e, t),
          n
        );
      }
      unset(e) {
        let t = this._clone();
        return (t._internalState.delete(e), t);
      }
      get(e) {
        return this._internalState.get(e);
      }
      serialize() {
        return this._keys()
          .reduce((e, t) => (e.push(t + a + this.get(t)), e), [])
          .join(i);
      }
      _parse(e) {
        e.length > r ||
          ((this._internalState = e
            .split(i)
            .reverse()
            .reduce((e, n) => {
              let r = n.trim(),
                i = r.indexOf(a);
              if (i !== -1) {
                let a = r.slice(0, i),
                  o = r.slice(i + 1, n.length);
                (0, t.validateKey)(a) && (0, t.validateValue)(o) && e.set(a, o);
              }
              return e;
            }, new Map())),
          this._internalState.size > n &&
            (this._internalState = new Map(
              Array.from(this._internalState.entries()).reverse().slice(0, n),
            )));
      }
      _keys() {
        return Array.from(this._internalState.keys()).reverse();
      }
      _clone() {
        let t = new e();
        return ((t._internalState = new Map(this._internalState)), t);
      }
    };
  }),
  jn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.createTraceState = void 0));
    var t = An();
    function n(e) {
      return new t.TraceStateImpl(e);
    }
    e.createTraceState = n;
  }),
  Mn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.context = void 0),
      (e.context = gn().ContextAPI.getInstance()));
  }),
  Nn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.diag = void 0),
      (e.diag = on().DiagAPI.instance()));
  }),
  Pn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.NOOP_METER_PROVIDER = e.NoopMeterProvider = void 0));
    var t = fn(),
      n = class {
        getMeter(e, n, r) {
          return t.NOOP_METER;
        }
      };
    ((e.NoopMeterProvider = n), (e.NOOP_METER_PROVIDER = new n()));
  }),
  Fn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.MetricsAPI = void 0));
    var t = Pn(),
      n = tn(),
      r = on(),
      i = `metrics`;
    e.MetricsAPI = class e {
      constructor() {}
      static getInstance() {
        return ((this._instance ||= new e()), this._instance);
      }
      setGlobalMeterProvider(e) {
        return (0, n.registerGlobal)(i, e, r.DiagAPI.instance());
      }
      getMeterProvider() {
        return (0, n.getGlobal)(i) || t.NOOP_METER_PROVIDER;
      }
      getMeter(e, t, n) {
        return this.getMeterProvider().getMeter(e, t, n);
      }
      disable() {
        (0, n.unregisterGlobal)(i, r.DiagAPI.instance());
      }
    };
  }),
  In = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.metrics = void 0),
      (e.metrics = Fn().MetricsAPI.getInstance()));
  }),
  Ln = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.NoopTextMapPropagator = void 0),
      (e.NoopTextMapPropagator = class {
        inject(e, t) {}
        extract(e, t) {
          return e;
        }
        fields() {
          return [];
        }
      }));
  }),
  Rn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.deleteBaggage = e.setBaggage = e.getActiveBaggage = e.getBaggage = void 0));
    var t = gn(),
      n = (0, un().createContextKey)(`OpenTelemetry Baggage Key`);
    function r(e) {
      return e.getValue(n) || void 0;
    }
    e.getBaggage = r;
    function i() {
      return r(t.ContextAPI.getInstance().active());
    }
    e.getActiveBaggage = i;
    function a(e, t) {
      return e.setValue(n, t);
    }
    e.setBaggage = a;
    function o(e) {
      return e.deleteValue(n);
    }
    e.deleteBaggage = o;
  }),
  zn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.PropagationAPI = void 0));
    var t = tn(),
      n = Ln(),
      r = mn(),
      i = Rn(),
      a = ln(),
      o = on(),
      s = `propagation`,
      c = new n.NoopTextMapPropagator();
    e.PropagationAPI = class e {
      constructor() {
        ((this.createBaggage = a.createBaggage),
          (this.getBaggage = i.getBaggage),
          (this.getActiveBaggage = i.getActiveBaggage),
          (this.setBaggage = i.setBaggage),
          (this.deleteBaggage = i.deleteBaggage));
      }
      static getInstance() {
        return ((this._instance ||= new e()), this._instance);
      }
      setGlobalPropagator(e) {
        return (0, t.registerGlobal)(s, e, o.DiagAPI.instance());
      }
      inject(e, t, n = r.defaultTextMapSetter) {
        return this._getGlobalPropagator().inject(e, t, n);
      }
      extract(e, t, n = r.defaultTextMapGetter) {
        return this._getGlobalPropagator().extract(e, t, n);
      }
      fields() {
        return this._getGlobalPropagator().fields();
      }
      disable() {
        (0, t.unregisterGlobal)(s, o.DiagAPI.instance());
      }
      _getGlobalPropagator() {
        return (0, t.getGlobal)(s) || c;
      }
    };
  }),
  Bn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.propagation = void 0),
      (e.propagation = zn().PropagationAPI.getInstance()));
  }),
  Vn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.TraceAPI = void 0));
    var t = tn(),
      n = Tn(),
      r = xn(),
      i = bn(),
      a = on(),
      o = `trace`;
    e.TraceAPI = class e {
      constructor() {
        ((this._proxyTracerProvider = new n.ProxyTracerProvider()),
          (this.wrapSpanContext = r.wrapSpanContext),
          (this.isSpanContextValid = r.isSpanContextValid),
          (this.deleteSpan = i.deleteSpan),
          (this.getSpan = i.getSpan),
          (this.getActiveSpan = i.getActiveSpan),
          (this.getSpanContext = i.getSpanContext),
          (this.setSpan = i.setSpan),
          (this.setSpanContext = i.setSpanContext));
      }
      static getInstance() {
        return ((this._instance ||= new e()), this._instance);
      }
      setGlobalTracerProvider(e) {
        let n = (0, t.registerGlobal)(o, this._proxyTracerProvider, a.DiagAPI.instance());
        return (n && this._proxyTracerProvider.setDelegate(e), n);
      }
      getTracerProvider() {
        return (0, t.getGlobal)(o) || this._proxyTracerProvider;
      }
      getTracer(e, t) {
        return this.getTracerProvider().getTracer(e, t);
      }
      disable() {
        ((0, t.unregisterGlobal)(o, a.DiagAPI.instance()),
          (this._proxyTracerProvider = new n.ProxyTracerProvider()));
      }
    };
  }),
  Hn = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.trace = void 0),
      (e.trace = Vn().TraceAPI.getInstance()));
  }),
  N = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.trace =
        e.propagation =
        e.metrics =
        e.diag =
        e.context =
        e.INVALID_SPAN_CONTEXT =
        e.INVALID_TRACEID =
        e.INVALID_SPANID =
        e.isValidSpanId =
        e.isValidTraceId =
        e.isSpanContextValid =
        e.createTraceState =
        e.TraceFlags =
        e.SpanStatusCode =
        e.SpanKind =
        e.SamplingDecision =
        e.ProxyTracerProvider =
        e.ProxyTracer =
        e.defaultTextMapSetter =
        e.defaultTextMapGetter =
        e.ValueType =
        e.createNoopMeter =
        e.DiagLogLevel =
        e.DiagConsoleLogger =
        e.ROOT_CONTEXT =
        e.createContextKey =
        e.baggageEntryMetadataFromString =
          void 0));
    var t = ln();
    Object.defineProperty(e, "baggageEntryMetadataFromString", {
      enumerable: !0,
      get: function () {
        return t.baggageEntryMetadataFromString;
      },
    });
    var n = un();
    (Object.defineProperty(e, "createContextKey", {
      enumerable: !0,
      get: function () {
        return n.createContextKey;
      },
    }),
      Object.defineProperty(e, "ROOT_CONTEXT", {
        enumerable: !0,
        get: function () {
          return n.ROOT_CONTEXT;
        },
      }));
    var r = dn();
    Object.defineProperty(e, "DiagConsoleLogger", {
      enumerable: !0,
      get: function () {
        return r.DiagConsoleLogger;
      },
    });
    var i = rn();
    Object.defineProperty(e, "DiagLogLevel", {
      enumerable: !0,
      get: function () {
        return i.DiagLogLevel;
      },
    });
    var a = fn();
    Object.defineProperty(e, "createNoopMeter", {
      enumerable: !0,
      get: function () {
        return a.createNoopMeter;
      },
    });
    var o = pn();
    Object.defineProperty(e, "ValueType", {
      enumerable: !0,
      get: function () {
        return o.ValueType;
      },
    });
    var s = mn();
    (Object.defineProperty(e, "defaultTextMapGetter", {
      enumerable: !0,
      get: function () {
        return s.defaultTextMapGetter;
      },
    }),
      Object.defineProperty(e, "defaultTextMapSetter", {
        enumerable: !0,
        get: function () {
          return s.defaultTextMapSetter;
        },
      }));
    var c = Cn();
    Object.defineProperty(e, "ProxyTracer", {
      enumerable: !0,
      get: function () {
        return c.ProxyTracer;
      },
    });
    var l = Tn();
    Object.defineProperty(e, "ProxyTracerProvider", {
      enumerable: !0,
      get: function () {
        return l.ProxyTracerProvider;
      },
    });
    var u = En();
    Object.defineProperty(e, "SamplingDecision", {
      enumerable: !0,
      get: function () {
        return u.SamplingDecision;
      },
    });
    var d = Dn();
    Object.defineProperty(e, "SpanKind", {
      enumerable: !0,
      get: function () {
        return d.SpanKind;
      },
    });
    var f = On();
    Object.defineProperty(e, "SpanStatusCode", {
      enumerable: !0,
      get: function () {
        return f.SpanStatusCode;
      },
    });
    var p = _n();
    Object.defineProperty(e, "TraceFlags", {
      enumerable: !0,
      get: function () {
        return p.TraceFlags;
      },
    });
    var m = jn();
    Object.defineProperty(e, "createTraceState", {
      enumerable: !0,
      get: function () {
        return m.createTraceState;
      },
    });
    var h = xn();
    (Object.defineProperty(e, "isSpanContextValid", {
      enumerable: !0,
      get: function () {
        return h.isSpanContextValid;
      },
    }),
      Object.defineProperty(e, "isValidTraceId", {
        enumerable: !0,
        get: function () {
          return h.isValidTraceId;
        },
      }),
      Object.defineProperty(e, "isValidSpanId", {
        enumerable: !0,
        get: function () {
          return h.isValidSpanId;
        },
      }));
    var g = vn();
    (Object.defineProperty(e, "INVALID_SPANID", {
      enumerable: !0,
      get: function () {
        return g.INVALID_SPANID;
      },
    }),
      Object.defineProperty(e, "INVALID_TRACEID", {
        enumerable: !0,
        get: function () {
          return g.INVALID_TRACEID;
        },
      }),
      Object.defineProperty(e, "INVALID_SPAN_CONTEXT", {
        enumerable: !0,
        get: function () {
          return g.INVALID_SPAN_CONTEXT;
        },
      }));
    var _ = Mn();
    Object.defineProperty(e, "context", {
      enumerable: !0,
      get: function () {
        return _.context;
      },
    });
    var v = Nn();
    Object.defineProperty(e, "diag", {
      enumerable: !0,
      get: function () {
        return v.diag;
      },
    });
    var y = In();
    Object.defineProperty(e, "metrics", {
      enumerable: !0,
      get: function () {
        return y.metrics;
      },
    });
    var b = Bn();
    Object.defineProperty(e, "propagation", {
      enumerable: !0,
      get: function () {
        return b.propagation;
      },
    });
    var x = Hn();
    (Object.defineProperty(e, "trace", {
      enumerable: !0,
      get: function () {
        return x.trace;
      },
    }),
      (e.default = {
        context: _.context,
        diag: v.diag,
        metrics: y.metrics,
        propagation: b.propagation,
        trace: x.trace,
      }));
  });
function Un(e) {
  return e.setValue(qn, !0);
}
function Wn(e) {
  return e.deleteValue(qn);
}
function Gn(e) {
  return e.getValue(qn) === !0;
}
var Kn,
  qn,
  Jn = e.n(() => {
    ((Kn = e.a(N())),
      (qn = (0, Kn.createContextKey)(`OpenTelemetry SDK Context Key SUPPRESS_TRACING`)));
  }),
  Yn,
  Xn,
  Zn = e.n(() => {
    ((Yn = `baggage`), (Xn = 4096));
  });
function Qn(e) {
  return e.reduce((e, t) => {
    let n = `${e}${e === `` ? `` : `,`}${t}`;
    return n.length > 8192 ? e : n;
  }, ``);
}
function $n(e) {
  return e.getAllEntries().map(([e, t]) => {
    let n = `${encodeURIComponent(e)}=${encodeURIComponent(t.value)}`;
    return (t.metadata !== void 0 && (n += `;` + t.metadata.toString()), n);
  });
}
function er(e) {
  let t = e.split(`;`);
  if (t.length <= 0) return;
  let n = t.shift();
  if (!n) return;
  let r = n.indexOf(`=`);
  if (r <= 0) return;
  let i = decodeURIComponent(n.substring(0, r).trim()),
    a = decodeURIComponent(n.substring(r + 1).trim()),
    o;
  return (
    t.length > 0 && (o = (0, nr.baggageEntryMetadataFromString)(t.join(`;`))),
    { key: i, value: a, metadata: o }
  );
}
function tr(e) {
  let t = {};
  return (
    typeof e == `string` &&
      e.length > 0 &&
      e.split(`,`).forEach((e) => {
        let n = er(e);
        n !== void 0 && n.value.length > 0 && (t[n.key] = n.value);
      }),
    t
  );
}
var nr,
  rr = e.n(() => {
    ((nr = e.a(N())), Zn());
  }),
  ir,
  ar,
  or = e.n(() => {
    ((ir = e.a(N())),
      Jn(),
      Zn(),
      rr(),
      (ar = class {
        inject(e, t, n) {
          let r = ir.propagation.getBaggage(e);
          if (!r || Gn(e)) return;
          let i = Qn(
            $n(r)
              .filter((e) => e.length <= Xn)
              .slice(0, 180),
          );
          i.length > 0 && n.set(t, Yn, i);
        }
        extract(e, t, n) {
          let r = n.get(t, Yn),
            i = Array.isArray(r) ? r.join(`,`) : r;
          if (!i) return e;
          let a = {};
          return i.length === 0 ||
            (i.split(`,`).forEach((e) => {
              let t = er(e);
              if (t) {
                let e = { value: t.value };
                (t.metadata && (e.metadata = t.metadata), (a[t.key] = e));
              }
            }),
            Object.entries(a).length === 0)
            ? e
            : ir.propagation.setBaggage(e, ir.propagation.createBaggage(a));
        }
        fields() {
          return [Yn];
        }
      }));
  }),
  sr,
  cr = e.n(() => {
    sr = class {
      _monotonicClock;
      _epochMillis;
      _performanceMillis;
      constructor(e, t) {
        ((this._monotonicClock = t),
          (this._epochMillis = e.now()),
          (this._performanceMillis = t.now()));
      }
      now() {
        let e = this._monotonicClock.now() - this._performanceMillis;
        return this._epochMillis + e;
      }
    };
  });
function lr(e) {
  let t = {};
  if (typeof e != `object` || !e) return t;
  for (let n in e) {
    if (!Object.prototype.hasOwnProperty.call(e, n)) continue;
    if (!ur(n)) {
      mr.diag.warn(`Invalid attribute key: ${n}`);
      continue;
    }
    let r = e[n];
    if (!dr(r)) {
      mr.diag.warn(`Invalid attribute value set for key: ${n}`);
      continue;
    }
    t[n] = Array.isArray(r) ? r.slice() : r;
  }
  return t;
}
function ur(e) {
  return typeof e == `string` && e !== ``;
}
function dr(e) {
  return e == null ? !0 : Array.isArray(e) ? fr(e) : pr(typeof e);
}
function fr(e) {
  let t;
  for (let n of e) {
    if (n == null) continue;
    let e = typeof n;
    if (e !== t) {
      if (!t) {
        if (pr(e)) {
          t = e;
          continue;
        }
        return !1;
      }
      return !1;
    }
  }
  return !0;
}
function pr(e) {
  switch (e) {
    case `number`:
    case `boolean`:
    case `string`:
      return !0;
  }
  return !1;
}
var mr,
  hr = e.n(() => {
    mr = e.a(N());
  });
function gr() {
  return (e) => {
    yr.diag.error(_r(e));
  };
}
function _r(e) {
  return typeof e == `string` ? e : JSON.stringify(vr(e));
}
function vr(e) {
  let t = {},
    n = e;
  for (; n !== null;)
    (Object.getOwnPropertyNames(n).forEach((e) => {
      if (t[e]) return;
      let r = n[e];
      r && (t[e] = String(r));
    }),
      (n = Object.getPrototypeOf(n)));
  return t;
}
var yr,
  br = e.n(() => {
    yr = e.a(N());
  });
function xr(e) {
  Cr = e;
}
function Sr(e) {
  try {
    Cr(e);
  } catch {}
}
var Cr,
  wr = e.n(() => {
    (br(), (Cr = gr()));
  });
function P(e) {
  let t = process.env[e];
  if (t == null || t.trim() === ``) return;
  let n = Number(t);
  if (isNaN(n)) {
    Or.diag.warn(`Unknown value ${(0, v.inspect)(t)} for ${e}, expected a number, using defaults`);
    return;
  }
  return n;
}
function Tr(e) {
  let t = process.env[e];
  if (t != null && t.trim() !== ``) return t;
}
function Er(e) {
  let t = process.env[e]?.trim().toLowerCase();
  return t == null || t === ``
    ? !1
    : t === `true` ||
        (t === `false` ||
          Or.diag.warn(
            `Unknown value ${(0, v.inspect)(t)} for ${e}, expected 'true' or 'false', falling back to 'false' (default)`,
          ),
        !1);
}
function Dr(e) {
  return Tr(e)
    ?.split(`,`)
    .map((e) => e.trim())
    .filter((e) => e !== ``);
}
var Or,
  kr = e.n(() => {
    Or = e.a(N());
  }),
  Ar,
  jr = e.n(() => {
    Ar = typeof globalThis == `object` ? globalThis : global;
  }),
  Mr,
  Nr = e.n(() => {
    Mr = C.performance;
  }),
  Pr,
  Fr = e.n(() => {
    Pr = `2.2.0`;
  }),
  Ir = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.createConstMap = void 0));
    function t(e) {
      let t = {},
        n = e.length;
      for (let r = 0; r < n; r++) {
        let n = e[r];
        n && (t[String(n).toUpperCase().replace(/[-.]/g, `_`)] = n);
      }
      return t;
    }
    e.createConstMap = t;
  }),
  Lr = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.SEMATTRS_NET_HOST_CARRIER_ICC =
        e.SEMATTRS_NET_HOST_CARRIER_MNC =
        e.SEMATTRS_NET_HOST_CARRIER_MCC =
        e.SEMATTRS_NET_HOST_CARRIER_NAME =
        e.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE =
        e.SEMATTRS_NET_HOST_CONNECTION_TYPE =
        e.SEMATTRS_NET_HOST_NAME =
        e.SEMATTRS_NET_HOST_PORT =
        e.SEMATTRS_NET_HOST_IP =
        e.SEMATTRS_NET_PEER_NAME =
        e.SEMATTRS_NET_PEER_PORT =
        e.SEMATTRS_NET_PEER_IP =
        e.SEMATTRS_NET_TRANSPORT =
        e.SEMATTRS_FAAS_INVOKED_REGION =
        e.SEMATTRS_FAAS_INVOKED_PROVIDER =
        e.SEMATTRS_FAAS_INVOKED_NAME =
        e.SEMATTRS_FAAS_COLDSTART =
        e.SEMATTRS_FAAS_CRON =
        e.SEMATTRS_FAAS_TIME =
        e.SEMATTRS_FAAS_DOCUMENT_NAME =
        e.SEMATTRS_FAAS_DOCUMENT_TIME =
        e.SEMATTRS_FAAS_DOCUMENT_OPERATION =
        e.SEMATTRS_FAAS_DOCUMENT_COLLECTION =
        e.SEMATTRS_FAAS_EXECUTION =
        e.SEMATTRS_FAAS_TRIGGER =
        e.SEMATTRS_EXCEPTION_ESCAPED =
        e.SEMATTRS_EXCEPTION_STACKTRACE =
        e.SEMATTRS_EXCEPTION_MESSAGE =
        e.SEMATTRS_EXCEPTION_TYPE =
        e.SEMATTRS_DB_SQL_TABLE =
        e.SEMATTRS_DB_MONGODB_COLLECTION =
        e.SEMATTRS_DB_REDIS_DATABASE_INDEX =
        e.SEMATTRS_DB_HBASE_NAMESPACE =
        e.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC =
        e.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID =
        e.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT =
        e.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE =
        e.SEMATTRS_DB_CASSANDRA_TABLE =
        e.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL =
        e.SEMATTRS_DB_CASSANDRA_PAGE_SIZE =
        e.SEMATTRS_DB_CASSANDRA_KEYSPACE =
        e.SEMATTRS_DB_MSSQL_INSTANCE_NAME =
        e.SEMATTRS_DB_OPERATION =
        e.SEMATTRS_DB_STATEMENT =
        e.SEMATTRS_DB_NAME =
        e.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME =
        e.SEMATTRS_DB_USER =
        e.SEMATTRS_DB_CONNECTION_STRING =
        e.SEMATTRS_DB_SYSTEM =
        e.SEMATTRS_AWS_LAMBDA_INVOKED_ARN =
          void 0),
      (e.SEMATTRS_MESSAGING_DESTINATION_KIND =
        e.SEMATTRS_MESSAGING_DESTINATION =
        e.SEMATTRS_MESSAGING_SYSTEM =
        e.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES =
        e.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS =
        e.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT =
        e.SEMATTRS_AWS_DYNAMODB_COUNT =
        e.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS =
        e.SEMATTRS_AWS_DYNAMODB_SEGMENT =
        e.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD =
        e.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT =
        e.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE =
        e.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES =
        e.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES =
        e.SEMATTRS_AWS_DYNAMODB_SELECT =
        e.SEMATTRS_AWS_DYNAMODB_INDEX_NAME =
        e.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET =
        e.SEMATTRS_AWS_DYNAMODB_LIMIT =
        e.SEMATTRS_AWS_DYNAMODB_PROJECTION =
        e.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ =
        e.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY =
        e.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY =
        e.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS =
        e.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY =
        e.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES =
        e.SEMATTRS_HTTP_CLIENT_IP =
        e.SEMATTRS_HTTP_ROUTE =
        e.SEMATTRS_HTTP_SERVER_NAME =
        e.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED =
        e.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH =
        e.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED =
        e.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH =
        e.SEMATTRS_HTTP_USER_AGENT =
        e.SEMATTRS_HTTP_FLAVOR =
        e.SEMATTRS_HTTP_STATUS_CODE =
        e.SEMATTRS_HTTP_SCHEME =
        e.SEMATTRS_HTTP_HOST =
        e.SEMATTRS_HTTP_TARGET =
        e.SEMATTRS_HTTP_URL =
        e.SEMATTRS_HTTP_METHOD =
        e.SEMATTRS_CODE_LINENO =
        e.SEMATTRS_CODE_FILEPATH =
        e.SEMATTRS_CODE_NAMESPACE =
        e.SEMATTRS_CODE_FUNCTION =
        e.SEMATTRS_THREAD_NAME =
        e.SEMATTRS_THREAD_ID =
        e.SEMATTRS_ENDUSER_SCOPE =
        e.SEMATTRS_ENDUSER_ROLE =
        e.SEMATTRS_ENDUSER_ID =
        e.SEMATTRS_PEER_SERVICE =
          void 0),
      (e.DBSYSTEMVALUES_FILEMAKER =
        e.DBSYSTEMVALUES_DERBY =
        e.DBSYSTEMVALUES_FIREBIRD =
        e.DBSYSTEMVALUES_ADABAS =
        e.DBSYSTEMVALUES_CACHE =
        e.DBSYSTEMVALUES_EDB =
        e.DBSYSTEMVALUES_FIRSTSQL =
        e.DBSYSTEMVALUES_INGRES =
        e.DBSYSTEMVALUES_HANADB =
        e.DBSYSTEMVALUES_MAXDB =
        e.DBSYSTEMVALUES_PROGRESS =
        e.DBSYSTEMVALUES_HSQLDB =
        e.DBSYSTEMVALUES_CLOUDSCAPE =
        e.DBSYSTEMVALUES_HIVE =
        e.DBSYSTEMVALUES_REDSHIFT =
        e.DBSYSTEMVALUES_POSTGRESQL =
        e.DBSYSTEMVALUES_DB2 =
        e.DBSYSTEMVALUES_ORACLE =
        e.DBSYSTEMVALUES_MYSQL =
        e.DBSYSTEMVALUES_MSSQL =
        e.DBSYSTEMVALUES_OTHER_SQL =
        e.SemanticAttributes =
        e.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE =
        e.SEMATTRS_MESSAGE_COMPRESSED_SIZE =
        e.SEMATTRS_MESSAGE_ID =
        e.SEMATTRS_MESSAGE_TYPE =
        e.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE =
        e.SEMATTRS_RPC_JSONRPC_ERROR_CODE =
        e.SEMATTRS_RPC_JSONRPC_REQUEST_ID =
        e.SEMATTRS_RPC_JSONRPC_VERSION =
        e.SEMATTRS_RPC_GRPC_STATUS_CODE =
        e.SEMATTRS_RPC_METHOD =
        e.SEMATTRS_RPC_SERVICE =
        e.SEMATTRS_RPC_SYSTEM =
        e.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE =
        e.SEMATTRS_MESSAGING_KAFKA_PARTITION =
        e.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID =
        e.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP =
        e.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY =
        e.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY =
        e.SEMATTRS_MESSAGING_CONSUMER_ID =
        e.SEMATTRS_MESSAGING_OPERATION =
        e.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES =
        e.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES =
        e.SEMATTRS_MESSAGING_CONVERSATION_ID =
        e.SEMATTRS_MESSAGING_MESSAGE_ID =
        e.SEMATTRS_MESSAGING_URL =
        e.SEMATTRS_MESSAGING_PROTOCOL_VERSION =
        e.SEMATTRS_MESSAGING_PROTOCOL =
        e.SEMATTRS_MESSAGING_TEMP_DESTINATION =
          void 0),
      (e.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD =
        e.FaasDocumentOperationValues =
        e.FAASDOCUMENTOPERATIONVALUES_DELETE =
        e.FAASDOCUMENTOPERATIONVALUES_EDIT =
        e.FAASDOCUMENTOPERATIONVALUES_INSERT =
        e.FaasTriggerValues =
        e.FAASTRIGGERVALUES_OTHER =
        e.FAASTRIGGERVALUES_TIMER =
        e.FAASTRIGGERVALUES_PUBSUB =
        e.FAASTRIGGERVALUES_HTTP =
        e.FAASTRIGGERVALUES_DATASOURCE =
        e.DbCassandraConsistencyLevelValues =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_ANY =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_THREE =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_TWO =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_ONE =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM =
        e.DBCASSANDRACONSISTENCYLEVELVALUES_ALL =
        e.DbSystemValues =
        e.DBSYSTEMVALUES_COCKROACHDB =
        e.DBSYSTEMVALUES_MEMCACHED =
        e.DBSYSTEMVALUES_ELASTICSEARCH =
        e.DBSYSTEMVALUES_GEODE =
        e.DBSYSTEMVALUES_NEO4J =
        e.DBSYSTEMVALUES_DYNAMODB =
        e.DBSYSTEMVALUES_COSMOSDB =
        e.DBSYSTEMVALUES_COUCHDB =
        e.DBSYSTEMVALUES_COUCHBASE =
        e.DBSYSTEMVALUES_REDIS =
        e.DBSYSTEMVALUES_MONGODB =
        e.DBSYSTEMVALUES_HBASE =
        e.DBSYSTEMVALUES_CASSANDRA =
        e.DBSYSTEMVALUES_COLDFUSION =
        e.DBSYSTEMVALUES_H2 =
        e.DBSYSTEMVALUES_VERTICA =
        e.DBSYSTEMVALUES_TERADATA =
        e.DBSYSTEMVALUES_SYBASE =
        e.DBSYSTEMVALUES_SQLITE =
        e.DBSYSTEMVALUES_POINTBASE =
        e.DBSYSTEMVALUES_PERVASIVE =
        e.DBSYSTEMVALUES_NETEZZA =
        e.DBSYSTEMVALUES_MARIADB =
        e.DBSYSTEMVALUES_INTERBASE =
        e.DBSYSTEMVALUES_INSTANTDB =
        e.DBSYSTEMVALUES_INFORMIX =
          void 0),
      (e.MESSAGINGOPERATIONVALUES_RECEIVE =
        e.MessagingDestinationKindValues =
        e.MESSAGINGDESTINATIONKINDVALUES_TOPIC =
        e.MESSAGINGDESTINATIONKINDVALUES_QUEUE =
        e.HttpFlavorValues =
        e.HTTPFLAVORVALUES_QUIC =
        e.HTTPFLAVORVALUES_SPDY =
        e.HTTPFLAVORVALUES_HTTP_2_0 =
        e.HTTPFLAVORVALUES_HTTP_1_1 =
        e.HTTPFLAVORVALUES_HTTP_1_0 =
        e.NetHostConnectionSubtypeValues =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_NR =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_GSM =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_LTE =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE =
        e.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS =
        e.NetHostConnectionTypeValues =
        e.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN =
        e.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE =
        e.NETHOSTCONNECTIONTYPEVALUES_CELL =
        e.NETHOSTCONNECTIONTYPEVALUES_WIRED =
        e.NETHOSTCONNECTIONTYPEVALUES_WIFI =
        e.NetTransportValues =
        e.NETTRANSPORTVALUES_OTHER =
        e.NETTRANSPORTVALUES_INPROC =
        e.NETTRANSPORTVALUES_PIPE =
        e.NETTRANSPORTVALUES_UNIX =
        e.NETTRANSPORTVALUES_IP =
        e.NETTRANSPORTVALUES_IP_UDP =
        e.NETTRANSPORTVALUES_IP_TCP =
        e.FaasInvokedProviderValues =
        e.FAASINVOKEDPROVIDERVALUES_GCP =
        e.FAASINVOKEDPROVIDERVALUES_AZURE =
        e.FAASINVOKEDPROVIDERVALUES_AWS =
          void 0),
      (e.MessageTypeValues =
        e.MESSAGETYPEVALUES_RECEIVED =
        e.MESSAGETYPEVALUES_SENT =
        e.RpcGrpcStatusCodeValues =
        e.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED =
        e.RPCGRPCSTATUSCODEVALUES_DATA_LOSS =
        e.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE =
        e.RPCGRPCSTATUSCODEVALUES_INTERNAL =
        e.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED =
        e.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE =
        e.RPCGRPCSTATUSCODEVALUES_ABORTED =
        e.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION =
        e.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED =
        e.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED =
        e.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS =
        e.RPCGRPCSTATUSCODEVALUES_NOT_FOUND =
        e.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED =
        e.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT =
        e.RPCGRPCSTATUSCODEVALUES_UNKNOWN =
        e.RPCGRPCSTATUSCODEVALUES_CANCELLED =
        e.RPCGRPCSTATUSCODEVALUES_OK =
        e.MessagingOperationValues =
        e.MESSAGINGOPERATIONVALUES_PROCESS =
          void 0));
    var t = Ir(),
      n = `aws.lambda.invoked_arn`,
      r = `db.system`,
      i = `db.connection_string`,
      a = `db.user`,
      o = `db.jdbc.driver_classname`,
      s = `db.name`,
      c = `db.statement`,
      l = `db.operation`,
      u = `db.mssql.instance_name`,
      d = `db.cassandra.keyspace`,
      f = `db.cassandra.page_size`,
      p = `db.cassandra.consistency_level`,
      m = `db.cassandra.table`,
      h = `db.cassandra.idempotence`,
      g = `db.cassandra.speculative_execution_count`,
      _ = `db.cassandra.coordinator.id`,
      v = `db.cassandra.coordinator.dc`,
      y = `db.hbase.namespace`,
      b = `db.redis.database_index`,
      x = `db.mongodb.collection`,
      S = `db.sql.table`,
      C = `exception.type`,
      w = `exception.message`,
      T = `exception.stacktrace`,
      E = `exception.escaped`,
      D = `faas.trigger`,
      O = `faas.execution`,
      ee = `faas.document.collection`,
      te = `faas.document.operation`,
      ne = `faas.document.time`,
      re = `faas.document.name`,
      ie = `faas.time`,
      ae = `faas.cron`,
      oe = `faas.coldstart`,
      se = `faas.invoked_name`,
      ce = `faas.invoked_provider`,
      le = `faas.invoked_region`,
      ue = `net.transport`,
      de = `net.peer.ip`,
      fe = `net.peer.port`,
      pe = `net.peer.name`,
      me = `net.host.ip`,
      he = `net.host.port`,
      ge = `net.host.name`,
      _e = `net.host.connection.type`,
      ve = `net.host.connection.subtype`,
      ye = `net.host.carrier.name`,
      be = `net.host.carrier.mcc`,
      xe = `net.host.carrier.mnc`,
      Se = `net.host.carrier.icc`,
      k = `peer.service`,
      Ce = `enduser.id`,
      we = `enduser.role`,
      Te = `enduser.scope`,
      Ee = `thread.id`,
      De = `thread.name`,
      Oe = `code.function`,
      ke = `code.namespace`,
      Ae = `code.filepath`,
      je = `code.lineno`,
      Me = `http.method`,
      Ne = `http.url`,
      Pe = `http.target`,
      Fe = `http.host`,
      Ie = `http.scheme`,
      Le = `http.status_code`,
      Re = `http.flavor`,
      ze = `http.user_agent`,
      Be = `http.request_content_length`,
      Ve = `http.request_content_length_uncompressed`,
      A = `http.response_content_length`,
      He = `http.response_content_length_uncompressed`,
      Ue = `http.server_name`,
      We = `http.route`,
      Ge = `http.client_ip`,
      Ke = `aws.dynamodb.table_names`,
      qe = `aws.dynamodb.consumed_capacity`,
      Je = `aws.dynamodb.item_collection_metrics`,
      Ye = `aws.dynamodb.provisioned_read_capacity`,
      Xe = `aws.dynamodb.provisioned_write_capacity`,
      Ze = `aws.dynamodb.consistent_read`,
      Qe = `aws.dynamodb.projection`,
      $e = `aws.dynamodb.limit`,
      et = `aws.dynamodb.attributes_to_get`,
      tt = `aws.dynamodb.index_name`,
      nt = `aws.dynamodb.select`,
      rt = `aws.dynamodb.global_secondary_indexes`,
      it = `aws.dynamodb.local_secondary_indexes`,
      at = `aws.dynamodb.exclusive_start_table`,
      ot = `aws.dynamodb.table_count`,
      st = `aws.dynamodb.scan_forward`,
      ct = `aws.dynamodb.segment`,
      lt = `aws.dynamodb.total_segments`,
      ut = `aws.dynamodb.count`,
      dt = `aws.dynamodb.scanned_count`,
      ft = `aws.dynamodb.attribute_definitions`,
      pt = `aws.dynamodb.global_secondary_index_updates`,
      mt = `messaging.system`,
      ht = `messaging.destination`,
      gt = `messaging.destination_kind`,
      _t = `messaging.temp_destination`,
      vt = `messaging.protocol`,
      yt = `messaging.protocol_version`,
      bt = `messaging.url`,
      xt = `messaging.message_id`,
      St = `messaging.conversation_id`,
      Ct = `messaging.message_payload_size_bytes`,
      wt = `messaging.message_payload_compressed_size_bytes`,
      Tt = `messaging.operation`,
      Et = `messaging.consumer_id`,
      Dt = `messaging.rabbitmq.routing_key`,
      Ot = `messaging.kafka.message_key`,
      kt = `messaging.kafka.consumer_group`,
      At = `messaging.kafka.client_id`,
      jt = `messaging.kafka.partition`,
      Mt = `messaging.kafka.tombstone`,
      Nt = `rpc.system`,
      Pt = `rpc.service`,
      j = `rpc.method`,
      Ft = `rpc.grpc.status_code`,
      It = `rpc.jsonrpc.version`,
      Lt = `rpc.jsonrpc.request_id`,
      Rt = `rpc.jsonrpc.error_code`,
      zt = `rpc.jsonrpc.error_message`,
      Bt = `message.type`,
      Vt = `message.id`,
      M = `message.compressed_size`,
      Ht = `message.uncompressed_size`;
    ((e.SEMATTRS_AWS_LAMBDA_INVOKED_ARN = n),
      (e.SEMATTRS_DB_SYSTEM = r),
      (e.SEMATTRS_DB_CONNECTION_STRING = i),
      (e.SEMATTRS_DB_USER = a),
      (e.SEMATTRS_DB_JDBC_DRIVER_CLASSNAME = o),
      (e.SEMATTRS_DB_NAME = s),
      (e.SEMATTRS_DB_STATEMENT = c),
      (e.SEMATTRS_DB_OPERATION = l),
      (e.SEMATTRS_DB_MSSQL_INSTANCE_NAME = u),
      (e.SEMATTRS_DB_CASSANDRA_KEYSPACE = d),
      (e.SEMATTRS_DB_CASSANDRA_PAGE_SIZE = f),
      (e.SEMATTRS_DB_CASSANDRA_CONSISTENCY_LEVEL = p),
      (e.SEMATTRS_DB_CASSANDRA_TABLE = m),
      (e.SEMATTRS_DB_CASSANDRA_IDEMPOTENCE = h),
      (e.SEMATTRS_DB_CASSANDRA_SPECULATIVE_EXECUTION_COUNT = g),
      (e.SEMATTRS_DB_CASSANDRA_COORDINATOR_ID = _),
      (e.SEMATTRS_DB_CASSANDRA_COORDINATOR_DC = v),
      (e.SEMATTRS_DB_HBASE_NAMESPACE = y),
      (e.SEMATTRS_DB_REDIS_DATABASE_INDEX = b),
      (e.SEMATTRS_DB_MONGODB_COLLECTION = x),
      (e.SEMATTRS_DB_SQL_TABLE = S),
      (e.SEMATTRS_EXCEPTION_TYPE = C),
      (e.SEMATTRS_EXCEPTION_MESSAGE = w),
      (e.SEMATTRS_EXCEPTION_STACKTRACE = T),
      (e.SEMATTRS_EXCEPTION_ESCAPED = E),
      (e.SEMATTRS_FAAS_TRIGGER = D),
      (e.SEMATTRS_FAAS_EXECUTION = O),
      (e.SEMATTRS_FAAS_DOCUMENT_COLLECTION = ee),
      (e.SEMATTRS_FAAS_DOCUMENT_OPERATION = te),
      (e.SEMATTRS_FAAS_DOCUMENT_TIME = ne),
      (e.SEMATTRS_FAAS_DOCUMENT_NAME = re),
      (e.SEMATTRS_FAAS_TIME = ie),
      (e.SEMATTRS_FAAS_CRON = ae),
      (e.SEMATTRS_FAAS_COLDSTART = oe),
      (e.SEMATTRS_FAAS_INVOKED_NAME = se),
      (e.SEMATTRS_FAAS_INVOKED_PROVIDER = ce),
      (e.SEMATTRS_FAAS_INVOKED_REGION = le),
      (e.SEMATTRS_NET_TRANSPORT = ue),
      (e.SEMATTRS_NET_PEER_IP = de),
      (e.SEMATTRS_NET_PEER_PORT = fe),
      (e.SEMATTRS_NET_PEER_NAME = pe),
      (e.SEMATTRS_NET_HOST_IP = me),
      (e.SEMATTRS_NET_HOST_PORT = he),
      (e.SEMATTRS_NET_HOST_NAME = ge),
      (e.SEMATTRS_NET_HOST_CONNECTION_TYPE = _e),
      (e.SEMATTRS_NET_HOST_CONNECTION_SUBTYPE = ve),
      (e.SEMATTRS_NET_HOST_CARRIER_NAME = ye),
      (e.SEMATTRS_NET_HOST_CARRIER_MCC = be),
      (e.SEMATTRS_NET_HOST_CARRIER_MNC = xe),
      (e.SEMATTRS_NET_HOST_CARRIER_ICC = Se),
      (e.SEMATTRS_PEER_SERVICE = k),
      (e.SEMATTRS_ENDUSER_ID = Ce),
      (e.SEMATTRS_ENDUSER_ROLE = we),
      (e.SEMATTRS_ENDUSER_SCOPE = Te),
      (e.SEMATTRS_THREAD_ID = Ee),
      (e.SEMATTRS_THREAD_NAME = De),
      (e.SEMATTRS_CODE_FUNCTION = Oe),
      (e.SEMATTRS_CODE_NAMESPACE = ke),
      (e.SEMATTRS_CODE_FILEPATH = Ae),
      (e.SEMATTRS_CODE_LINENO = je),
      (e.SEMATTRS_HTTP_METHOD = Me),
      (e.SEMATTRS_HTTP_URL = Ne),
      (e.SEMATTRS_HTTP_TARGET = Pe),
      (e.SEMATTRS_HTTP_HOST = Fe),
      (e.SEMATTRS_HTTP_SCHEME = Ie),
      (e.SEMATTRS_HTTP_STATUS_CODE = Le),
      (e.SEMATTRS_HTTP_FLAVOR = Re),
      (e.SEMATTRS_HTTP_USER_AGENT = ze),
      (e.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH = Be),
      (e.SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH_UNCOMPRESSED = Ve),
      (e.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH = A),
      (e.SEMATTRS_HTTP_RESPONSE_CONTENT_LENGTH_UNCOMPRESSED = He),
      (e.SEMATTRS_HTTP_SERVER_NAME = Ue),
      (e.SEMATTRS_HTTP_ROUTE = We),
      (e.SEMATTRS_HTTP_CLIENT_IP = Ge),
      (e.SEMATTRS_AWS_DYNAMODB_TABLE_NAMES = Ke),
      (e.SEMATTRS_AWS_DYNAMODB_CONSUMED_CAPACITY = qe),
      (e.SEMATTRS_AWS_DYNAMODB_ITEM_COLLECTION_METRICS = Je),
      (e.SEMATTRS_AWS_DYNAMODB_PROVISIONED_READ_CAPACITY = Ye),
      (e.SEMATTRS_AWS_DYNAMODB_PROVISIONED_WRITE_CAPACITY = Xe),
      (e.SEMATTRS_AWS_DYNAMODB_CONSISTENT_READ = Ze),
      (e.SEMATTRS_AWS_DYNAMODB_PROJECTION = Qe),
      (e.SEMATTRS_AWS_DYNAMODB_LIMIT = $e),
      (e.SEMATTRS_AWS_DYNAMODB_ATTRIBUTES_TO_GET = et),
      (e.SEMATTRS_AWS_DYNAMODB_INDEX_NAME = tt),
      (e.SEMATTRS_AWS_DYNAMODB_SELECT = nt),
      (e.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEXES = rt),
      (e.SEMATTRS_AWS_DYNAMODB_LOCAL_SECONDARY_INDEXES = it),
      (e.SEMATTRS_AWS_DYNAMODB_EXCLUSIVE_START_TABLE = at),
      (e.SEMATTRS_AWS_DYNAMODB_TABLE_COUNT = ot),
      (e.SEMATTRS_AWS_DYNAMODB_SCAN_FORWARD = st),
      (e.SEMATTRS_AWS_DYNAMODB_SEGMENT = ct),
      (e.SEMATTRS_AWS_DYNAMODB_TOTAL_SEGMENTS = lt),
      (e.SEMATTRS_AWS_DYNAMODB_COUNT = ut),
      (e.SEMATTRS_AWS_DYNAMODB_SCANNED_COUNT = dt),
      (e.SEMATTRS_AWS_DYNAMODB_ATTRIBUTE_DEFINITIONS = ft),
      (e.SEMATTRS_AWS_DYNAMODB_GLOBAL_SECONDARY_INDEX_UPDATES = pt),
      (e.SEMATTRS_MESSAGING_SYSTEM = mt),
      (e.SEMATTRS_MESSAGING_DESTINATION = ht),
      (e.SEMATTRS_MESSAGING_DESTINATION_KIND = gt),
      (e.SEMATTRS_MESSAGING_TEMP_DESTINATION = _t),
      (e.SEMATTRS_MESSAGING_PROTOCOL = vt),
      (e.SEMATTRS_MESSAGING_PROTOCOL_VERSION = yt),
      (e.SEMATTRS_MESSAGING_URL = bt),
      (e.SEMATTRS_MESSAGING_MESSAGE_ID = xt),
      (e.SEMATTRS_MESSAGING_CONVERSATION_ID = St),
      (e.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_SIZE_BYTES = Ct),
      (e.SEMATTRS_MESSAGING_MESSAGE_PAYLOAD_COMPRESSED_SIZE_BYTES = wt),
      (e.SEMATTRS_MESSAGING_OPERATION = Tt),
      (e.SEMATTRS_MESSAGING_CONSUMER_ID = Et),
      (e.SEMATTRS_MESSAGING_RABBITMQ_ROUTING_KEY = Dt),
      (e.SEMATTRS_MESSAGING_KAFKA_MESSAGE_KEY = Ot),
      (e.SEMATTRS_MESSAGING_KAFKA_CONSUMER_GROUP = kt),
      (e.SEMATTRS_MESSAGING_KAFKA_CLIENT_ID = At),
      (e.SEMATTRS_MESSAGING_KAFKA_PARTITION = jt),
      (e.SEMATTRS_MESSAGING_KAFKA_TOMBSTONE = Mt),
      (e.SEMATTRS_RPC_SYSTEM = Nt),
      (e.SEMATTRS_RPC_SERVICE = Pt),
      (e.SEMATTRS_RPC_METHOD = j),
      (e.SEMATTRS_RPC_GRPC_STATUS_CODE = Ft),
      (e.SEMATTRS_RPC_JSONRPC_VERSION = It),
      (e.SEMATTRS_RPC_JSONRPC_REQUEST_ID = Lt),
      (e.SEMATTRS_RPC_JSONRPC_ERROR_CODE = Rt),
      (e.SEMATTRS_RPC_JSONRPC_ERROR_MESSAGE = zt),
      (e.SEMATTRS_MESSAGE_TYPE = Bt),
      (e.SEMATTRS_MESSAGE_ID = Vt),
      (e.SEMATTRS_MESSAGE_COMPRESSED_SIZE = M),
      (e.SEMATTRS_MESSAGE_UNCOMPRESSED_SIZE = Ht),
      (e.SemanticAttributes = (0, t.createConstMap)([
        n,
        r,
        i,
        a,
        o,
        s,
        c,
        l,
        u,
        d,
        f,
        p,
        m,
        h,
        g,
        _,
        v,
        y,
        b,
        x,
        S,
        C,
        w,
        T,
        E,
        D,
        O,
        ee,
        te,
        ne,
        re,
        ie,
        ae,
        oe,
        se,
        ce,
        le,
        ue,
        de,
        fe,
        pe,
        me,
        he,
        ge,
        _e,
        ve,
        ye,
        be,
        xe,
        Se,
        k,
        Ce,
        we,
        Te,
        Ee,
        De,
        Oe,
        ke,
        Ae,
        je,
        Me,
        Ne,
        Pe,
        Fe,
        Ie,
        Le,
        Re,
        ze,
        Be,
        Ve,
        A,
        He,
        Ue,
        We,
        Ge,
        Ke,
        qe,
        Je,
        Ye,
        Xe,
        Ze,
        Qe,
        $e,
        et,
        tt,
        nt,
        rt,
        it,
        at,
        ot,
        st,
        ct,
        lt,
        ut,
        dt,
        ft,
        pt,
        mt,
        ht,
        gt,
        _t,
        vt,
        yt,
        bt,
        xt,
        St,
        Ct,
        wt,
        Tt,
        Et,
        Dt,
        Ot,
        kt,
        At,
        jt,
        Mt,
        Nt,
        Pt,
        j,
        Ft,
        It,
        Lt,
        Rt,
        zt,
        Bt,
        Vt,
        M,
        Ht,
      ])));
    var Ut = `other_sql`,
      Wt = `mssql`,
      Gt = `mysql`,
      Kt = `oracle`,
      qt = `db2`,
      Jt = `postgresql`,
      Yt = `redshift`,
      Xt = `hive`,
      Zt = `cloudscape`,
      Qt = `hsqldb`,
      $t = `progress`,
      en = `maxdb`,
      tn = `hanadb`,
      nn = `ingres`,
      rn = `firstsql`,
      an = `edb`,
      on = `cache`,
      sn = `adabas`,
      cn = `firebird`,
      ln = `derby`,
      un = `filemaker`,
      dn = `informix`,
      fn = `instantdb`,
      pn = `interbase`,
      mn = `mariadb`,
      hn = `netezza`,
      gn = `pervasive`,
      _n = `pointbase`,
      vn = `sqlite`,
      yn = `sybase`,
      bn = `teradata`,
      xn = `vertica`,
      Sn = `h2`,
      Cn = `coldfusion`,
      wn = `cassandra`,
      Tn = `hbase`,
      En = `mongodb`,
      Dn = `redis`,
      On = `couchbase`,
      kn = `couchdb`,
      An = `cosmosdb`,
      jn = `dynamodb`,
      Mn = `neo4j`,
      Nn = `geode`,
      Pn = `elasticsearch`,
      Fn = `memcached`,
      In = `cockroachdb`;
    ((e.DBSYSTEMVALUES_OTHER_SQL = Ut),
      (e.DBSYSTEMVALUES_MSSQL = Wt),
      (e.DBSYSTEMVALUES_MYSQL = Gt),
      (e.DBSYSTEMVALUES_ORACLE = Kt),
      (e.DBSYSTEMVALUES_DB2 = qt),
      (e.DBSYSTEMVALUES_POSTGRESQL = Jt),
      (e.DBSYSTEMVALUES_REDSHIFT = Yt),
      (e.DBSYSTEMVALUES_HIVE = Xt),
      (e.DBSYSTEMVALUES_CLOUDSCAPE = Zt),
      (e.DBSYSTEMVALUES_HSQLDB = Qt),
      (e.DBSYSTEMVALUES_PROGRESS = $t),
      (e.DBSYSTEMVALUES_MAXDB = en),
      (e.DBSYSTEMVALUES_HANADB = tn),
      (e.DBSYSTEMVALUES_INGRES = nn),
      (e.DBSYSTEMVALUES_FIRSTSQL = rn),
      (e.DBSYSTEMVALUES_EDB = an),
      (e.DBSYSTEMVALUES_CACHE = on),
      (e.DBSYSTEMVALUES_ADABAS = sn),
      (e.DBSYSTEMVALUES_FIREBIRD = cn),
      (e.DBSYSTEMVALUES_DERBY = ln),
      (e.DBSYSTEMVALUES_FILEMAKER = un),
      (e.DBSYSTEMVALUES_INFORMIX = dn),
      (e.DBSYSTEMVALUES_INSTANTDB = fn),
      (e.DBSYSTEMVALUES_INTERBASE = pn),
      (e.DBSYSTEMVALUES_MARIADB = mn),
      (e.DBSYSTEMVALUES_NETEZZA = hn),
      (e.DBSYSTEMVALUES_PERVASIVE = gn),
      (e.DBSYSTEMVALUES_POINTBASE = _n),
      (e.DBSYSTEMVALUES_SQLITE = vn),
      (e.DBSYSTEMVALUES_SYBASE = yn),
      (e.DBSYSTEMVALUES_TERADATA = bn),
      (e.DBSYSTEMVALUES_VERTICA = xn),
      (e.DBSYSTEMVALUES_H2 = Sn),
      (e.DBSYSTEMVALUES_COLDFUSION = Cn),
      (e.DBSYSTEMVALUES_CASSANDRA = wn),
      (e.DBSYSTEMVALUES_HBASE = Tn),
      (e.DBSYSTEMVALUES_MONGODB = En),
      (e.DBSYSTEMVALUES_REDIS = Dn),
      (e.DBSYSTEMVALUES_COUCHBASE = On),
      (e.DBSYSTEMVALUES_COUCHDB = kn),
      (e.DBSYSTEMVALUES_COSMOSDB = An),
      (e.DBSYSTEMVALUES_DYNAMODB = jn),
      (e.DBSYSTEMVALUES_NEO4J = Mn),
      (e.DBSYSTEMVALUES_GEODE = Nn),
      (e.DBSYSTEMVALUES_ELASTICSEARCH = Pn),
      (e.DBSYSTEMVALUES_MEMCACHED = Fn),
      (e.DBSYSTEMVALUES_COCKROACHDB = In),
      (e.DbSystemValues = (0, t.createConstMap)([
        Ut,
        Wt,
        Gt,
        Kt,
        qt,
        Jt,
        Yt,
        Xt,
        Zt,
        Qt,
        $t,
        en,
        tn,
        nn,
        rn,
        an,
        on,
        sn,
        cn,
        ln,
        un,
        dn,
        fn,
        pn,
        mn,
        hn,
        gn,
        _n,
        vn,
        yn,
        bn,
        xn,
        Sn,
        Cn,
        wn,
        Tn,
        En,
        Dn,
        On,
        kn,
        An,
        jn,
        Mn,
        Nn,
        Pn,
        Fn,
        In,
      ])));
    var Ln = `all`,
      Rn = `each_quorum`,
      zn = `quorum`,
      Bn = `local_quorum`,
      Vn = `one`,
      Hn = `two`,
      N = `three`,
      Un = `local_one`,
      Wn = `any`,
      Gn = `serial`,
      Kn = `local_serial`;
    ((e.DBCASSANDRACONSISTENCYLEVELVALUES_ALL = Ln),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_EACH_QUORUM = Rn),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_QUORUM = zn),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_QUORUM = Bn),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_ONE = Vn),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_TWO = Hn),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_THREE = N),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_ONE = Un),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_ANY = Wn),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_SERIAL = Gn),
      (e.DBCASSANDRACONSISTENCYLEVELVALUES_LOCAL_SERIAL = Kn),
      (e.DbCassandraConsistencyLevelValues = (0, t.createConstMap)([
        Ln,
        Rn,
        zn,
        Bn,
        Vn,
        Hn,
        N,
        Un,
        Wn,
        Gn,
        Kn,
      ])));
    var qn = `datasource`,
      Jn = `http`,
      Yn = `pubsub`,
      Xn = `timer`,
      Zn = `other`;
    ((e.FAASTRIGGERVALUES_DATASOURCE = qn),
      (e.FAASTRIGGERVALUES_HTTP = Jn),
      (e.FAASTRIGGERVALUES_PUBSUB = Yn),
      (e.FAASTRIGGERVALUES_TIMER = Xn),
      (e.FAASTRIGGERVALUES_OTHER = Zn),
      (e.FaasTriggerValues = (0, t.createConstMap)([qn, Jn, Yn, Xn, Zn])));
    var Qn = `insert`,
      $n = `edit`,
      er = `delete`;
    ((e.FAASDOCUMENTOPERATIONVALUES_INSERT = Qn),
      (e.FAASDOCUMENTOPERATIONVALUES_EDIT = $n),
      (e.FAASDOCUMENTOPERATIONVALUES_DELETE = er),
      (e.FaasDocumentOperationValues = (0, t.createConstMap)([Qn, $n, er])));
    var tr = `alibaba_cloud`,
      nr = `aws`,
      rr = `azure`,
      ir = `gcp`;
    ((e.FAASINVOKEDPROVIDERVALUES_ALIBABA_CLOUD = tr),
      (e.FAASINVOKEDPROVIDERVALUES_AWS = nr),
      (e.FAASINVOKEDPROVIDERVALUES_AZURE = rr),
      (e.FAASINVOKEDPROVIDERVALUES_GCP = ir),
      (e.FaasInvokedProviderValues = (0, t.createConstMap)([tr, nr, rr, ir])));
    var ar = `ip_tcp`,
      or = `ip_udp`,
      sr = `ip`,
      cr = `unix`,
      lr = `pipe`,
      ur = `inproc`,
      dr = `other`;
    ((e.NETTRANSPORTVALUES_IP_TCP = ar),
      (e.NETTRANSPORTVALUES_IP_UDP = or),
      (e.NETTRANSPORTVALUES_IP = sr),
      (e.NETTRANSPORTVALUES_UNIX = cr),
      (e.NETTRANSPORTVALUES_PIPE = lr),
      (e.NETTRANSPORTVALUES_INPROC = ur),
      (e.NETTRANSPORTVALUES_OTHER = dr),
      (e.NetTransportValues = (0, t.createConstMap)([ar, or, sr, cr, lr, ur, dr])));
    var fr = `wifi`,
      pr = `wired`,
      mr = `cell`,
      hr = `unavailable`,
      gr = `unknown`;
    ((e.NETHOSTCONNECTIONTYPEVALUES_WIFI = fr),
      (e.NETHOSTCONNECTIONTYPEVALUES_WIRED = pr),
      (e.NETHOSTCONNECTIONTYPEVALUES_CELL = mr),
      (e.NETHOSTCONNECTIONTYPEVALUES_UNAVAILABLE = hr),
      (e.NETHOSTCONNECTIONTYPEVALUES_UNKNOWN = gr),
      (e.NetHostConnectionTypeValues = (0, t.createConstMap)([fr, pr, mr, hr, gr])));
    var _r = `gprs`,
      vr = `edge`,
      yr = `umts`,
      br = `cdma`,
      xr = `evdo_0`,
      Sr = `evdo_a`,
      Cr = `cdma2000_1xrtt`,
      wr = `hsdpa`,
      P = `hsupa`,
      Tr = `hspa`,
      Er = `iden`,
      Dr = `evdo_b`,
      Or = `lte`,
      kr = `ehrpd`,
      Ar = `hspap`,
      jr = `gsm`,
      Mr = `td_scdma`,
      Nr = `iwlan`,
      Pr = `nr`,
      Fr = `nrnsa`,
      Lr = `lte_ca`;
    ((e.NETHOSTCONNECTIONSUBTYPEVALUES_GPRS = _r),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_EDGE = vr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_UMTS = yr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA = br),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_0 = xr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_A = Sr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_CDMA2000_1XRTT = Cr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_HSDPA = wr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_HSUPA = P),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_HSPA = Tr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_IDEN = Er),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_EVDO_B = Dr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_LTE = Or),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_EHRPD = kr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_HSPAP = Ar),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_GSM = jr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_TD_SCDMA = Mr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_IWLAN = Nr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_NR = Pr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_NRNSA = Fr),
      (e.NETHOSTCONNECTIONSUBTYPEVALUES_LTE_CA = Lr),
      (e.NetHostConnectionSubtypeValues = (0, t.createConstMap)([
        _r,
        vr,
        yr,
        br,
        xr,
        Sr,
        Cr,
        wr,
        P,
        Tr,
        Er,
        Dr,
        Or,
        kr,
        Ar,
        jr,
        Mr,
        Nr,
        Pr,
        Fr,
        Lr,
      ])));
    var Rr = `1.0`,
      zr = `1.1`,
      Br = `2.0`,
      Vr = `SPDY`,
      Hr = `QUIC`;
    ((e.HTTPFLAVORVALUES_HTTP_1_0 = Rr),
      (e.HTTPFLAVORVALUES_HTTP_1_1 = zr),
      (e.HTTPFLAVORVALUES_HTTP_2_0 = Br),
      (e.HTTPFLAVORVALUES_SPDY = Vr),
      (e.HTTPFLAVORVALUES_QUIC = Hr),
      (e.HttpFlavorValues = { HTTP_1_0: Rr, HTTP_1_1: zr, HTTP_2_0: Br, SPDY: Vr, QUIC: Hr }));
    var Ur = `queue`,
      Wr = `topic`;
    ((e.MESSAGINGDESTINATIONKINDVALUES_QUEUE = Ur),
      (e.MESSAGINGDESTINATIONKINDVALUES_TOPIC = Wr),
      (e.MessagingDestinationKindValues = (0, t.createConstMap)([Ur, Wr])));
    var Gr = `receive`,
      Kr = `process`;
    ((e.MESSAGINGOPERATIONVALUES_RECEIVE = Gr),
      (e.MESSAGINGOPERATIONVALUES_PROCESS = Kr),
      (e.MessagingOperationValues = (0, t.createConstMap)([Gr, Kr])));
    var qr = 0,
      Jr = 1,
      Yr = 2,
      Xr = 3,
      Zr = 4,
      Qr = 5,
      $r = 6,
      ei = 7,
      ti = 8,
      ni = 9,
      ri = 10,
      ii = 11,
      ai = 12,
      oi = 13,
      si = 14,
      ci = 15,
      li = 16;
    ((e.RPCGRPCSTATUSCODEVALUES_OK = qr),
      (e.RPCGRPCSTATUSCODEVALUES_CANCELLED = Jr),
      (e.RPCGRPCSTATUSCODEVALUES_UNKNOWN = Yr),
      (e.RPCGRPCSTATUSCODEVALUES_INVALID_ARGUMENT = Xr),
      (e.RPCGRPCSTATUSCODEVALUES_DEADLINE_EXCEEDED = Zr),
      (e.RPCGRPCSTATUSCODEVALUES_NOT_FOUND = Qr),
      (e.RPCGRPCSTATUSCODEVALUES_ALREADY_EXISTS = $r),
      (e.RPCGRPCSTATUSCODEVALUES_PERMISSION_DENIED = ei),
      (e.RPCGRPCSTATUSCODEVALUES_RESOURCE_EXHAUSTED = ti),
      (e.RPCGRPCSTATUSCODEVALUES_FAILED_PRECONDITION = ni),
      (e.RPCGRPCSTATUSCODEVALUES_ABORTED = ri),
      (e.RPCGRPCSTATUSCODEVALUES_OUT_OF_RANGE = ii),
      (e.RPCGRPCSTATUSCODEVALUES_UNIMPLEMENTED = ai),
      (e.RPCGRPCSTATUSCODEVALUES_INTERNAL = oi),
      (e.RPCGRPCSTATUSCODEVALUES_UNAVAILABLE = si),
      (e.RPCGRPCSTATUSCODEVALUES_DATA_LOSS = ci),
      (e.RPCGRPCSTATUSCODEVALUES_UNAUTHENTICATED = li),
      (e.RpcGrpcStatusCodeValues = {
        OK: qr,
        CANCELLED: Jr,
        UNKNOWN: Yr,
        INVALID_ARGUMENT: Xr,
        DEADLINE_EXCEEDED: Zr,
        NOT_FOUND: Qr,
        ALREADY_EXISTS: $r,
        PERMISSION_DENIED: ei,
        RESOURCE_EXHAUSTED: ti,
        FAILED_PRECONDITION: ni,
        ABORTED: ri,
        OUT_OF_RANGE: ii,
        UNIMPLEMENTED: ai,
        INTERNAL: oi,
        UNAVAILABLE: si,
        DATA_LOSS: ci,
        UNAUTHENTICATED: li,
      }));
    var ui = `SENT`,
      di = `RECEIVED`;
    ((e.MESSAGETYPEVALUES_SENT = ui),
      (e.MESSAGETYPEVALUES_RECEIVED = di),
      (e.MessageTypeValues = (0, t.createConstMap)([ui, di])));
  }),
  Rr = e.t((e) => {
    var t =
        (e && e.__createBinding) ||
        (Object.create
          ? function (e, t, n, r) {
              r === void 0 && (r = n);
              var i = Object.getOwnPropertyDescriptor(t, n);
              ((!i || (`get` in i ? !t.__esModule : i.writable || i.configurable)) &&
                (i = {
                  enumerable: !0,
                  get: function () {
                    return t[n];
                  },
                }),
                Object.defineProperty(e, r, i));
            }
          : function (e, t, n, r) {
              (r === void 0 && (r = n), (e[r] = t[n]));
            }),
      n =
        (e && e.__exportStar) ||
        function (e, n) {
          for (var r in e)
            r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
        };
    (Object.defineProperty(e, "__esModule", { value: !0 }), n(Lr(), e));
  }),
  zr = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.SEMRESATTRS_K8S_STATEFULSET_NAME =
        e.SEMRESATTRS_K8S_STATEFULSET_UID =
        e.SEMRESATTRS_K8S_DEPLOYMENT_NAME =
        e.SEMRESATTRS_K8S_DEPLOYMENT_UID =
        e.SEMRESATTRS_K8S_REPLICASET_NAME =
        e.SEMRESATTRS_K8S_REPLICASET_UID =
        e.SEMRESATTRS_K8S_CONTAINER_NAME =
        e.SEMRESATTRS_K8S_POD_NAME =
        e.SEMRESATTRS_K8S_POD_UID =
        e.SEMRESATTRS_K8S_NAMESPACE_NAME =
        e.SEMRESATTRS_K8S_NODE_UID =
        e.SEMRESATTRS_K8S_NODE_NAME =
        e.SEMRESATTRS_K8S_CLUSTER_NAME =
        e.SEMRESATTRS_HOST_IMAGE_VERSION =
        e.SEMRESATTRS_HOST_IMAGE_ID =
        e.SEMRESATTRS_HOST_IMAGE_NAME =
        e.SEMRESATTRS_HOST_ARCH =
        e.SEMRESATTRS_HOST_TYPE =
        e.SEMRESATTRS_HOST_NAME =
        e.SEMRESATTRS_HOST_ID =
        e.SEMRESATTRS_FAAS_MAX_MEMORY =
        e.SEMRESATTRS_FAAS_INSTANCE =
        e.SEMRESATTRS_FAAS_VERSION =
        e.SEMRESATTRS_FAAS_ID =
        e.SEMRESATTRS_FAAS_NAME =
        e.SEMRESATTRS_DEVICE_MODEL_NAME =
        e.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER =
        e.SEMRESATTRS_DEVICE_ID =
        e.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT =
        e.SEMRESATTRS_CONTAINER_IMAGE_TAG =
        e.SEMRESATTRS_CONTAINER_IMAGE_NAME =
        e.SEMRESATTRS_CONTAINER_RUNTIME =
        e.SEMRESATTRS_CONTAINER_ID =
        e.SEMRESATTRS_CONTAINER_NAME =
        e.SEMRESATTRS_AWS_LOG_STREAM_ARNS =
        e.SEMRESATTRS_AWS_LOG_STREAM_NAMES =
        e.SEMRESATTRS_AWS_LOG_GROUP_ARNS =
        e.SEMRESATTRS_AWS_LOG_GROUP_NAMES =
        e.SEMRESATTRS_AWS_EKS_CLUSTER_ARN =
        e.SEMRESATTRS_AWS_ECS_TASK_REVISION =
        e.SEMRESATTRS_AWS_ECS_TASK_FAMILY =
        e.SEMRESATTRS_AWS_ECS_TASK_ARN =
        e.SEMRESATTRS_AWS_ECS_LAUNCHTYPE =
        e.SEMRESATTRS_AWS_ECS_CLUSTER_ARN =
        e.SEMRESATTRS_AWS_ECS_CONTAINER_ARN =
        e.SEMRESATTRS_CLOUD_PLATFORM =
        e.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE =
        e.SEMRESATTRS_CLOUD_REGION =
        e.SEMRESATTRS_CLOUD_ACCOUNT_ID =
        e.SEMRESATTRS_CLOUD_PROVIDER =
          void 0),
      (e.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE =
        e.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE =
        e.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS =
        e.CLOUDPLATFORMVALUES_AZURE_AKS =
        e.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES =
        e.CLOUDPLATFORMVALUES_AZURE_VM =
        e.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK =
        e.CLOUDPLATFORMVALUES_AWS_LAMBDA =
        e.CLOUDPLATFORMVALUES_AWS_EKS =
        e.CLOUDPLATFORMVALUES_AWS_ECS =
        e.CLOUDPLATFORMVALUES_AWS_EC2 =
        e.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC =
        e.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS =
        e.CloudProviderValues =
        e.CLOUDPROVIDERVALUES_GCP =
        e.CLOUDPROVIDERVALUES_AZURE =
        e.CLOUDPROVIDERVALUES_AWS =
        e.CLOUDPROVIDERVALUES_ALIBABA_CLOUD =
        e.SemanticResourceAttributes =
        e.SEMRESATTRS_WEBENGINE_DESCRIPTION =
        e.SEMRESATTRS_WEBENGINE_VERSION =
        e.SEMRESATTRS_WEBENGINE_NAME =
        e.SEMRESATTRS_TELEMETRY_AUTO_VERSION =
        e.SEMRESATTRS_TELEMETRY_SDK_VERSION =
        e.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE =
        e.SEMRESATTRS_TELEMETRY_SDK_NAME =
        e.SEMRESATTRS_SERVICE_VERSION =
        e.SEMRESATTRS_SERVICE_INSTANCE_ID =
        e.SEMRESATTRS_SERVICE_NAMESPACE =
        e.SEMRESATTRS_SERVICE_NAME =
        e.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION =
        e.SEMRESATTRS_PROCESS_RUNTIME_VERSION =
        e.SEMRESATTRS_PROCESS_RUNTIME_NAME =
        e.SEMRESATTRS_PROCESS_OWNER =
        e.SEMRESATTRS_PROCESS_COMMAND_ARGS =
        e.SEMRESATTRS_PROCESS_COMMAND_LINE =
        e.SEMRESATTRS_PROCESS_COMMAND =
        e.SEMRESATTRS_PROCESS_EXECUTABLE_PATH =
        e.SEMRESATTRS_PROCESS_EXECUTABLE_NAME =
        e.SEMRESATTRS_PROCESS_PID =
        e.SEMRESATTRS_OS_VERSION =
        e.SEMRESATTRS_OS_NAME =
        e.SEMRESATTRS_OS_DESCRIPTION =
        e.SEMRESATTRS_OS_TYPE =
        e.SEMRESATTRS_K8S_CRONJOB_NAME =
        e.SEMRESATTRS_K8S_CRONJOB_UID =
        e.SEMRESATTRS_K8S_JOB_NAME =
        e.SEMRESATTRS_K8S_JOB_UID =
        e.SEMRESATTRS_K8S_DAEMONSET_NAME =
        e.SEMRESATTRS_K8S_DAEMONSET_UID =
          void 0),
      (e.TelemetrySdkLanguageValues =
        e.TELEMETRYSDKLANGUAGEVALUES_WEBJS =
        e.TELEMETRYSDKLANGUAGEVALUES_RUBY =
        e.TELEMETRYSDKLANGUAGEVALUES_PYTHON =
        e.TELEMETRYSDKLANGUAGEVALUES_PHP =
        e.TELEMETRYSDKLANGUAGEVALUES_NODEJS =
        e.TELEMETRYSDKLANGUAGEVALUES_JAVA =
        e.TELEMETRYSDKLANGUAGEVALUES_GO =
        e.TELEMETRYSDKLANGUAGEVALUES_ERLANG =
        e.TELEMETRYSDKLANGUAGEVALUES_DOTNET =
        e.TELEMETRYSDKLANGUAGEVALUES_CPP =
        e.OsTypeValues =
        e.OSTYPEVALUES_Z_OS =
        e.OSTYPEVALUES_SOLARIS =
        e.OSTYPEVALUES_AIX =
        e.OSTYPEVALUES_HPUX =
        e.OSTYPEVALUES_DRAGONFLYBSD =
        e.OSTYPEVALUES_OPENBSD =
        e.OSTYPEVALUES_NETBSD =
        e.OSTYPEVALUES_FREEBSD =
        e.OSTYPEVALUES_DARWIN =
        e.OSTYPEVALUES_LINUX =
        e.OSTYPEVALUES_WINDOWS =
        e.HostArchValues =
        e.HOSTARCHVALUES_X86 =
        e.HOSTARCHVALUES_PPC64 =
        e.HOSTARCHVALUES_PPC32 =
        e.HOSTARCHVALUES_IA64 =
        e.HOSTARCHVALUES_ARM64 =
        e.HOSTARCHVALUES_ARM32 =
        e.HOSTARCHVALUES_AMD64 =
        e.AwsEcsLaunchtypeValues =
        e.AWSECSLAUNCHTYPEVALUES_FARGATE =
        e.AWSECSLAUNCHTYPEVALUES_EC2 =
        e.CloudPlatformValues =
        e.CLOUDPLATFORMVALUES_GCP_APP_ENGINE =
        e.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS =
        e.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE =
        e.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN =
          void 0));
    var t = Ir(),
      n = `cloud.provider`,
      r = `cloud.account.id`,
      i = `cloud.region`,
      a = `cloud.availability_zone`,
      o = `cloud.platform`,
      s = `aws.ecs.container.arn`,
      c = `aws.ecs.cluster.arn`,
      l = `aws.ecs.launchtype`,
      u = `aws.ecs.task.arn`,
      d = `aws.ecs.task.family`,
      f = `aws.ecs.task.revision`,
      p = `aws.eks.cluster.arn`,
      m = `aws.log.group.names`,
      h = `aws.log.group.arns`,
      g = `aws.log.stream.names`,
      _ = `aws.log.stream.arns`,
      v = `container.name`,
      y = `container.id`,
      b = `container.runtime`,
      x = `container.image.name`,
      S = `container.image.tag`,
      C = `deployment.environment`,
      w = `device.id`,
      T = `device.model.identifier`,
      E = `device.model.name`,
      D = `faas.name`,
      O = `faas.id`,
      ee = `faas.version`,
      te = `faas.instance`,
      ne = `faas.max_memory`,
      re = `host.id`,
      ie = `host.name`,
      ae = `host.type`,
      oe = `host.arch`,
      se = `host.image.name`,
      ce = `host.image.id`,
      le = `host.image.version`,
      ue = `k8s.cluster.name`,
      de = `k8s.node.name`,
      fe = `k8s.node.uid`,
      pe = `k8s.namespace.name`,
      me = `k8s.pod.uid`,
      he = `k8s.pod.name`,
      ge = `k8s.container.name`,
      _e = `k8s.replicaset.uid`,
      ve = `k8s.replicaset.name`,
      ye = `k8s.deployment.uid`,
      be = `k8s.deployment.name`,
      xe = `k8s.statefulset.uid`,
      Se = `k8s.statefulset.name`,
      k = `k8s.daemonset.uid`,
      Ce = `k8s.daemonset.name`,
      we = `k8s.job.uid`,
      Te = `k8s.job.name`,
      Ee = `k8s.cronjob.uid`,
      De = `k8s.cronjob.name`,
      Oe = `os.type`,
      ke = `os.description`,
      Ae = `os.name`,
      je = `os.version`,
      Me = `process.pid`,
      Ne = `process.executable.name`,
      Pe = `process.executable.path`,
      Fe = `process.command`,
      Ie = `process.command_line`,
      Le = `process.command_args`,
      Re = `process.owner`,
      ze = `process.runtime.name`,
      Be = `process.runtime.version`,
      Ve = `process.runtime.description`,
      A = `service.name`,
      He = `service.namespace`,
      Ue = `service.instance.id`,
      We = `service.version`,
      Ge = `telemetry.sdk.name`,
      Ke = `telemetry.sdk.language`,
      qe = `telemetry.sdk.version`,
      Je = `telemetry.auto.version`,
      Ye = `webengine.name`,
      Xe = `webengine.version`,
      Ze = `webengine.description`;
    ((e.SEMRESATTRS_CLOUD_PROVIDER = n),
      (e.SEMRESATTRS_CLOUD_ACCOUNT_ID = r),
      (e.SEMRESATTRS_CLOUD_REGION = i),
      (e.SEMRESATTRS_CLOUD_AVAILABILITY_ZONE = a),
      (e.SEMRESATTRS_CLOUD_PLATFORM = o),
      (e.SEMRESATTRS_AWS_ECS_CONTAINER_ARN = s),
      (e.SEMRESATTRS_AWS_ECS_CLUSTER_ARN = c),
      (e.SEMRESATTRS_AWS_ECS_LAUNCHTYPE = l),
      (e.SEMRESATTRS_AWS_ECS_TASK_ARN = u),
      (e.SEMRESATTRS_AWS_ECS_TASK_FAMILY = d),
      (e.SEMRESATTRS_AWS_ECS_TASK_REVISION = f),
      (e.SEMRESATTRS_AWS_EKS_CLUSTER_ARN = p),
      (e.SEMRESATTRS_AWS_LOG_GROUP_NAMES = m),
      (e.SEMRESATTRS_AWS_LOG_GROUP_ARNS = h),
      (e.SEMRESATTRS_AWS_LOG_STREAM_NAMES = g),
      (e.SEMRESATTRS_AWS_LOG_STREAM_ARNS = _),
      (e.SEMRESATTRS_CONTAINER_NAME = v),
      (e.SEMRESATTRS_CONTAINER_ID = y),
      (e.SEMRESATTRS_CONTAINER_RUNTIME = b),
      (e.SEMRESATTRS_CONTAINER_IMAGE_NAME = x),
      (e.SEMRESATTRS_CONTAINER_IMAGE_TAG = S),
      (e.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT = C),
      (e.SEMRESATTRS_DEVICE_ID = w),
      (e.SEMRESATTRS_DEVICE_MODEL_IDENTIFIER = T),
      (e.SEMRESATTRS_DEVICE_MODEL_NAME = E),
      (e.SEMRESATTRS_FAAS_NAME = D),
      (e.SEMRESATTRS_FAAS_ID = O),
      (e.SEMRESATTRS_FAAS_VERSION = ee),
      (e.SEMRESATTRS_FAAS_INSTANCE = te),
      (e.SEMRESATTRS_FAAS_MAX_MEMORY = ne),
      (e.SEMRESATTRS_HOST_ID = re),
      (e.SEMRESATTRS_HOST_NAME = ie),
      (e.SEMRESATTRS_HOST_TYPE = ae),
      (e.SEMRESATTRS_HOST_ARCH = oe),
      (e.SEMRESATTRS_HOST_IMAGE_NAME = se),
      (e.SEMRESATTRS_HOST_IMAGE_ID = ce),
      (e.SEMRESATTRS_HOST_IMAGE_VERSION = le),
      (e.SEMRESATTRS_K8S_CLUSTER_NAME = ue),
      (e.SEMRESATTRS_K8S_NODE_NAME = de),
      (e.SEMRESATTRS_K8S_NODE_UID = fe),
      (e.SEMRESATTRS_K8S_NAMESPACE_NAME = pe),
      (e.SEMRESATTRS_K8S_POD_UID = me),
      (e.SEMRESATTRS_K8S_POD_NAME = he),
      (e.SEMRESATTRS_K8S_CONTAINER_NAME = ge),
      (e.SEMRESATTRS_K8S_REPLICASET_UID = _e),
      (e.SEMRESATTRS_K8S_REPLICASET_NAME = ve),
      (e.SEMRESATTRS_K8S_DEPLOYMENT_UID = ye),
      (e.SEMRESATTRS_K8S_DEPLOYMENT_NAME = be),
      (e.SEMRESATTRS_K8S_STATEFULSET_UID = xe),
      (e.SEMRESATTRS_K8S_STATEFULSET_NAME = Se),
      (e.SEMRESATTRS_K8S_DAEMONSET_UID = k),
      (e.SEMRESATTRS_K8S_DAEMONSET_NAME = Ce),
      (e.SEMRESATTRS_K8S_JOB_UID = we),
      (e.SEMRESATTRS_K8S_JOB_NAME = Te),
      (e.SEMRESATTRS_K8S_CRONJOB_UID = Ee),
      (e.SEMRESATTRS_K8S_CRONJOB_NAME = De),
      (e.SEMRESATTRS_OS_TYPE = Oe),
      (e.SEMRESATTRS_OS_DESCRIPTION = ke),
      (e.SEMRESATTRS_OS_NAME = Ae),
      (e.SEMRESATTRS_OS_VERSION = je),
      (e.SEMRESATTRS_PROCESS_PID = Me),
      (e.SEMRESATTRS_PROCESS_EXECUTABLE_NAME = Ne),
      (e.SEMRESATTRS_PROCESS_EXECUTABLE_PATH = Pe),
      (e.SEMRESATTRS_PROCESS_COMMAND = Fe),
      (e.SEMRESATTRS_PROCESS_COMMAND_LINE = Ie),
      (e.SEMRESATTRS_PROCESS_COMMAND_ARGS = Le),
      (e.SEMRESATTRS_PROCESS_OWNER = Re),
      (e.SEMRESATTRS_PROCESS_RUNTIME_NAME = ze),
      (e.SEMRESATTRS_PROCESS_RUNTIME_VERSION = Be),
      (e.SEMRESATTRS_PROCESS_RUNTIME_DESCRIPTION = Ve),
      (e.SEMRESATTRS_SERVICE_NAME = A),
      (e.SEMRESATTRS_SERVICE_NAMESPACE = He),
      (e.SEMRESATTRS_SERVICE_INSTANCE_ID = Ue),
      (e.SEMRESATTRS_SERVICE_VERSION = We),
      (e.SEMRESATTRS_TELEMETRY_SDK_NAME = Ge),
      (e.SEMRESATTRS_TELEMETRY_SDK_LANGUAGE = Ke),
      (e.SEMRESATTRS_TELEMETRY_SDK_VERSION = qe),
      (e.SEMRESATTRS_TELEMETRY_AUTO_VERSION = Je),
      (e.SEMRESATTRS_WEBENGINE_NAME = Ye),
      (e.SEMRESATTRS_WEBENGINE_VERSION = Xe),
      (e.SEMRESATTRS_WEBENGINE_DESCRIPTION = Ze),
      (e.SemanticResourceAttributes = (0, t.createConstMap)([
        n,
        r,
        i,
        a,
        o,
        s,
        c,
        l,
        u,
        d,
        f,
        p,
        m,
        h,
        g,
        _,
        v,
        y,
        b,
        x,
        S,
        C,
        w,
        T,
        E,
        D,
        O,
        ee,
        te,
        ne,
        re,
        ie,
        ae,
        oe,
        se,
        ce,
        le,
        ue,
        de,
        fe,
        pe,
        me,
        he,
        ge,
        _e,
        ve,
        ye,
        be,
        xe,
        Se,
        k,
        Ce,
        we,
        Te,
        Ee,
        De,
        Oe,
        ke,
        Ae,
        je,
        Me,
        Ne,
        Pe,
        Fe,
        Ie,
        Le,
        Re,
        ze,
        Be,
        Ve,
        A,
        He,
        Ue,
        We,
        Ge,
        Ke,
        qe,
        Je,
        Ye,
        Xe,
        Ze,
      ])));
    var Qe = `alibaba_cloud`,
      $e = `aws`,
      et = `azure`,
      tt = `gcp`;
    ((e.CLOUDPROVIDERVALUES_ALIBABA_CLOUD = Qe),
      (e.CLOUDPROVIDERVALUES_AWS = $e),
      (e.CLOUDPROVIDERVALUES_AZURE = et),
      (e.CLOUDPROVIDERVALUES_GCP = tt),
      (e.CloudProviderValues = (0, t.createConstMap)([Qe, $e, et, tt])));
    var nt = `alibaba_cloud_ecs`,
      rt = `alibaba_cloud_fc`,
      it = `aws_ec2`,
      at = `aws_ecs`,
      ot = `aws_eks`,
      st = `aws_lambda`,
      ct = `aws_elastic_beanstalk`,
      lt = `azure_vm`,
      ut = `azure_container_instances`,
      dt = `azure_aks`,
      ft = `azure_functions`,
      pt = `azure_app_service`,
      mt = `gcp_compute_engine`,
      ht = `gcp_cloud_run`,
      gt = `gcp_kubernetes_engine`,
      _t = `gcp_cloud_functions`,
      vt = `gcp_app_engine`;
    ((e.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_ECS = nt),
      (e.CLOUDPLATFORMVALUES_ALIBABA_CLOUD_FC = rt),
      (e.CLOUDPLATFORMVALUES_AWS_EC2 = it),
      (e.CLOUDPLATFORMVALUES_AWS_ECS = at),
      (e.CLOUDPLATFORMVALUES_AWS_EKS = ot),
      (e.CLOUDPLATFORMVALUES_AWS_LAMBDA = st),
      (e.CLOUDPLATFORMVALUES_AWS_ELASTIC_BEANSTALK = ct),
      (e.CLOUDPLATFORMVALUES_AZURE_VM = lt),
      (e.CLOUDPLATFORMVALUES_AZURE_CONTAINER_INSTANCES = ut),
      (e.CLOUDPLATFORMVALUES_AZURE_AKS = dt),
      (e.CLOUDPLATFORMVALUES_AZURE_FUNCTIONS = ft),
      (e.CLOUDPLATFORMVALUES_AZURE_APP_SERVICE = pt),
      (e.CLOUDPLATFORMVALUES_GCP_COMPUTE_ENGINE = mt),
      (e.CLOUDPLATFORMVALUES_GCP_CLOUD_RUN = ht),
      (e.CLOUDPLATFORMVALUES_GCP_KUBERNETES_ENGINE = gt),
      (e.CLOUDPLATFORMVALUES_GCP_CLOUD_FUNCTIONS = _t),
      (e.CLOUDPLATFORMVALUES_GCP_APP_ENGINE = vt),
      (e.CloudPlatformValues = (0, t.createConstMap)([
        nt,
        rt,
        it,
        at,
        ot,
        st,
        ct,
        lt,
        ut,
        dt,
        ft,
        pt,
        mt,
        ht,
        gt,
        _t,
        vt,
      ])));
    var yt = `ec2`,
      bt = `fargate`;
    ((e.AWSECSLAUNCHTYPEVALUES_EC2 = yt),
      (e.AWSECSLAUNCHTYPEVALUES_FARGATE = bt),
      (e.AwsEcsLaunchtypeValues = (0, t.createConstMap)([yt, bt])));
    var xt = `amd64`,
      St = `arm32`,
      Ct = `arm64`,
      wt = `ia64`,
      Tt = `ppc32`,
      Et = `ppc64`,
      Dt = `x86`;
    ((e.HOSTARCHVALUES_AMD64 = xt),
      (e.HOSTARCHVALUES_ARM32 = St),
      (e.HOSTARCHVALUES_ARM64 = Ct),
      (e.HOSTARCHVALUES_IA64 = wt),
      (e.HOSTARCHVALUES_PPC32 = Tt),
      (e.HOSTARCHVALUES_PPC64 = Et),
      (e.HOSTARCHVALUES_X86 = Dt),
      (e.HostArchValues = (0, t.createConstMap)([xt, St, Ct, wt, Tt, Et, Dt])));
    var Ot = `windows`,
      kt = `linux`,
      At = `darwin`,
      jt = `freebsd`,
      Mt = `netbsd`,
      Nt = `openbsd`,
      Pt = `dragonflybsd`,
      j = `hpux`,
      Ft = `aix`,
      It = `solaris`,
      Lt = `z_os`;
    ((e.OSTYPEVALUES_WINDOWS = Ot),
      (e.OSTYPEVALUES_LINUX = kt),
      (e.OSTYPEVALUES_DARWIN = At),
      (e.OSTYPEVALUES_FREEBSD = jt),
      (e.OSTYPEVALUES_NETBSD = Mt),
      (e.OSTYPEVALUES_OPENBSD = Nt),
      (e.OSTYPEVALUES_DRAGONFLYBSD = Pt),
      (e.OSTYPEVALUES_HPUX = j),
      (e.OSTYPEVALUES_AIX = Ft),
      (e.OSTYPEVALUES_SOLARIS = It),
      (e.OSTYPEVALUES_Z_OS = Lt),
      (e.OsTypeValues = (0, t.createConstMap)([Ot, kt, At, jt, Mt, Nt, Pt, j, Ft, It, Lt])));
    var Rt = `cpp`,
      zt = `dotnet`,
      Bt = `erlang`,
      Vt = `go`,
      M = `java`,
      Ht = `nodejs`,
      Ut = `php`,
      Wt = `python`,
      Gt = `ruby`,
      Kt = `webjs`;
    ((e.TELEMETRYSDKLANGUAGEVALUES_CPP = Rt),
      (e.TELEMETRYSDKLANGUAGEVALUES_DOTNET = zt),
      (e.TELEMETRYSDKLANGUAGEVALUES_ERLANG = Bt),
      (e.TELEMETRYSDKLANGUAGEVALUES_GO = Vt),
      (e.TELEMETRYSDKLANGUAGEVALUES_JAVA = M),
      (e.TELEMETRYSDKLANGUAGEVALUES_NODEJS = Ht),
      (e.TELEMETRYSDKLANGUAGEVALUES_PHP = Ut),
      (e.TELEMETRYSDKLANGUAGEVALUES_PYTHON = Wt),
      (e.TELEMETRYSDKLANGUAGEVALUES_RUBY = Gt),
      (e.TELEMETRYSDKLANGUAGEVALUES_WEBJS = Kt),
      (e.TelemetrySdkLanguageValues = (0, t.createConstMap)([
        Rt,
        zt,
        Bt,
        Vt,
        M,
        Ht,
        Ut,
        Wt,
        Gt,
        Kt,
      ])));
  }),
  Br = e.t((e) => {
    var t =
        (e && e.__createBinding) ||
        (Object.create
          ? function (e, t, n, r) {
              r === void 0 && (r = n);
              var i = Object.getOwnPropertyDescriptor(t, n);
              ((!i || (`get` in i ? !t.__esModule : i.writable || i.configurable)) &&
                (i = {
                  enumerable: !0,
                  get: function () {
                    return t[n];
                  },
                }),
                Object.defineProperty(e, r, i));
            }
          : function (e, t, n, r) {
              (r === void 0 && (r = n), (e[r] = t[n]));
            }),
      n =
        (e && e.__exportStar) ||
        function (e, n) {
          for (var r in e)
            r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
        };
    (Object.defineProperty(e, "__esModule", { value: !0 }), n(zr(), e));
  }),
  Vr = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.ATTR_EXCEPTION_TYPE =
        e.ATTR_EXCEPTION_STACKTRACE =
        e.ATTR_EXCEPTION_MESSAGE =
        e.ATTR_EXCEPTION_ESCAPED =
        e.ERROR_TYPE_VALUE_OTHER =
        e.ATTR_ERROR_TYPE =
        e.DOTNET_GC_HEAP_GENERATION_VALUE_POH =
        e.DOTNET_GC_HEAP_GENERATION_VALUE_LOH =
        e.DOTNET_GC_HEAP_GENERATION_VALUE_GEN2 =
        e.DOTNET_GC_HEAP_GENERATION_VALUE_GEN1 =
        e.DOTNET_GC_HEAP_GENERATION_VALUE_GEN0 =
        e.ATTR_DOTNET_GC_HEAP_GENERATION =
        e.DB_SYSTEM_NAME_VALUE_POSTGRESQL =
        e.DB_SYSTEM_NAME_VALUE_MYSQL =
        e.DB_SYSTEM_NAME_VALUE_MICROSOFT_SQL_SERVER =
        e.DB_SYSTEM_NAME_VALUE_MARIADB =
        e.ATTR_DB_SYSTEM_NAME =
        e.ATTR_DB_STORED_PROCEDURE_NAME =
        e.ATTR_DB_RESPONSE_STATUS_CODE =
        e.ATTR_DB_QUERY_TEXT =
        e.ATTR_DB_QUERY_SUMMARY =
        e.ATTR_DB_OPERATION_NAME =
        e.ATTR_DB_OPERATION_BATCH_SIZE =
        e.ATTR_DB_NAMESPACE =
        e.ATTR_DB_COLLECTION_NAME =
        e.ATTR_CODE_STACKTRACE =
        e.ATTR_CODE_LINE_NUMBER =
        e.ATTR_CODE_FUNCTION_NAME =
        e.ATTR_CODE_FILE_PATH =
        e.ATTR_CODE_COLUMN_NUMBER =
        e.ATTR_CLIENT_PORT =
        e.ATTR_CLIENT_ADDRESS =
        e.ATTR_ASPNETCORE_USER_IS_AUTHENTICATED =
        e.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS =
        e.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE =
        e.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS =
        e.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK =
        e.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED =
        e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED =
        e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER =
        e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER =
        e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED =
        e.ATTR_ASPNETCORE_RATE_LIMITING_RESULT =
        e.ATTR_ASPNETCORE_RATE_LIMITING_POLICY =
        e.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE =
        e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED =
        e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED =
        e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED =
        e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED =
        e.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT =
          void 0),
      (e.OTEL_STATUS_CODE_VALUE_ERROR =
        e.ATTR_OTEL_STATUS_CODE =
        e.ATTR_OTEL_SCOPE_VERSION =
        e.ATTR_OTEL_SCOPE_NAME =
        e.NETWORK_TYPE_VALUE_IPV6 =
        e.NETWORK_TYPE_VALUE_IPV4 =
        e.ATTR_NETWORK_TYPE =
        e.NETWORK_TRANSPORT_VALUE_UNIX =
        e.NETWORK_TRANSPORT_VALUE_UDP =
        e.NETWORK_TRANSPORT_VALUE_TCP =
        e.NETWORK_TRANSPORT_VALUE_QUIC =
        e.NETWORK_TRANSPORT_VALUE_PIPE =
        e.ATTR_NETWORK_TRANSPORT =
        e.ATTR_NETWORK_PROTOCOL_VERSION =
        e.ATTR_NETWORK_PROTOCOL_NAME =
        e.ATTR_NETWORK_PEER_PORT =
        e.ATTR_NETWORK_PEER_ADDRESS =
        e.ATTR_NETWORK_LOCAL_PORT =
        e.ATTR_NETWORK_LOCAL_ADDRESS =
        e.JVM_THREAD_STATE_VALUE_WAITING =
        e.JVM_THREAD_STATE_VALUE_TIMED_WAITING =
        e.JVM_THREAD_STATE_VALUE_TERMINATED =
        e.JVM_THREAD_STATE_VALUE_RUNNABLE =
        e.JVM_THREAD_STATE_VALUE_NEW =
        e.JVM_THREAD_STATE_VALUE_BLOCKED =
        e.ATTR_JVM_THREAD_STATE =
        e.ATTR_JVM_THREAD_DAEMON =
        e.JVM_MEMORY_TYPE_VALUE_NON_HEAP =
        e.JVM_MEMORY_TYPE_VALUE_HEAP =
        e.ATTR_JVM_MEMORY_TYPE =
        e.ATTR_JVM_MEMORY_POOL_NAME =
        e.ATTR_JVM_GC_NAME =
        e.ATTR_JVM_GC_ACTION =
        e.ATTR_HTTP_ROUTE =
        e.ATTR_HTTP_RESPONSE_STATUS_CODE =
        e.ATTR_HTTP_RESPONSE_HEADER =
        e.ATTR_HTTP_REQUEST_RESEND_COUNT =
        e.ATTR_HTTP_REQUEST_METHOD_ORIGINAL =
        e.HTTP_REQUEST_METHOD_VALUE_TRACE =
        e.HTTP_REQUEST_METHOD_VALUE_PUT =
        e.HTTP_REQUEST_METHOD_VALUE_POST =
        e.HTTP_REQUEST_METHOD_VALUE_PATCH =
        e.HTTP_REQUEST_METHOD_VALUE_OPTIONS =
        e.HTTP_REQUEST_METHOD_VALUE_HEAD =
        e.HTTP_REQUEST_METHOD_VALUE_GET =
        e.HTTP_REQUEST_METHOD_VALUE_DELETE =
        e.HTTP_REQUEST_METHOD_VALUE_CONNECT =
        e.HTTP_REQUEST_METHOD_VALUE_OTHER =
        e.ATTR_HTTP_REQUEST_METHOD =
        e.ATTR_HTTP_REQUEST_HEADER =
          void 0),
      (e.ATTR_USER_AGENT_ORIGINAL =
        e.ATTR_URL_SCHEME =
        e.ATTR_URL_QUERY =
        e.ATTR_URL_PATH =
        e.ATTR_URL_FULL =
        e.ATTR_URL_FRAGMENT =
        e.ATTR_TELEMETRY_SDK_VERSION =
        e.ATTR_TELEMETRY_SDK_NAME =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_RUST =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_PHP =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_GO =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET =
        e.TELEMETRY_SDK_LANGUAGE_VALUE_CPP =
        e.ATTR_TELEMETRY_SDK_LANGUAGE =
        e.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS =
        e.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS =
        e.SIGNALR_TRANSPORT_VALUE_LONG_POLLING =
        e.ATTR_SIGNALR_TRANSPORT =
        e.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT =
        e.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE =
        e.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN =
        e.ATTR_SIGNALR_CONNECTION_STATUS =
        e.ATTR_SERVICE_VERSION =
        e.ATTR_SERVICE_NAME =
        e.ATTR_SERVER_PORT =
        e.ATTR_SERVER_ADDRESS =
        e.ATTR_OTEL_STATUS_DESCRIPTION =
        e.OTEL_STATUS_CODE_VALUE_OK =
          void 0),
      (e.ATTR_ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT = `aspnetcore.diagnostics.exception.result`),
      (e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_ABORTED = `aborted`),
      (e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_HANDLED = `handled`),
      (e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_SKIPPED = `skipped`),
      (e.ASPNETCORE_DIAGNOSTICS_EXCEPTION_RESULT_VALUE_UNHANDLED = `unhandled`),
      (e.ATTR_ASPNETCORE_DIAGNOSTICS_HANDLER_TYPE = `aspnetcore.diagnostics.handler.type`),
      (e.ATTR_ASPNETCORE_RATE_LIMITING_POLICY = `aspnetcore.rate_limiting.policy`),
      (e.ATTR_ASPNETCORE_RATE_LIMITING_RESULT = `aspnetcore.rate_limiting.result`),
      (e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ACQUIRED = `acquired`),
      (e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_ENDPOINT_LIMITER = `endpoint_limiter`),
      (e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_GLOBAL_LIMITER = `global_limiter`),
      (e.ASPNETCORE_RATE_LIMITING_RESULT_VALUE_REQUEST_CANCELED = `request_canceled`),
      (e.ATTR_ASPNETCORE_REQUEST_IS_UNHANDLED = `aspnetcore.request.is_unhandled`),
      (e.ATTR_ASPNETCORE_ROUTING_IS_FALLBACK = `aspnetcore.routing.is_fallback`),
      (e.ATTR_ASPNETCORE_ROUTING_MATCH_STATUS = `aspnetcore.routing.match_status`),
      (e.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_FAILURE = `failure`),
      (e.ASPNETCORE_ROUTING_MATCH_STATUS_VALUE_SUCCESS = `success`),
      (e.ATTR_ASPNETCORE_USER_IS_AUTHENTICATED = `aspnetcore.user.is_authenticated`),
      (e.ATTR_CLIENT_ADDRESS = `client.address`),
      (e.ATTR_CLIENT_PORT = `client.port`),
      (e.ATTR_CODE_COLUMN_NUMBER = `code.column.number`),
      (e.ATTR_CODE_FILE_PATH = `code.file.path`),
      (e.ATTR_CODE_FUNCTION_NAME = `code.function.name`),
      (e.ATTR_CODE_LINE_NUMBER = `code.line.number`),
      (e.ATTR_CODE_STACKTRACE = `code.stacktrace`),
      (e.ATTR_DB_COLLECTION_NAME = `db.collection.name`),
      (e.ATTR_DB_NAMESPACE = `db.namespace`),
      (e.ATTR_DB_OPERATION_BATCH_SIZE = `db.operation.batch.size`),
      (e.ATTR_DB_OPERATION_NAME = `db.operation.name`),
      (e.ATTR_DB_QUERY_SUMMARY = `db.query.summary`),
      (e.ATTR_DB_QUERY_TEXT = `db.query.text`),
      (e.ATTR_DB_RESPONSE_STATUS_CODE = `db.response.status_code`),
      (e.ATTR_DB_STORED_PROCEDURE_NAME = `db.stored_procedure.name`),
      (e.ATTR_DB_SYSTEM_NAME = `db.system.name`),
      (e.DB_SYSTEM_NAME_VALUE_MARIADB = `mariadb`),
      (e.DB_SYSTEM_NAME_VALUE_MICROSOFT_SQL_SERVER = `microsoft.sql_server`),
      (e.DB_SYSTEM_NAME_VALUE_MYSQL = `mysql`),
      (e.DB_SYSTEM_NAME_VALUE_POSTGRESQL = `postgresql`),
      (e.ATTR_DOTNET_GC_HEAP_GENERATION = `dotnet.gc.heap.generation`),
      (e.DOTNET_GC_HEAP_GENERATION_VALUE_GEN0 = `gen0`),
      (e.DOTNET_GC_HEAP_GENERATION_VALUE_GEN1 = `gen1`),
      (e.DOTNET_GC_HEAP_GENERATION_VALUE_GEN2 = `gen2`),
      (e.DOTNET_GC_HEAP_GENERATION_VALUE_LOH = `loh`),
      (e.DOTNET_GC_HEAP_GENERATION_VALUE_POH = `poh`),
      (e.ATTR_ERROR_TYPE = `error.type`),
      (e.ERROR_TYPE_VALUE_OTHER = `_OTHER`),
      (e.ATTR_EXCEPTION_ESCAPED = `exception.escaped`),
      (e.ATTR_EXCEPTION_MESSAGE = `exception.message`),
      (e.ATTR_EXCEPTION_STACKTRACE = `exception.stacktrace`),
      (e.ATTR_EXCEPTION_TYPE = `exception.type`),
      (e.ATTR_HTTP_REQUEST_HEADER = (e) => `http.request.header.${e}`),
      (e.ATTR_HTTP_REQUEST_METHOD = `http.request.method`),
      (e.HTTP_REQUEST_METHOD_VALUE_OTHER = `_OTHER`),
      (e.HTTP_REQUEST_METHOD_VALUE_CONNECT = `CONNECT`),
      (e.HTTP_REQUEST_METHOD_VALUE_DELETE = `DELETE`),
      (e.HTTP_REQUEST_METHOD_VALUE_GET = `GET`),
      (e.HTTP_REQUEST_METHOD_VALUE_HEAD = `HEAD`),
      (e.HTTP_REQUEST_METHOD_VALUE_OPTIONS = `OPTIONS`),
      (e.HTTP_REQUEST_METHOD_VALUE_PATCH = `PATCH`),
      (e.HTTP_REQUEST_METHOD_VALUE_POST = `POST`),
      (e.HTTP_REQUEST_METHOD_VALUE_PUT = `PUT`),
      (e.HTTP_REQUEST_METHOD_VALUE_TRACE = `TRACE`),
      (e.ATTR_HTTP_REQUEST_METHOD_ORIGINAL = `http.request.method_original`),
      (e.ATTR_HTTP_REQUEST_RESEND_COUNT = `http.request.resend_count`),
      (e.ATTR_HTTP_RESPONSE_HEADER = (e) => `http.response.header.${e}`),
      (e.ATTR_HTTP_RESPONSE_STATUS_CODE = `http.response.status_code`),
      (e.ATTR_HTTP_ROUTE = `http.route`),
      (e.ATTR_JVM_GC_ACTION = `jvm.gc.action`),
      (e.ATTR_JVM_GC_NAME = `jvm.gc.name`),
      (e.ATTR_JVM_MEMORY_POOL_NAME = `jvm.memory.pool.name`),
      (e.ATTR_JVM_MEMORY_TYPE = `jvm.memory.type`),
      (e.JVM_MEMORY_TYPE_VALUE_HEAP = `heap`),
      (e.JVM_MEMORY_TYPE_VALUE_NON_HEAP = `non_heap`),
      (e.ATTR_JVM_THREAD_DAEMON = `jvm.thread.daemon`),
      (e.ATTR_JVM_THREAD_STATE = `jvm.thread.state`),
      (e.JVM_THREAD_STATE_VALUE_BLOCKED = `blocked`),
      (e.JVM_THREAD_STATE_VALUE_NEW = `new`),
      (e.JVM_THREAD_STATE_VALUE_RUNNABLE = `runnable`),
      (e.JVM_THREAD_STATE_VALUE_TERMINATED = `terminated`),
      (e.JVM_THREAD_STATE_VALUE_TIMED_WAITING = `timed_waiting`),
      (e.JVM_THREAD_STATE_VALUE_WAITING = `waiting`),
      (e.ATTR_NETWORK_LOCAL_ADDRESS = `network.local.address`),
      (e.ATTR_NETWORK_LOCAL_PORT = `network.local.port`),
      (e.ATTR_NETWORK_PEER_ADDRESS = `network.peer.address`),
      (e.ATTR_NETWORK_PEER_PORT = `network.peer.port`),
      (e.ATTR_NETWORK_PROTOCOL_NAME = `network.protocol.name`),
      (e.ATTR_NETWORK_PROTOCOL_VERSION = `network.protocol.version`),
      (e.ATTR_NETWORK_TRANSPORT = `network.transport`),
      (e.NETWORK_TRANSPORT_VALUE_PIPE = `pipe`),
      (e.NETWORK_TRANSPORT_VALUE_QUIC = `quic`),
      (e.NETWORK_TRANSPORT_VALUE_TCP = `tcp`),
      (e.NETWORK_TRANSPORT_VALUE_UDP = `udp`),
      (e.NETWORK_TRANSPORT_VALUE_UNIX = `unix`),
      (e.ATTR_NETWORK_TYPE = `network.type`),
      (e.NETWORK_TYPE_VALUE_IPV4 = `ipv4`),
      (e.NETWORK_TYPE_VALUE_IPV6 = `ipv6`),
      (e.ATTR_OTEL_SCOPE_NAME = `otel.scope.name`),
      (e.ATTR_OTEL_SCOPE_VERSION = `otel.scope.version`),
      (e.ATTR_OTEL_STATUS_CODE = `otel.status_code`),
      (e.OTEL_STATUS_CODE_VALUE_ERROR = `ERROR`),
      (e.OTEL_STATUS_CODE_VALUE_OK = `OK`),
      (e.ATTR_OTEL_STATUS_DESCRIPTION = `otel.status_description`),
      (e.ATTR_SERVER_ADDRESS = `server.address`),
      (e.ATTR_SERVER_PORT = `server.port`),
      (e.ATTR_SERVICE_NAME = `service.name`),
      (e.ATTR_SERVICE_VERSION = `service.version`),
      (e.ATTR_SIGNALR_CONNECTION_STATUS = `signalr.connection.status`),
      (e.SIGNALR_CONNECTION_STATUS_VALUE_APP_SHUTDOWN = `app_shutdown`),
      (e.SIGNALR_CONNECTION_STATUS_VALUE_NORMAL_CLOSURE = `normal_closure`),
      (e.SIGNALR_CONNECTION_STATUS_VALUE_TIMEOUT = `timeout`),
      (e.ATTR_SIGNALR_TRANSPORT = `signalr.transport`),
      (e.SIGNALR_TRANSPORT_VALUE_LONG_POLLING = `long_polling`),
      (e.SIGNALR_TRANSPORT_VALUE_SERVER_SENT_EVENTS = `server_sent_events`),
      (e.SIGNALR_TRANSPORT_VALUE_WEB_SOCKETS = `web_sockets`),
      (e.ATTR_TELEMETRY_SDK_LANGUAGE = `telemetry.sdk.language`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_CPP = `cpp`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_DOTNET = `dotnet`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_ERLANG = `erlang`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_GO = `go`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_JAVA = `java`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = `nodejs`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_PHP = `php`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_PYTHON = `python`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_RUBY = `ruby`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_RUST = `rust`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_SWIFT = `swift`),
      (e.TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = `webjs`),
      (e.ATTR_TELEMETRY_SDK_NAME = `telemetry.sdk.name`),
      (e.ATTR_TELEMETRY_SDK_VERSION = `telemetry.sdk.version`),
      (e.ATTR_URL_FRAGMENT = `url.fragment`),
      (e.ATTR_URL_FULL = `url.full`),
      (e.ATTR_URL_PATH = `url.path`),
      (e.ATTR_URL_QUERY = `url.query`),
      (e.ATTR_URL_SCHEME = `url.scheme`),
      (e.ATTR_USER_AGENT_ORIGINAL = `user_agent.original`));
  }),
  Hr = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS =
        e.METRIC_KESTREL_UPGRADED_CONNECTIONS =
        e.METRIC_KESTREL_TLS_HANDSHAKE_DURATION =
        e.METRIC_KESTREL_REJECTED_CONNECTIONS =
        e.METRIC_KESTREL_QUEUED_REQUESTS =
        e.METRIC_KESTREL_QUEUED_CONNECTIONS =
        e.METRIC_KESTREL_CONNECTION_DURATION =
        e.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES =
        e.METRIC_KESTREL_ACTIVE_CONNECTIONS =
        e.METRIC_JVM_THREAD_COUNT =
        e.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC =
        e.METRIC_JVM_MEMORY_USED =
        e.METRIC_JVM_MEMORY_LIMIT =
        e.METRIC_JVM_MEMORY_COMMITTED =
        e.METRIC_JVM_GC_DURATION =
        e.METRIC_JVM_CPU_TIME =
        e.METRIC_JVM_CPU_RECENT_UTILIZATION =
        e.METRIC_JVM_CPU_COUNT =
        e.METRIC_JVM_CLASS_UNLOADED =
        e.METRIC_JVM_CLASS_LOADED =
        e.METRIC_JVM_CLASS_COUNT =
        e.METRIC_HTTP_SERVER_REQUEST_DURATION =
        e.METRIC_HTTP_CLIENT_REQUEST_DURATION =
        e.METRIC_DOTNET_TIMER_COUNT =
        e.METRIC_DOTNET_THREAD_POOL_WORK_ITEM_COUNT =
        e.METRIC_DOTNET_THREAD_POOL_THREAD_COUNT =
        e.METRIC_DOTNET_THREAD_POOL_QUEUE_LENGTH =
        e.METRIC_DOTNET_PROCESS_MEMORY_WORKING_SET =
        e.METRIC_DOTNET_PROCESS_CPU_TIME =
        e.METRIC_DOTNET_PROCESS_CPU_COUNT =
        e.METRIC_DOTNET_MONITOR_LOCK_CONTENTIONS =
        e.METRIC_DOTNET_JIT_COMPILED_METHODS =
        e.METRIC_DOTNET_JIT_COMPILED_IL_SIZE =
        e.METRIC_DOTNET_JIT_COMPILATION_TIME =
        e.METRIC_DOTNET_GC_PAUSE_TIME =
        e.METRIC_DOTNET_GC_LAST_COLLECTION_MEMORY_COMMITTED_SIZE =
        e.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_SIZE =
        e.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_FRAGMENTATION_SIZE =
        e.METRIC_DOTNET_GC_HEAP_TOTAL_ALLOCATED =
        e.METRIC_DOTNET_GC_COLLECTIONS =
        e.METRIC_DOTNET_EXCEPTIONS =
        e.METRIC_DOTNET_ASSEMBLY_COUNT =
        e.METRIC_DB_CLIENT_OPERATION_DURATION =
        e.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS =
        e.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS =
        e.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION =
        e.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE =
        e.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS =
        e.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES =
        e.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS =
          void 0),
      (e.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = void 0),
      (e.METRIC_ASPNETCORE_DIAGNOSTICS_EXCEPTIONS = `aspnetcore.diagnostics.exceptions`),
      (e.METRIC_ASPNETCORE_RATE_LIMITING_ACTIVE_REQUEST_LEASES = `aspnetcore.rate_limiting.active_request_leases`),
      (e.METRIC_ASPNETCORE_RATE_LIMITING_QUEUED_REQUESTS = `aspnetcore.rate_limiting.queued_requests`),
      (e.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_TIME_IN_QUEUE = `aspnetcore.rate_limiting.request.time_in_queue`),
      (e.METRIC_ASPNETCORE_RATE_LIMITING_REQUEST_LEASE_DURATION = `aspnetcore.rate_limiting.request_lease.duration`),
      (e.METRIC_ASPNETCORE_RATE_LIMITING_REQUESTS = `aspnetcore.rate_limiting.requests`),
      (e.METRIC_ASPNETCORE_ROUTING_MATCH_ATTEMPTS = `aspnetcore.routing.match_attempts`),
      (e.METRIC_DB_CLIENT_OPERATION_DURATION = `db.client.operation.duration`),
      (e.METRIC_DOTNET_ASSEMBLY_COUNT = `dotnet.assembly.count`),
      (e.METRIC_DOTNET_EXCEPTIONS = `dotnet.exceptions`),
      (e.METRIC_DOTNET_GC_COLLECTIONS = `dotnet.gc.collections`),
      (e.METRIC_DOTNET_GC_HEAP_TOTAL_ALLOCATED = `dotnet.gc.heap.total_allocated`),
      (e.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_FRAGMENTATION_SIZE = `dotnet.gc.last_collection.heap.fragmentation.size`),
      (e.METRIC_DOTNET_GC_LAST_COLLECTION_HEAP_SIZE = `dotnet.gc.last_collection.heap.size`),
      (e.METRIC_DOTNET_GC_LAST_COLLECTION_MEMORY_COMMITTED_SIZE = `dotnet.gc.last_collection.memory.committed_size`),
      (e.METRIC_DOTNET_GC_PAUSE_TIME = `dotnet.gc.pause.time`),
      (e.METRIC_DOTNET_JIT_COMPILATION_TIME = `dotnet.jit.compilation.time`),
      (e.METRIC_DOTNET_JIT_COMPILED_IL_SIZE = `dotnet.jit.compiled_il.size`),
      (e.METRIC_DOTNET_JIT_COMPILED_METHODS = `dotnet.jit.compiled_methods`),
      (e.METRIC_DOTNET_MONITOR_LOCK_CONTENTIONS = `dotnet.monitor.lock_contentions`),
      (e.METRIC_DOTNET_PROCESS_CPU_COUNT = `dotnet.process.cpu.count`),
      (e.METRIC_DOTNET_PROCESS_CPU_TIME = `dotnet.process.cpu.time`),
      (e.METRIC_DOTNET_PROCESS_MEMORY_WORKING_SET = `dotnet.process.memory.working_set`),
      (e.METRIC_DOTNET_THREAD_POOL_QUEUE_LENGTH = `dotnet.thread_pool.queue.length`),
      (e.METRIC_DOTNET_THREAD_POOL_THREAD_COUNT = `dotnet.thread_pool.thread.count`),
      (e.METRIC_DOTNET_THREAD_POOL_WORK_ITEM_COUNT = `dotnet.thread_pool.work_item.count`),
      (e.METRIC_DOTNET_TIMER_COUNT = `dotnet.timer.count`),
      (e.METRIC_HTTP_CLIENT_REQUEST_DURATION = `http.client.request.duration`),
      (e.METRIC_HTTP_SERVER_REQUEST_DURATION = `http.server.request.duration`),
      (e.METRIC_JVM_CLASS_COUNT = `jvm.class.count`),
      (e.METRIC_JVM_CLASS_LOADED = `jvm.class.loaded`),
      (e.METRIC_JVM_CLASS_UNLOADED = `jvm.class.unloaded`),
      (e.METRIC_JVM_CPU_COUNT = `jvm.cpu.count`),
      (e.METRIC_JVM_CPU_RECENT_UTILIZATION = `jvm.cpu.recent_utilization`),
      (e.METRIC_JVM_CPU_TIME = `jvm.cpu.time`),
      (e.METRIC_JVM_GC_DURATION = `jvm.gc.duration`),
      (e.METRIC_JVM_MEMORY_COMMITTED = `jvm.memory.committed`),
      (e.METRIC_JVM_MEMORY_LIMIT = `jvm.memory.limit`),
      (e.METRIC_JVM_MEMORY_USED = `jvm.memory.used`),
      (e.METRIC_JVM_MEMORY_USED_AFTER_LAST_GC = `jvm.memory.used_after_last_gc`),
      (e.METRIC_JVM_THREAD_COUNT = `jvm.thread.count`),
      (e.METRIC_KESTREL_ACTIVE_CONNECTIONS = `kestrel.active_connections`),
      (e.METRIC_KESTREL_ACTIVE_TLS_HANDSHAKES = `kestrel.active_tls_handshakes`),
      (e.METRIC_KESTREL_CONNECTION_DURATION = `kestrel.connection.duration`),
      (e.METRIC_KESTREL_QUEUED_CONNECTIONS = `kestrel.queued_connections`),
      (e.METRIC_KESTREL_QUEUED_REQUESTS = `kestrel.queued_requests`),
      (e.METRIC_KESTREL_REJECTED_CONNECTIONS = `kestrel.rejected_connections`),
      (e.METRIC_KESTREL_TLS_HANDSHAKE_DURATION = `kestrel.tls_handshake.duration`),
      (e.METRIC_KESTREL_UPGRADED_CONNECTIONS = `kestrel.upgraded_connections`),
      (e.METRIC_SIGNALR_SERVER_ACTIVE_CONNECTIONS = `signalr.server.active_connections`),
      (e.METRIC_SIGNALR_SERVER_CONNECTION_DURATION = `signalr.server.connection.duration`));
  }),
  Ur = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.EVENT_EXCEPTION = void 0),
      (e.EVENT_EXCEPTION = `exception`));
  }),
  Wr = e.t((e) => {
    var t =
        (e && e.__createBinding) ||
        (Object.create
          ? function (e, t, n, r) {
              r === void 0 && (r = n);
              var i = Object.getOwnPropertyDescriptor(t, n);
              ((!i || (`get` in i ? !t.__esModule : i.writable || i.configurable)) &&
                (i = {
                  enumerable: !0,
                  get: function () {
                    return t[n];
                  },
                }),
                Object.defineProperty(e, r, i));
            }
          : function (e, t, n, r) {
              (r === void 0 && (r = n), (e[r] = t[n]));
            }),
      n =
        (e && e.__exportStar) ||
        function (e, n) {
          for (var r in e)
            r !== "default" && !Object.prototype.hasOwnProperty.call(n, r) && t(n, e, r);
        };
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      n(Rr(), e),
      n(Br(), e),
      n(Vr(), e),
      n(Hr(), e),
      n(Ur(), e));
  }),
  Gr,
  Kr = e.n(() => {
    Gr = `process.runtime.name`;
  }),
  qr,
  Jr,
  Yr = e.n(() => {
    (Fr(),
      (qr = Wr()),
      Kr(),
      (Jr = {
        [qr.ATTR_TELEMETRY_SDK_NAME]: `opentelemetry`,
        [Gr]: `node`,
        [qr.ATTR_TELEMETRY_SDK_LANGUAGE]: qr.TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS,
        [qr.ATTR_TELEMETRY_SDK_VERSION]: Pr,
      }));
  }),
  Xr = e.n(() => {
    (kr(), jr(), Nr(), Yr());
  }),
  Zr = e.n(() => {
    Xr();
  });
function Qr(e) {
  let t = e / 1e3;
  return [Math.trunc(t), Math.round((e % 1e3) * di)];
}
function $r() {
  let e = Mr.timeOrigin;
  if (typeof e != `number`) {
    let t = Mr;
    e = t.timing && t.timing.fetchStart;
  }
  return e;
}
function ei(e) {
  return li(Qr($r()), Qr(typeof e == `number` ? e : Mr.now()));
}
function ti(e) {
  if (si(e)) return e;
  if (typeof e == `number`) return e < $r() ? ei(e) : Qr(e);
  if (e instanceof Date) return Qr(e.getTime());
  throw TypeError(`Invalid input type`);
}
function ni(e, t) {
  let n = t[0] - e[0],
    r = t[1] - e[1];
  return (r < 0 && (--n, (r += fi)), [n, r]);
}
function ri(e) {
  let t = ui,
    n = `${`0`.repeat(t)}${e[1]}Z`,
    r = n.substring(n.length - t - 1);
  return new Date(e[0] * 1e3).toISOString().replace(`000Z`, r);
}
function ii(e) {
  return e[0] * fi + e[1];
}
function ai(e) {
  return e[0] * 1e3 + e[1] / 1e6;
}
function oi(e) {
  return e[0] * 1e6 + e[1] / 1e3;
}
function si(e) {
  return Array.isArray(e) && e.length === 2 && typeof e[0] == `number` && typeof e[1] == `number`;
}
function ci(e) {
  return si(e) || typeof e == `number` || e instanceof Date;
}
function li(e, t) {
  let n = [e[0] + t[0], e[1] + t[1]];
  return (n[1] >= fi && ((n[1] -= fi), (n[0] += 1)), n);
}
var ui,
  di,
  fi,
  pi = e.n(() => {
    (Zr(), (ui = 9), (di = 10 ** 6), (fi = 10 ** ui));
  });
function mi(e) {
  typeof e != `number` && e.unref();
}
var hi = e.n(() => {}),
  gi,
  _i = e.n(() => {
    (function (e) {
      ((e[(e.SUCCESS = 0)] = `SUCCESS`), (e[(e.FAILED = 1)] = `FAILED`));
    })((gi ||= {}));
  }),
  vi,
  yi,
  bi = e.n(() => {
    ((vi = e.a(N())),
      (yi = class {
        _propagators;
        _fields;
        constructor(e = {}) {
          ((this._propagators = e.propagators ?? []),
            (this._fields = Array.from(
              new Set(
                this._propagators
                  .map((e) => (typeof e.fields == `function` ? e.fields() : []))
                  .reduce((e, t) => e.concat(t), []),
              ),
            )));
        }
        inject(e, t, n) {
          for (let r of this._propagators)
            try {
              r.inject(e, t, n);
            } catch (e) {
              vi.diag.warn(`Failed to inject with ${r.constructor.name}. Err: ${e.message}`);
            }
        }
        extract(e, t, n) {
          return this._propagators.reduce((e, r) => {
            try {
              return r.extract(e, t, n);
            } catch (e) {
              vi.diag.warn(`Failed to extract with ${r.constructor.name}. Err: ${e.message}`);
            }
            return e;
          }, e);
        }
        fields() {
          return this._fields.slice();
        }
      }));
  });
function xi(e) {
  return wi.test(e);
}
function Si(e) {
  return Ti.test(e) && !Ei.test(e);
}
var Ci,
  wi,
  Ti,
  Ei,
  Di = e.n(() => {
    ((Ci = `[_0-9a-z-*/]`),
      (wi = RegExp(`^(?:${`[a-z]${Ci}{0,255}`}|${`[a-z0-9]${Ci}{0,240}@[a-z]${Ci}{0,13}`})$`)),
      (Ti = /^[ -~]{0,255}[!-~]$/),
      (Ei = /,|=/));
  }),
  Oi,
  ki,
  Ai,
  ji,
  Mi,
  Ni = e.n(() => {
    (Di(),
      (Oi = 32),
      (ki = 512),
      (Ai = `,`),
      (ji = `=`),
      (Mi = class e {
        _internalState = new Map();
        constructor(e) {
          e && this._parse(e);
        }
        set(e, t) {
          let n = this._clone();
          return (
            n._internalState.has(e) && n._internalState.delete(e),
            n._internalState.set(e, t),
            n
          );
        }
        unset(e) {
          let t = this._clone();
          return (t._internalState.delete(e), t);
        }
        get(e) {
          return this._internalState.get(e);
        }
        serialize() {
          return this._keys()
            .reduce((e, t) => (e.push(t + ji + this.get(t)), e), [])
            .join(Ai);
        }
        _parse(e) {
          e.length > ki ||
            ((this._internalState = e
              .split(Ai)
              .reverse()
              .reduce((e, t) => {
                let n = t.trim(),
                  r = n.indexOf(ji);
                if (r !== -1) {
                  let i = n.slice(0, r),
                    a = n.slice(r + 1, t.length);
                  xi(i) && Si(a) && e.set(i, a);
                }
                return e;
              }, new Map())),
            this._internalState.size > Oi &&
              (this._internalState = new Map(
                Array.from(this._internalState.entries()).reverse().slice(0, Oi),
              )));
        }
        _keys() {
          return Array.from(this._internalState.keys()).reverse();
        }
        _clone() {
          let t = new e();
          return ((t._internalState = new Map(this._internalState)), t);
        }
      }));
  });
function Pi(e) {
  let t = zi.exec(e);
  return !t || (t[1] === `00` && t[5])
    ? null
    : { traceId: t[2], spanId: t[3], traceFlags: parseInt(t[4], 16) };
}
var Fi,
  Ii,
  Li,
  Ri,
  zi,
  Bi,
  Vi = e.n(() => {
    ((Fi = e.a(N())),
      Jn(),
      Ni(),
      (Ii = `traceparent`),
      (Li = `tracestate`),
      (Ri = `00`),
      (zi = RegExp(
        `^\\s?((?!ff)[\\da-f]{2})-((?![0]{32})[\\da-f]{32})-((?![0]{16})[\\da-f]{16})-([\\da-f]{2})(-.*)?\\s?$`,
      )),
      (Bi = class {
        inject(e, t, n) {
          let r = Fi.trace.getSpanContext(e);
          if (!r || Gn(e) || !(0, Fi.isSpanContextValid)(r)) return;
          let i = `${Ri}-${r.traceId}-${r.spanId}-0${Number(r.traceFlags || Fi.TraceFlags.NONE).toString(16)}`;
          (n.set(t, Ii, i), r.traceState && n.set(t, Li, r.traceState.serialize()));
        }
        extract(e, t, n) {
          let r = n.get(t, Ii);
          if (!r) return e;
          let i = Array.isArray(r) ? r[0] : r;
          if (typeof i != `string`) return e;
          let a = Pi(i);
          if (!a) return e;
          a.isRemote = !0;
          let o = n.get(t, Li);
          if (o) {
            let e = Array.isArray(o) ? o.join(`,`) : o;
            a.traceState = new Mi(typeof e == `string` ? e : void 0);
          }
          return Fi.trace.setSpanContext(e, a);
        }
        fields() {
          return [Ii, Li];
        }
      }));
  });
function Hi(e, t) {
  return e.setValue(Ki, t);
}
function Ui(e) {
  return e.deleteValue(Ki);
}
function Wi(e) {
  return e.getValue(Ki);
}
var Gi,
  Ki,
  qi,
  Ji = e.n(() => {
    ((Gi = e.a(N())),
      (Ki = (0, Gi.createContextKey)(`OpenTelemetry SDK Context Key RPC_METADATA`)),
      (function (e) {
        e.HTTP = `http`;
      })((qi ||= {})));
  });
function Yi(e) {
  if (!Xi(e) || Zi(e) !== ea) return !1;
  let t = aa(e);
  if (t === null) return !0;
  let n = sa.call(t, `constructor`) && t.constructor;
  return typeof n == `function` && n instanceof n && ra.call(n) === ia;
}
function Xi(e) {
  return typeof e == `object` && !!e;
}
function Zi(e) {
  return e == null ? (e === void 0 ? na : ta) : ca && ca in Object(e) ? Qi(e) : $i(e);
}
function Qi(e) {
  let t = sa.call(e, ca),
    n = e[ca],
    r = !1;
  try {
    ((e[ca] = void 0), (r = !0));
  } catch {}
  let i = la.call(e);
  return (r && (t ? (e[ca] = n) : delete e[ca]), i);
}
function $i(e) {
  return la.call(e);
}
var ea,
  ta,
  na,
  ra,
  ia,
  aa,
  oa,
  sa,
  ca,
  la,
  ua = e.n(() => {
    ((ea = `[object Object]`),
      (ta = `[object Null]`),
      (na = `[object Undefined]`),
      (ra = Function.prototype.toString),
      (ia = ra.call(Object)),
      (aa = Object.getPrototypeOf),
      (oa = Object.prototype),
      (sa = oa.hasOwnProperty),
      (ca = Symbol ? Symbol.toStringTag : void 0),
      (la = oa.toString));
  });
function da(...e) {
  let t = e.shift(),
    n = new WeakMap();
  for (; e.length > 0;) t = pa(t, e.shift(), 0, n);
  return t;
}
function fa(e) {
  return ha(e) ? e.slice() : e;
}
function pa(e, t, n = 0, r) {
  let i;
  if (!(n > ba)) {
    if ((n++, va(e) || va(t) || ga(t))) i = fa(t);
    else if (ha(e)) {
      if (((i = e.slice()), ha(t))) for (let e = 0, n = t.length; e < n; e++) i.push(fa(t[e]));
      else if (_a(t)) {
        let e = Object.keys(t);
        for (let n = 0, r = e.length; n < r; n++) {
          let r = e[n];
          i[r] = fa(t[r]);
        }
      }
    } else if (_a(e)) {
      if (_a(t)) {
        if (!ya(e, t)) return t;
        i = Object.assign({}, e);
        let a = Object.keys(t);
        for (let o = 0, s = a.length; o < s; o++) {
          let s = a[o],
            c = t[s];
          if (va(c)) c === void 0 ? delete i[s] : (i[s] = c);
          else {
            let a = i[s],
              o = c;
            if (ma(e, s, r) || ma(t, s, r)) delete i[s];
            else {
              if (_a(a) && _a(o)) {
                let n = r.get(a) || [],
                  i = r.get(o) || [];
                (n.push({ obj: e, key: s }), i.push({ obj: t, key: s }), r.set(a, n), r.set(o, i));
              }
              i[s] = pa(i[s], c, n, r);
            }
          }
        }
      } else i = t;
    }
    return i;
  }
}
function ma(e, t, n) {
  let r = n.get(e[t]) || [];
  for (let n = 0, i = r.length; n < i; n++) {
    let i = r[n];
    if (i.key === t && i.obj === e) return !0;
  }
  return !1;
}
function ha(e) {
  return Array.isArray(e);
}
function ga(e) {
  return typeof e == `function`;
}
function _a(e) {
  return !va(e) && !ha(e) && !ga(e) && typeof e == `object`;
}
function va(e) {
  return (
    typeof e == `string` ||
    typeof e == `number` ||
    typeof e == `boolean` ||
    e === void 0 ||
    e instanceof Date ||
    e instanceof RegExp ||
    e === null
  );
}
function ya(e, t) {
  return !(!Yi(e) || !Yi(t));
}
var ba,
  xa = e.n(() => {
    (ua(), (ba = 20));
  });
function Sa(e, t) {
  let n,
    r = new Promise(function (e, r) {
      n = setTimeout(function () {
        r(new Ca(`Operation timed out.`));
      }, t);
    });
  return Promise.race([e, r]).then(
    (e) => (clearTimeout(n), e),
    (e) => {
      throw (clearTimeout(n), e);
    },
  );
}
var Ca,
  wa = e.n(() => {
    Ca = class e extends Error {
      constructor(t) {
        (super(t), Object.setPrototypeOf(this, e.prototype));
      }
    };
  });
function Ta(e, t) {
  return typeof t == `string` ? e === t : !!e.match(t);
}
function Ea(e, t) {
  if (!t) return !1;
  for (let n of t) if (Ta(e, n)) return !0;
  return !1;
}
var Da = e.n(() => {}),
  Oa,
  ka = e.n(() => {
    Oa = class {
      _promise;
      _resolve;
      _reject;
      constructor() {
        this._promise = new Promise((e, t) => {
          ((this._resolve = e), (this._reject = t));
        });
      }
      get promise() {
        return this._promise;
      }
      resolve(e) {
        this._resolve(e);
      }
      reject(e) {
        this._reject(e);
      }
    };
  }),
  Aa,
  ja = e.n(() => {
    (ka(),
      (Aa = class {
        _callback;
        _that;
        _isCalled = !1;
        _deferred = new Oa();
        constructor(e, t) {
          ((this._callback = e), (this._that = t));
        }
        get isCalled() {
          return this._isCalled;
        }
        get promise() {
          return this._deferred.promise;
        }
        call(...e) {
          if (!this._isCalled) {
            this._isCalled = !0;
            try {
              Promise.resolve(this._callback.call(this._that, ...e)).then(
                (e) => this._deferred.resolve(e),
                (e) => this._deferred.reject(e),
              );
            } catch (e) {
              this._deferred.reject(e);
            }
          }
          return this._deferred.promise;
        }
      }));
  });
function Ma(e) {
  return e == null
    ? void 0
    : (Pa[e.toUpperCase()] ??
        (Na.diag.warn(
          `Unknown log level "${e}", expected one of ${Object.keys(Pa)}, using default`,
        ),
        Na.DiagLogLevel.INFO));
}
var Na,
  Pa,
  Fa = e.n(() => {
    ((Na = e.a(N())),
      (Pa = {
        ALL: Na.DiagLogLevel.ALL,
        VERBOSE: Na.DiagLogLevel.VERBOSE,
        DEBUG: Na.DiagLogLevel.DEBUG,
        INFO: Na.DiagLogLevel.INFO,
        WARN: Na.DiagLogLevel.WARN,
        ERROR: Na.DiagLogLevel.ERROR,
        NONE: Na.DiagLogLevel.NONE,
      }));
  });
function Ia(e, t) {
  return new Promise((n) => {
    La.context.with(Un(La.context.active()), () => {
      e.export(t, (e) => {
        n(e);
      });
    });
  });
}
var La,
  Ra = e.n(() => {
    ((La = e.a(N())), Jn());
  }),
  za = e.r({
    AnchoredClock: () => sr,
    BindOnceFuture: () => Aa,
    CompositePropagator: () => yi,
    ExportResultCode: () => gi,
    RPCType: () => qi,
    SDK_INFO: () => Jr,
    TRACE_PARENT_HEADER: () => Ii,
    TRACE_STATE_HEADER: () => Li,
    TimeoutError: () => Ca,
    TraceState: () => Mi,
    W3CBaggagePropagator: () => ar,
    W3CTraceContextPropagator: () => Bi,
    _globalThis: () => Ar,
    addHrTimes: () => li,
    callWithTimeout: () => Sa,
    deleteRPCMetadata: () => Ui,
    diagLogLevelFromString: () => Ma,
    getBooleanFromEnv: () => Er,
    getNumberFromEnv: () => P,
    getRPCMetadata: () => Wi,
    getStringFromEnv: () => Tr,
    getStringListFromEnv: () => Dr,
    getTimeOrigin: () => $r,
    globalErrorHandler: () => Sr,
    hrTime: () => ei,
    hrTimeDuration: () => ni,
    hrTimeToMicroseconds: () => oi,
    hrTimeToMilliseconds: () => ai,
    hrTimeToNanoseconds: () => ii,
    hrTimeToTimeStamp: () => ri,
    internal: () => Ba,
    isAttributeValue: () => dr,
    isTimeInput: () => ci,
    isTimeInputHrTime: () => si,
    isTracingSuppressed: () => Gn,
    isUrlIgnored: () => Ea,
    loggingErrorHandler: () => gr,
    merge: () => da,
    millisToHrTime: () => Qr,
    otperformance: () => Mr,
    parseKeyPairsIntoRecord: () => tr,
    parseTraceParent: () => Pi,
    sanitizeAttributes: () => lr,
    setGlobalErrorHandler: () => xr,
    setRPCMetadata: () => Hi,
    suppressTracing: () => Un,
    timeInputToHrTime: () => ti,
    unrefTimer: () => mi,
    unsuppressTracing: () => Wn,
    urlMatches: () => Ta,
  }),
  Ba,
  F = e.n(() => {
    (or(),
      cr(),
      hr(),
      wr(),
      br(),
      pi(),
      hi(),
      _i(),
      rr(),
      Zr(),
      bi(),
      Vi(),
      Ji(),
      Jn(),
      Ni(),
      xa(),
      wa(),
      Da(),
      ja(),
      Fa(),
      Ra(),
      (Ba = { _export: Ia }));
  }),
  Va,
  Ha,
  Ua = e.n(() => {
    ((Va = class {
      emit(e) {}
    }),
      (Ha = new Va()));
  }),
  Wa,
  Ga,
  Ka = e.n(() => {
    (Ua(),
      (Wa = class {
        getLogger(e, t, n) {
          return new Va();
        }
      }),
      (Ga = new Wa()));
  }),
  qa,
  Ja = e.n(() => {
    (Ua(),
      (qa = class {
        constructor(e, t, n, r) {
          ((this._provider = e), (this.name = t), (this.version = n), (this.options = r));
        }
        emit(e) {
          this._getLogger().emit(e);
        }
        _getLogger() {
          if (this._delegate) return this._delegate;
          let e = this._provider._getDelegateLogger(this.name, this.version, this.options);
          return e ? ((this._delegate = e), this._delegate) : Ha;
        }
      }));
  }),
  Ya,
  Xa = e.n(() => {
    (Ka(),
      Ja(),
      (Ya = class {
        getLogger(e, t, n) {
          return this._getDelegateLogger(e, t, n) ?? new qa(this, e, t, n);
        }
        _getDelegate() {
          return this._delegate ?? Ga;
        }
        _setDelegate(e) {
          this._delegate = e;
        }
        _getDelegateLogger(e, t, n) {
          return this._delegate?.getLogger(e, t, n);
        }
      }));
  }),
  Za,
  Qa = e.n(() => {
    Za = typeof globalThis == `object` ? globalThis : global;
  }),
  $a = e.n(() => {
    Qa();
  }),
  eo = e.n(() => {
    $a();
  });
function to(e, t, n) {
  return (r) => (r === e ? t : n);
}
var no,
  ro,
  io = e.n(() => {
    (eo(), (no = Symbol.for(`io.opentelemetry.js.api.logs`)), (ro = Za));
  }),
  ao,
  oo = e.n(() => {
    (io(),
      Ka(),
      Xa(),
      (ao = class e {
        constructor() {
          this._proxyLoggerProvider = new Ya();
        }
        static getInstance() {
          return ((this._instance ||= new e()), this._instance);
        }
        setGlobalLoggerProvider(e) {
          return ro[no]
            ? this.getLoggerProvider()
            : ((ro[no] = to(1, e, Ga)), this._proxyLoggerProvider._setDelegate(e), e);
        }
        getLoggerProvider() {
          return ro[no]?.call(ro, 1) ?? this._proxyLoggerProvider;
        }
        getLogger(e, t, n) {
          return this.getLoggerProvider().getLogger(e, t, n);
        }
        disable() {
          (delete ro[no], (this._proxyLoggerProvider = new Ya()));
        }
      }));
  }),
  so,
  co = e.n(() => {
    (Ua(), Xa(), oo(), (so = ao.getInstance()));
  });
function lo(e, t, n, r) {
  for (let i = 0, a = e.length; i < a; i++) {
    let a = e[i];
    (t && a.setTracerProvider(t),
      n && a.setMeterProvider(n),
      r && a.setLoggerProvider && a.setLoggerProvider(r),
      a.getConfig().enabled || a.enable());
  }
}
function uo(e) {
  e.forEach((e) => e.disable());
}
var fo = e.n(() => {});
function po(e) {
  let t = e.tracerProvider || mo.trace.getTracerProvider(),
    n = e.meterProvider || mo.metrics.getMeterProvider(),
    r = e.loggerProvider || so.getLoggerProvider(),
    i = e.instrumentations?.flat() ?? [];
  return (
    lo(i, t, n, r),
    () => {
      uo(i);
    }
  );
}
var mo,
  ho = e.n(() => {
    ((mo = e.a(N())), co(), fo());
  });
function go(e, t, n) {
  if (!_o(e)) return (Po.diag.error(`Invalid version: ${e}`), !1);
  if (!t) return !0;
  t = t.replace(/([<>=~^]+)\s+/g, `$1`);
  let r = Co(e);
  if (!r) return !1;
  let i = [],
    a = vo(r, t, i, n);
  return a && !n?.includePrerelease ? xo(r, i) : a;
}
function _o(e) {
  return typeof e == `string` && Fo.test(e);
}
function vo(e, t, n, r) {
  if (t.includes(`||`)) {
    let i = t.trim().split(`||`);
    for (let t of i) if (yo(e, t, n, r)) return !0;
    return !1;
  }
  if (t.includes(` - `)) t = No(t, r);
  else if (t.includes(` `)) {
    let i = t
      .trim()
      .replace(/\s{2,}/g, ` `)
      .split(` `);
    for (let t of i) if (!yo(e, t, n, r)) return !1;
    return !0;
  }
  return yo(e, t, n, r);
}
function yo(e, t, n, r) {
  if (((t = So(t, r)), t.includes(` `))) return vo(e, t, n, r);
  {
    let r = wo(t);
    return (n.push(r), bo(e, r));
  }
}
function bo(e, t) {
  if (t.invalid) return !1;
  if (!t.version || To(t.version)) return !0;
  let n = ko(e.versionSegments || [], t.versionSegments || []);
  if (n === 0) {
    let r = e.prereleaseSegments || [],
      i = t.prereleaseSegments || [];
    n =
      !r.length && !i.length
        ? 0
        : !r.length && i.length
          ? 1
          : r.length && !i.length
            ? -1
            : ko(r, i);
  }
  return Lo[t.op]?.includes(n);
}
function xo(e, t) {
  return !e.prerelease || t.some((t) => t.prerelease && t.version === e.version);
}
function So(e, t) {
  return ((e = e.trim()), (e = jo(e, t)), (e = Ao(e)), (e = Mo(e, t)), (e = e.trim()), e);
}
function I(e) {
  return !e || e.toLowerCase() === `x` || e === `*`;
}
function Co(e) {
  let t = e.match(Fo);
  if (!t) {
    Po.diag.error(`Invalid version: ${e}`);
    return;
  }
  let n = t.groups.version,
    r = t.groups.prerelease,
    i = t.groups.build,
    a = n.split(`.`),
    o = r?.split(`.`);
  return {
    op: void 0,
    version: n,
    versionSegments: a,
    versionSegmentCount: a.length,
    prerelease: r,
    prereleaseSegments: o,
    prereleaseSegmentCount: o ? o.length : 0,
    build: i,
  };
}
function wo(e) {
  if (!e) return {};
  let t = e.match(Io);
  if (!t) return (Po.diag.error(`Invalid range: ${e}`), { invalid: !0 });
  let n = t.groups.op,
    r = t.groups.version,
    i = t.groups.prerelease,
    a = t.groups.build,
    o = r.split(`.`),
    s = i?.split(`.`);
  return (
    n === `==` && (n = `=`),
    {
      op: n || `=`,
      version: r,
      versionSegments: o,
      versionSegmentCount: o.length,
      prerelease: i,
      prereleaseSegments: s,
      prereleaseSegmentCount: s ? s.length : 0,
      build: a,
    }
  );
}
function To(e) {
  return e === `*` || e === `x` || e === `X`;
}
function Eo(e) {
  let t = parseInt(e, 10);
  return isNaN(t) ? e : t;
}
function Do(e, t) {
  if (typeof e == typeof t) {
    if (typeof e == `number` || typeof e == `string`) return [e, t];
    throw Error(`Version segments can only be strings or numbers`);
  }
  return [String(e), String(t)];
}
function Oo(e, t) {
  if (To(e) || To(t)) return 0;
  let [n, r] = Do(Eo(e), Eo(t));
  return n > r ? 1 : n < r ? -1 : 0;
}
function ko(e, t) {
  for (let n = 0; n < Math.max(e.length, t.length); n++) {
    let r = Oo(e[n] || `0`, t[n] || `0`);
    if (r !== 0) return r;
  }
  return 0;
}
function Ao(e) {
  let t = $o;
  return e.replace(t, (e, t, n, r, i) => {
    let a;
    return (
      (a = I(t)
        ? ``
        : I(n)
          ? `>=${t}.0.0 <${+t + 1}.0.0-0`
          : I(r)
            ? `>=${t}.${n}.0 <${t}.${+n + 1}.0-0`
            : i
              ? `>=${t}.${n}.${r}-${i} <${t}.${+n + 1}.0-0`
              : `>=${t}.${n}.${r} <${t}.${+n + 1}.0-0`),
      a
    );
  });
}
function jo(e, t) {
  let n = ts,
    r = t?.includePrerelease ? `-0` : ``;
  return e.replace(n, (e, t, n, i, a) => {
    let o;
    return (
      (o = I(t)
        ? ``
        : I(n)
          ? `>=${t}.0.0${r} <${+t + 1}.0.0-0`
          : I(i)
            ? t === `0`
              ? `>=${t}.${n}.0${r} <${t}.${+n + 1}.0-0`
              : `>=${t}.${n}.0${r} <${+t + 1}.0.0-0`
            : a
              ? t === `0`
                ? n === `0`
                  ? `>=${t}.${n}.${i}-${a} <${t}.${n}.${+i + 1}-0`
                  : `>=${t}.${n}.${i}-${a} <${t}.${+n + 1}.0-0`
                : `>=${t}.${n}.${i}-${a} <${+t + 1}.0.0-0`
              : t === `0`
                ? n === `0`
                  ? `>=${t}.${n}.${i}${r} <${t}.${n}.${+i + 1}-0`
                  : `>=${t}.${n}.${i}${r} <${t}.${+n + 1}.0-0`
                : `>=${t}.${n}.${i} <${+t + 1}.0.0-0`),
      o
    );
  });
}
function Mo(e, t) {
  let n = Yo;
  return e.replace(n, (e, n, r, i, a, o) => {
    let s = I(r),
      c = s || I(i),
      l = c || I(a),
      u = l;
    return (
      n === `=` && u && (n = ``),
      (o = t?.includePrerelease ? `-0` : ``),
      s
        ? (e = n === `>` || n === `<` ? `<0.0.0-0` : `*`)
        : n && u
          ? (c && (i = 0),
            (a = 0),
            n === `>`
              ? ((n = `>=`), c ? ((r = +r + 1), (i = 0), (a = 0)) : ((i = +i + 1), (a = 0)))
              : n === `<=` && ((n = `<`), c ? (r = +r + 1) : (i = +i + 1)),
            n === `<` && (o = `-0`),
            (e = `${n + r}.${i}.${a}${o}`))
          : c
            ? (e = `>=${r}.0.0${o} <${+r + 1}.0.0-0`)
            : l && (e = `>=${r}.${i}.0${o} <${r}.${+i + 1}.0-0`),
      e
    );
  });
}
function No(e, t) {
  let n = Zo;
  return e.replace(
    n,
    (e, n, r, i, a, o, s, c, l, u, d, f) => (
      (n = I(r)
        ? ``
        : I(i)
          ? `>=${r}.0.0${t?.includePrerelease ? `-0` : ``}`
          : I(a)
            ? `>=${r}.${i}.0${t?.includePrerelease ? `-0` : ``}`
            : o
              ? `>=${n}`
              : `>=${n}${t?.includePrerelease ? `-0` : ``}`),
      (c = I(l)
        ? ``
        : I(u)
          ? `<${+l + 1}.0.0-0`
          : I(d)
            ? `<${l}.${+u + 1}.0-0`
            : f
              ? `<=${l}.${u}.${d}-${f}`
              : t?.includePrerelease
                ? `<${l}.${u}.${+d + 1}-0`
                : `<=${c}`),
      `${n} ${c}`.trim()
    ),
  );
}
var Po,
  Fo,
  Io,
  Lo,
  Ro,
  zo,
  Bo,
  Vo,
  Ho,
  Uo,
  Wo,
  Go,
  Ko,
  qo,
  Jo,
  Yo,
  Xo,
  Zo,
  Qo,
  $o,
  es,
  ts,
  ns = e.n(() => {
    ((Po = e.a(N())),
      (Fo =
        /^(?:v)?(?<version>(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*))(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<build>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/),
      (Io =
        /^(?<op><|>|=|==|<=|>=|~|\^|~>)?\s*(?:v)?(?<version>(?<major>x|X|\*|0|[1-9]\d*)(?:\.(?<minor>x|X|\*|0|[1-9]\d*))?(?:\.(?<patch>x|X|\*|0|[1-9]\d*))?)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<build>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/),
      (Lo = { ">": [1], ">=": [0, 1], "=": [0], "<=": [-1, 0], "<": [-1], "!=": [-1, 1] }),
      (Ro = `[a-zA-Z0-9-]`),
      (zo = `0|[1-9]\\d*`),
      (Bo = `\\d*[a-zA-Z-]${Ro}*`),
      (Vo = `((?:<|>)?=?)`),
      (Ho = `(?:${zo}|${Bo})`),
      (Uo = `(?:-(${Ho}(?:\\.${Ho})*))`),
      (Wo = `${Ro}+`),
      (Go = `(?:\\+(${Wo}(?:\\.${Wo})*))`),
      (Ko = `${zo}|x|X|\\*`),
      (qo = `[v=\\s]*(${Ko})(?:\\.(${Ko})(?:\\.(${Ko})(?:${Uo})?${Go}?)?)?`),
      (Jo = `^${Vo}\\s*${qo}$`),
      (Yo = new RegExp(Jo)),
      (Xo = `^\\s*(${qo})\\s+-\\s+(${qo})\\s*$`),
      (Zo = new RegExp(Xo)),
      (Qo = `^(?:~>?)${qo}$`),
      ($o = new RegExp(Qo)),
      (es = `^(?:\\^)${qo}$`),
      (ts = new RegExp(es)));
  });
function rs(e, t, n) {
  let r = !!e[t] && Object.prototype.propertyIsEnumerable.call(e, t);
  Object.defineProperty(e, t, { configurable: !0, enumerable: r, writable: !0, value: n });
}
var L,
  is,
  as,
  os,
  ss,
  cs = e.n(() => {
    ((L = console.error.bind(console)),
      (is = (e, t, n) => {
        if (!e || !e[t]) {
          L(`no original function ` + String(t) + ` to wrap`);
          return;
        }
        if (!n) {
          (L(`no wrapper function`), L(Error().stack));
          return;
        }
        let r = e[t];
        if (typeof r != `function` || typeof n != `function`) {
          L(`original object and wrapper must be functions`);
          return;
        }
        let i = n(r, t);
        return (
          rs(i, `__original`, r),
          rs(i, `__unwrap`, () => {
            e[t] === i && rs(e, t, r);
          }),
          rs(i, `__wrapped`, !0),
          rs(e, t, i),
          i
        );
      }),
      (as = (e, t, n) => {
        if (e) Array.isArray(e) || (e = [e]);
        else {
          (L(`must provide one or more modules to patch`), L(Error().stack));
          return;
        }
        if (!(t && Array.isArray(t))) {
          L(`must provide one or more functions to wrap on modules`);
          return;
        }
        e.forEach((e) => {
          t.forEach((t) => {
            is(e, t, n);
          });
        });
      }),
      (os = (e, t) => {
        if (!e || !e[t]) {
          (L(`no function to unwrap.`), L(Error().stack));
          return;
        }
        let n = e[t];
        if (!n.__unwrap)
          L(`no original to unwrap to -- has ` + String(t) + ` already been unwrapped?`);
        else {
          n.__unwrap();
          return;
        }
      }),
      (ss = (e, t) => {
        if (e) Array.isArray(e) || (e = [e]);
        else {
          (L(`must provide one or more modules to patch`), L(Error().stack));
          return;
        }
        if (!(t && Array.isArray(t))) {
          L(`must provide one or more functions to unwrap on modules`);
          return;
        }
        e.forEach((e) => {
          t.forEach((t) => {
            os(e, t);
          });
        });
      }));
  }),
  ls,
  us,
  ds = e.n(() => {
    ((ls = e.a(N())),
      co(),
      cs(),
      (us = class {
        instrumentationName;
        instrumentationVersion;
        _config = {};
        _tracer;
        _meter;
        _logger;
        _diag;
        constructor(e, t, n) {
          ((this.instrumentationName = e),
            (this.instrumentationVersion = t),
            this.setConfig(n),
            (this._diag = ls.diag.createComponentLogger({ namespace: e })),
            (this._tracer = ls.trace.getTracer(e, t)),
            (this._meter = ls.metrics.getMeter(e, t)),
            (this._logger = so.getLogger(e, t)),
            this._updateMetricInstruments());
        }
        _wrap = is;
        _unwrap = os;
        _massWrap = as;
        _massUnwrap = ss;
        get meter() {
          return this._meter;
        }
        setMeterProvider(e) {
          ((this._meter = e.getMeter(this.instrumentationName, this.instrumentationVersion)),
            this._updateMetricInstruments());
        }
        get logger() {
          return this._logger;
        }
        setLoggerProvider(e) {
          this._logger = e.getLogger(this.instrumentationName, this.instrumentationVersion);
        }
        getModuleDefinitions() {
          let e = this.init() ?? [];
          return Array.isArray(e) ? e : [e];
        }
        _updateMetricInstruments() {}
        getConfig() {
          return this._config;
        }
        setConfig(e) {
          this._config = { enabled: !0, ...e };
        }
        setTracerProvider(e) {
          this._tracer = e.getTracer(this.instrumentationName, this.instrumentationVersion);
        }
        get tracer() {
          return this._tracer;
        }
        _runSpanCustomizationHook(e, t, n, r) {
          if (e)
            try {
              e(n, r);
            } catch (e) {
              this._diag.error(
                `Error running span customization hook due to exception in handler`,
                { triggerName: t },
                e,
              );
            }
        }
      }));
  }),
  fs = e.t((e, t) => {
    var n = require("path").sep;
    t.exports = function (e) {
      var t = e.split(n),
        r = t.lastIndexOf(`node_modules`);
      if (r !== -1 && t[r + 1]) {
        for (
          var i = t[r + 1][0] === `@`,
            a = i ? t[r + 1] + `/` + t[r + 2] : t[r + 1],
            o = i ? 3 : 2,
            s = ``,
            c = r + o - 1,
            l = 0;
          l <= c;
          l++
        )
          s += l === c ? t[l] : t[l] + n;
        for (var u = ``, d = t.length - 1, f = r + o; f <= d; f++) u += f === d ? t[f] : t[f] + n;
        return { name: a, basedir: s, path: u };
      }
    };
  }),
  ps = e.t((e, t) => {
    var n = require("path"),
      r = require("module"),
      a = i.t()(`require-in-the-middle`),
      o = fs();
    ((t.exports = d), (t.exports.Hook = d));
    var s, c;
    if (r.isBuiltin) c = r.isBuiltin;
    else if (r.builtinModules)
      c = (e) =>
        e.startsWith(`node:`) ? !0 : (s === void 0 && (s = new Set(r.builtinModules)), s.has(e));
    else throw Error(`'require-in-the-middle' requires Node.js >=v9.3.0 or >=v8.10.0`);
    var l = /([/\\]index)?(\.js)?$/,
      u = class {
        constructor() {
          ((this._localCache = new Map()), (this._kRitmExports = Symbol(`RitmExports`)));
        }
        has(e, t) {
          if (this._localCache.has(e)) return !0;
          if (t) return !1;
          {
            let t = require.cache[e];
            return !!(t && this._kRitmExports in t);
          }
        }
        get(e, t) {
          let n = this._localCache.get(e);
          if (n !== void 0) return n;
          if (!t) {
            let t = require.cache[e];
            return t && t[this._kRitmExports];
          }
        }
        set(e, t, n) {
          n
            ? this._localCache.set(e, t)
            : e in require.cache
              ? (require.cache[e][this._kRitmExports] = t)
              : (a(`non-core module is unexpectedly not in require.cache: "%s"`, e),
                this._localCache.set(e, t));
        }
      };
    function d(e, t, i) {
      if (!(this instanceof d)) return new d(e, t, i);
      if (
        (typeof e == `function`
          ? ((i = e), (e = null), (t = null))
          : typeof t == `function` && ((i = t), (t = null)),
        typeof r._resolveFilename != `function`)
      ) {
        (console.error(
          `Error: Expected Module._resolveFilename to be a function (was: %s) - aborting!`,
          typeof r._resolveFilename,
        ),
          console.error(
            `Please report this error as an issue related to Node.js %s at https://github.com/nodejs/require-in-the-middle/issues`,
            process.version,
          ));
        return;
      }
      ((this._cache = new u()), (this._unhooked = !1), (this._origRequire = r.prototype.require));
      let s = this,
        l = new Set(),
        p = t ? t.internals === !0 : !1,
        m = Array.isArray(e);
      (a(`registering require hook`),
        (this._require = r.prototype.require =
          function (e) {
            return s._unhooked === !0
              ? (a(`ignoring require call - module is soft-unhooked`),
                s._origRequire.apply(this, arguments))
              : h.call(this, arguments, !1);
          }),
        typeof process.getBuiltinModule == `function` &&
          ((this._origGetBuiltinModule = process.getBuiltinModule),
          (this._getBuiltinModule = process.getBuiltinModule =
            function (e) {
              return s._unhooked === !0
                ? (a(`ignoring process.getBuiltinModule call - module is soft-unhooked`),
                  s._origGetBuiltinModule.apply(this, arguments))
                : h.call(this, arguments, !0);
            })));
      function h(t, u) {
        let d = t[0],
          h = c(d),
          g;
        if (h) {
          if (((g = d), d.startsWith(`node:`))) {
            let e = d.slice(5);
            c(e) && (g = e);
          }
        } else if (u)
          return (
            a(`call to process.getBuiltinModule with unknown built-in id`),
            s._origGetBuiltinModule.apply(this, t)
          );
        else
          try {
            g = r._resolveFilename(d, this);
          } catch (e) {
            return (
              a(
                `Module._resolveFilename("%s") threw %j, calling original Module.require`,
                d,
                e.message,
              ),
              s._origRequire.apply(this, t)
            );
          }
        let _, v;
        if (
          (a(`processing %s module require('%s'): %s`, h === !0 ? `core` : `non-core`, d, g),
          s._cache.has(g, h) === !0)
        )
          return (a(`returning already patched cached module: %s`, g), s._cache.get(g, h));
        let y = l.has(g);
        y === !1 && l.add(g);
        let b = u ? s._origGetBuiltinModule.apply(this, t) : s._origRequire.apply(this, t);
        if (y === !0)
          return (a(`module is in the process of being patched already - ignoring: %s`, g), b);
        if ((l.delete(g), h === !0)) {
          if (m === !0 && e.includes(g) === !1)
            return (a(`ignoring core module not on whitelist: %s`, g), b);
          _ = g;
        } else if (m === !0 && e.includes(g)) {
          let e = n.parse(g);
          ((_ = e.name), (v = e.dir));
        } else {
          let t = o(g);
          if (t === void 0) return (a(`could not parse filename: %s`, g), b);
          ((_ = t.name), (v = t.basedir));
          let r = f(t);
          a(`resolved filename to module: %s (id: %s, resolved: %s, basedir: %s)`, _, d, r, v);
          let i = !1;
          if (m) {
            if (
              (!d.startsWith(`.`) && e.includes(d) && ((_ = d), (i = !0)),
              !e.includes(_) && !e.includes(r))
            )
              return b;
            e.includes(r) && r !== _ && ((_ = r), (i = !0));
          }
          if (!i) {
            let e;
            try {
              e = require.resolve(_, { paths: [v] });
            } catch {
              return (a(`could not resolve module: %s`, _), s._cache.set(g, b, h), b);
            }
            if (e !== g) {
              if (p === !0)
                ((_ = _ + n.sep + n.relative(v, g)),
                  a(`preparing to process require of internal file: %s`, _));
              else
                return (
                  a(`ignoring require of non-main module file: %s`, e),
                  s._cache.set(g, b, h),
                  b
                );
            }
          }
        }
        (s._cache.set(g, b, h), a(`calling require hook: %s`, _));
        let x = i(b, _, v);
        return (s._cache.set(g, x, h), a(`returning module: %s`, _), x);
      }
    }
    d.prototype.unhook = function () {
      ((this._unhooked = !0),
        this._require === r.prototype.require
          ? ((r.prototype.require = this._origRequire), a(`require unhook successful`))
          : a(`require unhook unsuccessful`),
        process.getBuiltinModule !== void 0 &&
          (this._getBuiltinModule === process.getBuiltinModule
            ? ((process.getBuiltinModule = this._origGetBuiltinModule),
              a(`process.getBuiltinModule unhook successful`))
            : a(`process.getBuiltinModule unhook unsuccessful`)));
    };
    function f(e) {
      let t = n.sep === `/` ? e.path : e.path.split(n.sep).join(`/`);
      return n.posix.join(e.name, t).replace(l, ``);
    }
  }),
  ms,
  hs,
  gs = e.n(() => {
    ((ms = class {
      hooks = [];
      children = new Map();
    }),
      (hs = class {
        _trie = new ms();
        _counter = 0;
        insert(e) {
          let t = this._trie;
          for (let n of e.moduleName.split(`/`)) {
            let e = t.children.get(n);
            (e || ((e = new ms()), t.children.set(n, e)), (t = e));
          }
          t.hooks.push({ hook: e, insertedId: this._counter++ });
        }
        search(e, { maintainInsertionOrder: t, fullOnly: n } = {}) {
          let r = this._trie,
            i = [],
            a = !0;
          for (let t of e.split(`/`)) {
            let e = r.children.get(t);
            if (!e) {
              a = !1;
              break;
            }
            (n || i.push(...e.hooks), (r = e));
          }
          return (
            n && a && i.push(...r.hooks),
            i.length === 0
              ? []
              : i.length === 1
                ? [i[0].hook]
                : (t && i.sort((e, t) => e.insertedId - t.insertedId), i.map(({ hook: e }) => e))
          );
        }
      }));
  });
function _s(e) {
  return c.sep === `/` ? e : e.split(c.sep).join(`/`);
}
var vs,
  ys,
  bs,
  xs = e.n(() => {
    ((vs = ps()),
      gs(),
      (ys = [`afterEach`, `after`, `beforeEach`, `before`, `describe`, `it`].every(
        (e) => typeof global[e] == `function`,
      )),
      (bs = class e {
        _moduleNameTrie = new hs();
        static _instance;
        constructor() {
          this._initialize();
        }
        _initialize() {
          new vs.Hook(null, { internals: !0 }, (e, t, n) => {
            let r = _s(t),
              i = this._moduleNameTrie.search(r, {
                maintainInsertionOrder: !0,
                fullOnly: n === void 0,
              });
            for (let { onRequire: r } of i) e = r(e, t, n);
            return e;
          });
        }
        register(e, t) {
          let n = { moduleName: e, onRequire: t };
          return (this._moduleNameTrie.insert(n), n);
        }
        static getInstance() {
          return ys ? new e() : (this._instance = this._instance ?? new e());
        }
      }));
  }),
  Ss = e.t((e) => {
    var t = [],
      n = new WeakMap(),
      r = new WeakMap(),
      i = new Map(),
      a = [],
      o = {
        set(e, t, r) {
          return n.get(e)[t](r);
        },
        get(e, t) {
          if (t === Symbol.toStringTag) return `Module`;
          let n = r.get(e)[t];
          if (typeof n == `function`) return n();
        },
        defineProperty(e, t, r) {
          if (!(`value` in r))
            throw Error(`Getters/setters are not supported for exports property descriptors.`);
          return n.get(e)[t](r.value);
        },
      };
    function s(e, s, c, l, u) {
      (i.set(e, u), n.set(s, c), r.set(s, l));
      let d = new Proxy(s, o);
      (t.forEach((t) => t(e, d)), a.push([e, d]));
    }
    var c = !1;
    function l() {
      return c;
    }
    function u(e) {
      c = e;
    }
    ((e.register = s),
      (e.importHooks = t),
      (e.specifiers = i),
      (e.toHook = a),
      (e.getExperimentalPatchInternals = l),
      (e.setExperimentalPatchInternals = u));
  }),
  Cs = e.t((e, t) => {
    var n = require("path"),
      r = fs(),
      { fileURLToPath: i } = require("url"),
      { MessageChannel: a } = require("worker_threads"),
      { importHooks: o, specifiers: s, toHook: c, getExperimentalPatchInternals: l } = Ss();
    function u(e) {
      (o.push(e), c.forEach(([t, n]) => e(t, n)));
    }
    function d(e) {
      let t = o.indexOf(e);
      t > -1 && o.splice(t, 1);
    }
    function f(e, t, n, r) {
      let i = e(t, n, r);
      i && i !== t && (t.default = i);
    }
    var p;
    function m() {
      let { port1: e, port2: t } = new a(),
        n = 0,
        r;
      ((p = (t) => {
        (n++, e.postMessage(t));
      }),
        e
          .on(`message`, () => {
            (n--, r && n <= 0 && r());
          })
          .unref());
      function i() {
        let e = setInterval(() => {}, 1e3),
          t = new Promise((e) => {
            r = e;
          }).then(() => {
            clearInterval(e);
          });
        return (n === 0 && r(), t);
      }
      let o = t;
      return {
        registerOptions: { data: { addHookMessagePort: o, include: [] }, transferList: [o] },
        addHookMessagePort: o,
        waitForAllMessagesAcknowledged: i,
      };
    }
    function h(e, t, a) {
      if (!(this instanceof h)) return new h(e, t, a);
      typeof e == `function`
        ? ((a = e), (e = null), (t = null))
        : typeof t == `function` && ((a = t), (t = null));
      let o = t ? t.internals === !0 : !1;
      (p && Array.isArray(e) && p(e),
        (this._iitmHook = (t, c) => {
          let u = t,
            d = t.startsWith(`node:`),
            p;
          if (d) t = t.replace(/^node:/, ``);
          else {
            if (t.startsWith(`file://`))
              try {
                t = i(t);
              } catch {}
            let e = r(t);
            e && ((t = e.name), (p = e.basedir));
          }
          if (e) {
            for (let r of e)
              if (r === t) {
                if (p) {
                  if (o) t = t + n.sep + n.relative(p, i(u));
                  else if (!l() && !p.endsWith(s.get(u))) continue;
                }
                f(a, c, t, p);
              }
          } else f(a, c, t, p);
        }),
        u(this._iitmHook));
    }
    ((h.prototype.unhook = function () {
      d(this._iitmHook);
    }),
      (t.exports = h),
      (t.exports.Hook = h),
      (t.exports.addHook = u),
      (t.exports.removeHook = d),
      (t.exports.createAddHookMessageChannel = m));
  });
function ws(e, t, n) {
  let r, i;
  try {
    i = e();
  } catch (e) {
    r = e;
  } finally {
    if ((t(r, i), r && !n)) throw r;
    return i;
  }
}
async function Ts(e, t, n) {
  let r, i;
  try {
    i = await e();
  } catch (e) {
    r = e;
  } finally {
    if ((await t(r, i), r && !n)) throw r;
    return i;
  }
}
function Es(e) {
  return (
    typeof e == `function` &&
    typeof e.__original == `function` &&
    typeof e.__unwrap == `function` &&
    e.__wrapped === !0
  );
}
var Ds = e.n(() => {});
function Os(e, t, n) {
  return t === void 0 ? e.includes(`*`) : e.some((e) => go(t, e, { includePrerelease: n }));
}
var ks,
  As,
  js,
  Ms,
  Ns = e.n(() => {
    (ns(),
      cs(),
      ds(),
      xs(),
      (ks = Cs()),
      (As = e.a(N())),
      (js = ps()),
      Ds(),
      (Ms = class extends us {
        _modules;
        _hooks = [];
        _requireInTheMiddleSingleton = bs.getInstance();
        _enabled = !1;
        constructor(e, t, n) {
          super(e, t, n);
          let r = this.init();
          (r && !Array.isArray(r) && (r = [r]),
            (this._modules = r || []),
            this._config.enabled && this.enable());
        }
        _wrap = (e, t, n) => {
          if ((Es(e[t]) && this._unwrap(e, t), v.types.isProxy(e))) {
            let r = is(Object.assign({}, e), t, n);
            return (Object.defineProperty(e, t, { value: r }), r);
          }
          return is(e, t, n);
        };
        _unwrap = (e, t) =>
          v.types.isProxy(e) ? Object.defineProperty(e, t, { value: e[t] }) : os(e, t);
        _massWrap = (e, t, n) => {
          if (e) Array.isArray(e) || (e = [e]);
          else {
            As.diag.error(`must provide one or more modules to patch`);
            return;
          }
          if (!(t && Array.isArray(t))) {
            As.diag.error(`must provide one or more functions to wrap on modules`);
            return;
          }
          e.forEach((e) => {
            t.forEach((t) => {
              this._wrap(e, t, n);
            });
          });
        };
        _massUnwrap = (e, t) => {
          if (e) Array.isArray(e) || (e = [e]);
          else {
            As.diag.error(`must provide one or more modules to patch`);
            return;
          }
          if (!(t && Array.isArray(t))) {
            As.diag.error(`must provide one or more functions to wrap on modules`);
            return;
          }
          e.forEach((e) => {
            t.forEach((t) => {
              this._unwrap(e, t);
            });
          });
        };
        _warnOnPreloadedModules() {
          this._modules.forEach((e) => {
            let { name: t } = e;
            try {
              let e = require.resolve(t);
              require.cache[e] &&
                this._diag.warn(
                  `Module ${t} has been loaded before ${this.instrumentationName} so it might not work, please initialize it before requiring ${t}`,
                );
            } catch {}
          });
        }
        _extractPackageVersion(e) {
          try {
            let t = (0, g.readFileSync)(c.join(e, `package.json`), { encoding: `utf8` }),
              n = JSON.parse(t).version;
            return typeof n == `string` ? n : void 0;
          } catch {
            As.diag.warn(`Failed extracting version`, e);
          }
        }
        _onRequire(e, t, n, r) {
          if (!r)
            return typeof e.patch == `function` && ((e.moduleExports = t), this._enabled)
              ? (this._diag.debug(
                  `Applying instrumentation patch for nodejs core module on require hook`,
                  { module: e.name },
                ),
                e.patch(t))
              : t;
          let i = this._extractPackageVersion(r);
          if (((e.moduleVersion = i), e.name === n))
            return Os(e.supportedVersions, i, e.includePrerelease) &&
              typeof e.patch == `function` &&
              ((e.moduleExports = t), this._enabled)
              ? (this._diag.debug(`Applying instrumentation patch for module on require hook`, {
                  module: e.name,
                  version: e.moduleVersion,
                  baseDir: r,
                }),
                e.patch(t, e.moduleVersion))
              : t;
          let a = e.files ?? [],
            o = c.normalize(n);
          return a
            .filter((e) => e.name === o)
            .filter((t) => Os(t.supportedVersions, i, e.includePrerelease))
            .reduce(
              (t, n) => (
                (n.moduleExports = t),
                this._enabled
                  ? (this._diag.debug(
                      `Applying instrumentation patch for nodejs module file on require hook`,
                      { module: e.name, version: e.moduleVersion, fileName: n.name, baseDir: r },
                    ),
                    n.patch(t, e.moduleVersion))
                  : t
              ),
              t,
            );
        }
        enable() {
          if (!this._enabled) {
            if (((this._enabled = !0), this._hooks.length > 0)) {
              for (let e of this._modules) {
                typeof e.patch == `function` &&
                  e.moduleExports &&
                  (this._diag.debug(
                    `Applying instrumentation patch for nodejs module on instrumentation enabled`,
                    { module: e.name, version: e.moduleVersion },
                  ),
                  e.patch(e.moduleExports, e.moduleVersion));
                for (let t of e.files)
                  t.moduleExports &&
                    (this._diag.debug(
                      `Applying instrumentation patch for nodejs module file on instrumentation enabled`,
                      { module: e.name, version: e.moduleVersion, fileName: t.name },
                    ),
                    t.patch(t.moduleExports, e.moduleVersion));
              }
              return;
            }
            this._warnOnPreloadedModules();
            for (let e of this._modules) {
              let t = (t, n, r) => {
                  if (!r && c.isAbsolute(n)) {
                    let e = c.parse(n);
                    ((n = e.name), (r = e.dir));
                  }
                  return this._onRequire(e, t, n, r);
                },
                n = (t, n, r) => this._onRequire(e, t, n, r),
                r = c.isAbsolute(e.name)
                  ? new js.Hook([e.name], { internals: !0 }, n)
                  : this._requireInTheMiddleSingleton.register(e.name, n);
              this._hooks.push(r);
              let i = new ks.Hook([e.name], { internals: !1 }, t);
              this._hooks.push(i);
            }
          }
        }
        disable() {
          if (this._enabled) {
            this._enabled = !1;
            for (let e of this._modules) {
              typeof e.unpatch == `function` &&
                e.moduleExports &&
                (this._diag.debug(
                  `Removing instrumentation patch for nodejs module on instrumentation disabled`,
                  { module: e.name, version: e.moduleVersion },
                ),
                e.unpatch(e.moduleExports, e.moduleVersion));
              for (let t of e.files)
                t.moduleExports &&
                  (this._diag.debug(
                    `Removing instrumentation patch for nodejs module file on instrumentation disabled`,
                    { module: e.name, version: e.moduleVersion, fileName: t.name },
                  ),
                  t.unpatch(t.moduleExports, e.moduleVersion));
            }
          }
        }
        isEnabled() {
          return this._enabled;
        }
      }));
  }),
  Ps = e.n(() => {
    Ns();
  }),
  Fs = e.n(() => {
    Ps();
  }),
  Is,
  Ls = e.n(() => {
    Is = class {
      name;
      supportedVersions;
      patch;
      unpatch;
      files;
      constructor(e, t, n, r, i) {
        ((this.name = e),
          (this.supportedVersions = t),
          (this.patch = n),
          (this.unpatch = r),
          (this.files = i || []));
      }
    };
  }),
  Rs,
  zs = e.n(() => {
    (Fs(),
      (Rs = class {
        supportedVersions;
        patch;
        unpatch;
        name;
        constructor(e, t, n, r) {
          ((this.supportedVersions = t),
            (this.patch = n),
            (this.unpatch = r),
            (this.name = (0, c.normalize)(e)));
        }
      }));
  });
function Bs(e, t) {
  let n = Vs.OLD,
    r = t
      ?.split(`,`)
      .map((e) => e.trim())
      .filter((e) => e !== ``);
  for (let t of r ?? [])
    if (t.toLowerCase() === e + `/dup`) {
      n = Vs.DUPLICATE;
      break;
    } else t.toLowerCase() === e && (n = Vs.STABLE);
  return n;
}
var Vs,
  Hs = e.n(() => {
    (function (e) {
      ((e[(e.STABLE = 1)] = `STABLE`),
        (e[(e.OLD = 2)] = `OLD`),
        (e[(e.DUPLICATE = 3)] = `DUPLICATE`));
    })((Vs ||= {}));
  }),
  Us = e.r({
    InstrumentationBase: () => Ms,
    InstrumentationNodeModuleDefinition: () => Is,
    InstrumentationNodeModuleFile: () => Rs,
    SemconvStability: () => Vs,
    isWrapped: () => Es,
    registerInstrumentations: () => po,
    safeExecuteInTheMiddle: () => ws,
    safeExecuteInTheMiddleAsync: () => Ts,
    semconvStabilityFromStr: () => Bs,
  }),
  Ws = e.n(() => {
    (ho(), Fs(), Ls(), zs(), Ds(), Hs());
  }),
  R = typeof __SENTRY_DEBUG__ > `u` || __SENTRY_DEBUG__,
  z = globalThis,
  Gs = `10.29.0`;
function Ks() {
  return (qs(z), z);
}
function qs(e) {
  let t = (e.__SENTRY__ = e.__SENTRY__ || {});
  return ((t.version = t.version || `10.29.0`), (t[Gs] = t[`10.29.0`] || {}));
}
function Js(e, t, n = z) {
  let r = (n.__SENTRY__ = n.__SENTRY__ || {}),
    i = (r[Gs] = r[`10.29.0`] || {});
  return i[e] || (i[e] = t());
}
var Ys = [`debug`, `info`, `warn`, `error`, `log`, `assert`, `trace`],
  Xs = `Sentry Logger `,
  Zs = {};
function Qs(e) {
  if (!(`console` in z)) return e();
  let t = z.console,
    n = {},
    r = Object.keys(Zs);
  r.forEach((e) => {
    let r = Zs[e];
    ((n[e] = t[e]), (t[e] = r));
  });
  try {
    return e();
  } finally {
    r.forEach((e) => {
      t[e] = n[e];
    });
  }
}
function $s() {
  oc().enabled = !0;
}
function ec() {
  oc().enabled = !1;
}
function tc() {
  return oc().enabled;
}
function nc(...e) {
  ac(`log`, ...e);
}
function rc(...e) {
  ac(`warn`, ...e);
}
function ic(...e) {
  ac(`error`, ...e);
}
function ac(e, ...t) {
  R &&
    tc() &&
    Qs(() => {
      z.console[e](`${Xs}[${e}]:`, ...t);
    });
}
function oc() {
  return R ? Js(`loggerSettings`, () => ({ enabled: !1 })) : { enabled: !1 };
}
var B = { enable: $s, disable: ec, isEnabled: tc, log: nc, warn: rc, error: ic },
  sc = 50,
  cc = /\(error: (.*)\)/,
  lc = /captureMessage|captureException/;
function uc(...e) {
  let t = e.sort((e, t) => e[0] - t[0]).map((e) => e[1]);
  return (e, n = 0, r = 0) => {
    let i = [],
      a = e.split(`
`);
    for (let e = n; e < a.length; e++) {
      let n = a[e];
      n.length > 1024 && (n = n.slice(0, 1024));
      let o = cc.test(n) ? n.replace(cc, `$1`) : n;
      if (!o.match(/\S*Error: /)) {
        for (let e of t) {
          let t = e(o);
          if (t) {
            i.push(t);
            break;
          }
        }
        if (i.length >= sc + r) break;
      }
    }
    return fc(i.slice(r));
  };
}
function dc(e) {
  return Array.isArray(e) ? uc(...e) : e;
}
function fc(e) {
  if (!e.length) return [];
  let t = Array.from(e);
  return (
    /sentryWrapped/.test(pc(t).function || ``) && t.pop(),
    t.reverse(),
    lc.test(pc(t).function || ``) && (t.pop(), lc.test(pc(t).function || ``) && t.pop()),
    t
      .slice(0, sc)
      .map((e) => ({ ...e, filename: e.filename || pc(t).filename, function: e.function || `?` }))
  );
}
function pc(e) {
  return e[e.length - 1] || {};
}
var mc = `<anonymous>`;
function hc(e) {
  try {
    return !e || typeof e != `function` ? mc : e.name || mc;
  } catch {
    return mc;
  }
}
function gc(e) {
  return `__v_isVNode` in e && e.__v_isVNode ? `[VueVNode]` : `[VueViewModel]`;
}
var _c = {},
  vc = {};
function yc(e, t) {
  ((_c[e] = _c[e] || []), _c[e].push(t));
}
function bc(e, t) {
  if (!vc[e]) {
    vc[e] = !0;
    try {
      t();
    } catch (t) {
      R && B.error(`Error while instrumenting ${e}`, t);
    }
  }
}
function xc(e, t) {
  let n = e && _c[e];
  if (n)
    for (let r of n)
      try {
        r(t);
      } catch (t) {
        R &&
          B.error(
            `Error while triggering instrumentation handler.\nType: ${e}\nName: ${hc(r)}\nError:`,
            t,
          );
      }
}
var Sc = null;
function Cc(e) {
  let t = `error`;
  (yc(t, e), bc(t, wc));
}
function wc() {
  ((Sc = z.onerror),
    (z.onerror = function (e, t, n, r, i) {
      return (
        xc(`error`, { column: r, error: i, line: n, msg: e, url: t }),
        Sc ? Sc.apply(this, arguments) : !1
      );
    }),
    (z.onerror.__SENTRY_INSTRUMENTED__ = !0));
}
var Tc = null;
function Ec(e) {
  let t = `unhandledrejection`;
  (yc(t, e), bc(t, Dc));
}
function Dc() {
  ((Tc = z.onunhandledrejection),
    (z.onunhandledrejection = function (e) {
      return (xc(`unhandledrejection`, e), !Tc || Tc.apply(this, arguments));
    }),
    (z.onunhandledrejection.__SENTRY_INSTRUMENTED__ = !0));
}
var Oc = Object.prototype.toString;
function kc(e) {
  switch (Oc.call(e)) {
    case `[object Error]`:
    case `[object Exception]`:
    case `[object DOMException]`:
    case `[object WebAssembly.Exception]`:
      return !0;
    default:
      return Vc(e, Error);
  }
}
function Ac(e, t) {
  return Oc.call(e) === `[object ${t}]`;
}
function jc(e) {
  return Ac(e, `ErrorEvent`);
}
function Mc(e) {
  return Ac(e, `String`);
}
function Nc(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `__sentry_template_string__` in e &&
    `__sentry_template_values__` in e
  );
}
function Pc(e) {
  return e === null || Nc(e) || (typeof e != `object` && typeof e != `function`);
}
function Fc(e) {
  return Ac(e, `Object`);
}
function Ic(e) {
  return typeof Event < `u` && Vc(e, Event);
}
function Lc(e) {
  return typeof Element < `u` && Vc(e, Element);
}
function Rc(e) {
  return Ac(e, `RegExp`);
}
function zc(e) {
  return !!(e?.then && typeof e.then == `function`);
}
function Bc(e) {
  return Fc(e) && `nativeEvent` in e && `preventDefault` in e && `stopPropagation` in e;
}
function Vc(e, t) {
  try {
    return e instanceof t;
  } catch {
    return !1;
  }
}
function Hc(e) {
  return !!(typeof e == `object` && e && (e.__isVue || e._isVue || e.__v_isVNode));
}
var Uc = z,
  Wc = 80;
function Gc(e, t = {}) {
  if (!e) return `<unknown>`;
  try {
    let n = e,
      r = [],
      i = 0,
      a = 0,
      o,
      s = Array.isArray(t) ? t : t.keyAttrs,
      c = (!Array.isArray(t) && t.maxStringLength) || Wc;
    for (
      ;
      n &&
      i++ < 5 &&
      ((o = Kc(n, s)), !(o === `html` || (i > 1 && a + r.length * 3 + o.length >= c)));
    )
      (r.push(o), (a += o.length), (n = n.parentNode));
    return r.reverse().join(` > `);
  } catch {
    return `<unknown>`;
  }
}
function Kc(e, t) {
  let n = e,
    r = [];
  if (!n?.tagName) return ``;
  if (Uc.HTMLElement && n instanceof HTMLElement && n.dataset) {
    if (n.dataset.sentryComponent) return n.dataset.sentryComponent;
    if (n.dataset.sentryElement) return n.dataset.sentryElement;
  }
  r.push(n.tagName.toLowerCase());
  let i = t?.length ? t.filter((e) => n.getAttribute(e)).map((e) => [e, n.getAttribute(e)]) : null;
  if (i?.length)
    i.forEach((e) => {
      r.push(`[${e[0]}="${e[1]}"]`);
    });
  else {
    n.id && r.push(`#${n.id}`);
    let e = n.className;
    if (e && Mc(e)) {
      let t = e.split(/\s+/);
      for (let e of t) r.push(`.${e}`);
    }
  }
  for (let e of [`aria-label`, `type`, `name`, `title`, `alt`]) {
    let t = n.getAttribute(e);
    t && r.push(`[${e}="${t}"]`);
  }
  return r.join(``);
}
function qc(e, t, n) {
  if (!(t in e)) return;
  let r = e[t];
  if (typeof r != `function`) return;
  let i = n(r);
  typeof i == `function` && Yc(i, r);
  try {
    e[t] = i;
  } catch {
    R && B.log(`Failed to replace method "${t}" in object`, e);
  }
}
function Jc(e, t, n) {
  try {
    Object.defineProperty(e, t, { value: n, writable: !0, configurable: !0 });
  } catch {
    R && B.log(`Failed to add non-enumerable property "${t}" to object`, e);
  }
}
function Yc(e, t) {
  try {
    ((e.prototype = t.prototype = t.prototype || {}), Jc(e, `__sentry_original__`, t));
  } catch {}
}
function Xc(e) {
  return e.__sentry_original__;
}
function Zc(e) {
  if (kc(e)) return { message: e.message, name: e.name, stack: e.stack, ...$c(e) };
  if (Ic(e)) {
    let t = { type: e.type, target: Qc(e.target), currentTarget: Qc(e.currentTarget), ...$c(e) };
    return (typeof CustomEvent < `u` && Vc(e, CustomEvent) && (t.detail = e.detail), t);
  }
  return e;
}
function Qc(e) {
  try {
    return Lc(e) ? Gc(e) : Object.prototype.toString.call(e);
  } catch {
    return `<unknown>`;
  }
}
function $c(e) {
  if (typeof e == `object` && e) {
    let t = {};
    for (let n in e) Object.prototype.hasOwnProperty.call(e, n) && (t[n] = e[n]);
    return t;
  }
  return {};
}
function el(e) {
  let t = Object.keys(Zc(e));
  return (t.sort(), t[0] ? t.join(`, `) : `[object has no keys]`);
}
function tl(e, t = 0) {
  return typeof e != `string` || t === 0 || e.length <= t ? e : `${e.slice(0, t)}...`;
}
function nl(e, t) {
  let n = e,
    r = n.length;
  if (r <= 150) return n;
  t > r && (t = r);
  let i = Math.max(t - 60, 0);
  i < 5 && (i = 0);
  let a = Math.min(i + 140, r);
  return (
    a > r - 5 && (a = r),
    a === r && (i = Math.max(a - 140, 0)),
    (n = n.slice(i, a)),
    i > 0 && (n = `'{snip} ${n}`),
    a < r && (n += ` {snip}`),
    n
  );
}
function rl(e, t) {
  if (!Array.isArray(e)) return ``;
  let n = [];
  for (let t = 0; t < e.length; t++) {
    let r = e[t];
    try {
      Hc(r) ? n.push(gc(r)) : n.push(String(r));
    } catch {
      n.push(`[value cannot be serialized]`);
    }
  }
  return n.join(t);
}
function il(e, t, n = !1) {
  return Mc(e) ? (Rc(t) ? t.test(e) : Mc(t) ? (n ? e === t : e.includes(t)) : !1) : !1;
}
function al(e, t = [], n = !1) {
  return t.some((t) => il(e, t, n));
}
function ol() {
  let e = z;
  return e.crypto || e.msCrypto;
}
var sl;
function cl() {
  return Math.random() * 16;
}
function V(e = ol()) {
  try {
    if (e?.randomUUID) return e.randomUUID().replace(/-/g, ``);
  } catch {}
  return (
    (sl ||= `10000000100040008000100000000000`),
    sl.replace(/[018]/g, (e) => (e ^ ((cl() & 15) >> (e / 4))).toString(16))
  );
}
function ll(e) {
  return e.exception?.values?.[0];
}
function ul(e) {
  let { message: t, event_id: n } = e;
  if (t) return t;
  let r = ll(e);
  return r
    ? r.type && r.value
      ? `${r.type}: ${r.value}`
      : r.type || r.value || n || `<unknown>`
    : n || `<unknown>`;
}
function dl(e, t, n) {
  let r = (e.exception = e.exception || {}),
    i = (r.values = r.values || []),
    a = (i[0] = i[0] || {});
  ((a.value ||= t || ``), (a.type ||= n || `Error`));
}
function fl(e, t) {
  let n = ll(e);
  if (!n) return;
  let r = { type: `generic`, handled: !0 },
    i = n.mechanism;
  if (((n.mechanism = { ...r, ...i, ...t }), t && `data` in t)) {
    let e = { ...i?.data, ...t.data };
    n.mechanism.data = e;
  }
}
var pl =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
function ml(e) {
  return parseInt(e || ``, 10);
}
function hl(e) {
  let t = e.match(pl) || [],
    n = ml(t[1]),
    r = ml(t[2]),
    i = ml(t[3]);
  return {
    buildmetadata: t[5],
    major: isNaN(n) ? void 0 : n,
    minor: isNaN(r) ? void 0 : r,
    patch: isNaN(i) ? void 0 : i,
    prerelease: t[4],
  };
}
function gl(e) {
  if (_l(e)) return !0;
  try {
    Jc(e, `__sentry_captured__`, !0);
  } catch {}
  return !1;
}
function _l(e) {
  try {
    return e.__sentry_captured__;
  } catch {}
}
var vl = 1e3;
function yl() {
  return Date.now() / vl;
}
function bl() {
  let { performance: e } = z;
  if (!e?.now || !e.timeOrigin) return yl;
  let t = e.timeOrigin;
  return () => (t + e.now()) / vl;
}
var xl;
function Sl() {
  return (xl ??= bl())();
}
function Cl(e) {
  let t = Sl(),
    n = {
      sid: V(),
      init: !0,
      timestamp: t,
      started: t,
      duration: 0,
      status: `ok`,
      errors: 0,
      ignoreDuration: !1,
      toJSON: () => El(n),
    };
  return (e && wl(n, e), n);
}
function wl(e, t = {}) {
  if (
    (t.user &&
      (!e.ipAddress && t.user.ip_address && (e.ipAddress = t.user.ip_address),
      !e.did && !t.did && (e.did = t.user.id || t.user.email || t.user.username)),
    (e.timestamp = t.timestamp || Sl()),
    t.abnormal_mechanism && (e.abnormal_mechanism = t.abnormal_mechanism),
    t.ignoreDuration && (e.ignoreDuration = t.ignoreDuration),
    t.sid && (e.sid = t.sid.length === 32 ? t.sid : V()),
    t.init !== void 0 && (e.init = t.init),
    !e.did && t.did && (e.did = `${t.did}`),
    typeof t.started == `number` && (e.started = t.started),
    e.ignoreDuration)
  )
    e.duration = void 0;
  else if (typeof t.duration == `number`) e.duration = t.duration;
  else {
    let t = e.timestamp - e.started;
    e.duration = t >= 0 ? t : 0;
  }
  (t.release && (e.release = t.release),
    t.environment && (e.environment = t.environment),
    !e.ipAddress && t.ipAddress && (e.ipAddress = t.ipAddress),
    !e.userAgent && t.userAgent && (e.userAgent = t.userAgent),
    typeof t.errors == `number` && (e.errors = t.errors),
    t.status && (e.status = t.status));
}
function Tl(e, t) {
  let n = {};
  (t ? (n = { status: t }) : e.status === `ok` && (n = { status: `exited` }), wl(e, n));
}
function El(e) {
  return {
    sid: `${e.sid}`,
    init: e.init,
    started: new Date(e.started * 1e3).toISOString(),
    timestamp: new Date(e.timestamp * 1e3).toISOString(),
    status: e.status,
    errors: e.errors,
    did: typeof e.did == `number` || typeof e.did == `string` ? `${e.did}` : void 0,
    duration: e.duration,
    abnormal_mechanism: e.abnormal_mechanism,
    attrs: {
      release: e.release,
      environment: e.environment,
      ip_address: e.ipAddress,
      user_agent: e.userAgent,
    },
  };
}
function Dl(e, t, n = 2) {
  if (!t || typeof t != `object` || n <= 0) return t;
  if (e && Object.keys(t).length === 0) return e;
  let r = { ...e };
  for (let e in t) Object.prototype.hasOwnProperty.call(t, e) && (r[e] = Dl(r[e], t[e], n - 1));
  return r;
}
function Ol() {
  return V();
}
function kl() {
  return V().substring(16);
}
var Al = `_sentrySpan`;
function jl(e, t) {
  t ? Jc(e, Al, t) : delete e[Al];
}
function Ml(e) {
  return e[Al];
}
var Nl = 100,
  Pl = class e {
    constructor() {
      ((this._notifyingListeners = !1),
        (this._scopeListeners = []),
        (this._eventProcessors = []),
        (this._breadcrumbs = []),
        (this._attachments = []),
        (this._user = {}),
        (this._tags = {}),
        (this._attributes = {}),
        (this._extra = {}),
        (this._contexts = {}),
        (this._sdkProcessingMetadata = {}),
        (this._propagationContext = { traceId: Ol(), sampleRand: Math.random() }));
    }
    clone() {
      let t = new e();
      return (
        (t._breadcrumbs = [...this._breadcrumbs]),
        (t._tags = { ...this._tags }),
        (t._attributes = { ...this._attributes }),
        (t._extra = { ...this._extra }),
        (t._contexts = { ...this._contexts }),
        this._contexts.flags && (t._contexts.flags = { values: [...this._contexts.flags.values] }),
        (t._user = this._user),
        (t._level = this._level),
        (t._session = this._session),
        (t._transactionName = this._transactionName),
        (t._fingerprint = this._fingerprint),
        (t._eventProcessors = [...this._eventProcessors]),
        (t._attachments = [...this._attachments]),
        (t._sdkProcessingMetadata = { ...this._sdkProcessingMetadata }),
        (t._propagationContext = { ...this._propagationContext }),
        (t._client = this._client),
        (t._lastEventId = this._lastEventId),
        jl(t, Ml(this)),
        t
      );
    }
    setClient(e) {
      this._client = e;
    }
    setLastEventId(e) {
      this._lastEventId = e;
    }
    getClient() {
      return this._client;
    }
    lastEventId() {
      return this._lastEventId;
    }
    addScopeListener(e) {
      this._scopeListeners.push(e);
    }
    addEventProcessor(e) {
      return (this._eventProcessors.push(e), this);
    }
    setUser(e) {
      return (
        (this._user = e || { email: void 0, id: void 0, ip_address: void 0, username: void 0 }),
        this._session && wl(this._session, { user: e }),
        this._notifyScopeListeners(),
        this
      );
    }
    getUser() {
      return this._user;
    }
    setTags(e) {
      return ((this._tags = { ...this._tags, ...e }), this._notifyScopeListeners(), this);
    }
    setTag(e, t) {
      return this.setTags({ [e]: t });
    }
    setAttributes(e) {
      return (
        (this._attributes = { ...this._attributes, ...e }),
        this._notifyScopeListeners(),
        this
      );
    }
    setAttribute(e, t) {
      return this.setAttributes({ [e]: t });
    }
    removeAttribute(e) {
      return (
        e in this._attributes && (delete this._attributes[e], this._notifyScopeListeners()),
        this
      );
    }
    setExtras(e) {
      return ((this._extra = { ...this._extra, ...e }), this._notifyScopeListeners(), this);
    }
    setExtra(e, t) {
      return ((this._extra = { ...this._extra, [e]: t }), this._notifyScopeListeners(), this);
    }
    setFingerprint(e) {
      return ((this._fingerprint = e), this._notifyScopeListeners(), this);
    }
    setLevel(e) {
      return ((this._level = e), this._notifyScopeListeners(), this);
    }
    setTransactionName(e) {
      return ((this._transactionName = e), this._notifyScopeListeners(), this);
    }
    setContext(e, t) {
      return (
        t === null ? delete this._contexts[e] : (this._contexts[e] = t),
        this._notifyScopeListeners(),
        this
      );
    }
    setSession(e) {
      return (e ? (this._session = e) : delete this._session, this._notifyScopeListeners(), this);
    }
    getSession() {
      return this._session;
    }
    update(t) {
      if (!t) return this;
      let n = typeof t == `function` ? t(this) : t,
        {
          tags: r,
          attributes: i,
          extra: a,
          user: o,
          contexts: s,
          level: c,
          fingerprint: l = [],
          propagationContext: u,
        } = (n instanceof e ? n.getScopeData() : Fc(n) ? t : void 0) || {};
      return (
        (this._tags = { ...this._tags, ...r }),
        (this._attributes = { ...this._attributes, ...i }),
        (this._extra = { ...this._extra, ...a }),
        (this._contexts = { ...this._contexts, ...s }),
        o && Object.keys(o).length && (this._user = o),
        c && (this._level = c),
        l.length && (this._fingerprint = l),
        u && (this._propagationContext = u),
        this
      );
    }
    clear() {
      return (
        (this._breadcrumbs = []),
        (this._tags = {}),
        (this._attributes = {}),
        (this._extra = {}),
        (this._user = {}),
        (this._contexts = {}),
        (this._level = void 0),
        (this._transactionName = void 0),
        (this._fingerprint = void 0),
        (this._session = void 0),
        jl(this, void 0),
        (this._attachments = []),
        this.setPropagationContext({ traceId: Ol(), sampleRand: Math.random() }),
        this._notifyScopeListeners(),
        this
      );
    }
    addBreadcrumb(e, t) {
      let n = typeof t == `number` ? t : Nl;
      if (n <= 0) return this;
      let r = { timestamp: yl(), ...e, message: e.message ? tl(e.message, 2048) : e.message };
      return (
        this._breadcrumbs.push(r),
        this._breadcrumbs.length > n &&
          ((this._breadcrumbs = this._breadcrumbs.slice(-n)),
          this._client?.recordDroppedEvent(`buffer_overflow`, `log_item`)),
        this._notifyScopeListeners(),
        this
      );
    }
    getLastBreadcrumb() {
      return this._breadcrumbs[this._breadcrumbs.length - 1];
    }
    clearBreadcrumbs() {
      return ((this._breadcrumbs = []), this._notifyScopeListeners(), this);
    }
    addAttachment(e) {
      return (this._attachments.push(e), this);
    }
    clearAttachments() {
      return ((this._attachments = []), this);
    }
    getScopeData() {
      return {
        breadcrumbs: this._breadcrumbs,
        attachments: this._attachments,
        contexts: this._contexts,
        tags: this._tags,
        attributes: this._attributes,
        extra: this._extra,
        user: this._user,
        level: this._level,
        fingerprint: this._fingerprint || [],
        eventProcessors: this._eventProcessors,
        propagationContext: this._propagationContext,
        sdkProcessingMetadata: this._sdkProcessingMetadata,
        transactionName: this._transactionName,
        span: Ml(this),
      };
    }
    setSDKProcessingMetadata(e) {
      return ((this._sdkProcessingMetadata = Dl(this._sdkProcessingMetadata, e, 2)), this);
    }
    setPropagationContext(e) {
      return ((this._propagationContext = e), this);
    }
    getPropagationContext() {
      return this._propagationContext;
    }
    captureException(e, t) {
      let n = t?.event_id || V();
      if (!this._client)
        return (R && B.warn(`No client configured on scope - will not capture exception!`), n);
      let r = Error(`Sentry syntheticException`);
      return (
        this._client.captureException(
          e,
          { originalException: e, syntheticException: r, ...t, event_id: n },
          this,
        ),
        n
      );
    }
    captureMessage(e, t, n) {
      let r = n?.event_id || V();
      if (!this._client)
        return (R && B.warn(`No client configured on scope - will not capture message!`), r);
      let i = n?.syntheticException ?? Error(e);
      return (
        this._client.captureMessage(
          e,
          t,
          { originalException: e, syntheticException: i, ...n, event_id: r },
          this,
        ),
        r
      );
    }
    captureEvent(e, t) {
      let n = t?.event_id || V();
      return this._client
        ? (this._client.captureEvent(e, { ...t, event_id: n }, this), n)
        : (R && B.warn(`No client configured on scope - will not capture event!`), n);
    }
    _notifyScopeListeners() {
      this._notifyingListeners ||=
        ((this._notifyingListeners = !0),
        this._scopeListeners.forEach((e) => {
          e(this);
        }),
        !1);
    }
  };
function Fl() {
  return Js(`defaultCurrentScope`, () => new Pl());
}
function Il() {
  return Js(`defaultIsolationScope`, () => new Pl());
}
var Ll = class {
  constructor(e, t) {
    let n;
    n = e || new Pl();
    let r;
    ((r = t || new Pl()), (this._stack = [{ scope: n }]), (this._isolationScope = r));
  }
  withScope(e) {
    let t = this._pushScope(),
      n;
    try {
      n = e(t);
    } catch (e) {
      throw (this._popScope(), e);
    }
    return zc(n)
      ? n.then(
          (e) => (this._popScope(), e),
          (e) => {
            throw (this._popScope(), e);
          },
        )
      : (this._popScope(), n);
  }
  getClient() {
    return this.getStackTop().client;
  }
  getScope() {
    return this.getStackTop().scope;
  }
  getIsolationScope() {
    return this._isolationScope;
  }
  getStackTop() {
    return this._stack[this._stack.length - 1];
  }
  _pushScope() {
    let e = this.getScope().clone();
    return (this._stack.push({ client: this.getClient(), scope: e }), e);
  }
  _popScope() {
    return this._stack.length <= 1 ? !1 : !!this._stack.pop();
  }
};
function Rl() {
  let e = qs(Ks());
  return (e.stack = e.stack || new Ll(Fl(), Il()));
}
function zl(e) {
  return Rl().withScope(e);
}
function Bl(e, t) {
  let n = Rl();
  return n.withScope(() => ((n.getStackTop().scope = e), t(e)));
}
function Vl(e) {
  return Rl().withScope(() => e(Rl().getIsolationScope()));
}
function Hl() {
  return {
    withIsolationScope: Vl,
    withScope: zl,
    withSetScope: Bl,
    withSetIsolationScope: (e, t) => Vl(t),
    getCurrentScope: () => Rl().getScope(),
    getIsolationScope: () => Rl().getIsolationScope(),
  };
}
function Ul(e) {
  let t = qs(Ks());
  t.acs = e;
}
function Wl(e) {
  let t = qs(e);
  return t.acs ? t.acs : Hl();
}
function H() {
  return Wl(Ks()).getCurrentScope();
}
function U() {
  return Wl(Ks()).getIsolationScope();
}
function Gl() {
  return Js(`globalScope`, () => new Pl());
}
function Kl(...e) {
  let t = Wl(Ks());
  if (e.length === 2) {
    let [n, r] = e;
    return n ? t.withSetScope(n, r) : t.withScope(r);
  }
  return t.withScope(e[0]);
}
function W() {
  return H().getClient();
}
function ql(e) {
  let { traceId: t, parentSpanId: n, propagationSpanId: r } = e.getPropagationContext(),
    i = { trace_id: t, span_id: r || kl() };
  return (n && (i.parent_span_id = n), i);
}
var Jl = `sentry.source`,
  Yl = `sentry.sample_rate`,
  Xl = `sentry.op`,
  Zl = `sentry.origin`,
  Ql = `sentry.measurement_unit`,
  $l = `sentry.measurement_value`,
  eu = `sentry.custom_span_name`,
  tu = `sentry.profile_id`,
  nu = `sentry.exclusive_time`;
function ru(e) {
  if (e < 400 && e >= 100) return { code: 1 };
  if (e >= 400 && e < 500)
    switch (e) {
      case 401:
        return { code: 2, message: `unauthenticated` };
      case 403:
        return { code: 2, message: `permission_denied` };
      case 404:
        return { code: 2, message: `not_found` };
      case 409:
        return { code: 2, message: `already_exists` };
      case 413:
        return { code: 2, message: `failed_precondition` };
      case 429:
        return { code: 2, message: `resource_exhausted` };
      case 499:
        return { code: 2, message: `cancelled` };
      default:
        return { code: 2, message: `invalid_argument` };
    }
  if (e >= 500 && e < 600)
    switch (e) {
      case 501:
        return { code: 2, message: `unimplemented` };
      case 503:
        return { code: 2, message: `unavailable` };
      case 504:
        return { code: 2, message: `deadline_exceeded` };
      default:
        return { code: 2, message: `internal_error` };
    }
  return { code: 2, message: `internal_error` };
}
function iu(e, t) {
  e.setAttribute(`http.response.status_code`, t);
  let n = ru(t);
  n.message !== `unknown_error` && e.setStatus(n);
}
var au = `_sentryScope`,
  ou = `_sentryIsolationScope`;
function su(e) {
  try {
    let t = z.WeakRef;
    if (typeof t == `function`) return new t(e);
  } catch {}
  return e;
}
function cu(e) {
  if (e) {
    if (typeof e == `object` && `deref` in e && typeof e.deref == `function`)
      try {
        return e.deref();
      } catch {
        return;
      }
    return e;
  }
}
function lu(e, t, n) {
  e && (Jc(e, ou, su(n)), Jc(e, au, t));
}
function uu(e) {
  let t = e;
  return { scope: t[au], isolationScope: cu(t[ou]) };
}
var du = `sentry-`,
  fu = /^sentry-/;
function pu(e) {
  let t = hu(e);
  if (!t) return;
  let n = Object.entries(t).reduce((e, [t, n]) => {
    if (t.match(fu)) {
      let r = t.slice(7);
      e[r] = n;
    }
    return e;
  }, {});
  if (Object.keys(n).length > 0) return n;
}
function mu(e) {
  if (e) return _u(Object.entries(e).reduce((e, [t, n]) => (n && (e[`${du}${t}`] = n), e), {}));
}
function hu(e) {
  if (e && (Mc(e) || Array.isArray(e)))
    return Array.isArray(e)
      ? e.reduce((e, t) => {
          let n = gu(t);
          return (
            Object.entries(n).forEach(([t, n]) => {
              e[t] = n;
            }),
            e
          );
        }, {})
      : gu(e);
}
function gu(e) {
  return e
    .split(`,`)
    .map((e) => {
      let t = e.indexOf(`=`);
      return t === -1
        ? []
        : [e.slice(0, t), e.slice(t + 1)].map((e) => {
            try {
              return decodeURIComponent(e.trim());
            } catch {
              return;
            }
          });
    })
    .reduce((e, [t, n]) => (t && n && (e[t] = n), e), {});
}
function _u(e) {
  if (Object.keys(e).length !== 0)
    return Object.entries(e).reduce((e, [t, n], r) => {
      let i = `${encodeURIComponent(t)}=${encodeURIComponent(n)}`,
        a = r === 0 ? i : `${e},${i}`;
      return a.length > 8192
        ? (R &&
            B.warn(
              `Not adding key: ${t} with val: ${n} to baggage header due to exceeding baggage size limits.`,
            ),
          e)
        : a;
    }, ``);
}
var vu = /^o(\d+)\./,
  yu = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;
function bu(e) {
  return e === `http` || e === `https`;
}
function xu(e, t = !1) {
  let { host: n, path: r, pass: i, port: a, projectId: o, protocol: s, publicKey: c } = e;
  return `${s}://${c}${t && i ? `:${i}` : ``}@${n}${a ? `:${a}` : ``}/${r && `${r}/`}${o}`;
}
function Su(e) {
  let t = yu.exec(e);
  if (!t) {
    Qs(() => {
      console.error(`Invalid Sentry Dsn: ${e}`);
    });
    return;
  }
  let [n, r, i = ``, a = ``, o = ``, s = ``] = t.slice(1),
    c = ``,
    l = s,
    u = l.split(`/`);
  if ((u.length > 1 && ((c = u.slice(0, -1).join(`/`)), (l = u.pop())), l)) {
    let e = l.match(/^\d+/);
    e && (l = e[0]);
  }
  return Cu({ host: a, pass: i, path: c, projectId: l, port: o, protocol: n, publicKey: r });
}
function Cu(e) {
  return {
    protocol: e.protocol,
    publicKey: e.publicKey || ``,
    pass: e.pass || ``,
    host: e.host,
    port: e.port || ``,
    path: e.path || ``,
    projectId: e.projectId,
  };
}
function wu(e) {
  if (!R) return !0;
  let { port: t, projectId: n, protocol: r } = e;
  return [`protocol`, `publicKey`, `host`, `projectId`].find(
    (t) => !e[t] && (B.error(`Invalid Sentry Dsn: ${t} missing`), !0),
  )
    ? !1
    : n.match(/^\d+$/)
      ? bu(r)
        ? t && isNaN(parseInt(t, 10))
          ? (B.error(`Invalid Sentry Dsn: Invalid port ${t}`), !1)
          : !0
        : (B.error(`Invalid Sentry Dsn: Invalid protocol ${r}`), !1)
      : (B.error(`Invalid Sentry Dsn: Invalid projectId ${n}`), !1);
}
function Tu(e) {
  return e.match(vu)?.[1];
}
function Eu(e) {
  let t = e.getOptions(),
    { host: n } = e.getDsn() || {},
    r;
  return (t.orgId ? (r = String(t.orgId)) : n && (r = Tu(n)), r);
}
function Du(e) {
  let t = typeof e == `string` ? Su(e) : Cu(e);
  if (t && wu(t)) return t;
}
function Ou(e) {
  if (typeof e == `boolean`) return Number(e);
  let t = typeof e == `string` ? parseFloat(e) : e;
  if (!(typeof t != `number` || isNaN(t) || t < 0 || t > 1)) return t;
}
var ku = RegExp(`^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$`);
function Au(e) {
  if (!e) return;
  let t = e.match(ku);
  if (!t) return;
  let n;
  return (
    t[3] === `1` ? (n = !0) : t[3] === `0` && (n = !1),
    { traceId: t[1], parentSampled: n, parentSpanId: t[2] }
  );
}
function ju(e, t) {
  let n = Au(e),
    r = pu(t);
  if (!n?.traceId) return { traceId: Ol(), sampleRand: Math.random() };
  let i = Pu(n, r);
  r && (r.sample_rand = i.toString());
  let { traceId: a, parentSpanId: o, parentSampled: s } = n;
  return { traceId: a, parentSpanId: o, sampled: s, dsc: r || {}, sampleRand: i };
}
function Mu(e = Ol(), t = kl(), n) {
  let r = ``;
  return (n !== void 0 && (r = n ? `-1` : `-0`), `${e}-${t}${r}`);
}
function Nu(e = Ol(), t = kl(), n) {
  return `00-${e}-${t}-${n ? `01` : `00`}`;
}
function Pu(e, t) {
  let n = Ou(t?.sample_rand);
  if (n !== void 0) return n;
  let r = Ou(t?.sample_rate);
  return r && e?.parentSampled !== void 0
    ? e.parentSampled
      ? Math.random() * r
      : r + Math.random() * (1 - r)
    : Math.random();
}
function Fu(e, t) {
  let n = Eu(e);
  return t && n && t !== n
    ? (B.log(
        `Won't continue trace because org IDs don't match (incoming baggage: ${t}, SDK options: ${n})`,
      ),
      !1)
    : e.getOptions().strictTraceContinuation && ((t && !n) || (!t && n))
      ? (B.log(
          `Starting a new trace because strict trace continuation is enabled but one org ID is missing (incoming baggage: ${t}, Sentry client: ${n})`,
        ),
        !1)
      : !0;
}
var Iu = !1;
function Lu(e) {
  let { spanId: t, traceId: n } = e.spanContext(),
    { data: r, op: i, parent_span_id: a, status: o, origin: s, links: c } = G(e);
  return {
    parent_span_id: a,
    span_id: t,
    trace_id: n,
    data: r,
    op: i,
    status: o,
    origin: s,
    links: c,
  };
}
function Ru(e) {
  let { spanId: t, traceId: n, isRemote: r } = e.spanContext(),
    i = r ? t : G(e).parent_span_id,
    a = uu(e).scope;
  return {
    parent_span_id: i,
    span_id: r ? a?.getPropagationContext().propagationSpanId || kl() : t,
    trace_id: n,
  };
}
function zu(e) {
  let { traceId: t, spanId: n } = e.spanContext();
  return Mu(t, n, Ku(e));
}
function Bu(e) {
  let { traceId: t, spanId: n } = e.spanContext();
  return Nu(t, n, Ku(e));
}
function Vu(e) {
  if (e && e.length > 0)
    return e.map(({ context: { spanId: e, traceId: t, traceFlags: n, ...r }, attributes: i }) => ({
      span_id: e,
      trace_id: t,
      sampled: n === 1,
      attributes: i,
      ...r,
    }));
}
function Hu(e) {
  return typeof e == `number`
    ? Uu(e)
    : Array.isArray(e)
      ? e[0] + e[1] / 1e9
      : e instanceof Date
        ? Uu(e.getTime())
        : Sl();
}
function Uu(e) {
  return e > 9999999999 ? e / 1e3 : e;
}
function G(e) {
  if (Gu(e)) return e.getSpanJSON();
  let { spanId: t, traceId: n } = e.spanContext();
  if (Wu(e)) {
    let { attributes: r, startTime: i, name: a, endTime: o, status: s, links: c } = e;
    return {
      span_id: t,
      trace_id: n,
      data: r,
      description: a,
      parent_span_id:
        `parentSpanId` in e
          ? e.parentSpanId
          : `parentSpanContext` in e
            ? e.parentSpanContext?.spanId
            : void 0,
      start_timestamp: Hu(i),
      timestamp: Hu(o) || void 0,
      status: qu(s),
      op: r[Xl],
      origin: r[Zl],
      links: Vu(c),
    };
  }
  return { span_id: t, trace_id: n, start_timestamp: 0, data: {} };
}
function Wu(e) {
  let t = e;
  return !!t.attributes && !!t.startTime && !!t.name && !!t.endTime && !!t.status;
}
function Gu(e) {
  return typeof e.getSpanJSON == `function`;
}
function Ku(e) {
  let { traceFlags: t } = e.spanContext();
  return t === 1;
}
function qu(e) {
  if (e && e.code !== 0) return e.code === 1 ? `ok` : e.message || `internal_error`;
}
var Ju = `_sentryChildSpans`,
  Yu = `_sentryRootSpan`;
function Xu(e, t) {
  (Jc(t, Yu, e[Yu] || e), e[Ju] ? e[Ju].add(t) : Jc(e, Ju, new Set([t])));
}
function Zu(e) {
  let t = new Set();
  function n(e) {
    if (!t.has(e) && Ku(e)) {
      t.add(e);
      let r = e[Ju] ? Array.from(e[Ju]) : [];
      for (let e of r) n(e);
    }
  }
  return (n(e), Array.from(t));
}
function Qu(e) {
  return e[Yu] || e;
}
function $u() {
  let e = Wl(Ks());
  return e.getActiveSpan ? e.getActiveSpan() : Ml(H());
}
function ed() {
  Iu ||=
    (Qs(() => {
      console.warn(
        "[Sentry] Returning null from `beforeSendSpan` is disallowed. To drop certain spans, configure the respective integrations directly or use `ignoreSpans`.",
      );
    }),
    !0);
}
var td = !1;
function nd() {
  if (td) return;
  function e() {
    let e = $u(),
      t = e && Qu(e);
    if (t) {
      let e = `internal_error`;
      (R && B.log(`[Tracing] Root span: ${e} -> Global error occurred`),
        t.setStatus({ code: 2, message: e }));
    }
  }
  ((e.tag = `sentry_tracingErrorCallback`), (td = !0), Cc(e), Ec(e));
}
function rd(e) {
  if (typeof __SENTRY_TRACING__ == `boolean` && !__SENTRY_TRACING__) return !1;
  let t = e || W()?.getOptions();
  return !!t && (t.tracesSampleRate != null || !!t.tracesSampler);
}
function id(e) {
  B.log(`Ignoring span ${e.op} - ${e.description} because it matches \`ignoreSpans\`.`);
}
function ad(e, t) {
  if (!t?.length || !e.description) return !1;
  for (let n of t) {
    if (sd(n)) {
      if (il(e.description, n)) return (R && id(e), !0);
      continue;
    }
    if (!n.name && !n.op) continue;
    let t = !n.name || il(e.description, n.name),
      r = !n.op || (e.op && il(e.op, n.op));
    if (t && r) return (R && id(e), !0);
  }
  return !1;
}
function od(e, t) {
  let n = t.parent_span_id,
    r = t.span_id;
  if (n) for (let t of e) t.parent_span_id === r && (t.parent_span_id = n);
}
function sd(e) {
  return typeof e == `string` || e instanceof RegExp;
}
var cd = `production`,
  ld = `_frozenDsc`;
function ud(e, t) {
  Jc(e, ld, t);
}
function dd(e, t) {
  let n = t.getOptions(),
    { publicKey: r } = t.getDsn() || {},
    i = {
      environment: n.environment || `production`,
      release: n.release,
      public_key: r,
      trace_id: e,
      org_id: Eu(t),
    };
  return (t.emit(`createDsc`, i), i);
}
function fd(e, t) {
  let n = t.getPropagationContext();
  return n.dsc || dd(n.traceId, e);
}
function pd(e) {
  let t = W();
  if (!t) return {};
  let n = Qu(e),
    r = G(n),
    i = r.data,
    a = n.spanContext().traceState,
    o =
      a?.get(`sentry.sample_rate`) ??
      i[`sentry.sample_rate`] ??
      i[`sentry.previous_trace_sample_rate`];
  function s(e) {
    return ((typeof o == `number` || typeof o == `string`) && (e.sample_rate = `${o}`), e);
  }
  let c = n[ld];
  if (c) return s(c);
  let l = a?.get(`sentry.dsc`),
    u = l && pu(l);
  if (u) return s(u);
  let d = dd(e.spanContext().traceId, t),
    f = i[Jl],
    p = r.description;
  return (
    f !== `url` && p && (d.transaction = p),
    rd() &&
      ((d.sampled = String(Ku(n))),
      (d.sample_rand =
        a?.get(`sentry.sample_rand`) ??
        uu(n).scope?.getPropagationContext().sampleRand.toString())),
    s(d),
    t.emit(`createDsc`, d, n),
    d
  );
}
var md = class {
  constructor(e = {}) {
    ((this._traceId = e.traceId || Ol()), (this._spanId = e.spanId || kl()));
  }
  spanContext() {
    return { spanId: this._spanId, traceId: this._traceId, traceFlags: 0 };
  }
  end(e) {}
  setAttribute(e, t) {
    return this;
  }
  setAttributes(e) {
    return this;
  }
  setStatus(e) {
    return this;
  }
  updateName(e) {
    return this;
  }
  isRecording() {
    return !1;
  }
  addEvent(e, t, n) {
    return this;
  }
  addLink(e) {
    return this;
  }
  addLinks(e) {
    return this;
  }
  recordException(e, t) {}
};
function hd(e, t = 100, n = 1 / 0) {
  try {
    return _d(``, e, t, n);
  } catch (e) {
    return { ERROR: `**non-serializable** (${e})` };
  }
}
function gd(e, t = 3, n = 102400) {
  let r = hd(e, t);
  return xd(r) > n ? gd(e, t - 1, n) : r;
}
function _d(e, t, n = 1 / 0, r = 1 / 0, i = Sd()) {
  let [a, o] = i;
  if (
    t == null ||
    [`boolean`, `string`].includes(typeof t) ||
    (typeof t == `number` && Number.isFinite(t))
  )
    return t;
  let s = vd(e, t);
  if (!s.startsWith(`[object `)) return s;
  if (t.__sentry_skip_normalization__) return t;
  let c =
    typeof t.__sentry_override_normalization_depth__ == `number`
      ? t.__sentry_override_normalization_depth__
      : n;
  if (c === 0) return s.replace(`object `, ``);
  if (a(t)) return `[Circular ~]`;
  let l = t;
  if (l && typeof l.toJSON == `function`)
    try {
      return _d(``, l.toJSON(), c - 1, r, i);
    } catch {}
  let u = Array.isArray(t) ? [] : {},
    d = 0,
    f = Zc(t);
  for (let e in f) {
    if (!Object.prototype.hasOwnProperty.call(f, e)) continue;
    if (d >= r) {
      u[e] = `[MaxProperties ~]`;
      break;
    }
    let t = f[e];
    ((u[e] = _d(e, t, c - 1, r, i)), d++);
  }
  return (o(t), u);
}
function vd(e, t) {
  try {
    if (e === `domain` && t && typeof t == `object` && t._events) return `[Domain]`;
    if (e === `domainEmitter`) return `[DomainEmitter]`;
    if (typeof global < `u` && t === global) return `[Global]`;
    if (typeof window < `u` && t === window) return `[Window]`;
    if (typeof document < `u` && t === document) return `[Document]`;
    if (Hc(t)) return gc(t);
    if (Bc(t)) return `[SyntheticEvent]`;
    if (typeof t == `number` && !Number.isFinite(t)) return `[${t}]`;
    if (typeof t == `function`) return `[Function: ${hc(t)}]`;
    if (typeof t == `symbol`) return `[${String(t)}]`;
    if (typeof t == `bigint`) return `[BigInt: ${String(t)}]`;
    let n = yd(t);
    return /^HTML(\w*)Element$/.test(n) ? `[HTMLElement: ${n}]` : `[object ${n}]`;
  } catch (e) {
    return `**non-serializable** (${e})`;
  }
}
function yd(e) {
  let t = Object.getPrototypeOf(e);
  return t?.constructor ? t.constructor.name : `null prototype`;
}
function bd(e) {
  return ~-encodeURI(e).split(/%..|./).length;
}
function xd(e) {
  return bd(JSON.stringify(e));
}
function K(e, t) {
  let n = t.replace(/\\/g, `/`).replace(/[|\\{}()[\]^$+*?.]/g, `\\$&`),
    r = e;
  try {
    r = decodeURI(e);
  } catch {}
  return r
    .replace(/\\/g, `/`)
    .replace(/webpack:\/?/g, ``)
    .replace(RegExp(`(file://)?/*${n}/*`, `ig`), `app:///`);
}
function Sd() {
  let e = new WeakSet();
  function t(t) {
    return e.has(t) ? !0 : (e.add(t), !1);
  }
  function n(t) {
    e.delete(t);
  }
  return [t, n];
}
function Cd(e, t = []) {
  return [e, t];
}
function wd(e, t) {
  let [n, r] = e;
  return [n, [...r, t]];
}
function Td(e, t) {
  let n = e[1];
  for (let e of n) {
    let n = e[0].type;
    if (t(e, n)) return !0;
  }
  return !1;
}
function Ed(e, t) {
  return Td(e, (e, n) => t.includes(n));
}
function Dd(e) {
  let t = qs(z);
  return t.encodePolyfill ? t.encodePolyfill(e) : new TextEncoder().encode(e);
}
function Od(e) {
  let t = qs(z);
  return t.decodePolyfill ? t.decodePolyfill(e) : new TextDecoder().decode(e);
}
function kd(e) {
  let [t, n] = e,
    r = JSON.stringify(t);
  function i(e) {
    typeof r == `string`
      ? (r = typeof e == `string` ? r + e : [Dd(r), e])
      : r.push(typeof e == `string` ? Dd(e) : e);
  }
  for (let e of n) {
    let [t, n] = e;
    if ((i(`\n${JSON.stringify(t)}\n`), typeof n == `string` || n instanceof Uint8Array)) i(n);
    else {
      let e;
      try {
        e = JSON.stringify(n);
      } catch {
        e = JSON.stringify(hd(n));
      }
      i(e);
    }
  }
  return typeof r == `string` ? r : Ad(r);
}
function Ad(e) {
  let t = e.reduce((e, t) => e + t.length, 0),
    n = new Uint8Array(t),
    r = 0;
  for (let t of e) (n.set(t, r), (r += t.length));
  return n;
}
function jd(e) {
  let t = typeof e == `string` ? Dd(e) : e;
  function n(e) {
    let n = t.subarray(0, e);
    return ((t = t.subarray(e + 1)), n);
  }
  function r() {
    let e = t.indexOf(10);
    return (e < 0 && (e = t.length), JSON.parse(Od(n(e))));
  }
  let i = r(),
    a = [];
  for (; t.length;) {
    let e = r(),
      t = typeof e.length == `number` ? e.length : void 0;
    a.push([e, t ? n(t) : r()]);
  }
  return [i, a];
}
function Md(e) {
  return [{ type: `span` }, e];
}
function Nd(e) {
  let t = typeof e.data == `string` ? Dd(e.data) : e.data;
  return [
    {
      type: `attachment`,
      length: t.length,
      filename: e.filename,
      content_type: e.contentType,
      attachment_type: e.attachmentType,
    },
    t,
  ];
}
var Pd = {
  session: `session`,
  sessions: `session`,
  attachment: `attachment`,
  transaction: `transaction`,
  event: `error`,
  client_report: `internal`,
  user_report: `default`,
  profile: `profile`,
  profile_chunk: `profile`,
  replay_event: `replay`,
  replay_recording: `replay`,
  check_in: `monitor`,
  feedback: `feedback`,
  span: `span`,
  raw_security: `security`,
  log: `log_item`,
  metric: `metric`,
  trace_metric: `metric`,
};
function Fd(e) {
  return Pd[e];
}
function Id(e) {
  if (!e?.sdk) return;
  let { name: t, version: n } = e.sdk;
  return { name: t, version: n };
}
function Ld(e, t, n, r) {
  let i = e.sdkProcessingMetadata?.dynamicSamplingContext;
  return {
    event_id: e.event_id,
    sent_at: new Date().toISOString(),
    ...(t && { sdk: t }),
    ...(!!n && r && { dsn: xu(r) }),
    ...(i && { trace: i }),
  };
}
function Rd(e, t) {
  if (!t) return e;
  let n = e.sdk || {};
  return (
    (e.sdk = {
      ...n,
      name: n.name || t.name,
      version: n.version || t.version,
      integrations: [...(e.sdk?.integrations || []), ...(t.integrations || [])],
      packages: [...(e.sdk?.packages || []), ...(t.packages || [])],
      settings: e.sdk?.settings || t.settings ? { ...e.sdk?.settings, ...t.settings } : void 0,
    }),
    e
  );
}
function zd(e, t, n, r) {
  let i = Id(n);
  return Cd(
    { sent_at: new Date().toISOString(), ...(i && { sdk: i }), ...(!!r && t && { dsn: xu(t) }) },
    [`aggregates` in e ? [{ type: `sessions` }, e] : [{ type: `session` }, e.toJSON()]],
  );
}
function Bd(e, t, n, r) {
  let i = Id(n),
    a = e.type && e.type !== `replay_event` ? e.type : `event`;
  Rd(e, n?.sdk);
  let o = Ld(e, i, r, t);
  return (delete e.sdkProcessingMetadata, Cd(o, [[{ type: a }, e]]));
}
function Vd(e, t) {
  function n(e) {
    return !!e.trace_id && !!e.public_key;
  }
  let r = pd(e[0]),
    i = t?.getDsn(),
    a = t?.getOptions().tunnel,
    o = {
      sent_at: new Date().toISOString(),
      ...(n(r) && { trace: r }),
      ...(!!a && i && { dsn: xu(i) }),
    },
    { beforeSendSpan: s, ignoreSpans: c } = t?.getOptions() || {},
    l = c?.length ? e.filter((e) => !ad(G(e), c)) : e,
    u = e.length - l.length;
  u && t?.recordDroppedEvent(`before_send`, `span`, u);
  let d = s
      ? (e) => {
          let t = G(e);
          return s(t) || (ed(), t);
        }
      : G,
    f = [];
  for (let e of l) {
    let t = d(e);
    t && f.push(Md(t));
  }
  return Cd(o, f);
}
function Hd(e) {
  if (!R) return;
  let { description: t = `< unknown name >`, op: n = `< unknown op >`, parent_span_id: r } = G(e),
    { spanId: i } = e.spanContext(),
    a = Ku(e),
    o = Qu(e),
    s = o === e,
    c = `[Tracing] Starting ${a ? `sampled` : `unsampled`} ${s ? `root ` : ``}span`,
    l = [`op: ${n}`, `name: ${t}`, `ID: ${i}`];
  if ((r && l.push(`parent ID: ${r}`), !s)) {
    let { op: e, description: t } = G(o);
    (l.push(`root ID: ${o.spanContext().spanId}`),
      e && l.push(`root op: ${e}`),
      t && l.push(`root description: ${t}`));
  }
  B.log(`${c}
  ${l.join(`
  `)}`);
}
function Ud(e) {
  if (!R) return;
  let { description: t = `< unknown name >`, op: n = `< unknown op >` } = G(e),
    { spanId: r } = e.spanContext(),
    i = `[Tracing] Finishing "${n}" ${Qu(e) === e ? `root ` : ``}span "${t}" with ID ${r}`;
  B.log(i);
}
function Wd(e) {
  if (!e || e.length === 0) return;
  let t = {};
  return (
    e.forEach((e) => {
      let n = e.attributes || {},
        r = n[Ql],
        i = n[$l];
      typeof r == `string` && typeof i == `number` && (t[e.name] = { value: i, unit: r });
    }),
    t
  );
}
var Gd = 1e3,
  Kd = class {
    constructor(e = {}) {
      ((this._traceId = e.traceId || Ol()),
        (this._spanId = e.spanId || kl()),
        (this._startTime = e.startTimestamp || Sl()),
        (this._links = e.links),
        (this._attributes = {}),
        this.setAttributes({ [Zl]: `manual`, [Xl]: e.op, ...e.attributes }),
        (this._name = e.name),
        e.parentSpanId && (this._parentSpanId = e.parentSpanId),
        `sampled` in e && (this._sampled = e.sampled),
        e.endTimestamp && (this._endTime = e.endTimestamp),
        (this._events = []),
        (this._isStandaloneSpan = e.isStandalone),
        this._endTime && this._onSpanEnded());
    }
    addLink(e) {
      return (this._links ? this._links.push(e) : (this._links = [e]), this);
    }
    addLinks(e) {
      return (this._links ? this._links.push(...e) : (this._links = e), this);
    }
    recordException(e, t) {}
    spanContext() {
      let { _spanId: e, _traceId: t, _sampled: n } = this;
      return { spanId: e, traceId: t, traceFlags: +!!n };
    }
    setAttribute(e, t) {
      return (t === void 0 ? delete this._attributes[e] : (this._attributes[e] = t), this);
    }
    setAttributes(e) {
      return (Object.keys(e).forEach((t) => this.setAttribute(t, e[t])), this);
    }
    updateStartTime(e) {
      this._startTime = Hu(e);
    }
    setStatus(e) {
      return ((this._status = e), this);
    }
    updateName(e) {
      return ((this._name = e), this.setAttribute(Jl, `custom`), this);
    }
    end(e) {
      this._endTime || ((this._endTime = Hu(e)), Ud(this), this._onSpanEnded());
    }
    getSpanJSON() {
      return {
        data: this._attributes,
        description: this._name,
        op: this._attributes[Xl],
        parent_span_id: this._parentSpanId,
        span_id: this._spanId,
        start_timestamp: this._startTime,
        status: qu(this._status),
        timestamp: this._endTime,
        trace_id: this._traceId,
        origin: this._attributes[Zl],
        profile_id: this._attributes[tu],
        exclusive_time: this._attributes[nu],
        measurements: Wd(this._events),
        is_segment: (this._isStandaloneSpan && Qu(this) === this) || void 0,
        segment_id: this._isStandaloneSpan ? Qu(this).spanContext().spanId : void 0,
        links: Vu(this._links),
      };
    }
    isRecording() {
      return !this._endTime && !!this._sampled;
    }
    addEvent(e, t, n) {
      R && B.log(`[Tracing] Adding an event to span:`, e);
      let r = qd(t) ? t : n || Sl(),
        i = qd(t) ? {} : t || {},
        a = { name: e, time: Hu(r), attributes: i };
      return (this._events.push(a), this);
    }
    isStandaloneSpan() {
      return !!this._isStandaloneSpan;
    }
    _onSpanEnded() {
      let e = W();
      if ((e && e.emit(`spanEnd`, this), !(this._isStandaloneSpan || this === Qu(this)))) return;
      if (this._isStandaloneSpan) {
        this._sampled
          ? Xd(Vd([this], e))
          : (R &&
              B.log(
                `[Tracing] Discarding standalone span because its trace was not chosen to be sampled.`,
              ),
            e && e.recordDroppedEvent(`sample_rate`, `span`));
        return;
      }
      let t = this._convertSpanToTransaction();
      t && (uu(this).scope || H()).captureEvent(t);
    }
    _convertSpanToTransaction() {
      if (!Jd(G(this))) return;
      this._name ||=
        (R && B.warn("Transaction has no name, falling back to `<unlabeled transaction>`."),
        `<unlabeled transaction>`);
      let { scope: e, isolationScope: t } = uu(this),
        n = e?.getScopeData().sdkProcessingMetadata?.normalizedRequest;
      if (this._sampled !== !0) return;
      let r = Zu(this)
          .filter((e) => e !== this && !Yd(e))
          .map((e) => G(e))
          .filter(Jd),
        i = this._attributes[Jl];
      (delete this._attributes[eu],
        r.forEach((e) => {
          delete e.data[eu];
        }));
      let a = {
          contexts: { trace: Lu(this) },
          spans:
            r.length > Gd
              ? r.sort((e, t) => e.start_timestamp - t.start_timestamp).slice(0, Gd)
              : r,
          start_timestamp: this._startTime,
          timestamp: this._endTime,
          transaction: this._name,
          type: `transaction`,
          sdkProcessingMetadata: {
            capturedSpanScope: e,
            capturedSpanIsolationScope: t,
            dynamicSamplingContext: pd(this),
          },
          request: n,
          ...(i && { transaction_info: { source: i } }),
        },
        o = Wd(this._events);
      return (
        o &&
          Object.keys(o).length &&
          (R &&
            B.log(
              `[Measurements] Adding measurements to transaction event`,
              JSON.stringify(o, void 0, 2),
            ),
          (a.measurements = o)),
        a
      );
    }
  };
function qd(e) {
  return (e && typeof e == `number`) || e instanceof Date || Array.isArray(e);
}
function Jd(e) {
  return !!e.start_timestamp && !!e.timestamp && !!e.span_id && !!e.trace_id;
}
function Yd(e) {
  return e instanceof Kd && e.isStandaloneSpan();
}
function Xd(e) {
  let t = W();
  if (!t) return;
  let n = e[1];
  if (!n || n.length === 0) {
    t.recordDroppedEvent(`before_send`, `span`);
    return;
  }
  t.sendEnvelope(e);
}
function Zd(e, t, n = () => {}, r = () => {}) {
  let i;
  try {
    i = e();
  } catch (e) {
    throw (t(e), n(), e);
  }
  return Qd(i, t, n, r);
}
function Qd(e, t, n, r) {
  return zc(e)
    ? e.then(
        (e) => (n(), r(e), e),
        (e) => {
          throw (t(e), n(), e);
        },
      )
    : (n(), r(e), e);
}
function $d(e, t, n) {
  if (!rd(e)) return [!1];
  let r, i;
  typeof e.tracesSampler == `function`
    ? ((i = e.tracesSampler({
        ...t,
        inheritOrSampleWith: (e) =>
          typeof t.parentSampleRate == `number`
            ? t.parentSampleRate
            : typeof t.parentSampled == `boolean`
              ? Number(t.parentSampled)
              : e,
      })),
      (r = !0))
    : t.parentSampled === void 0
      ? e.tracesSampleRate !== void 0 && ((i = e.tracesSampleRate), (r = !0))
      : (i = t.parentSampled);
  let a = Ou(i);
  if (a === void 0)
    return (
      R &&
        B.warn(
          `[Tracing] Discarding root span because of invalid sample rate. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(i)} of type ${JSON.stringify(typeof i)}.`,
        ),
      [!1]
    );
  if (!a)
    return (
      R &&
        B.log(
          `[Tracing] Discarding transaction because ${typeof e.tracesSampler == `function` ? `tracesSampler returned 0 or false` : `a negative sampling decision was inherited or tracesSampleRate is set to 0`}`,
        ),
      [!1, a, r]
    );
  let o = n < a;
  return (
    o ||
      (R &&
        B.log(
          `[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(i)})`,
        )),
    [o, a, r]
  );
}
var ef = `__SENTRY_SUPPRESS_TRACING__`;
function tf(e) {
  let t = of();
  if (t.startInactiveSpan) return t.startInactiveSpan(e);
  let n = af(e),
    { forceTransaction: r, parentSpan: i } = e;
  return (e.scope ? (t) => Kl(e.scope, t) : i === void 0 ? (e) => e() : (e) => nf(i, e))(() => {
    let t = H(),
      a = lf(t, i);
    return e.onlyIfParent && !a
      ? new md()
      : rf({ parentSpan: a, spanArguments: n, forceTransaction: r, scope: t });
  });
}
function nf(e, t) {
  let n = of();
  return n.withActiveSpan ? n.withActiveSpan(e, t) : Kl((n) => (jl(n, e || void 0), t(n)));
}
function rf({ parentSpan: e, spanArguments: t, forceTransaction: n, scope: r }) {
  if (!rd()) {
    let r = new md();
    return (
      (n || !e) && ud(r, { sampled: `false`, sample_rate: `0`, transaction: t.name, ...pd(r) }),
      r
    );
  }
  let i = U(),
    a;
  if (e && !n) ((a = cf(e, r, t)), Xu(e, a));
  else if (e) {
    let n = pd(e),
      { traceId: i, spanId: o } = e.spanContext(),
      s = Ku(e);
    ((a = sf({ traceId: i, parentSpanId: o, ...t }, r, s)), ud(a, n));
  } else {
    let {
      traceId: e,
      dsc: n,
      parentSpanId: o,
      sampled: s,
    } = { ...i.getPropagationContext(), ...r.getPropagationContext() };
    ((a = sf({ traceId: e, parentSpanId: o, ...t }, r, s)), n && ud(a, n));
  }
  return (Hd(a), lu(a, r, i), a);
}
function af(e) {
  let t = { isStandalone: (e.experimental || {}).standalone, ...e };
  if (e.startTime) {
    let n = { ...t };
    return ((n.startTimestamp = Hu(e.startTime)), delete n.startTime, n);
  }
  return t;
}
function of() {
  return Wl(Ks());
}
function sf(e, t, n) {
  let r = W(),
    i = r?.getOptions() || {},
    { name: a = `` } = e,
    o = { spanAttributes: { ...e.attributes }, spanName: a, parentSampled: n };
  r?.emit(`beforeSampling`, o, { decision: !1 });
  let s = o.parentSampled ?? n,
    c = o.spanAttributes,
    l = t.getPropagationContext(),
    [u, d, f] = t.getScopeData().sdkProcessingMetadata[ef]
      ? [!1]
      : $d(
          i,
          { name: a, parentSampled: s, attributes: c, parentSampleRate: Ou(l.dsc?.sample_rate) },
          l.sampleRand,
        ),
    p = new Kd({
      ...e,
      attributes: { [Jl]: `custom`, [Yl]: d !== void 0 && f ? d : void 0, ...c },
      sampled: u,
    });
  return (
    !u &&
      r &&
      (R && B.log(`[Tracing] Discarding root span because its trace was not chosen to be sampled.`),
      r.recordDroppedEvent(`sample_rate`, `transaction`)),
    r && r.emit(`spanStart`, p),
    p
  );
}
function cf(e, t, n) {
  let { spanId: r, traceId: i } = e.spanContext(),
    a = !t.getScopeData().sdkProcessingMetadata[ef] && Ku(e),
    o = a ? new Kd({ ...n, parentSpanId: r, traceId: i, sampled: a }) : new md({ traceId: i });
  Xu(e, o);
  let s = W();
  return (s && (s.emit(`spanStart`, o), n.endTimestamp && s.emit(`spanEnd`, o)), o);
}
function lf(e, t) {
  if (t) return t;
  if (t === null) return;
  let n = Ml(e);
  if (!n) return;
  let r = W();
  return (r ? r.getOptions() : {}).parentSpanIsAlwaysRootSpan ? Qu(n) : n;
}
var uf = 0,
  df = 1,
  ff = 2;
function pf(e) {
  return new hf((t) => {
    t(e);
  });
}
function mf(e) {
  return new hf((t, n) => {
    n(e);
  });
}
var hf = class e {
  constructor(e) {
    ((this._state = uf), (this._handlers = []), this._runExecutor(e));
  }
  then(t, n) {
    return new e((e, r) => {
      (this._handlers.push([
        !1,
        (n) => {
          if (!t) e(n);
          else
            try {
              e(t(n));
            } catch (e) {
              r(e);
            }
        },
        (t) => {
          if (!n) r(t);
          else
            try {
              e(n(t));
            } catch (e) {
              r(e);
            }
        },
      ]),
        this._executeHandlers());
    });
  }
  catch(e) {
    return this.then((e) => e, e);
  }
  finally(t) {
    return new e((e, n) => {
      let r, i;
      return this.then(
        (e) => {
          ((i = !1), (r = e), t && t());
        },
        (e) => {
          ((i = !0), (r = e), t && t());
        },
      ).then(() => {
        if (i) {
          n(r);
          return;
        }
        e(r);
      });
    });
  }
  _executeHandlers() {
    if (this._state === uf) return;
    let e = this._handlers.slice();
    ((this._handlers = []),
      e.forEach((e) => {
        e[0] ||=
          (this._state === df && e[1](this._value), this._state === ff && e[2](this._value), !0);
      }));
  }
  _runExecutor(e) {
    let t = (e, t) => {
        if (this._state === uf) {
          if (zc(t)) {
            t.then(n, r);
            return;
          }
          ((this._state = e), (this._value = t), this._executeHandlers());
        }
      },
      n = (e) => {
        t(df, e);
      },
      r = (e) => {
        t(ff, e);
      };
    try {
      e(n, r);
    } catch (e) {
      r(e);
    }
  }
};
function gf(e, t, n, r = 0) {
  try {
    let i = _f(t, n, e, r);
    return zc(i) ? i : pf(i);
  } catch (e) {
    return mf(e);
  }
}
function _f(e, t, n, r) {
  let i = n[r];
  if (!e || !i) return e;
  let a = i({ ...e }, t);
  return (
    R && a === null && B.log(`Event processor "${i.id || `?`}" dropped event`),
    zc(a) ? a.then((e) => _f(e, t, n, r + 1)) : _f(a, t, n, r + 1)
  );
}
function vf(e, t) {
  let { fingerprint: n, span: r, breadcrumbs: i, sdkProcessingMetadata: a } = t;
  (xf(e, t), r && wf(e, r), Tf(e, n), Sf(e, i), Cf(e, a));
}
function yf(e, t) {
  let {
    extra: n,
    tags: r,
    user: i,
    contexts: a,
    level: o,
    sdkProcessingMetadata: s,
    breadcrumbs: c,
    fingerprint: l,
    eventProcessors: u,
    attachments: d,
    propagationContext: f,
    transactionName: p,
    span: m,
  } = t;
  (bf(e, `extra`, n),
    bf(e, `tags`, r),
    bf(e, `user`, i),
    bf(e, `contexts`, a),
    (e.sdkProcessingMetadata = Dl(e.sdkProcessingMetadata, s, 2)),
    o && (e.level = o),
    p && (e.transactionName = p),
    m && (e.span = m),
    c.length && (e.breadcrumbs = [...e.breadcrumbs, ...c]),
    l.length && (e.fingerprint = [...e.fingerprint, ...l]),
    u.length && (e.eventProcessors = [...e.eventProcessors, ...u]),
    d.length && (e.attachments = [...e.attachments, ...d]),
    (e.propagationContext = { ...e.propagationContext, ...f }));
}
function bf(e, t, n) {
  e[t] = Dl(e[t], n, 1);
}
function xf(e, t) {
  let { extra: n, tags: r, user: i, contexts: a, level: o, transactionName: s } = t;
  (Object.keys(n).length && (e.extra = { ...n, ...e.extra }),
    Object.keys(r).length && (e.tags = { ...r, ...e.tags }),
    Object.keys(i).length && (e.user = { ...i, ...e.user }),
    Object.keys(a).length && (e.contexts = { ...a, ...e.contexts }),
    o && (e.level = o),
    s && e.type !== `transaction` && (e.transaction = s));
}
function Sf(e, t) {
  let n = [...(e.breadcrumbs || []), ...t];
  e.breadcrumbs = n.length ? n : void 0;
}
function Cf(e, t) {
  e.sdkProcessingMetadata = { ...e.sdkProcessingMetadata, ...t };
}
function wf(e, t) {
  ((e.contexts = { trace: Ru(t), ...e.contexts }),
    (e.sdkProcessingMetadata = { dynamicSamplingContext: pd(t), ...e.sdkProcessingMetadata }));
  let n = G(Qu(t)).description;
  n && !e.transaction && e.type === `transaction` && (e.transaction = n);
}
function Tf(e, t) {
  ((e.fingerprint = e.fingerprint
    ? Array.isArray(e.fingerprint)
      ? e.fingerprint
      : [e.fingerprint]
    : []),
    t && (e.fingerprint = e.fingerprint.concat(t)),
    e.fingerprint.length || delete e.fingerprint);
}
var Ef, Df, Of, kf;
function Af(e) {
  let t = z._sentryDebugIds,
    n = z._debugIds;
  if (!t && !n) return {};
  let r = t ? Object.keys(t) : [],
    i = n ? Object.keys(n) : [];
  if (kf && r.length === Df && i.length === Of) return kf;
  ((Df = r.length), (Of = i.length), (kf = {}), (Ef ||= {}));
  let a = (t, n) => {
    for (let r of t) {
      let t = n[r],
        i = Ef?.[r];
      if (i && kf && t) ((kf[i[0]] = t), Ef && (Ef[r] = [i[0], t]));
      else if (t) {
        let n = e(r);
        for (let e = n.length - 1; e >= 0; e--) {
          let i = n[e]?.filename;
          if (i && kf && Ef) {
            ((kf[i] = t), (Ef[r] = [i, t]));
            break;
          }
        }
      }
    }
  };
  return (t && a(r, t), n && a(i, n), kf);
}
function jf(e, t, n, r, i, a) {
  let { normalizeDepth: o = 3, normalizeMaxBreadth: s = 1e3 } = e,
    c = { ...t, event_id: t.event_id || n.event_id || V(), timestamp: t.timestamp || yl() },
    l = n.integrations || e.integrations.map((e) => e.name);
  (Mf(c, e),
    Ff(c, l),
    i && i.emit(`applyFrameMetadata`, t),
    t.type === void 0 && Nf(c, e.stackParser));
  let u = Lf(r, n.captureContext);
  n.mechanism && fl(c, n.mechanism);
  let d = i ? i.getEventProcessors() : [],
    f = Gl().getScopeData();
  (a && yf(f, a.getScopeData()), u && yf(f, u.getScopeData()));
  let p = [...(n.attachments || []), ...f.attachments];
  return (
    p.length && (n.attachments = p),
    vf(c, f),
    gf([...d, ...f.eventProcessors], c, n).then(
      (e) => (e && Pf(e), typeof o == `number` && o > 0 ? If(e, o, s) : e),
    )
  );
}
function Mf(e, t) {
  let { environment: n, release: r, dist: i, maxValueLength: a } = t;
  ((e.environment = e.environment || n || `production`),
    !e.release && r && (e.release = r),
    !e.dist && i && (e.dist = i));
  let o = e.request;
  (o?.url && a && (o.url = tl(o.url, a)),
    a &&
      e.exception?.values?.forEach((e) => {
        e.value &&= tl(e.value, a);
      }));
}
function Nf(e, t) {
  let n = Af(t);
  e.exception?.values?.forEach((e) => {
    e.stacktrace?.frames?.forEach((e) => {
      e.filename && (e.debug_id = n[e.filename]);
    });
  });
}
function Pf(e) {
  let t = {};
  if (
    (e.exception?.values?.forEach((e) => {
      e.stacktrace?.frames?.forEach((e) => {
        e.debug_id &&
          (e.abs_path ? (t[e.abs_path] = e.debug_id) : e.filename && (t[e.filename] = e.debug_id),
          delete e.debug_id);
      });
    }),
    Object.keys(t).length === 0)
  )
    return;
  ((e.debug_meta = e.debug_meta || {}), (e.debug_meta.images = e.debug_meta.images || []));
  let n = e.debug_meta.images;
  Object.entries(t).forEach(([e, t]) => {
    n.push({ type: `sourcemap`, code_file: e, debug_id: t });
  });
}
function Ff(e, t) {
  t.length > 0 &&
    ((e.sdk = e.sdk || {}), (e.sdk.integrations = [...(e.sdk.integrations || []), ...t]));
}
function If(e, t, n) {
  if (!e) return null;
  let r = {
    ...e,
    ...(e.breadcrumbs && {
      breadcrumbs: e.breadcrumbs.map((e) => ({ ...e, ...(e.data && { data: hd(e.data, t, n) }) })),
    }),
    ...(e.user && { user: hd(e.user, t, n) }),
    ...(e.contexts && { contexts: hd(e.contexts, t, n) }),
    ...(e.extra && { extra: hd(e.extra, t, n) }),
  };
  return (
    e.contexts?.trace &&
      r.contexts &&
      ((r.contexts.trace = e.contexts.trace),
      e.contexts.trace.data && (r.contexts.trace.data = hd(e.contexts.trace.data, t, n))),
    e.spans &&
      (r.spans = e.spans.map((e) => ({ ...e, ...(e.data && { data: hd(e.data, t, n) }) }))),
    e.contexts?.flags && r.contexts && (r.contexts.flags = hd(e.contexts.flags, 3, n)),
    r
  );
}
function Lf(e, t) {
  if (!t) return e;
  let n = e ? e.clone() : new Pl();
  return (n.update(t), n);
}
function Rf(e) {
  if (e) return zf(e) || Vf(e) ? { captureContext: e } : e;
}
function zf(e) {
  return e instanceof Pl || typeof e == `function`;
}
var Bf = [`user`, `level`, `extra`, `contexts`, `tags`, `fingerprint`, `propagationContext`];
function Vf(e) {
  return Object.keys(e).some((e) => Bf.includes(e));
}
function Hf(e, t) {
  return H().captureException(e, Rf(t));
}
function Uf(e, t) {
  let n = typeof t == `string` ? t : void 0,
    r = typeof t == `string` ? void 0 : { captureContext: t };
  return H().captureMessage(e, n, r);
}
function Wf(e, t) {
  return H().captureEvent(e, t);
}
function Gf(e, t) {
  U().setTag(e, t);
}
function Kf(e) {
  U().setUser(e);
}
async function qf(e) {
  let t = W();
  return t
    ? t.flush(e)
    : (R && B.warn(`Cannot flush events. No client defined.`), Promise.resolve(!1));
}
function Jf() {
  let e = W();
  return e?.getOptions().enabled !== !1 && !!e?.getTransport();
}
function Yf(e) {
  let t = U(),
    n = H(),
    { userAgent: r } = z.navigator || {},
    i = Cl({ user: n.getUser() || t.getUser(), ...(r && { userAgent: r }), ...e }),
    a = t.getSession();
  return (a?.status === `ok` && wl(a, { status: `exited` }), Xf(), t.setSession(i), i);
}
function Xf() {
  let e = U(),
    t = H().getSession() || e.getSession();
  (t && Tl(t), Zf(), e.setSession());
}
function Zf() {
  let e = U(),
    t = W(),
    n = e.getSession();
  n && t && t.captureSession(n);
}
function Qf(e = !1) {
  if (e) {
    Xf();
    return;
  }
  Zf();
}
var $f = `7`;
function ep(e) {
  let t = e.protocol ? `${e.protocol}:` : ``,
    n = e.port ? `:${e.port}` : ``;
  return `${t}//${e.host}${n}${e.path ? `/${e.path}` : ``}/api/`;
}
function tp(e) {
  return `${ep(e)}${e.projectId}/envelope/`;
}
function np(e, t) {
  let n = { sentry_version: $f };
  return (
    e.publicKey && (n.sentry_key = e.publicKey),
    t && (n.sentry_client = `${t.name}/${t.version}`),
    new URLSearchParams(n).toString()
  );
}
function rp(e, t, n) {
  return t || `${tp(e)}?${np(e, n)}`;
}
var ip = [];
function ap(e) {
  let t = {};
  return (
    e.forEach((e) => {
      let { name: n } = e,
        r = t[n];
      (r && !r.isDefaultInstance && e.isDefaultInstance) || (t[n] = e);
    }),
    Object.values(t)
  );
}
function op(e) {
  let t = e.defaultIntegrations || [],
    n = e.integrations;
  t.forEach((e) => {
    e.isDefaultInstance = !0;
  });
  let r;
  if (Array.isArray(n)) r = [...t, ...n];
  else if (typeof n == `function`) {
    let e = n(t);
    r = Array.isArray(e) ? e : [e];
  } else r = t;
  return ap(r);
}
function sp(e, t) {
  let n = {};
  return (
    t.forEach((t) => {
      t && lp(e, t, n);
    }),
    n
  );
}
function cp(e, t) {
  for (let n of t) n?.afterAllSetup && n.afterAllSetup(e);
}
function lp(e, t, n) {
  if (n[t.name]) {
    R && B.log(`Integration skipped because it was already installed: ${t.name}`);
    return;
  }
  if (
    ((n[t.name] = t),
    !ip.includes(t.name) && typeof t.setupOnce == `function` && (t.setupOnce(), ip.push(t.name)),
    t.setup && typeof t.setup == `function` && t.setup(e),
    typeof t.preprocessEvent == `function`)
  ) {
    let n = t.preprocessEvent.bind(t);
    e.on(`preprocessEvent`, (t, r) => n(t, r, e));
  }
  if (typeof t.processEvent == `function`) {
    let n = t.processEvent.bind(t),
      r = Object.assign((t, r) => n(t, r, e), { id: t.name });
    e.addEventProcessor(r);
  }
  R && B.log(`Integration installed: ${t.name}`);
}
function q(e) {
  return e;
}
function up(e, t) {
  return t
    ? Kl(t, () => {
        let n = $u(),
          r = n ? Ru(n) : ql(t);
        return [n ? pd(n) : fd(e, t), r];
      })
    : [void 0, void 0];
}
var dp = { trace: 1, debug: 5, info: 9, warn: 13, error: 17, fatal: 21 };
function fp(e) {
  return [
    { type: `log`, item_count: e.length, content_type: `application/vnd.sentry.items.log+json` },
    { items: e },
  ];
}
function pp(e, t, n, r) {
  let i = {};
  return (
    t?.sdk && (i.sdk = { name: t.sdk.name, version: t.sdk.version }),
    n && r && (i.dsn = xu(r)),
    Cd(i, [fp(e)])
  );
}
var mp = 100;
function hp(e) {
  switch (typeof e) {
    case `number`:
      return Number.isInteger(e) ? { value: e, type: `integer` } : { value: e, type: `double` };
    case `boolean`:
      return { value: e, type: `boolean` };
    case `string`:
      return { value: e, type: `string` };
    default: {
      let t = ``;
      try {
        t = JSON.stringify(e) ?? ``;
      } catch {}
      return { value: t, type: `string` };
    }
  }
}
function gp(e, t, n, r = !0) {
  n && (!e[t] || r) && (e[t] = n);
}
function _p(e, t) {
  let n = Sp(),
    r = bp(e);
  r === void 0 ? n.set(e, [t]) : r.length >= mp ? (yp(e, r), n.set(e, [t])) : n.set(e, [...r, t]);
}
function vp(e, t = H(), n = _p) {
  let r = t?.getClient() ?? W();
  if (!r) {
    R && B.warn(`No client available to capture log.`);
    return;
  }
  let { release: i, environment: a, enableLogs: o = !1, beforeSendLog: s } = r.getOptions();
  if (!o) {
    R && B.warn(`logging option not enabled, log will not be captured.`);
    return;
  }
  let [, c] = up(r, t),
    l = { ...e.attributes },
    {
      user: { id: u, email: d, username: f },
    } = xp(t);
  (gp(l, `user.id`, u, !1),
    gp(l, `user.email`, d, !1),
    gp(l, `user.name`, f, !1),
    gp(l, `sentry.release`, i),
    gp(l, `sentry.environment`, a));
  let { name: p, version: m } = r.getSdkMetadata()?.sdk ?? {};
  (gp(l, `sentry.sdk.name`, p), gp(l, `sentry.sdk.version`, m));
  let h = r.getIntegrationByName(`Replay`),
    g = h?.getReplayId(!0);
  (gp(l, `sentry.replay_id`, g),
    g && h?.getRecordingMode() === `buffer` && gp(l, `sentry._internal.replay_is_buffering`, !0));
  let _ = e.message;
  if (Nc(_)) {
    let { __sentry_template_string__: e, __sentry_template_values__: t = [] } = _;
    (t?.length && (l[`sentry.message.template`] = e),
      t.forEach((e, t) => {
        l[`sentry.message.parameter.${t}`] = e;
      }));
  }
  gp(l, `sentry.trace.parent_span_id`, Ml(t)?.spanContext().spanId);
  let v = { ...e, attributes: l };
  r.emit(`beforeCaptureLog`, v);
  let y = s ? Qs(() => s(v)) : v;
  if (!y) {
    (r.recordDroppedEvent(`before_send`, `log_item`, 1),
      R && B.warn(`beforeSendLog returned null, log will not be captured.`));
    return;
  }
  let { level: b, message: x, attributes: S = {}, severityNumber: C } = y;
  (n(r, {
    timestamp: Sl(),
    level: b,
    body: x,
    trace_id: c?.trace_id,
    severity_number: C ?? dp[b],
    attributes: Object.keys(S).reduce((e, t) => ((e[t] = hp(S[t])), e), {}),
  }),
    r.emit(`afterCaptureLog`, y));
}
function yp(e, t) {
  let n = t ?? bp(e) ?? [];
  if (n.length === 0) return;
  let r = e.getOptions(),
    i = pp(n, r._metadata, r.tunnel, e.getDsn());
  (Sp().set(e, []), e.emit(`flushLogs`), e.sendEnvelope(i));
}
function bp(e) {
  return Sp().get(e);
}
function xp(e) {
  let t = Gl().getScopeData();
  return (yf(t, U().getScopeData()), yf(t, e.getScopeData()), t);
}
function Sp() {
  return Js(`clientToLogBufferMap`, () => new WeakMap());
}
function Cp(e) {
  return [
    {
      type: `trace_metric`,
      item_count: e.length,
      content_type: `application/vnd.sentry.items.trace-metric+json`,
    },
    { items: e },
  ];
}
function wp(e, t, n, r) {
  let i = {};
  return (
    t?.sdk && (i.sdk = { name: t.sdk.name, version: t.sdk.version }),
    n && r && (i.dsn = xu(r)),
    Cd(i, [Cp(e)])
  );
}
var Tp = 1e3;
function Ep(e, t) {
  let n = kp(),
    r = Op(e);
  r === void 0 ? n.set(e, [t]) : r.length >= Tp ? (Dp(e, r), n.set(e, [t])) : n.set(e, [...r, t]);
}
function Dp(e, t) {
  let n = t ?? Op(e) ?? [];
  if (n.length === 0) return;
  let r = e.getOptions(),
    i = wp(n, r._metadata, r.tunnel, e.getDsn());
  (kp().set(e, []), e.emit(`flushMetrics`), e.sendEnvelope(i));
}
function Op(e) {
  return kp().get(e);
}
function kp() {
  return Js(`clientToMetricBufferMap`, () => new WeakMap());
}
var Ap = Symbol.for(`SentryBufferFullError`);
function jp(e = 100) {
  let t = new Set();
  function n() {
    return t.size < e;
  }
  function r(e) {
    t.delete(e);
  }
  function i(e) {
    if (!n()) return mf(Ap);
    let i = e();
    return (
      t.add(i),
      i.then(
        () => r(i),
        () => r(i),
      ),
      i
    );
  }
  function a(e) {
    if (!t.size) return pf(!0);
    let n = Promise.allSettled(Array.from(t)).then(() => !0);
    if (!e) return n;
    let r = [n, new Promise((t) => setTimeout(() => t(!1), e))];
    return Promise.race(r);
  }
  return {
    get $() {
      return Array.from(t);
    },
    add: i,
    drain: a,
  };
}
var Mp = 6e4;
function Np(e, t = Date.now()) {
  let n = parseInt(`${e}`, 10);
  if (!isNaN(n)) return n * 1e3;
  let r = Date.parse(`${e}`);
  return isNaN(r) ? Mp : r - t;
}
function Pp(e, t) {
  return e[t] || e.all || 0;
}
function Fp(e, t, n = Date.now()) {
  return Pp(e, t) > n;
}
function Ip(e, { statusCode: t, headers: n }, r = Date.now()) {
  let i = { ...e },
    a = n?.[`x-sentry-rate-limits`],
    o = n?.[`retry-after`];
  if (a)
    for (let e of a.trim().split(`,`)) {
      let [t, n, , , a] = e.split(`:`, 5),
        o = parseInt(t, 10),
        s = (isNaN(o) ? 60 : o) * 1e3;
      if (!n) i.all = r + s;
      else
        for (let e of n.split(`;`))
          e === `metric_bucket`
            ? (!a || a.split(`;`).includes(`custom`)) && (i[e] = r + s)
            : (i[e] = r + s);
    }
  else o ? (i.all = r + Np(o, r)) : t === 429 && (i.all = r + 6e4);
  return i;
}
function Lp(e, t, n = jp(e.bufferSize || 64)) {
  let r = {},
    i = (e) => n.drain(e);
  function a(i) {
    let a = [];
    if (
      (Td(i, (t, n) => {
        let i = Fd(n);
        Fp(r, i) ? e.recordDroppedEvent(`ratelimit_backoff`, i) : a.push(t);
      }),
      a.length === 0)
    )
      return Promise.resolve({});
    let o = Cd(i[0], a),
      s = (t) => {
        Td(o, (n, r) => {
          e.recordDroppedEvent(t, Fd(r));
        });
      };
    return n
      .add(() =>
        t({ body: kd(o) }).then(
          (e) => (
            e.statusCode !== void 0 &&
              (e.statusCode < 200 || e.statusCode >= 300) &&
              R &&
              B.warn(`Sentry responded with status code ${e.statusCode} to sent event.`),
            (r = Ip(r, e)),
            e
          ),
          (e) => {
            throw (
              s(`network_error`),
              R && B.error(`Encountered error running transport request:`, e),
              e
            );
          },
        ),
      )
      .then(
        (e) => e,
        (e) => {
          if (e === Ap)
            return (
              R && B.error(`Skipped sending event because buffer is full.`),
              s(`queue_overflow`),
              Promise.resolve({})
            );
          throw e;
        },
      );
  }
  return { send: a, flush: i };
}
function Rp(e, t, n) {
  let r = [{ type: `client_report` }, { timestamp: n || yl(), discarded_events: e }];
  return Cd(t ? { dsn: t } : {}, [r]);
}
function zp(e) {
  let t = [];
  e.message && t.push(e.message);
  try {
    let n = e.exception.values[e.exception.values.length - 1];
    n?.value && (t.push(n.value), n.type && t.push(`${n.type}: ${n.value}`));
  } catch {}
  return t;
}
function Bp(e) {
  let {
    trace_id: t,
    parent_span_id: n,
    span_id: r,
    status: i,
    origin: a,
    data: o,
    op: s,
  } = e.contexts?.trace ?? {};
  return {
    data: o ?? {},
    description: e.transaction,
    op: s,
    parent_span_id: n,
    span_id: r ?? ``,
    start_timestamp: e.start_timestamp ?? 0,
    status: i,
    timestamp: e.timestamp,
    trace_id: t ?? ``,
    origin: a,
    profile_id: o?.[tu],
    exclusive_time: o?.[nu],
    measurements: e.measurements,
    is_segment: !0,
  };
}
function Vp(e) {
  return {
    type: `transaction`,
    timestamp: e.timestamp,
    start_timestamp: e.start_timestamp,
    transaction: e.description,
    contexts: {
      trace: {
        trace_id: e.trace_id,
        span_id: e.span_id,
        parent_span_id: e.parent_span_id,
        op: e.op,
        status: e.status,
        origin: e.origin,
        data: {
          ...e.data,
          ...(e.profile_id && { "sentry.profile_id": e.profile_id }),
          ...(e.exclusive_time && { "sentry.exclusive_time": e.exclusive_time }),
        },
      },
    },
    measurements: e.measurements,
  };
}
var Hp = `Not capturing exception because it's already been captured.`,
  Up = `Discarded session because of missing or non-string release`,
  Wp = Symbol.for(`SentryInternalError`),
  Gp = Symbol.for(`SentryDoNotSendEventError`),
  Kp = 5e3;
function qp(e) {
  return { message: e, [Wp]: !0 };
}
function Jp(e) {
  return { message: e, [Gp]: !0 };
}
function Yp(e) {
  return !!e && typeof e == `object` && Wp in e;
}
function Xp(e) {
  return !!e && typeof e == `object` && Gp in e;
}
function Zp(e, t, n, r, i) {
  let a = 0,
    o,
    s = !1;
  (e.on(n, () => {
    ((a = 0), clearTimeout(o), (s = !1));
  }),
    e.on(t, (t) => {
      ((a += r(t)),
        a >= 8e5
          ? i(e)
          : s ||
            ((s = !0),
            (o = setTimeout(() => {
              i(e);
            }, Kp))));
    }),
    e.on(`flush`, () => {
      i(e);
    }));
}
var Qp = class {
  constructor(e) {
    if (
      ((this._options = e),
      (this._integrations = {}),
      (this._numProcessing = 0),
      (this._outcomes = {}),
      (this._hooks = {}),
      (this._eventProcessors = []),
      (this._promiseBuffer = jp(e.transportOptions?.bufferSize ?? 64)),
      e.dsn
        ? (this._dsn = Du(e.dsn))
        : R && B.warn(`No DSN provided, client will not send events.`),
      this._dsn)
    ) {
      let t = rp(this._dsn, e.tunnel, e._metadata ? e._metadata.sdk : void 0);
      this._transport = e.transport({
        tunnel: this._options.tunnel,
        recordDroppedEvent: this.recordDroppedEvent.bind(this),
        ...e.transportOptions,
        url: t,
      });
    }
    ((this._options.enableLogs =
      this._options.enableLogs ?? this._options._experiments?.enableLogs),
      this._options.enableLogs && Zp(this, `afterCaptureLog`, `flushLogs`, am, yp),
      (this._options.enableMetrics ?? this._options._experiments?.enableMetrics ?? !0) &&
        Zp(this, `afterCaptureMetric`, `flushMetrics`, im, Dp));
  }
  captureException(e, t, n) {
    let r = V();
    if (gl(e)) return (R && B.log(Hp), r);
    let i = { event_id: r, ...t };
    return (
      this._process(
        () =>
          this.eventFromException(e, i)
            .then((e) => this._captureEvent(e, i, n))
            .then((e) => e),
        `error`,
      ),
      i.event_id
    );
  }
  captureMessage(e, t, n, r) {
    let i = { event_id: V(), ...n },
      a = Nc(e) ? e : String(e),
      o = Pc(e),
      s = o ? this.eventFromMessage(a, t, i) : this.eventFromException(e, i);
    return (
      this._process(() => s.then((e) => this._captureEvent(e, i, r)), o ? `unknown` : `error`),
      i.event_id
    );
  }
  captureEvent(e, t, n) {
    let r = V();
    if (t?.originalException && gl(t.originalException)) return (R && B.log(Hp), r);
    let i = { event_id: r, ...t },
      a = e.sdkProcessingMetadata || {},
      o = a.capturedSpanScope,
      s = a.capturedSpanIsolationScope,
      c = $p(e.type);
    return (this._process(() => this._captureEvent(e, i, o || n, s), c), i.event_id);
  }
  captureSession(e) {
    (this.sendSession(e), wl(e, { init: !1 }));
  }
  getDsn() {
    return this._dsn;
  }
  getOptions() {
    return this._options;
  }
  getSdkMetadata() {
    return this._options._metadata;
  }
  getTransport() {
    return this._transport;
  }
  async flush(e) {
    let t = this._transport;
    if (!t) return !0;
    this.emit(`flush`);
    let n = await this._isClientDoneProcessing(e),
      r = await t.flush(e);
    return n && r;
  }
  async close(e) {
    let t = await this.flush(e);
    return ((this.getOptions().enabled = !1), this.emit(`close`), t);
  }
  getEventProcessors() {
    return this._eventProcessors;
  }
  addEventProcessor(e) {
    this._eventProcessors.push(e);
  }
  init() {
    (this._isEnabled() ||
      this._options.integrations.some(({ name: e }) => e.startsWith(`Spotlight`))) &&
      this._setupIntegrations();
  }
  getIntegrationByName(e) {
    return this._integrations[e];
  }
  addIntegration(e) {
    let t = this._integrations[e.name];
    (lp(this, e, this._integrations), t || cp(this, [e]));
  }
  sendEvent(e, t = {}) {
    this.emit(`beforeSendEvent`, e, t);
    let n = Bd(e, this._dsn, this._options._metadata, this._options.tunnel);
    for (let e of t.attachments || []) n = wd(n, Nd(e));
    this.sendEnvelope(n).then((t) => this.emit(`afterSendEvent`, e, t));
  }
  sendSession(e) {
    let { release: t, environment: n = cd } = this._options;
    if (`aggregates` in e) {
      let r = e.attrs || {};
      if (!r.release && !t) {
        R && B.warn(Up);
        return;
      }
      ((r.release = r.release || t), (r.environment = r.environment || n), (e.attrs = r));
    } else {
      if (!e.release && !t) {
        R && B.warn(Up);
        return;
      }
      ((e.release = e.release || t), (e.environment = e.environment || n));
    }
    this.emit(`beforeSendSession`, e);
    let r = zd(e, this._dsn, this._options._metadata, this._options.tunnel);
    this.sendEnvelope(r);
  }
  recordDroppedEvent(e, t, n = 1) {
    if (this._options.sendClientReports) {
      let r = `${e}:${t}`;
      (R && B.log(`Recording outcome: "${r}"${n > 1 ? ` (${n} times)` : ``}`),
        (this._outcomes[r] = (this._outcomes[r] || 0) + n));
    }
  }
  on(e, t) {
    let n = (this._hooks[e] = this._hooks[e] || new Set()),
      r = (...e) => t(...e);
    return (
      n.add(r),
      () => {
        n.delete(r);
      }
    );
  }
  emit(e, ...t) {
    let n = this._hooks[e];
    n && n.forEach((e) => e(...t));
  }
  async sendEnvelope(e) {
    if ((this.emit(`beforeEnvelope`, e), this._isEnabled() && this._transport))
      try {
        return await this._transport.send(e);
      } catch (e) {
        return (R && B.error(`Error while sending envelope:`, e), {});
      }
    return (R && B.error(`Transport disabled`), {});
  }
  _setupIntegrations() {
    let { integrations: e } = this._options;
    ((this._integrations = sp(this, e)), cp(this, e));
  }
  _updateSessionFromEvent(e, t) {
    let n = t.level === `fatal`,
      r = !1,
      i = t.exception?.values;
    if (i) {
      ((r = !0), (n = !1));
      for (let e of i)
        if (e.mechanism?.handled === !1) {
          n = !0;
          break;
        }
    }
    let a = e.status === `ok`;
    ((a && e.errors === 0) || (a && n)) &&
      (wl(e, { ...(n && { status: `crashed` }), errors: e.errors || Number(r || n) }),
      this.captureSession(e));
  }
  async _isClientDoneProcessing(e) {
    let t = 0;
    for (; !e || t < e;) {
      if ((await new Promise((e) => setTimeout(e, 1)), !this._numProcessing)) return !0;
      t++;
    }
    return !1;
  }
  _isEnabled() {
    return this.getOptions().enabled !== !1 && this._transport !== void 0;
  }
  _prepareEvent(e, t, n, r) {
    let i = this.getOptions(),
      a = Object.keys(this._integrations);
    return (
      !t.integrations && a?.length && (t.integrations = a),
      this.emit(`preprocessEvent`, e, t),
      e.type || r.setLastEventId(e.event_id || t.event_id),
      jf(i, e, t, n, this, r).then((e) =>
        e === null
          ? e
          : (this.emit(`postprocessEvent`, e, t),
            (e.contexts = { trace: ql(n), ...e.contexts }),
            (e.sdkProcessingMetadata = {
              dynamicSamplingContext: fd(this, n),
              ...e.sdkProcessingMetadata,
            }),
            e),
      )
    );
  }
  _captureEvent(e, t = {}, n = H(), r = U()) {
    return (
      R && nm(e) && B.log(`Captured error event \`${zp(e)[0] || `<unknown>`}\``),
      this._processEvent(e, t, n, r).then(
        (e) => e.event_id,
        (e) => {
          R && (Xp(e) ? B.log(e.message) : Yp(e) ? B.warn(e.message) : B.warn(e));
        },
      )
    );
  }
  _processEvent(e, t, n, r) {
    let i = this.getOptions(),
      { sampleRate: a } = i,
      o = rm(e),
      s = nm(e),
      c = `before send for type \`${e.type || `error`}\``,
      l = a === void 0 ? void 0 : Ou(a);
    if (s && typeof l == `number` && Math.random() > l)
      return (
        this.recordDroppedEvent(`sample_rate`, `error`),
        mf(
          Jp(
            `Discarding event because it's not included in the random sample (sampling rate = ${a})`,
          ),
        )
      );
    let u = $p(e.type);
    return this._prepareEvent(e, t, n, r)
      .then((e) => {
        if (e === null)
          throw (
            this.recordDroppedEvent(`event_processor`, u),
            Jp("An event processor returned `null`, will not send event.")
          );
        return t.data && t.data.__sentry__ === !0 ? e : em(tm(this, i, e, t), c);
      })
      .then((i) => {
        if (i === null) {
          if ((this.recordDroppedEvent(`before_send`, u), o)) {
            let t = 1 + (e.spans || []).length;
            this.recordDroppedEvent(`before_send`, `span`, t);
          }
          throw Jp(`${c} returned \`null\`, will not send event.`);
        }
        let a = n.getSession() || r.getSession();
        if ((s && a && this._updateSessionFromEvent(a, i), o)) {
          let e =
            (i.sdkProcessingMetadata?.spanCountBeforeProcessing || 0) -
            (i.spans ? i.spans.length : 0);
          e > 0 && this.recordDroppedEvent(`before_send`, `span`, e);
        }
        let l = i.transaction_info;
        return (
          o &&
            l &&
            i.transaction !== e.transaction &&
            (i.transaction_info = { ...l, source: `custom` }),
          this.sendEvent(i, t),
          i
        );
      })
      .then(null, (e) => {
        throw Xp(e) || Yp(e)
          ? e
          : (this.captureException(e, {
              mechanism: { handled: !1, type: `internal` },
              data: { __sentry__: !0 },
              originalException: e,
            }),
            qp(
              `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.\nReason: ${e}`,
            ));
      });
  }
  _process(e, t) {
    (this._numProcessing++,
      this._promiseBuffer.add(e).then(
        (e) => (this._numProcessing--, e),
        (e) => (this._numProcessing--, e === Ap && this.recordDroppedEvent(`queue_overflow`, t), e),
      ));
  }
  _clearOutcomes() {
    let e = this._outcomes;
    return (
      (this._outcomes = {}),
      Object.entries(e).map(([e, t]) => {
        let [n, r] = e.split(`:`);
        return { reason: n, category: r, quantity: t };
      })
    );
  }
  _flushOutcomes() {
    R && B.log(`Flushing outcomes...`);
    let e = this._clearOutcomes();
    if (e.length === 0) {
      R && B.log(`No outcomes to send`);
      return;
    }
    if (!this._dsn) {
      R && B.log(`No dsn provided, will not send outcomes`);
      return;
    }
    R && B.log(`Sending outcomes:`, e);
    let t = Rp(e, this._options.tunnel && xu(this._dsn));
    this.sendEnvelope(t);
  }
};
function $p(e) {
  return e === `replay_event` ? `replay` : e || `error`;
}
function em(e, t) {
  let n = `${t} must return \`null\` or a valid event.`;
  if (zc(e))
    return e.then(
      (e) => {
        if (!Fc(e) && e !== null) throw qp(n);
        return e;
      },
      (e) => {
        throw qp(`${t} rejected with ${e}`);
      },
    );
  if (!Fc(e) && e !== null) throw qp(n);
  return e;
}
function tm(e, t, n, r) {
  let { beforeSend: i, beforeSendTransaction: a, beforeSendSpan: o, ignoreSpans: s } = t,
    c = n;
  if (nm(c) && i) return i(c, r);
  if (rm(c)) {
    if (o || s) {
      let t = Bp(c);
      if (s?.length && ad(t, s)) return null;
      if (o) {
        let e = o(t);
        e ? (c = Dl(n, Vp(e))) : ed();
      }
      if (c.spans) {
        let t = [],
          n = c.spans;
        for (let e of n) {
          if (s?.length && ad(e, s)) {
            od(n, e);
            continue;
          }
          if (o) {
            let n = o(e);
            n ? t.push(n) : (ed(), t.push(e));
          } else t.push(e);
        }
        let r = c.spans.length - t.length;
        (r && e.recordDroppedEvent(`before_send`, `span`, r), (c.spans = t));
      }
    }
    if (a) {
      if (c.spans) {
        let e = c.spans.length;
        c.sdkProcessingMetadata = { ...n.sdkProcessingMetadata, spanCountBeforeProcessing: e };
      }
      return a(c, r);
    }
  }
  return c;
}
function nm(e) {
  return e.type === void 0;
}
function rm(e) {
  return e.type === `transaction`;
}
function im(e) {
  let t = 0;
  return (e.name && (t += e.name.length * 2), (t += 8), t + om(e.attributes));
}
function am(e) {
  let t = 0;
  return (e.message && (t += e.message.length * 2), t + om(e.attributes));
}
function om(e) {
  if (!e) return 0;
  let t = 0;
  return (
    Object.values(e).forEach((e) => {
      Array.isArray(e) ? (t += e.length * sm(e[0])) : Pc(e) ? (t += sm(e)) : (t += 100);
    }),
    t
  );
}
function sm(e) {
  return typeof e == `string`
    ? e.length * 2
    : typeof e == `number`
      ? 8
      : typeof e == `boolean`
        ? 4
        : 0;
}
function cm(e, t, n, r, i) {
  let a = { sent_at: new Date().toISOString() };
  return (
    n?.sdk && (a.sdk = { name: n.sdk.name, version: n.sdk.version }),
    r && i && (a.dsn = xu(i)),
    t && (a.trace = t),
    Cd(a, [lm(e)])
  );
}
function lm(e) {
  return [{ type: `check_in` }, e];
}
function um(e) {
  let t = e._metadata?.sdk,
    n = t?.name && t?.version ? `${t?.name}/${t?.version}` : void 0;
  e.transportOptions = {
    ...e.transportOptions,
    headers: { ...(n && { "user-agent": n }), ...e.transportOptions?.headers },
  };
}
function dm(e, t) {
  return e(t.stack || ``, 1);
}
function fm(e, t) {
  let n = { type: t.name || t.constructor.name, value: t.message },
    r = dm(e, t);
  return (r.length && (n.stacktrace = { frames: r }), n);
}
function pm(e) {
  for (let t in e)
    if (Object.prototype.hasOwnProperty.call(e, t)) {
      let n = e[t];
      if (n instanceof Error) return n;
    }
}
function mm(e) {
  if (`name` in e && typeof e.name == `string`) {
    let t = `'${e.name}' captured as exception`;
    return (
      `message` in e && typeof e.message == `string` && (t += ` with message '${e.message}'`),
      t
    );
  }
  if (`message` in e && typeof e.message == `string`) return e.message;
  let t = el(e);
  if (jc(e)) return `Event \`ErrorEvent\` captured as exception with message \`${e.message}\``;
  let n = hm(e);
  return `${n && n !== `Object` ? `'${n}'` : `Object`} captured as exception with keys: ${t}`;
}
function hm(e) {
  try {
    let t = Object.getPrototypeOf(e);
    return t ? t.constructor.name : void 0;
  } catch {}
}
function gm(e, t, n, r) {
  if (kc(n)) return [n, void 0];
  if (((t.synthetic = !0), Fc(n))) {
    let t = e?.getOptions().normalizeDepth,
      i = { __serialized__: gd(n, t) },
      a = pm(n);
    if (a) return [a, i];
    let o = mm(n),
      s = r?.syntheticException || Error(o);
    return ((s.message = o), [s, i]);
  }
  let i = r?.syntheticException || Error(n);
  return ((i.message = `${n}`), [i, void 0]);
}
function _m(e, t, n, r) {
  let i = (r?.data && r.data.mechanism) || { handled: !0, type: `generic` },
    [a, o] = gm(e, i, n, r),
    s = { exception: { values: [fm(t, a)] } };
  return (o && (s.extra = o), dl(s, void 0, void 0), fl(s, i), { ...s, event_id: r?.event_id });
}
function vm(e, t, n = `info`, r, i) {
  let a = { event_id: r?.event_id, level: n };
  if (i && r?.syntheticException) {
    let n = dm(e, r.syntheticException);
    n.length &&
      ((a.exception = { values: [{ value: t, stacktrace: { frames: n } }] }),
      fl(a, { synthetic: !0 }));
  }
  if (Nc(t)) {
    let { __sentry_template_string__: e, __sentry_template_values__: n } = t;
    return ((a.logentry = { message: e, params: n }), a);
  }
  return ((a.message = t), a);
}
var ym = class extends Qp {
  constructor(e) {
    (nd(), um(e), super(e), this._setUpMetricsProcessing());
  }
  eventFromException(e, t) {
    let n = _m(this, this._options.stackParser, e, t);
    return ((n.level = `error`), pf(n));
  }
  eventFromMessage(e, t = `info`, n) {
    return pf(vm(this._options.stackParser, e, t, n, this._options.attachStacktrace));
  }
  captureException(e, t, n) {
    return (bm(t), super.captureException(e, t, n));
  }
  captureEvent(e, t, n) {
    return (
      !e.type && e.exception?.values && e.exception.values.length > 0 && bm(t),
      super.captureEvent(e, t, n)
    );
  }
  captureCheckIn(e, t, n) {
    let r = `checkInId` in e && e.checkInId ? e.checkInId : V();
    if (!this._isEnabled()) return (R && B.warn(`SDK not enabled, will not capture check-in.`), r);
    let { release: i, environment: a, tunnel: o } = this.getOptions(),
      s = {
        check_in_id: r,
        monitor_slug: e.monitorSlug,
        status: e.status,
        release: i,
        environment: a,
      };
    (`duration` in e && (s.duration = e.duration),
      t &&
        (s.monitor_config = {
          schedule: t.schedule,
          checkin_margin: t.checkinMargin,
          max_runtime: t.maxRuntime,
          timezone: t.timezone,
          failure_issue_threshold: t.failureIssueThreshold,
          recovery_threshold: t.recoveryThreshold,
        }));
    let [c, l] = up(this, n);
    l && (s.contexts = { trace: l });
    let u = cm(s, c, this.getSdkMetadata(), o, this.getDsn());
    return (R && B.log(`Sending checkin:`, e.monitorSlug, e.status), this.sendEnvelope(u), r);
  }
  _prepareEvent(e, t, n, r) {
    return (
      this._options.platform && (e.platform = e.platform || this._options.platform),
      this._options.runtime &&
        (e.contexts = { ...e.contexts, runtime: e.contexts?.runtime || this._options.runtime }),
      this._options.serverName && (e.server_name = e.server_name || this._options.serverName),
      super._prepareEvent(e, t, n, r)
    );
  }
  _setUpMetricsProcessing() {
    this.on(`processMetric`, (e) => {
      this._options.serverName &&
        (e.attributes = { "server.address": this._options.serverName, ...e.attributes });
    });
  }
};
function bm(e) {
  let t = U().getScopeData().sdkProcessingMetadata.requestSession;
  if (t) {
    let n = e?.mechanism?.handled ?? !0;
    n && t.status !== `crashed` ? (t.status = `errored`) : n || (t.status = `crashed`);
  }
}
var xm = 5e3,
  Sm = 36e5;
function Cm(e) {
  function t(...e) {
    R && B.log(`[Offline]:`, ...e);
  }
  return (n) => {
    let r = e(n);
    if (!n.createStore) throw Error("No `createStore` function was provided");
    let i = n.createStore(n),
      a = xm,
      o;
    function s(e, t, r) {
      return Ed(e, [`client_report`]) ? !1 : !n.shouldStore || n.shouldStore(e, t, r);
    }
    function c(e) {
      (o && clearTimeout(o),
        (o = setTimeout(async () => {
          o = void 0;
          let e = await i.shift();
          e &&
            (t(`Attempting to send previously queued event`),
            (e[0].sent_at = new Date().toISOString()),
            u(e, !0).catch((e) => {
              t(`Failed to retry sending`, e);
            }));
        }, e)),
        typeof o != `number` && o.unref && o.unref());
    }
    function l() {
      o || (c(a), (a = Math.min(a * 2, Sm)));
    }
    async function u(e, o = !1) {
      if (!o && Ed(e, [`replay_event`, `replay_recording`])) return (await i.push(e), c(100), {});
      try {
        if (n.shouldSend && (await n.shouldSend(e)) === !1)
          throw Error("Envelope not sent because `shouldSend` callback returned false");
        let t = await r.send(e),
          i = 100;
        if (t) {
          if (t.headers?.[`retry-after`]) i = Np(t.headers[`retry-after`]);
          else if (t.headers?.[`x-sentry-rate-limits`]) i = 6e4;
          else if ((t.statusCode || 0) >= 400) return t;
        }
        return (c(i), (a = xm), t);
      } catch (n) {
        if (await s(e, n, a))
          return (
            o ? await i.unshift(e) : await i.push(e),
            l(),
            t(`Error sending. Event queued.`, n),
            {}
          );
        throw n;
      }
    }
    return (
      n.flushAtStartup && l(),
      { send: u, flush: (e) => (e === void 0 && ((a = xm), c(100)), r.flush(e)) }
    );
  };
}
var wm = new Set();
function Tm() {
  (wm.clear(), R && B.log(`Cleared AI provider skip registrations`));
}
function Em(e) {
  if (!e) return {};
  let t = e.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
  if (!t) return {};
  let n = t[6] || ``,
    r = t[8] || ``;
  return { host: t[4], path: t[5], protocol: t[2], search: n, hash: r, relative: t[5] + n + r };
}
function Dm(e) {
  return e.split(/[?#]/, 1)[0];
}
function Om(e) {
  let { protocol: t, host: n, path: r } = e,
    i =
      n
        ?.replace(/^.*@/, `[filtered]:[filtered]@`)
        .replace(/(:80)$/, ``)
        .replace(/(:443)$/, ``) || ``;
  return `${t ? `${t}://` : ``}${i}${r}`;
}
function km(e, ...t) {
  let n = new String(String.raw(e, ...t));
  return (
    (n.__sentry_template_string__ = e.join(`\0`).replace(/%/g, `%%`).replace(/\0/g, `%s`)),
    (n.__sentry_template_values__ = t),
    n
  );
}
var Am = km;
function jm(e) {
  `aggregates` in e
    ? e.attrs?.ip_address === void 0 && (e.attrs = { ...e.attrs, ip_address: `{{auto}}` })
    : e.ipAddress === void 0 && (e.ipAddress = `{{auto}}`);
}
function Mm(e, t, n = [t], r = `npm`) {
  let i = e._metadata || {};
  ((i.sdk ||= {
    name: `sentry.javascript.${t}`,
    packages: n.map((e) => ({ name: `${r}:@sentry/${e}`, version: Gs })),
    version: Gs,
  }),
    (e._metadata = i));
}
function Nm(e = {}) {
  let t = e.client || W();
  if (!Jf() || !t) return {};
  let n = Wl(Ks());
  if (n.getTraceData) return n.getTraceData(e);
  let r = e.scope || H(),
    i = e.span || $u(),
    a = i ? zu(i) : Pm(r),
    o = mu(i ? pd(i) : fd(t, r));
  if (!ku.test(a)) return (B.warn(`Invalid sentry-trace data. Cannot generate trace data`), {});
  let s = { "sentry-trace": a, baggage: o };
  if (e.propagateTraceparent) {
    let e = i ? Bu(i) : Fm(r);
    e && (s.traceparent = e);
  }
  return s;
}
function Pm(e) {
  let { traceId: t, sampled: n, propagationSpanId: r } = e.getPropagationContext();
  return Mu(t, r, n);
}
function Fm(e) {
  let { traceId: t, sampled: n, propagationSpanId: r } = e.getPropagationContext();
  return Nu(t, r, n);
}
function Im(e, t, n) {
  let r,
    i,
    a,
    o = n?.maxWait ? Math.max(n.maxWait, t) : 0,
    s = n?.setTimeoutImpl || setTimeout;
  function c() {
    return (l(), (r = e()), r);
  }
  function l() {
    (i !== void 0 && clearTimeout(i), a !== void 0 && clearTimeout(a), (i = a = void 0));
  }
  function u() {
    return i !== void 0 || a !== void 0 ? c() : r;
  }
  function d() {
    return (i && clearTimeout(i), (i = s(c, t)), o && a === void 0 && (a = s(c, o)), r);
  }
  return ((d.cancel = l), (d.flush = u), d);
}
var Lm = 100;
function Rm(e, t) {
  let n = W(),
    r = U();
  if (!n) return;
  let { beforeBreadcrumb: i = null, maxBreadcrumbs: a = Lm } = n.getOptions();
  if (a <= 0) return;
  let o = { timestamp: yl(), ...e },
    s = i ? Qs(() => i(o, t)) : o;
  s !== null && (n.emit && n.emit(`beforeAddBreadcrumb`, s, t), r.addBreadcrumb(s, a));
}
var zm,
  Bm = `FunctionToString`,
  Vm = new WeakMap(),
  Hm = q(() => ({
    name: Bm,
    setupOnce() {
      zm = Function.prototype.toString;
      try {
        Function.prototype.toString = function (...e) {
          let t = Xc(this),
            n = Vm.has(W()) && t !== void 0 ? t : this;
          return zm.apply(n, e);
        };
      } catch {}
    },
    setup(e) {
      Vm.set(e, !0);
    },
  })),
  Um = [
    /^Script error\.?$/,
    /^Javascript error: Script error\.? on line 0$/,
    /^ResizeObserver loop completed with undelivered notifications.$/,
    /^Cannot redefine property: googletag$/,
    /^Can't find variable: gmo$/,
    /^undefined is not an object \(evaluating 'a\.[A-Z]'\)$/,
    `can't redefine non-configurable property "solana"`,
    `vv().getRestrictions is not a function. (In 'vv().getRestrictions(1,a)', 'vv().getRestrictions' is undefined)`,
    `Can't find variable: _AutofillCallbackHandler`,
    /^Non-Error promise rejection captured with value: Object Not Found Matching Id:\d+, MethodName:simulateEvent, ParamCount:\d+$/,
    /^Java exception was raised during method invocation$/,
  ],
  Wm = `EventFilters`,
  Gm = q((e = {}) => {
    let t;
    return {
      name: Wm,
      setup(n) {
        t = Km(e, n.getOptions());
      },
      processEvent(n, r, i) {
        return ((t ||= Km(e, i.getOptions())), qm(n, t) ? null : n);
      },
    };
  });
function Km(e = {}, t = {}) {
  return {
    allowUrls: [...(e.allowUrls || []), ...(t.allowUrls || [])],
    denyUrls: [...(e.denyUrls || []), ...(t.denyUrls || [])],
    ignoreErrors: [
      ...(e.ignoreErrors || []),
      ...(t.ignoreErrors || []),
      ...(e.disableErrorDefaults ? [] : Um),
    ],
    ignoreTransactions: [...(e.ignoreTransactions || []), ...(t.ignoreTransactions || [])],
  };
}
function qm(e, t) {
  if (!e.type) {
    if (Jm(e, t.ignoreErrors))
      return (
        R &&
          B.warn(`Event dropped due to being matched by \`ignoreErrors\` option.\nEvent: ${ul(e)}`),
        !0
      );
    if (eh(e))
      return (
        R &&
          B.warn(
            `Event dropped due to not having an error message, error type or stacktrace.\nEvent: ${ul(e)}`,
          ),
        !0
      );
    if (Xm(e, t.denyUrls))
      return (
        R &&
          B.warn(
            `Event dropped due to being matched by \`denyUrls\` option.\nEvent: ${ul(e)}.\nUrl: ${$m(e)}`,
          ),
        !0
      );
    if (!Zm(e, t.allowUrls))
      return (
        R &&
          B.warn(
            `Event dropped due to not being matched by \`allowUrls\` option.\nEvent: ${ul(e)}.\nUrl: ${$m(e)}`,
          ),
        !0
      );
  } else if (e.type === `transaction` && Ym(e, t.ignoreTransactions))
    return (
      R &&
        B.warn(
          `Event dropped due to being matched by \`ignoreTransactions\` option.\nEvent: ${ul(e)}`,
        ),
      !0
    );
  return !1;
}
function Jm(e, t) {
  return t?.length ? zp(e).some((e) => al(e, t)) : !1;
}
function Ym(e, t) {
  if (!t?.length) return !1;
  let n = e.transaction;
  return n ? al(n, t) : !1;
}
function Xm(e, t) {
  if (!t?.length) return !1;
  let n = $m(e);
  return n ? al(n, t) : !1;
}
function Zm(e, t) {
  if (!t?.length) return !0;
  let n = $m(e);
  return !n || al(n, t);
}
function Qm(e = []) {
  for (let t = e.length - 1; t >= 0; t--) {
    let n = e[t];
    if (n && n.filename !== `<anonymous>` && n.filename !== `[native code]`)
      return n.filename || null;
  }
  return null;
}
function $m(e) {
  try {
    let t = [...(e.exception?.values ?? [])]
      .reverse()
      .find((e) => e.mechanism?.parent_id === void 0 && e.stacktrace?.frames?.length)
      ?.stacktrace?.frames;
    return t ? Qm(t) : null;
  } catch {
    return (R && B.error(`Cannot extract url for event ${ul(e)}`), null);
  }
}
function eh(e) {
  return e.exception?.values?.length
    ? !e.message &&
        !e.exception.values.some((e) => e.stacktrace || (e.type && e.type !== `Error`) || e.value)
    : !1;
}
function th(e, t, n, r, i, a) {
  if (!i.exception?.values || !a || !Vc(a.originalException, Error)) return;
  let o =
    i.exception.values.length > 0 ? i.exception.values[i.exception.values.length - 1] : void 0;
  o && (i.exception.values = nh(e, t, r, a.originalException, n, i.exception.values, o, 0));
}
function nh(e, t, n, r, i, a, o, s) {
  if (a.length >= n + 1) return a;
  let c = [...a];
  if (Vc(r[i], Error)) {
    rh(o, s);
    let a = e(t, r[i]),
      l = c.length;
    (ih(a, i, l, s), (c = nh(e, t, n, r[i], i, [a, ...c], a, l)));
  }
  return (
    Array.isArray(r.errors) &&
      r.errors.forEach((r, a) => {
        if (Vc(r, Error)) {
          rh(o, s);
          let l = e(t, r),
            u = c.length;
          (ih(l, `errors[${a}]`, u, s), (c = nh(e, t, n, r, i, [l, ...c], l, u)));
        }
      }),
    c
  );
}
function rh(e, t) {
  e.mechanism = {
    handled: !0,
    type: `auto.core.linked_errors`,
    ...e.mechanism,
    ...(e.type === `AggregateError` && { is_exception_group: !0 }),
    exception_id: t,
  };
}
function ih(e, t, n, r) {
  e.mechanism = {
    handled: !0,
    ...e.mechanism,
    type: `chained`,
    source: t,
    exception_id: n,
    parent_id: r,
  };
}
var ah = `cause`,
  oh = 5,
  sh = `LinkedErrors`,
  ch = q((e = {}) => {
    let t = e.limit || oh,
      n = e.key || ah;
    return {
      name: sh,
      preprocessEvent(e, r, i) {
        th(fm, i.getOptions().stackParser, n, t, e, r);
      },
    };
  });
function lh(e) {
  let t = `console`;
  (yc(t, e), bc(t, uh));
}
function uh() {
  `console` in z &&
    Ys.forEach(function (e) {
      e in z.console &&
        qc(z.console, e, function (t) {
          return (
            (Zs[e] = t),
            function (...t) {
              (xc(`console`, { args: t, level: e }), Zs[e]?.apply(z.console, t));
            }
          );
        });
    });
}
function dh(e) {
  return e === `warn`
    ? `warning`
    : [`fatal`, `error`, `warning`, `log`, `info`, `debug`].includes(e)
      ? e
      : `log`;
}
function fh(e, t) {
  let n = 0;
  for (let t = e.length - 1; t >= 0; t--) {
    let r = e[t];
    r === `.` ? e.splice(t, 1) : r === `..` ? (e.splice(t, 1), n++) : n && (e.splice(t, 1), n--);
  }
  if (t) for (; n--;) e.unshift(`..`);
  return e;
}
var ph = /^(\S+:\\|\/?)([\s\S]*?)((?:\.{1,2}|[^/\\]+?|)(\.[^./\\]*|))(?:[/\\]*)$/;
function mh(e) {
  let t = e.length > 1024 ? `<truncated>${e.slice(-1024)}` : e,
    n = ph.exec(t);
  return n ? n.slice(1) : [];
}
function hh(...e) {
  let t = ``,
    n = !1;
  for (let r = e.length - 1; r >= -1 && !n; r--) {
    let i = r >= 0 ? e[r] : `/`;
    i && ((t = `${i}/${t}`), (n = i.charAt(0) === `/`));
  }
  return (
    (t = fh(
      t.split(`/`).filter((e) => !!e),
      !n,
    ).join(`/`)),
    (n ? `/` : ``) + t || `.`
  );
}
function gh(e) {
  let t = 0;
  for (; t < e.length && e[t] === ``; t++);
  let n = e.length - 1;
  for (; n >= 0 && e[n] === ``; n--);
  return t > n ? [] : e.slice(t, n - t + 1);
}
function _h(e, t) {
  ((e = hh(e).slice(1)), (t = hh(t).slice(1)));
  let n = gh(e.split(`/`)),
    r = gh(t.split(`/`)),
    i = Math.min(n.length, r.length),
    a = i;
  for (let e = 0; e < i; e++)
    if (n[e] !== r[e]) {
      a = e;
      break;
    }
  let o = [];
  for (let e = a; e < n.length; e++) o.push(`..`);
  return ((o = o.concat(r.slice(a))), o.join(`/`));
}
function vh(e) {
  let t = mh(e),
    n = t[0] || ``,
    r = t[1];
  return !n && !r ? `.` : ((r &&= r.slice(0, r.length - 1)), n + r);
}
function yh(e, t) {
  let n = mh(e)[2] || ``;
  return (t && n.slice(t.length * -1) === t && (n = n.slice(0, n.length - t.length)), n);
}
var bh = `RewriteFrames`,
  xh = q((e = {}) => {
    let t = e.root,
      n = e.prefix || `app:///`,
      r = `window` in z && !!z.window,
      i = e.iteratee || Sh({ isBrowser: r, root: t, prefix: n });
    function a(e) {
      try {
        return {
          ...e,
          exception: {
            ...e.exception,
            values: e.exception.values.map((e) => ({
              ...e,
              ...(e.stacktrace && { stacktrace: o(e.stacktrace) }),
            })),
          },
        };
      } catch {
        return e;
      }
    }
    function o(e) {
      return { ...e, frames: e?.frames?.map((e) => i(e)) };
    }
    return {
      name: bh,
      processEvent(e) {
        let t = e;
        return (e.exception && Array.isArray(e.exception.values) && (t = a(t)), t);
      },
    };
  });
function Sh({ isBrowser: e, root: t, prefix: n }) {
  return (r) => {
    if (!r.filename) return r;
    let i =
        /^[a-zA-Z]:\\/.test(r.filename) || (r.filename.includes(`\\`) && !r.filename.includes(`/`)),
      a = /^\//.test(r.filename);
    if (e) {
      if (t) {
        let e = r.filename;
        e.indexOf(t) === 0 && (r.filename = e.replace(t, n));
      }
    } else if (i || a) {
      let e = i ? r.filename.replace(/^[a-zA-Z]:/, ``).replace(/\\/g, `/`) : r.filename;
      r.filename = `${n}${t ? _h(t, e) : yh(e)}`;
    }
    return r;
  };
}
var Ch = `Console`,
  wh = q((e = {}) => {
    let t = new Set(e.levels || Ys);
    return {
      name: Ch,
      setup(e) {
        lh(({ args: n, level: r }) => {
          W() === e && t.has(r) && Th(r, n);
        });
      },
    };
  });
function Th(e, t) {
  let n = {
    category: `console`,
    data: { arguments: t, logger: `console` },
    level: dh(e),
    message: Eh(t),
  };
  if (e === `assert`) {
    if (t[0] === !1) {
      let e = t.slice(1);
      ((n.message = e.length > 0 ? `Assertion failed: ${Eh(e)}` : `Assertion failed`),
        (n.data.arguments = e));
    } else return;
  }
  Rm(n, { input: t, level: e });
}
function Eh(e) {
  return `util` in z && typeof z.util.format == `function` ? z.util.format(...e) : rl(e, ` `);
}
function Dh(e) {
  if (e !== void 0) {
    if (e >= 400 && e < 500) return `warning`;
    if (e >= 500) return `error`;
  }
}
function Oh(e, t = !1) {
  return (
    !(
      t ||
      (e &&
        !e.startsWith(`/`) &&
        !e.match(/^[A-Z]:/) &&
        !e.startsWith(`.`) &&
        !e.match(/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//))
    ) &&
    e !== void 0 &&
    !e.includes(`node_modules/`)
  );
}
function kh(e) {
  let t = /^\s*[-]{4,}$/,
    n = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/,
    r = /at (?:async )?(.+?) \(data:(.*?),/;
  return (i) => {
    let a = i.match(r);
    if (a) return { filename: `<data:${a[2]}>`, function: a[1] };
    let o = i.match(n);
    if (o) {
      let t, n, r, i, a;
      if (o[1]) {
        r = o[1];
        let e = r.lastIndexOf(`.`);
        if ((r[e - 1] === `.` && e--, e > 0)) {
          ((t = r.slice(0, e)), (n = r.slice(e + 1)));
          let i = t.indexOf(`.Module`);
          i > 0 && ((r = r.slice(i + 1)), (t = t.slice(0, i)));
        }
        i = void 0;
      }
      (n && ((i = t), (a = n)),
        n === `<anonymous>` && ((a = void 0), (r = void 0)),
        r === void 0 && ((a ||= `?`), (r = i ? `${i}.${a}` : a)));
      let s = o[2]?.startsWith(`file://`) ? o[2].slice(7) : o[2],
        c = o[5] === `native`;
      return (
        s?.match(/\/[A-Z]:/) && (s = s.slice(1)),
        !s && o[5] && !c && (s = o[5]),
        {
          filename: s ? decodeURI(s) : void 0,
          module: e ? e(s) : void 0,
          function: r,
          lineno: jh(o[3]),
          colno: jh(o[4]),
          in_app: Oh(s || ``, c),
        }
      );
    }
    if (i.match(t)) return { filename: i };
  };
}
function Ah(e) {
  return [90, kh(e)];
}
function jh(e) {
  return parseInt(e || ``, 10) || void 0;
}
function Mh(e, t, n, r) {
  let i = e(),
    a = !1,
    o = !0;
  return (
    setInterval(() => {
      let e = i.getTimeMs();
      (a === !1 && e > t + n && ((a = !0), o && r()), e < t + n && (a = !1));
    }, 20),
    {
      poll: () => {
        i.reset();
      },
      enabled: (e) => {
        o = e;
      },
    }
  );
}
function Nh(e, t, n) {
  let r = t ? t.replace(/^file:\/\//, ``) : void 0,
    i = e.location.columnNumber ? e.location.columnNumber + 1 : void 0,
    a = e.location.lineNumber ? e.location.lineNumber + 1 : void 0;
  return {
    filename: r,
    module: n(r),
    function: e.functionName || `?`,
    colno: i,
    lineno: a,
    in_app: r ? Oh(r) : void 0,
  };
}
var Ph = class {
  constructor(e) {
    ((this._maxSize = e), (this._cache = new Map()));
  }
  get size() {
    return this._cache.size;
  }
  get(e) {
    let t = this._cache.get(e);
    if (t !== void 0) return (this._cache.delete(e), this._cache.set(e, t), t);
  }
  set(e, t) {
    if (this._cache.size >= this._maxSize) {
      let e = this._cache.keys().next().value;
      this._cache.delete(e);
    }
    this._cache.set(e, t);
  }
  remove(e) {
    let t = this._cache.get(e);
    return (t && this._cache.delete(e), t);
  }
  clear() {
    this._cache.clear();
  }
  keys() {
    return Array.from(this._cache.keys());
  }
  values() {
    let e = [];
    return (this._cache.forEach((t) => e.push(t)), e);
  }
};
function Fh(e, ...t) {
  let [n, r, i, a] = t;
  if (Array.isArray(r)) {
    let t = { ...i };
    ((t[`sentry.message.template`] = n),
      r.forEach((e, n) => {
        t[`sentry.message.parameter.${n}`] = e;
      }),
      vp({ level: e, message: (0, s.format)(n, ...r), attributes: t }, a?.scope));
  } else vp({ level: e, message: n, attributes: r }, i?.scope ?? a?.scope);
}
function Ih(...e) {
  Fh(`info`, ...e);
}
function Lh(...e) {
  Fh(`warn`, ...e);
}
function Rh(...e) {
  Fh(`error`, ...e);
}
Ws();
var zh = {};
function Bh(e, t, n) {
  return n ? Hh(e, t, n) : Vh(e, t);
}
function Vh(e, t) {
  return Object.assign(
    (n) => {
      let r = zh[e];
      if (r) return (n && r.setConfig(n), r);
      let i = t(n);
      return ((zh[e] = i), po({ instrumentations: [i] }), i);
    },
    { id: e },
  );
}
function Hh(e, t, n) {
  return Object.assign(
    (r) => {
      let i = n(r),
        a = zh[e];
      if (a) return (a.setConfig(i), a);
      let o = new t(i);
      return ((zh[e] = o), po({ instrumentations: [o] }), o);
    },
    { id: e },
  );
}
var Uh = typeof __SENTRY_DEBUG__ > `u` || __SENTRY_DEBUG__;
function Wh() {
  return `unknown_service:${process.argv0}`;
}
var Gh = (e) => typeof e == `object` && !!e && typeof e.then == `function`,
  J = e.a(N());
F();
var Y = Wr(),
  Kh = class e {
    _rawAttributes;
    _asyncAttributesPending = !1;
    _schemaUrl;
    _memoizedAttributes;
    static FromAttributeList(t, n) {
      let r = new e({}, n);
      return (
        (r._rawAttributes = Yh(t)),
        (r._asyncAttributesPending = t.filter(([e, t]) => Gh(t)).length > 0),
        r
      );
    }
    constructor(e, t) {
      let n = e.attributes ?? {};
      ((this._rawAttributes = Object.entries(n).map(
        ([e, t]) => (Gh(t) && (this._asyncAttributesPending = !0), [e, t]),
      )),
        (this._rawAttributes = Yh(this._rawAttributes)),
        (this._schemaUrl = Xh(t?.schemaUrl)));
    }
    get asyncAttributesPending() {
      return this._asyncAttributesPending;
    }
    async waitForAsyncAttributes() {
      if (this.asyncAttributesPending) {
        for (let e = 0; e < this._rawAttributes.length; e++) {
          let [t, n] = this._rawAttributes[e];
          this._rawAttributes[e] = [t, Gh(n) ? await n : n];
        }
        this._asyncAttributesPending = !1;
      }
    }
    get attributes() {
      if (
        (this.asyncAttributesPending &&
          J.diag.error(`Accessing resource attributes before async attributes settled`),
        this._memoizedAttributes)
      )
        return this._memoizedAttributes;
      let e = {};
      for (let [t, n] of this._rawAttributes) {
        if (Gh(n)) {
          J.diag.debug(`Unsettled resource attribute ${t} skipped`);
          continue;
        }
        n != null && (e[t] ??= n);
      }
      return (this._asyncAttributesPending || (this._memoizedAttributes = e), e);
    }
    getRawAttributes() {
      return this._rawAttributes;
    }
    get schemaUrl() {
      return this._schemaUrl;
    }
    merge(t) {
      if (t == null) return this;
      let n = Zh(this, t),
        r = n ? { schemaUrl: n } : void 0;
      return e.FromAttributeList([...t.getRawAttributes(), ...this.getRawAttributes()], r);
    }
  };
function qh(e, t) {
  return Kh.FromAttributeList(Object.entries(e), t);
}
function Jh() {
  return qh({
    [Y.ATTR_SERVICE_NAME]: Wh(),
    [Y.ATTR_TELEMETRY_SDK_LANGUAGE]: Jr[Y.ATTR_TELEMETRY_SDK_LANGUAGE],
    [Y.ATTR_TELEMETRY_SDK_NAME]: Jr[Y.ATTR_TELEMETRY_SDK_NAME],
    [Y.ATTR_TELEMETRY_SDK_VERSION]: Jr[Y.ATTR_TELEMETRY_SDK_VERSION],
  });
}
function Yh(e) {
  return e.map(([e, t]) =>
    Gh(t)
      ? [
          e,
          t.catch((t) => {
            J.diag.debug(`promise rejection for resource attribute: %s - %s`, e, t);
          }),
        ]
      : [e, t],
  );
}
function Xh(e) {
  if (typeof e == `string` || e === void 0) return e;
  J.diag.warn(`Schema URL must be string or undefined, got %s. Schema URL will be ignored.`, e);
}
function Zh(e, t) {
  let n = e?.schemaUrl,
    r = t?.schemaUrl,
    i = n === void 0 || n === ``,
    a = r === void 0 || r === ``;
  if (i) return r;
  if (a || n === r) return n;
  J.diag.warn(
    `Schema URL merge conflict: old resource has "%s", updating resource has "%s". Resulting resource will have undefined Schema URL.`,
    n,
    r,
  );
}
var Qh = `exception`;
F();
var $h = class {
    _spanContext;
    kind;
    parentSpanContext;
    attributes = {};
    links = [];
    events = [];
    startTime;
    resource;
    instrumentationScope;
    _droppedAttributesCount = 0;
    _droppedEventsCount = 0;
    _droppedLinksCount = 0;
    name;
    status = { code: J.SpanStatusCode.UNSET };
    endTime = [0, 0];
    _ended = !1;
    _duration = [-1, -1];
    _spanProcessor;
    _spanLimits;
    _attributeValueLengthLimit;
    _performanceStartTime;
    _performanceOffset;
    _startTimeProvided;
    constructor(e) {
      let t = Date.now();
      ((this._spanContext = e.spanContext),
        (this._performanceStartTime = Mr.now()),
        (this._performanceOffset = t - (this._performanceStartTime + $r())),
        (this._startTimeProvided = e.startTime != null),
        (this._spanLimits = e.spanLimits),
        (this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit || 0),
        (this._spanProcessor = e.spanProcessor),
        (this.name = e.name),
        (this.parentSpanContext = e.parentSpanContext),
        (this.kind = e.kind),
        (this.links = e.links || []),
        (this.startTime = this._getTime(e.startTime ?? t)),
        (this.resource = e.resource),
        (this.instrumentationScope = e.scope),
        e.attributes != null && this.setAttributes(e.attributes),
        this._spanProcessor.onStart(this, e.context));
    }
    spanContext() {
      return this._spanContext;
    }
    setAttribute(e, t) {
      if (t == null || this._isSpanEnded()) return this;
      if (e.length === 0) return (J.diag.warn(`Invalid attribute key: ${e}`), this);
      if (!dr(t)) return (J.diag.warn(`Invalid attribute value set for key: ${e}`), this);
      let { attributeCountLimit: n } = this._spanLimits;
      return n !== void 0 &&
        Object.keys(this.attributes).length >= n &&
        !Object.prototype.hasOwnProperty.call(this.attributes, e)
        ? (this._droppedAttributesCount++, this)
        : ((this.attributes[e] = this._truncateToSize(t)), this);
    }
    setAttributes(e) {
      for (let [t, n] of Object.entries(e)) this.setAttribute(t, n);
      return this;
    }
    addEvent(e, t, n) {
      if (this._isSpanEnded()) return this;
      let { eventCountLimit: r } = this._spanLimits;
      if (r === 0) return (J.diag.warn(`No events allowed.`), this._droppedEventsCount++, this);
      (r !== void 0 &&
        this.events.length >= r &&
        (this._droppedEventsCount === 0 && J.diag.debug(`Dropping extra events.`),
        this.events.shift(),
        this._droppedEventsCount++),
        ci(t) && (ci(n) || (n = t), (t = void 0)));
      let i = lr(t);
      return (
        this.events.push({
          name: e,
          attributes: i,
          time: this._getTime(n),
          droppedAttributesCount: 0,
        }),
        this
      );
    }
    addLink(e) {
      return (this.links.push(e), this);
    }
    addLinks(e) {
      return (this.links.push(...e), this);
    }
    setStatus(e) {
      return this._isSpanEnded()
        ? this
        : ((this.status = { ...e }),
          this.status.message != null &&
            typeof e.message != `string` &&
            (J.diag.warn(
              `Dropping invalid status.message of type '${typeof e.message}', expected 'string'`,
            ),
            delete this.status.message),
          this);
    }
    updateName(e) {
      return (this._isSpanEnded() || (this.name = e), this);
    }
    end(e) {
      if (this._isSpanEnded()) {
        J.diag.error(
          `${this.name} ${this._spanContext.traceId}-${this._spanContext.spanId} - You can only call end() on a span once.`,
        );
        return;
      }
      ((this._ended = !0),
        (this.endTime = this._getTime(e)),
        (this._duration = ni(this.startTime, this.endTime)),
        this._duration[0] < 0 &&
          (J.diag.warn(
            `Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.`,
            this.startTime,
            this.endTime,
          ),
          (this.endTime = this.startTime.slice()),
          (this._duration = [0, 0])),
        this._droppedEventsCount > 0 &&
          J.diag.warn(`Dropped ${this._droppedEventsCount} events because eventCountLimit reached`),
        this._spanProcessor.onEnd(this));
    }
    _getTime(e) {
      if (typeof e == `number` && e <= Mr.now()) return ei(e + this._performanceOffset);
      if (typeof e == `number`) return Qr(e);
      if (e instanceof Date) return Qr(e.getTime());
      if (si(e)) return e;
      if (this._startTimeProvided) return Qr(Date.now());
      let t = Mr.now() - this._performanceStartTime;
      return li(this.startTime, Qr(t));
    }
    isRecording() {
      return this._ended === !1;
    }
    recordException(e, t) {
      let n = {};
      (typeof e == `string`
        ? (n[Y.ATTR_EXCEPTION_MESSAGE] = e)
        : e &&
          (e.code
            ? (n[Y.ATTR_EXCEPTION_TYPE] = e.code.toString())
            : e.name && (n[Y.ATTR_EXCEPTION_TYPE] = e.name),
          e.message && (n[Y.ATTR_EXCEPTION_MESSAGE] = e.message),
          e.stack && (n[Y.ATTR_EXCEPTION_STACKTRACE] = e.stack)),
        n[Y.ATTR_EXCEPTION_TYPE] || n[Y.ATTR_EXCEPTION_MESSAGE]
          ? this.addEvent(Qh, n, t)
          : J.diag.warn(`Failed to record an exception ${e}`));
    }
    get duration() {
      return this._duration;
    }
    get ended() {
      return this._ended;
    }
    get droppedAttributesCount() {
      return this._droppedAttributesCount;
    }
    get droppedEventsCount() {
      return this._droppedEventsCount;
    }
    get droppedLinksCount() {
      return this._droppedLinksCount;
    }
    _isSpanEnded() {
      if (this._ended) {
        let e = Error(
          `Operation attempted on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`,
        );
        J.diag.warn(
          `Cannot execute the operation on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`,
          e,
        );
      }
      return this._ended;
    }
    _truncateToLimitUtil(e, t) {
      return e.length <= t ? e : e.substring(0, t);
    }
    _truncateToSize(e) {
      let t = this._attributeValueLengthLimit;
      return t <= 0
        ? (J.diag.warn(`Attribute value limit must be positive, got ${t}`), e)
        : typeof e == `string`
          ? this._truncateToLimitUtil(e, t)
          : Array.isArray(e)
            ? e.map((e) => (typeof e == `string` ? this._truncateToLimitUtil(e, t) : e))
            : e;
    }
  },
  X;
(function (e) {
  ((e[(e.NOT_RECORD = 0)] = `NOT_RECORD`),
    (e[(e.RECORD = 1)] = `RECORD`),
    (e[(e.RECORD_AND_SAMPLED = 2)] = `RECORD_AND_SAMPLED`));
})((X ||= {}));
var eg = class {
    shouldSample() {
      return { decision: X.NOT_RECORD };
    }
    toString() {
      return `AlwaysOffSampler`;
    }
  },
  tg = class {
    shouldSample() {
      return { decision: X.RECORD_AND_SAMPLED };
    }
    toString() {
      return `AlwaysOnSampler`;
    }
  };
F();
var ng = class {
    _root;
    _remoteParentSampled;
    _remoteParentNotSampled;
    _localParentSampled;
    _localParentNotSampled;
    constructor(e) {
      ((this._root = e.root),
        (this._root ||=
          (Sr(Error(`ParentBasedSampler must have a root sampler configured`)), new tg())),
        (this._remoteParentSampled = e.remoteParentSampled ?? new tg()),
        (this._remoteParentNotSampled = e.remoteParentNotSampled ?? new eg()),
        (this._localParentSampled = e.localParentSampled ?? new tg()),
        (this._localParentNotSampled = e.localParentNotSampled ?? new eg()));
    }
    shouldSample(e, t, n, r, i, a) {
      let o = J.trace.getSpanContext(e);
      return !o || !(0, J.isSpanContextValid)(o)
        ? this._root.shouldSample(e, t, n, r, i, a)
        : o.isRemote
          ? o.traceFlags & J.TraceFlags.SAMPLED
            ? this._remoteParentSampled.shouldSample(e, t, n, r, i, a)
            : this._remoteParentNotSampled.shouldSample(e, t, n, r, i, a)
          : o.traceFlags & J.TraceFlags.SAMPLED
            ? this._localParentSampled.shouldSample(e, t, n, r, i, a)
            : this._localParentNotSampled.shouldSample(e, t, n, r, i, a);
    }
    toString() {
      return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
    }
  },
  rg = class {
    _ratio;
    _upperBound;
    constructor(e = 0) {
      ((this._ratio = e),
        (this._ratio = this._normalize(e)),
        (this._upperBound = Math.floor(this._ratio * 4294967295)));
    }
    shouldSample(e, t) {
      return {
        decision:
          (0, J.isValidTraceId)(t) && this._accumulate(t) < this._upperBound
            ? X.RECORD_AND_SAMPLED
            : X.NOT_RECORD,
      };
    }
    toString() {
      return `TraceIdRatioBased{${this._ratio}}`;
    }
    _normalize(e) {
      return typeof e != `number` || isNaN(e) ? 0 : e >= 1 ? 1 : e <= 0 ? 0 : e;
    }
    _accumulate(e) {
      let t = 0;
      for (let n = 0; n < e.length / 8; n++) {
        let r = n * 8,
          i = parseInt(e.slice(r, r + 8), 16);
        t = (t ^ i) >>> 0;
      }
      return t;
    }
  };
F();
var ig;
(function (e) {
  ((e.AlwaysOff = `always_off`),
    (e.AlwaysOn = `always_on`),
    (e.ParentBasedAlwaysOff = `parentbased_always_off`),
    (e.ParentBasedAlwaysOn = `parentbased_always_on`),
    (e.ParentBasedTraceIdRatio = `parentbased_traceidratio`),
    (e.TraceIdRatio = `traceidratio`));
})((ig ||= {}));
var ag = 1;
function og() {
  return {
    sampler: sg(),
    forceFlushTimeoutMillis: 3e4,
    generalLimits: {
      attributeValueLengthLimit: P(`OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT`) ?? 1 / 0,
      attributeCountLimit: P(`OTEL_ATTRIBUTE_COUNT_LIMIT`) ?? 128,
    },
    spanLimits: {
      attributeValueLengthLimit: P(`OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT`) ?? 1 / 0,
      attributeCountLimit: P(`OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT`) ?? 128,
      linkCountLimit: P(`OTEL_SPAN_LINK_COUNT_LIMIT`) ?? 128,
      eventCountLimit: P(`OTEL_SPAN_EVENT_COUNT_LIMIT`) ?? 128,
      attributePerEventCountLimit: P(`OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT`) ?? 128,
      attributePerLinkCountLimit: P(`OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT`) ?? 128,
    },
  };
}
function sg() {
  let e = Tr(`OTEL_TRACES_SAMPLER`) ?? ig.ParentBasedAlwaysOn;
  switch (e) {
    case ig.AlwaysOn:
      return new tg();
    case ig.AlwaysOff:
      return new eg();
    case ig.ParentBasedAlwaysOn:
      return new ng({ root: new tg() });
    case ig.ParentBasedAlwaysOff:
      return new ng({ root: new eg() });
    case ig.TraceIdRatio:
      return new rg(cg());
    case ig.ParentBasedTraceIdRatio:
      return new ng({ root: new rg(cg()) });
    default:
      return (
        J.diag.error(
          `OTEL_TRACES_SAMPLER value "${e}" invalid, defaulting to "${ig.ParentBasedAlwaysOn}".`,
        ),
        new ng({ root: new tg() })
      );
  }
}
function cg() {
  let e = P(`OTEL_TRACES_SAMPLER_ARG`);
  return e == null
    ? (J.diag.error(`OTEL_TRACES_SAMPLER_ARG is blank, defaulting to ${ag}.`), ag)
    : e < 0 || e > 1
      ? (J.diag.error(
          `OTEL_TRACES_SAMPLER_ARG=${e} was given, but it is out of range ([0..1]), defaulting to ${ag}.`,
        ),
        ag)
      : e;
}
F();
function lg(e) {
  let t = { sampler: sg() },
    n = og(),
    r = Object.assign({}, n, t, e);
  return (
    (r.generalLimits = Object.assign({}, n.generalLimits, e.generalLimits || {})),
    (r.spanLimits = Object.assign({}, n.spanLimits, e.spanLimits || {})),
    r
  );
}
function ug(e) {
  let t = Object.assign({}, e.spanLimits);
  return (
    (t.attributeCountLimit =
      e.spanLimits?.attributeCountLimit ??
      e.generalLimits?.attributeCountLimit ??
      P(`OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT`) ??
      P(`OTEL_ATTRIBUTE_COUNT_LIMIT`) ??
      128),
    (t.attributeValueLengthLimit =
      e.spanLimits?.attributeValueLengthLimit ??
      e.generalLimits?.attributeValueLengthLimit ??
      P(`OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT`) ??
      P(`OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT`) ??
      1 / 0),
    Object.assign({}, e, { spanLimits: t })
  );
}
F();
var dg = class {
    _exporter;
    _maxExportBatchSize;
    _maxQueueSize;
    _scheduledDelayMillis;
    _exportTimeoutMillis;
    _isExporting = !1;
    _finishedSpans = [];
    _timer;
    _shutdownOnce;
    _droppedSpansCount = 0;
    constructor(e, t) {
      ((this._exporter = e),
        (this._maxExportBatchSize =
          typeof t?.maxExportBatchSize == `number`
            ? t.maxExportBatchSize
            : (P(`OTEL_BSP_MAX_EXPORT_BATCH_SIZE`) ?? 512)),
        (this._maxQueueSize =
          typeof t?.maxQueueSize == `number`
            ? t.maxQueueSize
            : (P(`OTEL_BSP_MAX_QUEUE_SIZE`) ?? 2048)),
        (this._scheduledDelayMillis =
          typeof t?.scheduledDelayMillis == `number`
            ? t.scheduledDelayMillis
            : (P(`OTEL_BSP_SCHEDULE_DELAY`) ?? 5e3)),
        (this._exportTimeoutMillis =
          typeof t?.exportTimeoutMillis == `number`
            ? t.exportTimeoutMillis
            : (P(`OTEL_BSP_EXPORT_TIMEOUT`) ?? 3e4)),
        (this._shutdownOnce = new Aa(this._shutdown, this)),
        this._maxExportBatchSize > this._maxQueueSize &&
          (J.diag.warn(
            `BatchSpanProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize`,
          ),
          (this._maxExportBatchSize = this._maxQueueSize)));
    }
    forceFlush() {
      return this._shutdownOnce.isCalled ? this._shutdownOnce.promise : this._flushAll();
    }
    onStart(e, t) {}
    onEnd(e) {
      this._shutdownOnce.isCalled ||
        ((e.spanContext().traceFlags & J.TraceFlags.SAMPLED) !== 0 && this._addToBuffer(e));
    }
    shutdown() {
      return this._shutdownOnce.call();
    }
    _shutdown() {
      return Promise.resolve()
        .then(() => this.onShutdown())
        .then(() => this._flushAll())
        .then(() => this._exporter.shutdown());
    }
    _addToBuffer(e) {
      if (this._finishedSpans.length >= this._maxQueueSize) {
        (this._droppedSpansCount === 0 && J.diag.debug(`maxQueueSize reached, dropping spans`),
          this._droppedSpansCount++);
        return;
      }
      (this._droppedSpansCount > 0 &&
        (J.diag.warn(`Dropped ${this._droppedSpansCount} spans because maxQueueSize reached`),
        (this._droppedSpansCount = 0)),
        this._finishedSpans.push(e),
        this._maybeStartTimer());
    }
    _flushAll() {
      return new Promise((e, t) => {
        let n = [],
          r = Math.ceil(this._finishedSpans.length / this._maxExportBatchSize);
        for (let e = 0, t = r; e < t; e++) n.push(this._flushOneBatch());
        Promise.all(n)
          .then(() => {
            e();
          })
          .catch(t);
      });
    }
    _flushOneBatch() {
      return (
        this._clearTimer(),
        this._finishedSpans.length === 0
          ? Promise.resolve()
          : new Promise((e, t) => {
              let n = setTimeout(() => {
                t(Error(`Timeout`));
              }, this._exportTimeoutMillis);
              J.context.with(Un(J.context.active()), () => {
                let r;
                this._finishedSpans.length <= this._maxExportBatchSize
                  ? ((r = this._finishedSpans), (this._finishedSpans = []))
                  : (r = this._finishedSpans.splice(0, this._maxExportBatchSize));
                let i = () =>
                    this._exporter.export(r, (r) => {
                      (clearTimeout(n),
                        r.code === gi.SUCCESS
                          ? e()
                          : t(r.error ?? Error(`BatchSpanProcessor: span export failed`)));
                    }),
                  a = null;
                for (let e = 0, t = r.length; e < t; e++) {
                  let t = r[e];
                  t.resource.asyncAttributesPending &&
                    t.resource.waitForAsyncAttributes &&
                    ((a ??= []), a.push(t.resource.waitForAsyncAttributes()));
                }
                a === null
                  ? i()
                  : Promise.all(a).then(i, (e) => {
                      (Sr(e), t(e));
                    });
              });
            })
      );
    }
    _maybeStartTimer() {
      if (this._isExporting) return;
      let e = () => {
        ((this._isExporting = !0),
          this._flushOneBatch()
            .finally(() => {
              ((this._isExporting = !1),
                this._finishedSpans.length > 0 && (this._clearTimer(), this._maybeStartTimer()));
            })
            .catch((e) => {
              ((this._isExporting = !1), Sr(e));
            }));
      };
      if (this._finishedSpans.length >= this._maxExportBatchSize) return e();
      this._timer === void 0 &&
        ((this._timer = setTimeout(() => e(), this._scheduledDelayMillis)),
        typeof this._timer != `number` && this._timer.unref());
    }
    _clearTimer() {
      this._timer !== void 0 && (clearTimeout(this._timer), (this._timer = void 0));
    }
  },
  fg = class extends dg {
    onShutdown() {}
  },
  pg = 8,
  mg = 16,
  hg = class {
    generateTraceId = _g(mg);
    generateSpanId = _g(pg);
  },
  gg = Buffer.allocUnsafe(mg);
function _g(e) {
  return function () {
    for (let t = 0; t < e / 4; t++) gg.writeUInt32BE((Math.random() * 2 ** 32) >>> 0, t * 4);
    for (let t = 0; t < e && !(gg[t] > 0); t++) t === e - 1 && (gg[e - 1] = 1);
    return gg.toString(`hex`, 0, e);
  };
}
F();
var vg = class {
  _sampler;
  _generalLimits;
  _spanLimits;
  _idGenerator;
  instrumentationScope;
  _resource;
  _spanProcessor;
  constructor(e, t, n, r) {
    let i = lg(t);
    ((this._sampler = i.sampler),
      (this._generalLimits = i.generalLimits),
      (this._spanLimits = i.spanLimits),
      (this._idGenerator = t.idGenerator || new hg()),
      (this._resource = n),
      (this._spanProcessor = r),
      (this.instrumentationScope = e));
  }
  startSpan(e, t = {}, n = J.context.active()) {
    t.root && (n = J.trace.deleteSpan(n));
    let r = J.trace.getSpan(n);
    if (Gn(n))
      return (
        J.diag.debug(`Instrumentation suppressed, returning Noop Span`),
        J.trace.wrapSpanContext(J.INVALID_SPAN_CONTEXT)
      );
    let i = r?.spanContext(),
      a = this._idGenerator.generateSpanId(),
      o,
      s,
      c;
    !i || !J.trace.isSpanContextValid(i)
      ? (s = this._idGenerator.generateTraceId())
      : ((s = i.traceId), (c = i.traceState), (o = i));
    let l = t.kind ?? J.SpanKind.INTERNAL,
      u = (t.links ?? []).map((e) => ({ context: e.context, attributes: lr(e.attributes) })),
      d = lr(t.attributes),
      f = this._sampler.shouldSample(n, s, e, l, d, u);
    c = f.traceState ?? c;
    let p =
        f.decision === J.SamplingDecision.RECORD_AND_SAMPLED
          ? J.TraceFlags.SAMPLED
          : J.TraceFlags.NONE,
      m = { traceId: s, spanId: a, traceFlags: p, traceState: c };
    if (f.decision === J.SamplingDecision.NOT_RECORD)
      return (
        J.diag.debug(`Recording is off, propagating context in a non-recording span`),
        J.trace.wrapSpanContext(m)
      );
    let h = lr(Object.assign(d, f.attributes));
    return new $h({
      resource: this._resource,
      scope: this.instrumentationScope,
      context: n,
      spanContext: m,
      name: e,
      kind: l,
      links: u,
      parentSpanContext: o,
      attributes: h,
      startTime: t.startTime,
      spanProcessor: this._spanProcessor,
      spanLimits: this._spanLimits,
    });
  }
  startActiveSpan(e, t, n, r) {
    let i, a, o;
    if (arguments.length < 2) return;
    arguments.length === 2
      ? (o = t)
      : arguments.length === 3
        ? ((i = t), (o = n))
        : ((i = t), (a = n), (o = r));
    let s = a ?? J.context.active(),
      c = this.startSpan(e, i, s),
      l = J.trace.setSpan(s, c);
    return J.context.with(l, o, void 0, c);
  }
  getGeneralLimits() {
    return this._generalLimits;
  }
  getSpanLimits() {
    return this._spanLimits;
  }
};
F();
var yg = class {
  _spanProcessors;
  constructor(e) {
    this._spanProcessors = e;
  }
  forceFlush() {
    let e = [];
    for (let t of this._spanProcessors) e.push(t.forceFlush());
    return new Promise((t) => {
      Promise.all(e)
        .then(() => {
          t();
        })
        .catch((e) => {
          (Sr(e || Error(`MultiSpanProcessor: forceFlush failed`)), t());
        });
    });
  }
  onStart(e, t) {
    for (let n of this._spanProcessors) n.onStart(e, t);
  }
  onEnd(e) {
    for (let t of this._spanProcessors) t.onEnd(e);
  }
  shutdown() {
    let e = [];
    for (let t of this._spanProcessors) e.push(t.shutdown());
    return new Promise((t, n) => {
      Promise.all(e).then(() => {
        t();
      }, n);
    });
  }
};
F();
var bg;
(function (e) {
  ((e[(e.resolved = 0)] = `resolved`),
    (e[(e.timeout = 1)] = `timeout`),
    (e[(e.error = 2)] = `error`),
    (e[(e.unresolved = 3)] = `unresolved`));
})((bg ||= {}));
var xg = class {
  _config;
  _tracers = new Map();
  _resource;
  _activeSpanProcessor;
  constructor(e = {}) {
    let t = da({}, og(), ug(e));
    ((this._resource = t.resource ?? Jh()),
      (this._config = Object.assign({}, t, { resource: this._resource })));
    let n = [];
    (e.spanProcessors?.length && n.push(...e.spanProcessors),
      (this._activeSpanProcessor = new yg(n)));
  }
  getTracer(e, t, n) {
    let r = `${e}@${t || ``}:${n?.schemaUrl || ``}`;
    return (
      this._tracers.has(r) ||
        this._tracers.set(
          r,
          new vg(
            { name: e, version: t, schemaUrl: n?.schemaUrl },
            this._config,
            this._resource,
            this._activeSpanProcessor,
          ),
        ),
      this._tracers.get(r)
    );
  }
  forceFlush() {
    let e = this._config.forceFlushTimeoutMillis,
      t = this._activeSpanProcessor._spanProcessors.map(
        (t) =>
          new Promise((n) => {
            let r,
              i = setTimeout(() => {
                (n(Error(`Span processor did not completed within timeout period of ${e} ms`)),
                  (r = bg.timeout));
              }, e);
            t.forceFlush()
              .then(() => {
                (clearTimeout(i), r !== bg.timeout && ((r = bg.resolved), n(r)));
              })
              .catch((e) => {
                (clearTimeout(i), (r = bg.error), n(e));
              });
          }),
      );
    return new Promise((e, n) => {
      Promise.all(t)
        .then((t) => {
          let r = t.filter((e) => e !== bg.resolved);
          r.length > 0 ? n(r) : e();
        })
        .catch((e) => n([e]));
    });
  }
  shutdown() {
    return this._activeSpanProcessor.shutdown();
  }
};
F();
var Sg = `sentry.parentIsRemote`,
  Cg = `sentry.graphql.operation`;
function wg(e) {
  if (`parentSpanId` in e) return e.parentSpanId;
  if (`parentSpanContext` in e) return e.parentSpanContext?.spanId;
}
function Tg(e) {
  let t = e;
  return !!t.attributes && typeof t.attributes == `object`;
}
function Eg(e) {
  return typeof e.kind == `number`;
}
function Dg(e) {
  return !!e.status;
}
function Og(e) {
  return !!e.name;
}
function kg(e) {
  if (!Tg(e)) return {};
  let t = e.attributes[Y.ATTR_URL_FULL] || e.attributes[Y.SEMATTRS_HTTP_URL],
    n = {
      url: t,
      "http.method":
        e.attributes[Y.ATTR_HTTP_REQUEST_METHOD] || e.attributes[Y.SEMATTRS_HTTP_METHOD],
    };
  !n[`http.method`] && n.url && (n[`http.method`] = `GET`);
  try {
    if (typeof t == `string`) {
      let e = Em(t);
      ((n.url = Om(e)),
        e.search && (n[`http.query`] = e.search),
        e.hash && (n[`http.fragment`] = e.hash));
    }
  } catch {}
  return n;
}
function Ag(e) {
  return Eg(e) ? e.kind : J.SpanKind.INTERNAL;
}
var jg = `sentry-trace`,
  Mg = `baggage`,
  Ng = `sentry.dsc`,
  Pg = `sentry.sampled_not_recording`,
  Fg = `sentry.url`,
  Ig = `sentry.sample_rand`,
  Lg = `sentry.sample_rate`,
  Rg = (0, J.createContextKey)(`sentry_scopes`),
  zg = (0, J.createContextKey)(`sentry_fork_isolation_scope`),
  Bg = (0, J.createContextKey)(`sentry_fork_set_scope`),
  Vg = (0, J.createContextKey)(`sentry_fork_set_isolation_scope`),
  Hg = `_scopeContext`;
function Ug(e) {
  return e.getValue(Rg);
}
function Wg(e, t) {
  return e.setValue(Rg, t);
}
function Gg(e, t) {
  Jc(e, Hg, t);
}
function Kg(e) {
  return e[Hg];
}
function qg(e) {
  let { traceFlags: t, traceState: n } = e,
    r = n ? n.get(Pg) === `1` : !1;
  if (t === J.TraceFlags.SAMPLED) return !0;
  if (r) return !1;
  let i = n ? n.get(Ng) : void 0,
    a = i ? pu(i) : void 0;
  if (a?.sampled === `true`) return !0;
  if (a?.sampled === `false`) return !1;
}
function Jg(e, t, n) {
  let r = t[Y.ATTR_HTTP_REQUEST_METHOD] || t[Y.SEMATTRS_HTTP_METHOD];
  if (r) return Zg({ attributes: t, name: e, kind: n }, r);
  let i = t[Y.SEMATTRS_DB_SYSTEM],
    a = typeof t[`sentry.op`] == `string` && t[`sentry.op`].startsWith(`cache.`);
  if (i && !a) return Xg({ attributes: t, name: e });
  let o = t[`sentry.source`] === `custom` ? `custom` : `route`;
  if (t[Y.SEMATTRS_RPC_SERVICE]) return { ...e_(e, t, `route`), op: `rpc` };
  if (t[Y.SEMATTRS_MESSAGING_SYSTEM]) return { ...e_(e, t, o), op: `message` };
  let s = t[Y.SEMATTRS_FAAS_TRIGGER];
  return s
    ? { ...e_(e, t, o), op: s.toString() }
    : { op: void 0, description: e, source: `custom` };
}
function Yg(e) {
  let t = Tg(e) ? e.attributes : {};
  return Jg(Og(e) ? e.name : `<unknown>`, t, Ag(e));
}
function Xg({ attributes: e, name: t }) {
  let n = e[eu];
  if (typeof n == `string`)
    return { op: `db`, description: n, source: e[`sentry.source`] || `custom` };
  if (e[`sentry.source`] === `custom`) return { op: `db`, description: t, source: `custom` };
  let r = e[Y.SEMATTRS_DB_STATEMENT];
  return { op: `db`, description: r ? r.toString() : t, source: `task` };
}
function Zg({ name: e, kind: t, attributes: n }, r) {
  let i = [`http`];
  switch (t) {
    case J.SpanKind.CLIENT:
      i.push(`client`);
      break;
    case J.SpanKind.SERVER:
      i.push(`server`);
  }
  n[`sentry.http.prefetch`] && i.push(`prefetch`);
  let { urlPath: a, url: o, query: s, fragment: c, hasRoute: l } = $g(n, t);
  if (!a) return { ...e_(e, n), op: i.join(`.`) };
  let u = n[Cg],
    d = `${r} ${a}`,
    f = u ? `${d} (${Qg(u)})` : d,
    p = l || a === `/` ? `route` : `url`,
    m = {};
  (o && (m.url = o), s && (m[`http.query`] = s), c && (m[`http.fragment`] = c));
  let h = t === J.SpanKind.CLIENT || t === J.SpanKind.SERVER,
    g = !`${n[`sentry.origin`] || `manual`}`.startsWith(`auto`),
    _ = n[Jl] === `custom`,
    v = n[eu],
    { description: y, source: b } =
      !_ && v == null && (h || !g) ? { description: f, source: p } : e_(e, n);
  return { op: i.join(`.`), description: y, source: b, data: m };
}
function Qg(e) {
  if (Array.isArray(e)) {
    let t = e.slice().sort();
    return t.length <= 5 ? t.join(`, `) : `${t.slice(0, 5).join(`, `)}, +${t.length - 5}`;
  }
  return `${e}`;
}
function $g(e, t) {
  let n = e[Y.SEMATTRS_HTTP_TARGET],
    r = e[Y.SEMATTRS_HTTP_URL] || e[Y.ATTR_URL_FULL],
    i = e[Y.ATTR_HTTP_ROUTE],
    a = typeof r == `string` ? Em(r) : void 0,
    o = a ? Om(a) : void 0,
    s = a?.search || void 0,
    c = a?.hash || void 0;
  return typeof i == `string`
    ? { urlPath: i, url: o, query: s, fragment: c, hasRoute: !0 }
    : t === J.SpanKind.SERVER && typeof n == `string`
      ? { urlPath: Dm(n), url: o, query: s, fragment: c, hasRoute: !1 }
      : a
        ? { urlPath: o, url: o, query: s, fragment: c, hasRoute: !1 }
        : typeof n == `string`
          ? { urlPath: Dm(n), url: o, query: s, fragment: c, hasRoute: !1 }
          : { urlPath: void 0, url: o, query: s, fragment: c, hasRoute: !1 };
}
function e_(e, t, n = `custom`) {
  let r = t[`sentry.source`] || n,
    i = t[eu];
  return i && typeof i == `string` ? { description: i, source: r } : { description: e, source: r };
}
function t_() {
  return J.trace.getActiveSpan();
}
var n_ = typeof __SENTRY_DEBUG__ > `u` || __SENTRY_DEBUG__;
function r_({ dsc: e, sampled: t }) {
  let n = e ? mu(e) : void 0,
    r = new Mi(),
    i = n ? r.set(Ng, n) : r;
  return t === !1 ? i.set(Pg, `1`) : i;
}
var i_ = new Set();
function a_(e) {
  i_.add(e);
}
var o_ = class extends ar {
    constructor() {
      (super(), a_(`SentryPropagator`), (this._urlMatchesTargetsMap = new Ph(100)));
    }
    inject(e, t, n) {
      if (Gn(e)) {
        n_ && B.log(`[Tracing] Not injecting trace data for url because tracing is suppressed.`);
        return;
      }
      let r = J.trace.getSpan(e),
        i = r && m_(r),
        a = W()?.getOptions()?.tracePropagationTargets;
      if (!c_(i, a, this._urlMatchesTargetsMap)) {
        n_ &&
          B.log(
            `[Tracing] Not injecting trace data for url because it does not match tracePropagationTargets:`,
            i,
          );
        return;
      }
      let o = p_(t),
        s = J.propagation.getBaggage(e) || J.propagation.createBaggage({}),
        { dynamicSamplingContext: c, traceId: l, spanId: u, sampled: d } = l_(e);
      if (o) {
        let e = hu(o);
        e &&
          Object.entries(e).forEach(([e, t]) => {
            s = s.setEntry(e, { value: t });
          });
      }
      (c &&
        (s = Object.entries(c).reduce(
          (e, [t, n]) => (n ? e.setEntry(`${du}${t}`, { value: n }) : e),
          s,
        )),
        l && l !== J.INVALID_TRACEID && n.set(t, jg, Mu(l, u, d)),
        super.inject(J.propagation.setBaggage(e, s), t, n));
    }
    extract(e, t, n) {
      let r = n.get(t, jg),
        i = n.get(t, Mg);
      return f_(u_(e, { sentryTrace: r ? (Array.isArray(r) ? r[0] : r) : void 0, baggage: i }));
    }
    fields() {
      return [jg, Mg];
    }
  },
  s_ = `[Tracing] Not injecting trace data for url because it does not match tracePropagationTargets:`;
function c_(e, t, n) {
  if (typeof e != `string` || !t) return !0;
  let r = n?.get(e);
  if (r !== void 0) return (n_ && !r && B.log(s_, e), r);
  let i = al(e, t);
  return (n?.set(e, i), n_ && !i && B.log(s_, e), i);
}
function l_(e, t = {}) {
  let n = J.trace.getSpan(e);
  if (n?.spanContext().isRemote) {
    let e = n.spanContext();
    return { dynamicSamplingContext: pd(n), traceId: e.traceId, spanId: void 0, sampled: qg(e) };
  }
  if (n) {
    let e = n.spanContext();
    return { dynamicSamplingContext: pd(n), traceId: e.traceId, spanId: e.spanId, sampled: qg(e) };
  }
  let r = t.scope || Ug(e)?.scope || H(),
    i = t.client || W(),
    a = r.getPropagationContext();
  return {
    dynamicSamplingContext: i ? fd(i, r) : void 0,
    traceId: a.traceId,
    spanId: a.propagationSpanId,
    sampled: a.sampled,
  };
}
function u_(e, { sentryTrace: t, baggage: n }) {
  let { traceId: r, parentSpanId: i, sampled: a, dsc: o } = ju(t, n),
    s = W(),
    c = pu(n);
  if (!i || (s && !Fu(s, c?.org_id))) return e;
  let l = h_({ traceId: r, spanId: i, sampled: a, dsc: o });
  return J.trace.setSpanContext(e, l);
}
function d_(e, t, n) {
  let r = f_(u_(e, t));
  return J.context.with(r, n);
}
function f_(e) {
  let t = Ug(e);
  return Wg(e, { scope: t ? t.scope : H().clone(), isolationScope: t ? t.isolationScope : U() });
}
function p_(e) {
  try {
    let t = e[Mg];
    return Array.isArray(t) ? t.join(`,`) : t;
  } catch {
    return;
  }
}
function m_(e) {
  let t = G(e).data,
    n = t[Y.SEMATTRS_HTTP_URL] || t[Y.ATTR_URL_FULL];
  if (typeof n == `string`) return n;
  let r = e.spanContext().traceState?.get(Fg);
  if (r) return r;
}
function h_({ spanId: e, traceId: t, sampled: n, dsc: r }) {
  let i = r_({ dsc: r, sampled: n });
  return {
    traceId: t,
    spanId: e,
    isRemote: !0,
    traceFlags: n ? J.TraceFlags.SAMPLED : J.TraceFlags.NONE,
    traceState: i,
  };
}
function g_(e, t, n) {
  let r = x_(),
    { name: i, parentSpan: a } = e;
  return O_(a)(() => {
    let a = w_(e.scope, e.forceTransaction),
      o = e.onlyIfParent && !J.trace.getSpan(a) ? Un(a) : a,
      s = S_(e);
    if (!rd()) {
      let e = Gn(o) ? o : Un(o);
      return J.context.with(e, () =>
        r.startActiveSpan(i, s, e, (e) =>
          J.context.with(a, () =>
            Zd(
              () => t(e),
              () => {
                G(e).status === void 0 && e.setStatus({ code: J.SpanStatusCode.ERROR });
              },
              n ? () => e.end() : void 0,
            ),
          ),
        ),
      );
    }
    return r.startActiveSpan(i, s, o, (e) =>
      Zd(
        () => t(e),
        () => {
          G(e).status === void 0 && e.setStatus({ code: J.SpanStatusCode.ERROR });
        },
        n ? () => e.end() : void 0,
      ),
    );
  });
}
function __(e, t) {
  return g_(e, t, !0);
}
function v_(e, t) {
  return g_(e, (e) => t(e, () => e.end()), !1);
}
function y_(e) {
  let t = x_(),
    { name: n, parentSpan: r } = e;
  return O_(r)(() => {
    let r = w_(e.scope, e.forceTransaction),
      i = e.onlyIfParent && !J.trace.getSpan(r) ? Un(r) : r,
      a = S_(e);
    return (rd() || (i = Gn(i) ? i : Un(i)), t.startSpan(n, a, i));
  });
}
function b_(e, t) {
  let n = e ? J.trace.setSpan(J.context.active(), e) : J.trace.deleteSpan(J.context.active());
  return J.context.with(n, () => t(H()));
}
function x_() {
  return W()?.tracer || J.trace.getTracer(`@sentry/opentelemetry`, `10.29.0`);
}
function S_(e) {
  let { startTime: t, attributes: n, kind: r, op: i, links: a } = e,
    o = typeof t == `number` ? C_(t) : t;
  return { attributes: i ? { [Xl]: i, ...n } : n, kind: r, links: a, startTime: o };
}
function C_(e) {
  return e < 9999999999 ? e * 1e3 : e;
}
function w_(e, t) {
  let n = T_(e),
    r = J.trace.getSpan(n);
  if (!r || !t) return n;
  let i = J.trace.deleteSpan(n),
    { spanId: a, traceId: o } = r.spanContext(),
    s = qg(r.spanContext()),
    c = r_({ dsc: pd(Qu(r)), sampled: s }),
    l = {
      traceId: o,
      spanId: a,
      isRemote: !0,
      traceFlags: s ? J.TraceFlags.SAMPLED : J.TraceFlags.NONE,
      traceState: c,
    };
  return J.trace.setSpanContext(i, l);
}
function T_(e) {
  if (e) {
    let t = Kg(e);
    if (t) return t;
  }
  return J.context.active();
}
function E_(e, t) {
  return d_(J.context.active(), e, t);
}
function D_(e, t) {
  let n = Kg(t),
    r = n && J.trace.getSpan(n),
    i = r ? Ru(r) : ql(t);
  return [r ? pd(r) : fd(e, t), i];
}
function O_(e) {
  return e === void 0 ? (e) => e() : (t) => b_(e, t);
}
function k_(e) {
  let t = Un(J.context.active());
  return J.context.with(t, e);
}
function A_({ span: e, scope: t, client: n } = {}) {
  let r = (t && Kg(t)) ?? J.context.active();
  if (e) {
    let { scope: t } = uu(e);
    r = (t && Kg(t)) || J.trace.setSpan(J.context.active(), e);
  }
  let {
    traceId: i,
    spanId: a,
    sampled: o,
    dynamicSamplingContext: s,
  } = l_(r, { scope: t, client: n });
  return { "sentry-trace": Mu(i, a, o), baggage: mu(s) };
}
function j_() {
  function e() {
    return Ug(J.context.active()) || { scope: Fl(), isolationScope: Il() };
  }
  function t(e) {
    let t = J.context.active();
    return J.context.with(t, () => e(a()));
  }
  function n(e, t) {
    let n = Kg(e) || J.context.active();
    return J.context.with(n.setValue(Bg, e), () => t(e));
  }
  function r(e) {
    let t = J.context.active();
    return J.context.with(t.setValue(zg, !0), () => e(o()));
  }
  function i(e, t) {
    let n = J.context.active();
    return J.context.with(n.setValue(Vg, e), () => t(o()));
  }
  function a() {
    return e().scope;
  }
  function o() {
    return e().isolationScope;
  }
  Ul({
    withScope: t,
    withSetScope: n,
    withSetIsolationScope: i,
    withIsolationScope: r,
    getCurrentScope: a,
    getIsolationScope: o,
    startSpan: __,
    startSpanManual: v_,
    startInactiveSpan: y_,
    getActiveSpan: t_,
    suppressTracing: k_,
    getTraceData: A_,
    continueTrace: E_,
    withActiveSpan: b_,
  });
}
function M_(e) {
  class t extends e {
    constructor(...e) {
      (super(...e), a_(`SentryContextManager`));
    }
    with(e, t, n, ...r) {
      let i = Ug(e),
        a = i?.scope || H(),
        o = i?.isolationScope || U(),
        s = e.getValue(zg) === !0,
        c = e.getValue(Bg),
        l = e.getValue(Vg),
        u = c || a.clone(),
        d = Wg(e, { scope: u, isolationScope: l || (s ? o.clone() : o) })
          .deleteValue(zg)
          .deleteValue(Bg)
          .deleteValue(Vg);
      return (Gg(u, d), super.with(d, t, n, ...r));
    }
  }
  return t;
}
function N_(e) {
  let t = new Map();
  for (let n of e) F_(t, n);
  return Array.from(t, function ([e, t]) {
    return t;
  });
}
function P_(e) {
  return e.attributes[Sg] === !0 ? void 0 : wg(e);
}
function F_(e, t) {
  let n = t.spanContext().spanId,
    r = P_(t);
  if (!r) {
    L_(e, { id: n, span: t, children: [] });
    return;
  }
  let i = I_(e, r),
    a = L_(e, { id: n, span: t, parentNode: i, children: [] });
  i.children.push(a);
}
function I_(e, t) {
  return e.get(t) || L_(e, { id: t, children: [] });
}
function L_(e, t) {
  let n = e.get(t.id);
  return n?.span
    ? n
    : n && !n.span
      ? ((n.span = t.span), (n.parentNode = t.parentNode), n)
      : (e.set(t.id, t), t);
}
var R_ = {
    1: `cancelled`,
    2: `unknown_error`,
    3: `invalid_argument`,
    4: `deadline_exceeded`,
    5: `not_found`,
    6: `already_exists`,
    7: `permission_denied`,
    8: `resource_exhausted`,
    9: `failed_precondition`,
    10: `aborted`,
    11: `out_of_range`,
    12: `unimplemented`,
    13: `internal_error`,
    14: `unavailable`,
    15: `data_loss`,
    16: `unauthenticated`,
  },
  z_ = (e) => Object.values(R_).includes(e);
function B_(e) {
  let t = Tg(e) ? e.attributes : {},
    n = Dg(e) ? e.status : void 0;
  if (n) {
    if (n.code === J.SpanStatusCode.OK) return { code: 1 };
    if (n.code === J.SpanStatusCode.ERROR) {
      if (n.message === void 0) {
        let e = V_(t);
        if (e) return e;
      }
      return n.message && z_(n.message)
        ? { code: 2, message: n.message }
        : { code: 2, message: `internal_error` };
    }
  }
  return (
    V_(t) ||
    (n?.code === J.SpanStatusCode.UNSET ? { code: 1 } : { code: 2, message: `unknown_error` })
  );
}
function V_(e) {
  let t = e[Y.ATTR_HTTP_RESPONSE_STATUS_CODE] || e[Y.SEMATTRS_HTTP_STATUS_CODE],
    n = e[Y.SEMATTRS_RPC_GRPC_STATUS_CODE],
    r = typeof t == `number` ? t : typeof t == `string` ? parseInt(t) : void 0;
  if (typeof r == `number`) return ru(r);
  if (typeof n == `string`) return { code: 2, message: R_[n] || `unknown_error` };
}
var H_ = 1e3,
  U_ = 300,
  W_ = class {
    constructor(e) {
      ((this._finishedSpanBucketSize = e?.timeout || U_),
        (this._finishedSpanBuckets = Array(this._finishedSpanBucketSize).fill(void 0)),
        (this._lastCleanupTimestampInS = Math.floor(Date.now() / 1e3)),
        (this._spansToBucketEntry = new WeakMap()),
        (this._sentSpans = new Map()),
        (this._debouncedFlush = Im(this.flush.bind(this), 1, { maxWait: 100 })));
    }
    export(e) {
      let t = Math.floor(Date.now() / 1e3);
      if (this._lastCleanupTimestampInS !== t) {
        let e = 0;
        (this._finishedSpanBuckets.forEach((n, r) => {
          n &&
            n.timestampInS <= t - this._finishedSpanBucketSize &&
            ((e += n.spans.size), (this._finishedSpanBuckets[r] = void 0));
        }),
          e > 0 &&
            n_ &&
            B.log(
              `SpanExporter dropped ${e} spans because they were pending for more than ${this._finishedSpanBucketSize} seconds.`,
            ),
          (this._lastCleanupTimestampInS = t));
      }
      let n = t % this._finishedSpanBucketSize,
        r = this._finishedSpanBuckets[n] || { timestampInS: t, spans: new Set() };
      ((this._finishedSpanBuckets[n] = r), r.spans.add(e), this._spansToBucketEntry.set(e, r));
      let i = P_(e);
      (!i || this._sentSpans.has(i)) && this._debouncedFlush();
    }
    flush() {
      let e = this._finishedSpanBuckets.flatMap((e) => (e ? Array.from(e.spans) : []));
      this._flushSentSpanCache();
      let t = this._maybeSend(e),
        n = t.size,
        r = e.length - n;
      n_ &&
        B.log(
          `SpanExporter exported ${n} spans, ${r} spans are waiting for their parent spans to finish`,
        );
      let i = Date.now() + U_ * 1e3;
      for (let e of t) {
        this._sentSpans.set(e.spanContext().spanId, i);
        let t = this._spansToBucketEntry.get(e);
        t && t.spans.delete(e);
      }
      this._debouncedFlush.cancel();
    }
    clear() {
      ((this._finishedSpanBuckets = this._finishedSpanBuckets.fill(void 0)),
        this._sentSpans.clear(),
        this._debouncedFlush.cancel());
    }
    _maybeSend(e) {
      let t = N_(e),
        n = new Set(),
        r = this._getCompletedRootNodes(t);
      for (let e of r) {
        let t = e.span;
        n.add(t);
        let r = K_(t);
        if (e.parentNode && this._sentSpans.has(e.parentNode.id)) {
          let e = r.contexts?.trace?.data;
          e && (e[`sentry.parent_span_already_sent`] = !0);
        }
        let i = r.spans || [];
        for (let t of e.children) q_(t, i, n);
        r.spans =
          i.length > H_ ? i.sort((e, t) => e.start_timestamp - t.start_timestamp).slice(0, H_) : i;
        let a = Wd(t.events);
        (a && (r.measurements = a), Wf(r));
      }
      return n;
    }
    _flushSentSpanCache() {
      let e = Date.now();
      for (let [t, n] of this._sentSpans.entries()) n <= e && this._sentSpans.delete(t);
    }
    _nodeIsCompletedRootNodeOrHasSentParent(e) {
      return !!e.span && (!e.parentNode || this._sentSpans.has(e.parentNode.id));
    }
    _getCompletedRootNodes(e) {
      return e.filter((e) => this._nodeIsCompletedRootNodeOrHasSentParent(e));
    }
  };
function G_(e) {
  let t = e.attributes;
  return { origin: t[Zl], op: t[Xl], source: t[Jl] };
}
function K_(e) {
  let { op: t, description: n, data: r, origin: i = `manual`, source: a } = J_(e),
    o = uu(e),
    s = e.attributes[Yl],
    c = { [Jl]: a, [Yl]: s, [Xl]: t, [Zl]: i, ...r, ...Y_(e.attributes) },
    { links: l } = e,
    { traceId: u, spanId: d } = e.spanContext(),
    f = {
      parent_span_id: wg(e),
      span_id: d,
      trace_id: u,
      data: c,
      origin: i,
      op: t,
      status: qu(B_(e)),
      links: Vu(l),
    },
    p = c[Y.ATTR_HTTP_RESPONSE_STATUS_CODE],
    m = typeof p == `number` ? { response: { status_code: p } } : void 0;
  return {
    contexts: { trace: f, otel: { resource: e.resource.attributes }, ...m },
    spans: [],
    start_timestamp: Hu(e.startTime),
    timestamp: Hu(e.endTime),
    transaction: n,
    type: `transaction`,
    sdkProcessingMetadata: {
      capturedSpanScope: o.scope,
      capturedSpanIsolationScope: o.isolationScope,
      sampleRate: s,
      dynamicSamplingContext: pd(e),
    },
    ...(a && { transaction_info: { source: a } }),
  };
}
function q_(e, t, n) {
  let r = e.span;
  if ((r && n.add(r), !r)) {
    e.children.forEach((e) => {
      q_(e, t, n);
    });
    return;
  }
  let i = r.spanContext().spanId,
    a = r.spanContext().traceId,
    o = wg(r),
    { attributes: s, startTime: c, endTime: l, links: u } = r,
    { op: d, description: f, data: p, origin: m = `manual` } = J_(r),
    h = { [Zl]: m, [Xl]: d, ...Y_(s), ...p },
    g = B_(r),
    _ = {
      span_id: i,
      trace_id: a,
      data: h,
      description: f,
      parent_span_id: o,
      start_timestamp: Hu(c),
      timestamp: Hu(l) || void 0,
      status: qu(g),
      op: d,
      origin: m,
      measurements: Wd(r.events),
      links: Vu(u),
    };
  (t.push(_),
    e.children.forEach((e) => {
      q_(e, t, n);
    }));
}
function J_(e) {
  let { op: t, source: n, origin: r } = G_(e),
    { op: i, description: a, source: o, data: s } = Yg(e);
  return { op: t || i, description: a, source: n || o, origin: r, data: { ...s, ...X_(e) } };
}
function Y_(e) {
  let t = { ...e };
  return (delete t[Yl], delete t[Sg], delete t[eu], t);
}
function X_(e) {
  let t = e.attributes,
    n = {};
  e.kind !== J.SpanKind.INTERNAL && (n[`otel.kind`] = J.SpanKind[e.kind]);
  let r = t[Y.SEMATTRS_HTTP_STATUS_CODE];
  r && (n[Y.ATTR_HTTP_RESPONSE_STATUS_CODE] = r);
  let i = kg(e);
  return (
    i.url && (n.url = i.url),
    i[`http.query`] && (n[`http.query`] = i[`http.query`].slice(1)),
    i[`http.fragment`] && (n[`http.fragment`] = i[`http.fragment`].slice(1)),
    n
  );
}
function Z_(e, t) {
  let n = J.trace.getSpan(t),
    r = Ug(t);
  (n && !n.spanContext().isRemote && Xu(n, e),
    n?.spanContext().isRemote && e.setAttribute(Sg, !0),
    t === J.ROOT_CONTEXT && (r = { scope: Fl(), isolationScope: Il() }),
    r && lu(e, r.scope, r.isolationScope),
    Hd(e),
    W()?.emit(`spanStart`, e));
}
function Q_(e) {
  (Ud(e), W()?.emit(`spanEnd`, e));
}
var $_ = class {
    constructor(e) {
      (a_(`SentrySpanProcessor`), (this._exporter = new W_(e)));
    }
    async forceFlush() {
      this._exporter.flush();
    }
    async shutdown() {
      this._exporter.clear();
    }
    onStart(e, t) {
      Z_(e, t);
    }
    onEnd(e) {
      (Q_(e), this._exporter.export(e));
    }
  },
  ev = class {
    constructor(e) {
      ((this._client = e), a_(`SentrySampler`));
    }
    shouldSample(e, t, n, r, i, a) {
      let o = this._client.getOptions(),
        s = iv(e),
        c = s?.spanContext();
      if (!rd(o)) return nv({ decision: void 0, context: e, spanAttributes: i });
      let l = i[Y.SEMATTRS_HTTP_METHOD] || i[Y.ATTR_HTTP_REQUEST_METHOD];
      if (r === J.SpanKind.CLIENT && l && (!s || c?.isRemote))
        return nv({ decision: void 0, context: e, spanAttributes: i });
      let u = s ? tv(s, t, n) : void 0;
      if (s && !c?.isRemote)
        return nv({
          decision: u ? X.RECORD_AND_SAMPLED : X.NOT_RECORD,
          context: e,
          spanAttributes: i,
        });
      let { description: d, data: f, op: p } = Jg(n, i, r),
        m = { ...f, ...i };
      p && (m[Xl] = p);
      let h = { decision: !0 };
      if (
        (this._client.emit(
          `beforeSampling`,
          { spanAttributes: m, spanName: d, parentSampled: u, parentContext: c },
          h,
        ),
        !h.decision)
      )
        return nv({ decision: void 0, context: e, spanAttributes: i });
      let { isolationScope: g } = Ug(e) ?? {},
        _ = c?.traceState ? c.traceState.get(Ng) : void 0,
        v = _ ? pu(_) : void 0,
        y = Ou(v?.sample_rand) ?? Math.random(),
        [b, x, S] = $d(
          o,
          {
            name: d,
            attributes: m,
            normalizedRequest: g?.getScopeData().sdkProcessingMetadata.normalizedRequest,
            parentSampled: u,
            parentSampleRate: Ou(v?.sample_rate),
          },
          y,
        ),
        C = `${l}`.toUpperCase();
      return C === `OPTIONS` || C === `HEAD`
        ? (n_ && B.log(`[Tracing] Not sampling span because HTTP method is '${C}' for ${n}`),
          nv({
            decision: X.NOT_RECORD,
            context: e,
            spanAttributes: i,
            sampleRand: y,
            downstreamTraceSampleRate: 0,
          }))
        : (!b &&
            u === void 0 &&
            (n_ &&
              B.log(
                `[Tracing] Discarding root span because its trace was not chosen to be sampled.`,
              ),
            this._client.recordDroppedEvent(`sample_rate`, `transaction`)),
          {
            ...nv({
              decision: b ? X.RECORD_AND_SAMPLED : X.NOT_RECORD,
              context: e,
              spanAttributes: i,
              sampleRand: y,
              downstreamTraceSampleRate: S ? x : void 0,
            }),
            attributes: { [Yl]: S ? x : void 0 },
          });
    }
    toString() {
      return `SentrySampler`;
    }
  };
function tv(e, t, n) {
  let r = e.spanContext();
  if ((0, J.isSpanContextValid)(r) && r.traceId === t) {
    if (r.isRemote) {
      let t = qg(e.spanContext());
      return (
        n_ && B.log(`[Tracing] Inheriting remote parent's sampled decision for ${n}: ${t}`),
        t
      );
    }
    let t = qg(r);
    return (n_ && B.log(`[Tracing] Inheriting parent's sampled decision for ${n}: ${t}`), t);
  }
}
function nv({
  decision: e,
  context: t,
  spanAttributes: n,
  sampleRand: r,
  downstreamTraceSampleRate: i,
}) {
  let a = rv(t, n);
  return (
    i !== void 0 && (a = a.set(Lg, `${i}`)),
    r !== void 0 && (a = a.set(Ig, `${r}`)),
    e == null
      ? { decision: X.NOT_RECORD, traceState: a }
      : e === X.NOT_RECORD
        ? { decision: e, traceState: a.set(Pg, `1`) }
        : { decision: e, traceState: a }
  );
}
function rv(e, t) {
  let n = J.trace.getSpan(e)?.spanContext()?.traceState || new Mi(),
    r = t[Y.SEMATTRS_HTTP_URL] || t[Y.ATTR_URL_FULL];
  return (r && typeof r == `string` && (n = n.set(Fg, r)), n);
}
function iv(e) {
  let t = J.trace.getSpan(e);
  return t && (0, J.isSpanContextValid)(t.spanContext()) ? t : void 0;
}
function av(e, t) {
  if (!e) return t;
  let n = hu(e),
    r = hu(t);
  if (!r) return e;
  let i = { ...n };
  return (
    Object.entries(r).forEach(([e, t]) => {
      i[e] || (i[e] = t);
    }),
    _u(i)
  );
}
var ov = hl(process.versions.node),
  sv = ov.major,
  cv = ov.minor;
(F(), Ws());
var lv = `sentry-trace`,
  uv = `baggage`,
  dv = /baggage: (.*)\r\n/,
  fv = class extends Ms {
    constructor(e = {}) {
      (super(`@sentry/instrumentation-node-fetch`, Gs, e),
        (this._channelSubs = []),
        (this._propagationDecisionMap = new Ph(100)),
        (this._ignoreOutgoingRequestsMap = new WeakMap()));
    }
    init() {}
    disable() {
      (super.disable(),
        this._channelSubs.forEach((e) => e.unsubscribe()),
        (this._channelSubs = []));
    }
    enable() {
      (super.enable(),
        (this._channelSubs = this._channelSubs || []),
        !(this._channelSubs.length > 0) &&
          (this._subscribeToChannel(`undici:request:create`, this._onRequestCreated.bind(this)),
          this._subscribeToChannel(`undici:request:headers`, this._onResponseHeaders.bind(this))));
    }
    _onRequestCreated({ request: e }) {
      if (this.getConfig().enabled === !1) return;
      let t = this._shouldIgnoreOutgoingRequest(e);
      if ((this._ignoreOutgoingRequestsMap.set(e, t), t)) return;
      let n = hv(e.origin, e.path),
        r = W()?.getOptions().tracePropagationTargets,
        i = c_(n, r, this._propagationDecisionMap) ? Nm() : void 0;
      if (!i) return;
      let { "sentry-trace": a, baggage: o } = i;
      if (Array.isArray(e.headers)) {
        let t = e.headers;
        a && !t.includes(lv) && t.push(lv, a);
        let n = t.findIndex((e) => e === uv);
        if (o && n === -1) t.push(uv, o);
        else if (o) {
          let e = t[n + 1],
            r = av(e, o);
          r && (t[n + 1] = r);
        }
      } else {
        let t = e.headers;
        a && !t.includes(`${lv}:`) && (e.headers += `${lv}: ${a}\r\n`);
        let n = e.headers.match(dv)?.[1];
        if (o && !n) e.headers += `${uv}: ${o}\r\n`;
        else if (o) {
          let t = av(n, o);
          t && (e.headers = e.headers.replace(dv, `baggage: ${t}\r\n`));
        }
      }
    }
    _onResponseHeaders({ request: e, response: t }) {
      let n = this.getConfig();
      if (n.enabled === !1) return;
      let r = n.breadcrumbs,
        i = r === void 0 || r,
        a = this._ignoreOutgoingRequestsMap.get(e);
      i && !a && pv(e, t);
    }
    _subscribeToChannel(e, t) {
      let n = sv > 18 || (sv === 18 && cv >= 19),
        r;
      if (n) (D.subscribe?.(e, t), (r = () => D.unsubscribe?.(e, t)));
      else {
        let n = D.channel(e);
        (n.subscribe(t), (r = () => n.unsubscribe(t)));
      }
      this._channelSubs.push({ name: e, unsubscribe: r });
    }
    _shouldIgnoreOutgoingRequest(e) {
      if (Gn(J.context.active())) return !0;
      let t = hv(e.origin, e.path),
        n = this.getConfig().ignoreOutgoingRequests;
      return typeof n != `function` || !t ? !1 : n(t);
    }
  };
function pv(e, t) {
  let n = mv(e),
    r = t.statusCode,
    i = Dh(r);
  Rm(
    { category: `http`, data: { status_code: r, ...n }, type: `http`, level: i },
    { event: `response`, request: e, response: t },
  );
}
function mv(e) {
  try {
    let t = Em(hv(e.origin, e.path)),
      n = { url: Om(t), "http.method": e.method || `GET` };
    return (t.search && (n[`http.query`] = t.search), t.hash && (n[`http.fragment`] = t.hash), n);
  } catch {
    return {};
  }
}
function hv(e, t = `/`) {
  try {
    return new URL(t, e).toString();
  } catch {
    let n = `${e}`;
    return n.endsWith(`/`) && t.startsWith(`/`)
      ? `${n}${t.slice(1)}`
      : !n.endsWith(`/`) && !t.startsWith(`/`)
        ? `${n}/${t.slice(1)}`
        : `${n}${t}`;
  }
}
var gv = (0, s.promisify)(f.readFile),
  _v = (0, s.promisify)(f.readdir),
  vv = `Context`,
  yv = q((e = {}) => {
    let t,
      n = { app: !0, os: !0, device: !0, culture: !0, cloudResource: !0, ...e };
    async function r(e) {
      t === void 0 && (t = i());
      let n = bv(await t);
      return (
        (e.contexts = {
          ...e.contexts,
          app: { ...n.app, ...e.contexts?.app },
          os: { ...n.os, ...e.contexts?.os },
          device: { ...n.device, ...e.contexts?.device },
          culture: { ...n.culture, ...e.contexts?.culture },
          cloud_resource: { ...n.cloud_resource, ...e.contexts?.cloud_resource },
        }),
        e
      );
    }
    async function i() {
      let e = {};
      if (
        (n.os && (e.os = await xv()),
        n.app && (e.app = Cv()),
        n.device && (e.device = wv(n.device)),
        n.culture)
      ) {
        let t = Sv();
        t && (e.culture = t);
      }
      return (n.cloudResource && (e.cloud_resource = Mv()), e);
    }
    return {
      name: vv,
      processEvent(e) {
        return r(e);
      },
    };
  });
function bv(e) {
  if (
    (e.app?.app_memory && (e.app.app_memory = process.memoryUsage().rss),
    e.app?.free_memory && typeof process.availableMemory == `function`)
  ) {
    let t = process.availableMemory?.();
    t != null && (e.app.free_memory = t);
  }
  return (e.device?.free_memory && (e.device.free_memory = l.freemem()), e);
}
async function xv() {
  let e = l.platform();
  switch (e) {
    case `darwin`:
      return kv();
    case `linux`:
      return jv();
    default:
      return { name: Tv[e] || e, version: l.release() };
  }
}
function Sv() {
  try {
    if (typeof process.versions.icu != `string`) return;
    let e = new Date(9e8);
    if (new Intl.DateTimeFormat(`es`, { month: `long` }).format(e) === `enero`) {
      let e = Intl.DateTimeFormat().resolvedOptions();
      return { locale: e.locale, timezone: e.timeZone };
    }
  } catch {}
}
function Cv() {
  let e = process.memoryUsage().rss,
    t = {
      app_start_time: new Date(Date.now() - process.uptime() * 1e3).toISOString(),
      app_memory: e,
    };
  if (typeof process.availableMemory == `function`) {
    let e = process.availableMemory?.();
    e != null && (t.free_memory = e);
  }
  return t;
}
function wv(e) {
  let t = {},
    n;
  try {
    n = l.uptime();
  } catch {}
  if (
    (typeof n == `number` && (t.boot_time = new Date(Date.now() - n * 1e3).toISOString()),
    (t.arch = l.arch()),
    (e === !0 || e.memory) && ((t.memory_size = l.totalmem()), (t.free_memory = l.freemem())),
    e === !0 || e.cpu)
  ) {
    let e = l.cpus(),
      n = e?.[0];
    n &&
      ((t.processor_count = e.length),
      (t.cpu_description = n.model),
      (t.processor_frequency = n.speed));
  }
  return t;
}
var Tv = {
    aix: `IBM AIX`,
    freebsd: `FreeBSD`,
    openbsd: `OpenBSD`,
    sunos: `SunOS`,
    win32: `Windows`,
    ohos: `OpenHarmony`,
    android: `Android`,
  },
  Ev = [
    { name: `fedora-release`, distros: [`Fedora`] },
    { name: `redhat-release`, distros: [`Red Hat Linux`, `Centos`] },
    { name: `redhat_version`, distros: [`Red Hat Linux`] },
    { name: `SuSE-release`, distros: [`SUSE Linux`] },
    { name: `lsb-release`, distros: [`Ubuntu Linux`, `Arch Linux`] },
    { name: `debian_version`, distros: [`Debian`] },
    { name: `debian_release`, distros: [`Debian`] },
    { name: `arch-release`, distros: [`Arch Linux`] },
    { name: `gentoo-release`, distros: [`Gentoo Linux`] },
    { name: `novell-release`, distros: [`SUSE Linux`] },
    { name: `alpine-release`, distros: [`Alpine Linux`] },
  ],
  Dv = {
    alpine: (e) => e,
    arch: (e) => Ov(/distrib_release=(.*)/, e),
    centos: (e) => Ov(/release ([^ ]+)/, e),
    debian: (e) => e,
    fedora: (e) => Ov(/release (..)/, e),
    mint: (e) => Ov(/distrib_release=(.*)/, e),
    red: (e) => Ov(/release ([^ ]+)/, e),
    suse: (e) => Ov(/VERSION = (.*)\n/, e),
    ubuntu: (e) => Ov(/distrib_release=(.*)/, e),
  };
function Ov(e, t) {
  let n = e.exec(t);
  return n ? n[1] : void 0;
}
async function kv() {
  let e = {
    kernel_version: l.release(),
    name: `Mac OS X`,
    version: `10.${Number(l.release().split(`.`)[0]) - 4}`,
  };
  try {
    let t = await new Promise((e, t) => {
      (0, y.execFile)(`/usr/bin/sw_vers`, (n, r) => {
        if (n) {
          t(n);
          return;
        }
        e(r);
      });
    });
    ((e.name = Ov(/^ProductName:\s+(.*)$/m, t)),
      (e.version = Ov(/^ProductVersion:\s+(.*)$/m, t)),
      (e.build = Ov(/^BuildVersion:\s+(.*)$/m, t)));
  } catch {}
  return e;
}
function Av(e) {
  return e.split(` `)[0].toLowerCase();
}
async function jv() {
  let e = { kernel_version: l.release(), name: `Linux` };
  try {
    let t = await _v(`/etc`),
      n = Ev.find((e) => t.includes(e.name));
    if (!n) return e;
    let r = (await gv((0, u.join)(`/etc`, n.name), { encoding: `utf-8` })).toLowerCase(),
      { distros: i } = n;
    ((e.name = i.find((e) => r.indexOf(Av(e)) >= 0) || i[0]), (e.version = Dv[Av(e.name)]?.(r)));
  } catch {}
  return e;
}
function Mv() {
  if (process.env.VERCEL)
    return { "cloud.provider": `vercel`, "cloud.region": process.env.VERCEL_REGION };
  if (process.env.AWS_REGION)
    return {
      "cloud.provider": `aws`,
      "cloud.region": process.env.AWS_REGION,
      "cloud.platform": process.env.AWS_EXECUTION_ENV,
    };
  if (process.env.GCP_PROJECT) return { "cloud.provider": `gcp` };
  if (process.env.ALIYUN_REGION_ID)
    return { "cloud.provider": `alibaba_cloud`, "cloud.region": process.env.ALIYUN_REGION_ID };
  if (process.env.WEBSITE_SITE_NAME && process.env.REGION_NAME)
    return { "cloud.provider": `azure`, "cloud.region": process.env.REGION_NAME };
  if (process.env.IBM_CLOUD_REGION)
    return { "cloud.provider": `ibm_cloud`, "cloud.region": process.env.IBM_CLOUD_REGION };
  if (process.env.TENCENTCLOUD_REGION)
    return {
      "cloud.provider": `tencent_cloud`,
      "cloud.region": process.env.TENCENTCLOUD_REGION,
      "cloud.account.id": process.env.TENCENTCLOUD_APPID,
      "cloud.availability_zone": process.env.TENCENTCLOUD_ZONE,
    };
  if (process.env.NETLIFY) return { "cloud.provider": `netlify` };
  if (process.env.FLY_REGION)
    return { "cloud.provider": `fly.io`, "cloud.region": process.env.FLY_REGION };
  if (process.env.DYNO) return { "cloud.provider": `heroku` };
}
var Nv = new Ph(10),
  Pv = new Ph(20),
  Fv = 7,
  Iv = `ContextLines`;
function Lv(e, t, n) {
  let r = e.get(t);
  return r === void 0 ? (e.set(t, n), n) : r;
}
function Rv(e) {
  return !!(
    e.startsWith(`node:`) ||
    e.endsWith(`.min.js`) ||
    e.endsWith(`.min.cjs`) ||
    e.endsWith(`.min.mjs`) ||
    e.startsWith(`data:`)
  );
}
function zv(e) {
  return (e.lineno !== void 0 && e.lineno > 1e4) || (e.colno !== void 0 && e.colno > 1e3);
}
function Bv(e, t) {
  let n = Nv.get(e);
  if (n === void 0) return !1;
  for (let e = t[0]; e <= t[1]; e++) if (n[e] === void 0) return !1;
  return !0;
}
function Vv(e, t) {
  if (!e.length) return [];
  let n = 0,
    r = e[0];
  if (typeof r != `number`) return [];
  let i = Yv(r, t),
    a = [];
  for (;;) {
    if (n === e.length - 1) {
      a.push(i);
      break;
    }
    let r = e[n + 1];
    if (typeof r != `number`) break;
    (r <= i[1] ? (i[1] = r + t) : (a.push(i), (i = Yv(r, t))), n++);
  }
  return a;
}
function Hv(e, t, n) {
  return new Promise((r, i) => {
    let a = (0, f.createReadStream)(e),
      o = (0, S.createInterface)({ input: a });
    function s() {
      (a.destroy(), r());
    }
    let c = 0,
      l = 0,
      u = t[l];
    if (u === void 0) {
      s();
      return;
    }
    let d = u[0],
      p = u[1];
    function m(t) {
      (Pv.set(e, 1),
        Uh && B.error(`Failed to read file: ${e}. Error: ${t}`),
        o.close(),
        o.removeAllListeners(),
        s());
    }
    (a.on(`error`, m),
      o.on(`error`, m),
      o.on(`close`, s),
      o.on(`line`, (e) => {
        if ((c++, !(c < d) && ((n[c] = nl(e, 0)), c >= p))) {
          if (l === t.length - 1) {
            (o.close(), o.removeAllListeners());
            return;
          }
          l++;
          let e = t[l];
          if (e === void 0) {
            (o.close(), o.removeAllListeners());
            return;
          }
          ((d = e[0]), (p = e[1]));
        }
      }));
  });
}
async function Uv(e, t) {
  let n = {};
  if (t > 0 && e.exception?.values) {
    for (let t of e.exception.values)
      if (t.stacktrace?.frames?.length)
        for (let e = t.stacktrace.frames.length - 1; e >= 0; e--) {
          let r = t.stacktrace.frames[e],
            i = r?.filename;
          !r ||
            typeof i != `string` ||
            typeof r.lineno != `number` ||
            Rv(i) ||
            zv(r) ||
            (n[i] || (n[i] = []), n[i].push(r.lineno));
        }
  }
  let r = Object.keys(n);
  if (r.length == 0) return e;
  let i = [];
  for (let e of r) {
    if (Pv.get(e)) continue;
    let r = n[e];
    if (!r) continue;
    r.sort((e, t) => e - t);
    let a = Vv(r, t);
    if (a.every((t) => Bv(e, t))) continue;
    let o = Lv(Nv, e, {});
    i.push(Hv(e, a, o));
  }
  if (
    (await Promise.all(i).catch(() => {
      Uh && B.log(`Failed to read one or more source files and resolve context lines`);
    }),
    t > 0 && e.exception?.values)
  )
    for (let n of e.exception.values)
      n.stacktrace?.frames && n.stacktrace.frames.length > 0 && Wv(n.stacktrace.frames, t, Nv);
  return e;
}
function Wv(e, t, n) {
  for (let r of e)
    if (r.filename && r.context_line === void 0 && typeof r.lineno == `number`) {
      let e = n.get(r.filename);
      if (e === void 0) continue;
      Kv(r.lineno, r, t, e);
    }
}
function Gv(e) {
  (delete e.pre_context, delete e.context_line, delete e.post_context);
}
function Kv(e, t, n, r) {
  if (t.lineno === void 0 || r === void 0) {
    Uh && B.error(`Cannot resolve context for frame with no lineno or file contents`);
    return;
  }
  t.pre_context = [];
  for (let i = qv(e, n); i < e; i++) {
    let e = r[i];
    if (e === void 0) {
      (Gv(t), Uh && B.error(`Could not find line ${i} in file ${t.filename}`));
      return;
    }
    t.pre_context.push(e);
  }
  if (r[e] === void 0) {
    (Gv(t), Uh && B.error(`Could not find line ${e} in file ${t.filename}`));
    return;
  }
  t.context_line = r[e];
  let i = Jv(e, n);
  t.post_context = [];
  for (let n = e + 1; n <= i; n++) {
    let e = r[n];
    if (e === void 0) break;
    t.post_context.push(e);
  }
}
function qv(e, t) {
  return Math.max(1, e - t);
}
function Jv(e, t) {
  return e + t;
}
function Yv(e, t) {
  return [qv(e, t), Jv(e, t)];
}
var Xv = q((e = {}) => {
    let t = e.frameContextLines === void 0 ? Fv : e.frameContextLines;
    return {
      name: Iv,
      processEvent(e) {
        return Uv(e, t);
      },
    };
  }),
  Zv;
async function Qv() {
  if (Zv === void 0)
    try {
      Zv = !!(await import(`node:inspector`)).url();
    } catch {
      Zv = !1;
    }
  return Zv;
}
var $v = `__SENTRY_ERROR_LOCAL_VARIABLES__`;
function ey(e, t, n) {
  let r = 0,
    i = 5,
    a = 0;
  return (
    setInterval(() => {
      (a === 0
        ? r > e && ((i *= 2), n(i), i > 86400 && (i = 86400), (a = i))
        : (--a, a === 0 && t()),
        (r = 0));
    }, 1e3).unref(),
    () => {
      r += 1;
    }
  );
}
function ty(e) {
  return e !== void 0 && (e.length === 0 || e === `?` || e === `<anonymous>`);
}
function ny(e, t) {
  return e === t || `Object.${e}` === t || e === `Object.${t}` || (ty(e) && ty(t));
}
var ry = `LyohIEBzZW50cnkvbm9kZS1jb3JlIDEwLjI5LjAgKDM1MjlkNDYpIHwgaHR0cHM6Ly9naXRodWIuY29tL2dldHNlbnRyeS9zZW50cnktamF2YXNjcmlwdCAqLwppbXBvcnR7U2Vzc2lvbiBhcyBlfWZyb20ibm9kZTppbnNwZWN0b3IvcHJvbWlzZXMiO2ltcG9ydHt3b3JrZXJEYXRhIGFzIHR9ZnJvbSJub2RlOndvcmtlcl90aHJlYWRzIjtjb25zdCBuPWdsb2JhbFRoaXMsaT17fTtjb25zdCBvPSJfX1NFTlRSWV9FUlJPUl9MT0NBTF9WQVJJQUJMRVNfXyI7Y29uc3QgYT10O2Z1bmN0aW9uIHMoLi4uZSl7YS5kZWJ1ZyYmZnVuY3Rpb24oZSl7aWYoISgiY29uc29sZSJpbiBuKSlyZXR1cm4gZSgpO2NvbnN0IHQ9bi5jb25zb2xlLG89e30sYT1PYmplY3Qua2V5cyhpKTthLmZvckVhY2goZT0+e2NvbnN0IG49aVtlXTtvW2VdPXRbZV0sdFtlXT1ufSk7dHJ5e3JldHVybiBlKCl9ZmluYWxseXthLmZvckVhY2goZT0+e3RbZV09b1tlXX0pfX0oKCk9PmNvbnNvbGUubG9nKCJbTG9jYWxWYXJpYWJsZXMgV29ya2VyXSIsLi4uZSkpfWFzeW5jIGZ1bmN0aW9uIGMoZSx0LG4saSl7Y29uc3Qgbz1hd2FpdCBlLnBvc3QoIlJ1bnRpbWUuZ2V0UHJvcGVydGllcyIse29iamVjdElkOnQsb3duUHJvcGVydGllczohMH0pO2lbbl09by5yZXN1bHQuZmlsdGVyKGU9PiJsZW5ndGgiIT09ZS5uYW1lJiYhaXNOYU4ocGFyc2VJbnQoZS5uYW1lLDEwKSkpLnNvcnQoKGUsdCk9PnBhcnNlSW50KGUubmFtZSwxMCktcGFyc2VJbnQodC5uYW1lLDEwKSkubWFwKGU9PmUudmFsdWU/LnZhbHVlKX1hc3luYyBmdW5jdGlvbiByKGUsdCxuLGkpe2NvbnN0IG89YXdhaXQgZS5wb3N0KCJSdW50aW1lLmdldFByb3BlcnRpZXMiLHtvYmplY3RJZDp0LG93blByb3BlcnRpZXM6ITB9KTtpW25dPW8ucmVzdWx0Lm1hcChlPT5bZS5uYW1lLGUudmFsdWU/LnZhbHVlXSkucmVkdWNlKChlLFt0LG5dKT0+KGVbdF09bixlKSx7fSl9ZnVuY3Rpb24gdShlLHQpe2UudmFsdWUmJigidmFsdWUiaW4gZS52YWx1ZT92b2lkIDA9PT1lLnZhbHVlLnZhbHVlfHxudWxsPT09ZS52YWx1ZS52YWx1ZT90W2UubmFtZV09YDwke2UudmFsdWUudmFsdWV9PmA6dFtlLm5hbWVdPWUudmFsdWUudmFsdWU6ImRlc2NyaXB0aW9uImluIGUudmFsdWUmJiJmdW5jdGlvbiIhPT1lLnZhbHVlLnR5cGU/dFtlLm5hbWVdPWA8JHtlLnZhbHVlLmRlc2NyaXB0aW9ufT5gOiJ1bmRlZmluZWQiPT09ZS52YWx1ZS50eXBlJiYodFtlLm5hbWVdPSI8dW5kZWZpbmVkPiIpKX1hc3luYyBmdW5jdGlvbiBsKGUsdCl7Y29uc3Qgbj1hd2FpdCBlLnBvc3QoIlJ1bnRpbWUuZ2V0UHJvcGVydGllcyIse29iamVjdElkOnQsb3duUHJvcGVydGllczohMH0pLGk9e307Zm9yKGNvbnN0IHQgb2Ygbi5yZXN1bHQpaWYodC52YWx1ZT8ub2JqZWN0SWQmJiJBcnJheSI9PT10LnZhbHVlLmNsYXNzTmFtZSl7Y29uc3Qgbj10LnZhbHVlLm9iamVjdElkO2F3YWl0IGMoZSxuLHQubmFtZSxpKX1lbHNlIGlmKHQudmFsdWU/Lm9iamVjdElkJiYiT2JqZWN0Ij09PXQudmFsdWUuY2xhc3NOYW1lKXtjb25zdCBuPXQudmFsdWUub2JqZWN0SWQ7YXdhaXQgcihlLG4sdC5uYW1lLGkpfWVsc2UgdC52YWx1ZSYmdSh0LGkpO3JldHVybiBpfWxldCBmOyhhc3luYyBmdW5jdGlvbigpe2NvbnN0IHQ9bmV3IGU7dC5jb25uZWN0VG9NYWluVGhyZWFkKCkscygiQ29ubmVjdGVkIHRvIG1haW4gdGhyZWFkIik7bGV0IG49ITE7dC5vbigiRGVidWdnZXIucmVzdW1lZCIsKCk9PntuPSExfSksdC5vbigiRGVidWdnZXIucGF1c2VkIixlPT57bj0hMCxhc3luYyBmdW5jdGlvbihlLHtyZWFzb246dCxkYXRhOntvYmplY3RJZDpufSxjYWxsRnJhbWVzOml9KXtpZigiZXhjZXB0aW9uIiE9PXQmJiJwcm9taXNlUmVqZWN0aW9uIiE9PXQpcmV0dXJuO2lmKGY/LigpLG51bGw9PW4pcmV0dXJuO2NvbnN0IGE9W107Zm9yKGxldCB0PTA7dDxpLmxlbmd0aDt0Kyspe2NvbnN0e3Njb3BlQ2hhaW46bixmdW5jdGlvbk5hbWU6byx0aGlzOnN9PWlbdF0sYz1uLmZpbmQoZT0+ImxvY2FsIj09PWUudHlwZSkscj0iZ2xvYmFsIiE9PXMuY2xhc3NOYW1lJiZzLmNsYXNzTmFtZT9gJHtzLmNsYXNzTmFtZX0uJHtvfWA6bztpZih2b2lkIDA9PT1jPy5vYmplY3Qub2JqZWN0SWQpYVt0XT17ZnVuY3Rpb246cn07ZWxzZXtjb25zdCBuPWF3YWl0IGwoZSxjLm9iamVjdC5vYmplY3RJZCk7YVt0XT17ZnVuY3Rpb246cix2YXJzOm59fX1hd2FpdCBlLnBvc3QoIlJ1bnRpbWUuY2FsbEZ1bmN0aW9uT24iLHtmdW5jdGlvbkRlY2xhcmF0aW9uOmBmdW5jdGlvbigpIHsgdGhpcy4ke299ID0gdGhpcy4ke299IHx8ICR7SlNPTi5zdHJpbmdpZnkoYSl9OyB9YCxzaWxlbnQ6ITAsb2JqZWN0SWQ6bn0pLGF3YWl0IGUucG9zdCgiUnVudGltZS5yZWxlYXNlT2JqZWN0Iix7b2JqZWN0SWQ6bn0pfSh0LGUucGFyYW1zKS50aGVuKGFzeW5jKCk9PntuJiZhd2FpdCB0LnBvc3QoIkRlYnVnZ2VyLnJlc3VtZSIpfSxhc3luYyBlPT57biYmYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5yZXN1bWUiKX0pfSksYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5lbmFibGUiKTtjb25zdCBpPSExIT09YS5jYXB0dXJlQWxsRXhjZXB0aW9ucztpZihhd2FpdCB0LnBvc3QoIkRlYnVnZ2VyLnNldFBhdXNlT25FeGNlcHRpb25zIix7c3RhdGU6aT8iYWxsIjoidW5jYXVnaHQifSksaSl7Y29uc3QgZT1hLm1heEV4Y2VwdGlvbnNQZXJTZWNvbmR8fDUwO2Y9ZnVuY3Rpb24oZSx0LG4pe2xldCBpPTAsbz01LGE9MDtyZXR1cm4gc2V0SW50ZXJ2YWwoKCk9PnswPT09YT9pPmUmJihvKj0yLG4obyksbz44NjQwMCYmKG89ODY0MDApLGE9byk6KGEtPTEsMD09PWEmJnQoKSksaT0wfSwxZTMpLnVucmVmKCksKCk9PntpKz0xfX0oZSxhc3luYygpPT57cygiUmF0ZS1saW1pdCBsaWZ0ZWQuIiksYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5zZXRQYXVzZU9uRXhjZXB0aW9ucyIse3N0YXRlOiJhbGwifSl9LGFzeW5jIGU9PntzKGBSYXRlLWxpbWl0IGV4Y2VlZGVkLiBEaXNhYmxpbmcgY2FwdHVyaW5nIG9mIGNhdWdodCBleGNlcHRpb25zIGZvciAke2V9IHNlY29uZHMuYCksYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5zZXRQYXVzZU9uRXhjZXB0aW9ucyIse3N0YXRlOiJ1bmNhdWdodCJ9KX0pfX0pKCkuY2F0Y2goZT0+e3MoIkZhaWxlZCB0byBzdGFydCBkZWJ1Z2dlciIsZSl9KSxzZXRJbnRlcnZhbCgoKT0+e30sMWU0KTs=`;
function iy(...e) {
  B.log(`[LocalVariables]`, ...e);
}
var ay = q((e = {}) => {
  function t(t, n) {
    let r = (t.stacktrace?.frames || []).filter((e) => e.function !== `new Promise`);
    for (let t = 0; t < r.length; t++) {
      let i = r.length - t - 1,
        a = n[t],
        o = r[i];
      if (!o || !a) break;
      a.vars === void 0 ||
        (o.in_app === !1 && e.includeOutOfAppFrames !== !0) ||
        !ny(o.function, a.function) ||
        (o.vars = a.vars);
    }
  }
  function n(e, n) {
    if (
      n.originalException &&
      typeof n.originalException == `object` &&
      `__SENTRY_ERROR_LOCAL_VARIABLES__` in n.originalException &&
      Array.isArray(n.originalException.__SENTRY_ERROR_LOCAL_VARIABLES__)
    ) {
      for (let r of e.exception?.values || []) t(r, n.originalException[$v]);
      n.originalException[$v] = void 0;
    }
    return e;
  }
  async function r() {
    let e = await import(`node:inspector`);
    e.url() || e.open(0);
  }
  function i(e) {
    let t = new O.Worker(new URL(`data:application/javascript;base64,${ry}`), {
      workerData: e,
      execArgv: [],
      env: { ...process.env, NODE_OPTIONS: void 0 },
    });
    (process.on(`exit`, () => {
      t.terminate();
    }),
      t.once(`error`, (e) => {
        iy(`Worker error`, e);
      }),
      t.once(`exit`, (e) => {
        iy(`Worker exit`, e);
      }),
      t.unref());
  }
  return {
    name: `LocalVariablesAsync`,
    async setup(t) {
      if (!t.getOptions().includeLocalVariables) return;
      if (await Qv()) {
        B.warn(
          `Local variables capture has been disabled because the debugger was already enabled`,
        );
        return;
      }
      let n = { ...e, debug: B.isEnabled() };
      r().then(
        () => {
          try {
            i(n);
          } catch (e) {
            B.error(`Failed to start worker`, e);
          }
        },
        (e) => {
          B.error(`Failed to start inspector`, e);
        },
      );
    },
    processEvent(e, t) {
      return n(e, t);
    },
  };
});
function oy(e) {
  if (e !== void 0)
    return e.slice(-10).reduce((e, t) => `${e},${t.function},${t.lineno},${t.colno}`, ``);
}
function sy(e, t) {
  if (t !== void 0) return oy(e(t, 1));
}
function cy(e) {
  let t = [],
    n = !1;
  function r(r) {
    ((t = []), !n && ((n = !0), e(r)));
  }
  t.push(r);
  function i(e) {
    t.push(e);
  }
  function a(e) {
    let n = t.pop() || r;
    try {
      n(e);
    } catch {
      r(e);
    }
  }
  return { add: i, next: a };
}
var ly = class e {
    constructor(e) {
      this._session = e;
    }
    static async create(t) {
      if (t) return t;
      let n = await import(`node:inspector`);
      return new e(new n.Session());
    }
    configureAndConnect(e, t) {
      (this._session.connect(),
        this._session.on(`Debugger.paused`, (t) => {
          e(t, () => {
            this._session.post(`Debugger.resume`);
          });
        }),
        this._session.post(`Debugger.enable`),
        this._session.post(`Debugger.setPauseOnExceptions`, { state: t ? `all` : `uncaught` }));
    }
    setPauseOnExceptions(e) {
      this._session.post(`Debugger.setPauseOnExceptions`, { state: e ? `all` : `uncaught` });
    }
    getLocalVariables(e, t) {
      this._getProperties(e, (e) => {
        let { add: n, next: r } = cy(t);
        for (let t of e)
          if (t.value?.objectId && t.value.className === `Array`) {
            let e = t.value.objectId;
            n((n) => this._unrollArray(e, t.name, n, r));
          } else if (t.value?.objectId && t.value.className === `Object`) {
            let e = t.value.objectId;
            n((n) => this._unrollObject(e, t.name, n, r));
          } else t.value && n((e) => this._unrollOther(t, e, r));
        r({});
      });
    }
    _getProperties(e, t) {
      this._session.post(`Runtime.getProperties`, { objectId: e, ownProperties: !0 }, (e, n) => {
        t(e ? [] : n.result);
      });
    }
    _unrollArray(e, t, n, r) {
      this._getProperties(e, (e) => {
        ((n[t] = e
          .filter((e) => e.name !== `length` && !isNaN(parseInt(e.name, 10)))
          .sort((e, t) => parseInt(e.name, 10) - parseInt(t.name, 10))
          .map((e) => e.value?.value)),
          r(n));
      });
    }
    _unrollObject(e, t, n, r) {
      this._getProperties(e, (e) => {
        ((n[t] = e.map((e) => [e.name, e.value?.value]).reduce((e, [t, n]) => ((e[t] = n), e), {})),
          r(n));
      });
    }
    _unrollOther(e, t, n) {
      (e.value &&
        (`value` in e.value
          ? e.value.value === void 0 || e.value.value === null
            ? (t[e.name] = `<${e.value.value}>`)
            : (t[e.name] = e.value.value)
          : `description` in e.value && e.value.type !== `function`
            ? (t[e.name] = `<${e.value.description}>`)
            : e.value.type === `undefined` && (t[e.name] = `<undefined>`)),
        n(t));
    }
  },
  uy = `LocalVariables`,
  dy = q((e = {}, t) => {
    let n = new Ph(20),
      r,
      i = !1;
    function a(t) {
      let r = oy(t.stacktrace?.frames);
      if (r === void 0) return;
      let i = n.remove(r);
      if (i === void 0) return;
      let a = (t.stacktrace?.frames || []).filter((e) => e.function !== `new Promise`);
      for (let t = 0; t < a.length; t++) {
        let n = a.length - t - 1,
          r = i[t],
          o = a[n];
        if (!o || !r) break;
        r.vars === void 0 ||
          (o.in_app === !1 && e.includeOutOfAppFrames !== !0) ||
          !ny(o.function, r.function) ||
          (o.vars = r.vars);
      }
    }
    function o(e) {
      for (let t of e.exception?.values || []) a(t);
      return e;
    }
    let s;
    async function c() {
      let a = W()?.getOptions();
      if (a?.includeLocalVariables) {
        if (sv < 18) {
          B.log("The `LocalVariables` integration is only supported on Node >= v18.");
          return;
        }
        if (await Qv()) {
          B.warn(
            `Local variables capture has been disabled because the debugger was already enabled`,
          );
          return;
        }
        try {
          let o = await ly.create(t),
            s = (e, { params: { reason: t, data: i, callFrames: a } }, s) => {
              if (t !== `exception` && t !== `promiseRejection`) {
                s();
                return;
              }
              r?.();
              let c = sy(e, i.description);
              if (c == null) {
                s();
                return;
              }
              let { add: l, next: u } = cy((e) => {
                (n.set(c, e), s());
              });
              for (let e = 0; e < Math.min(a.length, 5); e++) {
                let { scopeChain: t, functionName: n, this: r } = a[e],
                  i = t.find((e) => e.type === `local`),
                  s = r.className === `global` || !r.className ? n : `${r.className}.${n}`;
                if (i?.object.objectId === void 0)
                  l((t) => {
                    ((t[e] = { function: s }), u(t));
                  });
                else {
                  let t = i.object.objectId;
                  l((n) =>
                    o.getLocalVariables(t, (t) => {
                      ((n[e] = { function: s, vars: t }), u(n));
                    }),
                  );
                }
              }
              u([]);
            },
            c = e.captureAllExceptions !== !1;
          (o.configureAndConnect((e, t) => s(a.stackParser, e, t), c),
            c &&
              (r = ey(
                e.maxExceptionsPerSecond || 50,
                () => {
                  (B.log(`Local variables rate-limit lifted.`), o.setPauseOnExceptions(!0));
                },
                (e) => {
                  (B.log(
                    `Local variables rate-limit exceeded. Disabling capturing of caught exceptions for ${e} seconds.`,
                  ),
                    o.setPauseOnExceptions(!1));
                },
              )),
            (i = !0));
        } catch (e) {
          B.log("The `LocalVariables` integration failed to start.", e);
        }
      }
    }
    return {
      name: uy,
      setupOnce() {
        s = c();
      },
      async processEvent(e) {
        return (await s, i ? o(e) : e);
      },
      _getCachedFramesCount() {
        return n.size;
      },
      _getFirstCachedFrame() {
        return n.values()[0];
      },
    };
  }),
  fy = (e = {}) => (ov.major < 19 ? dy(e) : ay(e)),
  py = 2e3;
function my(e) {
  Qs(() => {
    console.error(e);
  });
  let t = W();
  if (t === void 0) {
    (Uh && B.warn(`No NodeClient was defined, we are exiting the process now.`),
      global.process.exit(1));
    return;
  }
  let n = t.getOptions(),
    r = n?.shutdownTimeout && n.shutdownTimeout > 0 ? n.shutdownTimeout : py;
  t.close(r).then(
    (e) => {
      (e ||
        (Uh &&
          B.warn(`We reached the timeout for emptying the request buffer, still exiting now!`)),
        global.process.exit(1));
    },
    (e) => {
      Uh && B.error(e);
    },
  );
}
var hy = `OnUnhandledRejection`,
  gy = [{ name: `AI_NoOutputGeneratedError` }],
  _y = q((e = {}) => {
    let t = { mode: e.mode ?? `warn`, ignore: [...gy, ...(e.ignore ?? [])] };
    return {
      name: hy,
      setup(e) {
        global.process.on(`unhandledRejection`, xy(e, t));
      },
    };
  });
function vy(e) {
  if (typeof e != `object` || !e) return { name: ``, message: String(e ?? ``) };
  let t = e;
  return {
    name: typeof t.name == `string` ? t.name : ``,
    message: typeof t.message == `string` ? t.message : String(e),
  };
}
function yy(e, t) {
  let n = e.name === void 0 || il(t.name, e.name, !0),
    r = e.message === void 0 || il(t.message, e.message);
  return n && r;
}
function by(e, t) {
  let n = vy(t);
  return e.some((e) => yy(e, n));
}
function xy(e, t) {
  return function (n, r) {
    if (W() !== e || by(t.ignore ?? [], n)) return;
    let i = t.mode === `strict` ? `fatal` : `error`,
      a = n && typeof n == `object` ? n._sentry_active_span : void 0;
    ((a ? (e) => nf(a, e) : (e) => e())(() => {
      Hf(n, {
        originalException: r,
        captureContext: { extra: { unhandledPromiseRejection: !0 }, level: i },
        mechanism: { handled: !1, type: `auto.node.onunhandledrejection` },
      });
    }),
      Sy(n, t.mode));
  };
}
function Sy(e, t) {
  let n = `This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:`;
  t === `warn`
    ? Qs(() => {
        (console.warn(n), console.error(e && typeof e == `object` && `stack` in e ? e.stack : e));
      })
    : t === `strict` &&
      (Qs(() => {
        console.warn(n);
      }),
      my(e));
}
var Cy = `ChildProcess`,
  wy = q((e = {}) => ({
    name: Cy,
    setup() {
      (E.channel(`child_process`).subscribe((t) => {
        t && typeof t == `object` && `process` in t && Ty(t.process, e);
      }),
        E.channel(`worker_threads`).subscribe((t) => {
          t && typeof t == `object` && `worker` in t && Ey(t.worker, e);
        }));
    },
  }));
function Ty(e, t) {
  let n = !1,
    r;
  e.on(`spawn`, () => {
    if (e.spawnfile === `/usr/bin/sw_vers`) {
      n = !0;
      return;
    }
    ((r = { spawnfile: e.spawnfile }), t.includeChildProcessArgs && (r.spawnargs = e.spawnargs));
  })
    .on(`exit`, (e) => {
      n ||
        ((n = !0),
        e !== null &&
          e !== 0 &&
          Rm({
            category: `child_process`,
            message: `Child process exited with code '${e}'`,
            level: e === 0 ? `info` : `warning`,
            data: r,
          }));
    })
    .on(`error`, (e) => {
      n ||
        ((n = !0),
        Rm({
          category: `child_process`,
          message: `Child process errored with '${e.message}'`,
          level: `error`,
          data: r,
        }));
    });
}
function Ey(e, t) {
  let n;
  e.on(`online`, () => {
    n = e.threadId;
  }).on(`error`, (e) => {
    t.captureWorkerErrors === !1
      ? Rm({
          category: `worker_thread`,
          message: `Worker thread errored with '${e.message}'`,
          level: `error`,
          data: { threadId: n },
        })
      : Hf(e, {
          mechanism: {
            type: `auto.child_process.worker_thread`,
            handled: !1,
            data: { threadId: String(n) },
          },
        });
  });
}
var Dy = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.AbstractAsyncHooksContextManager = void 0));
    var t = require("events"),
      n = [`addListener`, `on`, `once`, `prependListener`, `prependOnceListener`];
    e.AbstractAsyncHooksContextManager = class {
      bind(e, n) {
        return n instanceof t.EventEmitter
          ? this._bindEventEmitter(e, n)
          : typeof n == `function`
            ? this._bindFunction(e, n)
            : n;
      }
      _bindFunction(e, t) {
        let n = this,
          r = function (...r) {
            return n.with(e, () => t.apply(this, r));
          };
        return (
          Object.defineProperty(r, "length", {
            enumerable: !1,
            configurable: !0,
            writable: !1,
            value: t.length,
          }),
          r
        );
      }
      _bindEventEmitter(e, t) {
        return this._getPatchMap(t) === void 0
          ? (this._createPatchMap(t),
            n.forEach((n) => {
              t[n] !== void 0 && (t[n] = this._patchAddListener(t, t[n], e));
            }),
            typeof t.removeListener == `function` &&
              (t.removeListener = this._patchRemoveListener(t, t.removeListener)),
            typeof t.off == `function` && (t.off = this._patchRemoveListener(t, t.off)),
            typeof t.removeAllListeners == `function` &&
              (t.removeAllListeners = this._patchRemoveAllListeners(t, t.removeAllListeners)),
            t)
          : t;
      }
      _patchRemoveListener(e, t) {
        let n = this;
        return function (r, i) {
          let a = n._getPatchMap(e)?.[r];
          if (a === void 0) return t.call(this, r, i);
          let o = a.get(i);
          return t.call(this, r, o || i);
        };
      }
      _patchRemoveAllListeners(e, t) {
        let n = this;
        return function (r) {
          let i = n._getPatchMap(e);
          return (
            i !== void 0 &&
              (arguments.length === 0 ? n._createPatchMap(e) : i[r] !== void 0 && delete i[r]),
            t.apply(this, arguments)
          );
        };
      }
      _patchAddListener(e, t, n) {
        let r = this;
        return function (i, a) {
          if (r._wrapped) return t.call(this, i, a);
          let o = r._getPatchMap(e);
          o === void 0 && (o = r._createPatchMap(e));
          let s = o[i];
          s === void 0 && ((s = new WeakMap()), (o[i] = s));
          let c = r.bind(n, a);
          (s.set(a, c), (r._wrapped = !0));
          try {
            return t.call(this, i, c);
          } finally {
            r._wrapped = !1;
          }
        };
      }
      _createPatchMap(e) {
        let t = Object.create(null);
        return ((e[this._kOtListeners] = t), t);
      }
      _getPatchMap(e) {
        return e[this._kOtListeners];
      }
      _kOtListeners = Symbol(`OtListeners`);
      _wrapped = !1;
    };
  }),
  Oy = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.AsyncHooksContextManager = void 0));
    var t = N(),
      n = require("async_hooks"),
      r = Dy();
    e.AsyncHooksContextManager = class extends r.AbstractAsyncHooksContextManager {
      _asyncHook;
      _contexts = new Map();
      _stack = [];
      constructor() {
        (super(),
          (this._asyncHook = n.createHook({
            init: this._init.bind(this),
            before: this._before.bind(this),
            after: this._after.bind(this),
            destroy: this._destroy.bind(this),
            promiseResolve: this._destroy.bind(this),
          })));
      }
      active() {
        return this._stack[this._stack.length - 1] ?? t.ROOT_CONTEXT;
      }
      with(e, t, n, ...r) {
        this._enterContext(e);
        try {
          return t.call(n, ...r);
        } finally {
          this._exitContext();
        }
      }
      enable() {
        return (this._asyncHook.enable(), this);
      }
      disable() {
        return (this._asyncHook.disable(), this._contexts.clear(), (this._stack = []), this);
      }
      _init(e, t) {
        if (t === `TIMERWRAP`) return;
        let n = this._stack[this._stack.length - 1];
        n !== void 0 && this._contexts.set(e, n);
      }
      _destroy(e) {
        this._contexts.delete(e);
      }
      _before(e) {
        let t = this._contexts.get(e);
        t !== void 0 && this._enterContext(t);
      }
      _after() {
        this._exitContext();
      }
      _enterContext(e) {
        this._stack.push(e);
      }
      _exitContext() {
        this._stack.pop();
      }
    };
  }),
  ky = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.AsyncLocalStorageContextManager = void 0));
    var t = N(),
      n = require("async_hooks"),
      r = Dy();
    e.AsyncLocalStorageContextManager = class extends r.AbstractAsyncHooksContextManager {
      _asyncLocalStorage;
      constructor() {
        (super(), (this._asyncLocalStorage = new n.AsyncLocalStorage()));
      }
      active() {
        return this._asyncLocalStorage.getStore() ?? t.ROOT_CONTEXT;
      }
      with(e, t, n, ...r) {
        let i = n == null ? t : t.bind(n);
        return this._asyncLocalStorage.run(e, i, ...r);
      }
      enable() {
        return this;
      }
      disable() {
        return (this._asyncLocalStorage.disable(), this);
      }
    };
  }),
  Ay = M_(
    e.t((e) => {
      (Object.defineProperty(e, "__esModule", { value: !0 }),
        (e.AsyncLocalStorageContextManager = e.AsyncHooksContextManager = void 0));
      var t = Oy();
      Object.defineProperty(e, "AsyncHooksContextManager", {
        enumerable: !0,
        get: function () {
          return t.AsyncHooksContextManager;
        },
      });
      var n = ky();
      Object.defineProperty(e, "AsyncLocalStorageContextManager", {
        enumerable: !0,
        get: function () {
          return n.AsyncLocalStorageContextManager;
        },
      });
    })().AsyncLocalStorageContextManager,
  );
function jy() {
  (J.diag.disable(),
    J.diag.setLogger(
      { error: B.error, warn: B.warn, info: B.log, debug: B.log, verbose: B.log },
      J.DiagLogLevel.DEBUG,
    ));
}
function My(e) {
  return e.replace(/^[A-Z]:/, ``).replace(/\\/g, `/`);
}
function Ny(e = process.argv[1] ? vh(process.argv[1]) : process.cwd(), t = u.sep === `\\`) {
  let n = t ? My(e) : e;
  return (e) => {
    if (!e) return;
    let r = t ? My(e) : e,
      { dir: i, base: a, ext: o } = u.posix.parse(r);
    (o === `.js` || o === `.mjs` || o === `.cjs`) && (a = a.slice(0, o.length * -1));
    let s = decodeURIComponent(a);
    i ||= `.`;
    let c = i.lastIndexOf(`/node_modules`);
    if (c > -1) return `${i.slice(c + 14).replace(/\//g, `.`)}:${s}`;
    if (i.startsWith(n)) {
      let e = i.slice(n.length + 1).replace(/\//g, `.`);
      return e ? `${e}:${s}` : s;
    }
    return s;
  };
}
Ws();
var Py = 6e4,
  Fy = class extends ym {
    constructor(e) {
      let t =
          e.includeServerName === !1
            ? void 0
            : e.serverName || global.process.env.SENTRY_NAME || l.hostname(),
        n = {
          ...e,
          platform: `node`,
          runtime: { name: `node`, version: global.process.version },
          serverName: t,
        };
      (e.openTelemetryInstrumentations && po({ instrumentations: e.openTelemetryInstrumentations }),
        Mm(n, `node`),
        B.log(
          `Initializing Sentry: process: ${process.pid}, thread: ${T.isMainThread ? `main` : `worker-${T.threadId}`}.`,
        ),
        super(n),
        this.getOptions().enableLogs &&
          ((this._logOnExitFlushListener = () => {
            yp(this);
          }),
          t &&
            this.on(`beforeCaptureLog`, (e) => {
              e.attributes = { ...e.attributes, "server.address": t };
            }),
          process.on(`beforeExit`, this._logOnExitFlushListener)));
    }
    get tracer() {
      if (this._tracer) return this._tracer;
      let e = Gs,
        t = J.trace.getTracer(`@sentry/node`, e);
      return ((this._tracer = t), t);
    }
    async flush(e) {
      return (
        await this.traceProvider?.forceFlush(),
        this.getOptions().sendClientReports && this._flushOutcomes(),
        super.flush(e)
      );
    }
    async close(e) {
      (this._clientReportInterval && clearInterval(this._clientReportInterval),
        this._clientReportOnExitFlushListener &&
          process.off(`beforeExit`, this._clientReportOnExitFlushListener),
        this._logOnExitFlushListener && process.off(`beforeExit`, this._logOnExitFlushListener));
      let t = await super.close(e);
      return (this.traceProvider && (await this.traceProvider.shutdown()), t);
    }
    startClientReportTracking() {
      let e = this.getOptions();
      e.sendClientReports &&
        ((this._clientReportOnExitFlushListener = () => {
          this._flushOutcomes();
        }),
        (this._clientReportInterval = setInterval(() => {
          (Uh && B.log(`Flushing client reports based on interval.`), this._flushOutcomes());
        }, e.clientReportFlushInterval ?? Py).unref()),
        process.on(`beforeExit`, this._clientReportOnExitFlushListener));
    }
    _setupIntegrations() {
      (Tm(), super._setupIntegrations());
    }
    _getTraceInfoFromScope(e) {
      return e ? D_(this, e) : [void 0, void 0];
    }
  },
  Iy = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }),
      (e.PACKAGE_NAME = e.PACKAGE_VERSION = void 0),
      (e.PACKAGE_VERSION = `0.19.0`),
      (e.PACKAGE_NAME = `@opentelemetry/instrumentation-undici`));
  }),
  Ly = e.t((t) => {
    (Object.defineProperty(t, "__esModule", { value: !0 }), (t.UndiciInstrumentation = void 0));
    var n = require("diagnostics_channel"),
      r = require("url"),
      i = (Ws(), e.i(Us)),
      a = N(),
      o = (F(), e.i(za)),
      s = Wr(),
      c = Iy();
    t.UndiciInstrumentation = class extends i.InstrumentationBase {
      _recordFromReq = new WeakMap();
      constructor(e = {}) {
        super(c.PACKAGE_NAME, c.PACKAGE_VERSION, e);
      }
      init() {}
      disable() {
        (super.disable(),
          this._channelSubs.forEach((e) => e.unsubscribe()),
          (this._channelSubs.length = 0));
      }
      enable() {
        (super.enable(),
          (this._channelSubs = this._channelSubs || []),
          !(this._channelSubs.length > 0) &&
            (this.subscribeToChannel(`undici:request:create`, this.onRequestCreated.bind(this)),
            this.subscribeToChannel(`undici:client:sendHeaders`, this.onRequestHeaders.bind(this)),
            this.subscribeToChannel(`undici:request:headers`, this.onResponseHeaders.bind(this)),
            this.subscribeToChannel(`undici:request:trailers`, this.onDone.bind(this)),
            this.subscribeToChannel(`undici:request:error`, this.onError.bind(this))));
      }
      _updateMetricInstruments() {
        this._httpClientDurationHistogram = this.meter.createHistogram(
          s.METRIC_HTTP_CLIENT_REQUEST_DURATION,
          {
            description: `Measures the duration of outbound HTTP requests.`,
            unit: `s`,
            valueType: a.ValueType.DOUBLE,
            advice: {
              explicitBucketBoundaries: [
                0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10,
              ],
            },
          },
        );
      }
      subscribeToChannel(e, t) {
        let [r, i] = process.version
            .replace(`v`, ``)
            .split(`.`)
            .map((e) => Number(e)),
          a = r > 18 || (r === 18 && i >= 19),
          o;
        if (a) (n.subscribe?.(e, t), (o = () => n.unsubscribe?.(e, t)));
        else {
          let r = n.channel(e);
          (r.subscribe(t), (o = () => r.unsubscribe(t)));
        }
        this._channelSubs.push({ name: e, unsubscribe: o });
      }
      parseRequestHeaders(e) {
        let t = new Map();
        if (Array.isArray(e.headers))
          for (let n = 0; n < e.headers.length; n += 2) {
            let r = e.headers[n],
              i = e.headers[n + 1];
            typeof r == `string` && t.set(r.toLowerCase(), i);
          }
        else if (typeof e.headers == `string`) {
          let n = e.headers.split(`\r
`);
          for (let e of n) {
            if (!e) continue;
            let n = e.indexOf(`:`);
            if (n === -1) continue;
            let r = e.substring(0, n).toLowerCase(),
              i = e.substring(n + 1).trim(),
              a = t.get(r);
            a && Array.isArray(a) ? a.push(i) : a ? t.set(r, [a, i]) : t.set(r, i);
          }
        }
        return t;
      }
      onRequestCreated({ request: e }) {
        let t = this.getConfig(),
          n = t.enabled !== !1;
        if (
          (0, i.safeExecuteInTheMiddle)(
            () => !n || e.method === `CONNECT` || t.ignoreRequestHook?.(e),
            (e) => e && this._diag.error(`caught ignoreRequestHook error: `, e),
            !0,
          )
        )
          return;
        let c = (0, o.hrTime)(),
          l;
        try {
          l = new r.URL(e.path, e.origin);
        } catch (e) {
          this._diag.warn(`could not determine url.full:`, e);
          return;
        }
        let u = l.protocol.replace(`:`, ``),
          d = this.getRequestMethod(e.method),
          f = {
            [s.ATTR_HTTP_REQUEST_METHOD]: d,
            [s.ATTR_HTTP_REQUEST_METHOD_ORIGINAL]: e.method,
            [s.ATTR_URL_FULL]: l.toString(),
            [s.ATTR_URL_PATH]: l.pathname,
            [s.ATTR_URL_QUERY]: l.search,
            [s.ATTR_URL_SCHEME]: u,
          },
          p = { https: `443`, http: `80` },
          m = l.hostname,
          h = l.port || p[u];
        ((f[s.ATTR_SERVER_ADDRESS] = m),
          h && !isNaN(Number(h)) && (f[s.ATTR_SERVER_PORT] = Number(h)));
        let g = this.parseRequestHeaders(e).get(`user-agent`);
        if (g) {
          let e = Array.isArray(g) ? g[g.length - 1] : g;
          f[s.ATTR_USER_AGENT_ORIGINAL] = e;
        }
        let _ = (0, i.safeExecuteInTheMiddle)(
          () => t.startSpanHook?.(e),
          (e) => e && this._diag.error(`caught startSpanHook error: `, e),
          !0,
        );
        _ &&
          Object.entries(_).forEach(([e, t]) => {
            f[e] = t;
          });
        let v = a.context.active(),
          y = a.trace.getSpan(v),
          b;
        ((b =
          t.requireParentforSpans && (!y || !a.trace.isSpanContextValid(y.spanContext()))
            ? a.trace.wrapSpanContext(a.INVALID_SPAN_CONTEXT)
            : this.tracer.startSpan(
                d === `_OTHER` ? `HTTP` : d,
                { kind: a.SpanKind.CLIENT, attributes: f },
                v,
              )),
          (0, i.safeExecuteInTheMiddle)(
            () => t.requestHook?.(b, e),
            (e) => e && this._diag.error(`caught requestHook error: `, e),
            !0,
          ));
        let x = a.trace.setSpan(a.context.active(), b),
          S = {};
        a.propagation.inject(x, S);
        let C = Object.entries(S);
        for (let t = 0; t < C.length; t++) {
          let [n, r] = C[t];
          typeof e.addHeader == `function`
            ? e.addHeader(n, r)
            : typeof e.headers == `string`
              ? (e.headers += `${n}: ${r}\r\n`)
              : Array.isArray(e.headers) && e.headers.push(n, r);
        }
        this._recordFromReq.set(e, { span: b, attributes: f, startTime: c });
      }
      onRequestHeaders({ request: e, socket: t }) {
        let n = this._recordFromReq.get(e);
        if (!n) return;
        let r = this.getConfig(),
          { span: i } = n,
          { remoteAddress: a, remotePort: o } = t,
          c = { [s.ATTR_NETWORK_PEER_ADDRESS]: a, [s.ATTR_NETWORK_PEER_PORT]: o };
        if (r.headersToSpanAttributes?.requestHeaders) {
          let t = new Set(r.headersToSpanAttributes.requestHeaders.map((e) => e.toLowerCase())),
            n = this.parseRequestHeaders(e);
          for (let [e, r] of n.entries())
            if (t.has(e)) {
              let t = Array.isArray(r) ? r.join(`, `) : r;
              c[`http.request.header.${e}`] = t;
            }
        }
        i.setAttributes(c);
      }
      onResponseHeaders({ request: e, response: t }) {
        let n = this._recordFromReq.get(e);
        if (!n) return;
        let { span: r, attributes: o } = n,
          c = { [s.ATTR_HTTP_RESPONSE_STATUS_CODE]: t.statusCode },
          l = this.getConfig();
        (0, i.safeExecuteInTheMiddle)(
          () => l.responseHook?.(r, { request: e, response: t }),
          (e) => e && this._diag.error(`caught responseHook error: `, e),
          !0,
        );
        let u = new Set();
        l.headersToSpanAttributes?.responseHeaders &&
          l.headersToSpanAttributes?.responseHeaders.forEach((e) => u.add(e.toLowerCase()));
        for (let e = 0; e < t.headers.length; e += 2) {
          let n = t.headers[e].toString().toLowerCase(),
            r = t.headers[e + 1];
          if (
            (u.has(n) && (c[`http.response.header.${n}`] = r.toString()), n === `content-length`)
          ) {
            let e = Number(r.toString());
            isNaN(e) || (c[`http.response.header.content-length`] = e);
          }
        }
        (r.setAttributes(c),
          r.setStatus({
            code: t.statusCode >= 400 ? a.SpanStatusCode.ERROR : a.SpanStatusCode.UNSET,
          }),
          (n.attributes = Object.assign(o, c)));
      }
      onDone({ request: e }) {
        let t = this._recordFromReq.get(e);
        if (!t) return;
        let { span: n, attributes: r, startTime: i } = t;
        (n.end(), this._recordFromReq.delete(e), this.recordRequestDuration(r, i));
      }
      onError({ request: e, error: t }) {
        let n = this._recordFromReq.get(e);
        if (!n) return;
        let { span: r, attributes: i, startTime: o } = n;
        (r.recordException(t),
          r.setStatus({ code: a.SpanStatusCode.ERROR, message: t.message }),
          r.end(),
          this._recordFromReq.delete(e),
          (i[s.ATTR_ERROR_TYPE] = t.message),
          this.recordRequestDuration(i, o));
      }
      recordRequestDuration(e, t) {
        let n = {};
        [
          s.ATTR_HTTP_RESPONSE_STATUS_CODE,
          s.ATTR_HTTP_REQUEST_METHOD,
          s.ATTR_SERVER_ADDRESS,
          s.ATTR_SERVER_PORT,
          s.ATTR_URL_SCHEME,
          s.ATTR_ERROR_TYPE,
        ].forEach((t) => {
          t in e && (n[t] = e[t]);
        });
        let r = (0, o.hrTimeToMilliseconds)((0, o.hrTimeDuration)(t, (0, o.hrTime)())) / 1e3;
        this._httpClientDurationHistogram.record(r, n);
      }
      getRequestMethod(e) {
        return e.toUpperCase() in
          {
            CONNECT: !0,
            OPTIONS: !0,
            HEAD: !0,
            GET: !0,
            POST: !0,
            PUT: !0,
            PATCH: !0,
            DELETE: !0,
            TRACE: !0,
          }
          ? e.toUpperCase()
          : `_OTHER`;
      }
    };
  }),
  Ry = e.t((e) => {
    (Object.defineProperty(e, "__esModule", { value: !0 }), (e.UndiciInstrumentation = void 0));
    var t = Ly();
    Object.defineProperty(e, "UndiciInstrumentation", {
      enumerable: !0,
      get: function () {
        return t.UndiciInstrumentation;
      },
    });
  })(),
  zy = `NodeFetch`,
  By = Bh(zy, Ry.UndiciInstrumentation, (e) => Gy(e)),
  Vy = Bh(`${zy}.sentry`, fv, (e) => e),
  Hy = q((e = {}) => ({
    name: `NodeFetch`,
    setupOnce() {
      (Wy(e, W()?.getOptions()) && By(e), Vy(e));
    },
  }));
function Uy(e, t = `/`) {
  let n = `${e}`;
  return n.endsWith(`/`) && t.startsWith(`/`)
    ? `${n}${t.slice(1)}`
    : !n.endsWith(`/`) && !t.startsWith(`/`)
      ? `${n}/${t.slice(1)}`
      : `${n}${t}`;
}
function Wy(e, t = {}) {
  return typeof e.spans == `boolean` ? e.spans : !t.skipOpenTelemetrySetup && rd(t);
}
function Gy(e = {}) {
  return {
    requireParentforSpans: !1,
    ignoreRequestHook: (t) => {
      let n = Uy(t.origin, t.path),
        r = e.ignoreOutgoingRequests;
      return !!(r && n && r(n));
    },
    startSpanHook: () => ({ [Zl]: `auto.http.otel.node_fetch` }),
    requestHook: e.requestHook,
    responseHook: e.responseHook,
  };
}
var Ky = typeof __SENTRY_DEBUG__ > `u` || __SENTRY_DEBUG__,
  qy = 1e6;
function Jy(e, t = {}) {
  (e.getOptions().debug && jy(), (e.traceProvider = Yy(e, t)));
}
function Yy(e, t = {}) {
  let n = new xg({
    sampler: new ev(e),
    resource: Jh().merge(
      qh({
        [Y.ATTR_SERVICE_NAME]: `node`,
        [Y.SEMRESATTRS_SERVICE_NAMESPACE]: `sentry`,
        [Y.ATTR_SERVICE_VERSION]: Gs,
      }),
    ),
    forceFlushTimeoutMillis: 500,
    spanProcessors: [
      new $_({ timeout: Xy(e.getOptions().maxSpanWaitDuration) }),
      ...(t.spanProcessors || []),
    ],
  });
  return (
    J.trace.setGlobalTracerProvider(n),
    J.propagation.setGlobalPropagator(new o_()),
    J.context.setGlobalContextManager(new Ay()),
    n
  );
}
function Xy(e) {
  if (e != null) {
    if (e > qy)
      return (
        Ky && B.warn(`\`maxSpanWaitDuration\` is too high, using the maximum value of ${qy}`),
        qy
      );
    if (e <= 0 || Number.isNaN(e)) {
      Ky && B.warn("`maxSpanWaitDuration` must be a positive number, using default value instead.");
      return;
    }
    return e;
  }
}
var Zy;
function Qy() {
  if (Zy) return;
  let e = (Zy = new Map());
  function t(t, n) {
    let r = e.get(t) || { id: t };
    ((r.url = K(n, o.app.getAppPath())), e.set(t, r));
  }
  function n(t, n) {
    let r = e.get(t) || { id: t };
    ((r.title = n), e.set(t, r));
  }
  o.app.on(`web-contents-created`, (r, i) => {
    let a = i.id;
    (i.on(`did-navigate`, (e, n) => t(a, n)),
      i.on(`did-navigate-in-page`, (e, n) => t(a, n)),
      i.on(`page-title-updated`, (e, t) => n(a, t)),
      i.on(`destroyed`, () => {
        setTimeout(() => {
          e.delete(a);
        }, 5e3);
      }));
  });
}
function $y(e) {
  return Zy?.get(e);
}
var eb = {
  app: (e) => !e.startsWith(`remote-`),
  autoUpdater: () => !0,
  webContents: (e) => [`dom-ready`, `context-menu`, `load-url`, `destroyed`].includes(e),
  browserWindow: (e) =>
    [
      `closed`,
      `close`,
      `unresponsive`,
      `responsive`,
      `show`,
      `blur`,
      `focus`,
      `hide`,
      `maximize`,
      `minimize`,
      `restore`,
      `enter-full-screen`,
      `leave-full-screen`,
    ].includes(e),
  screen: () => !0,
  powerMonitor: () => !0,
  captureWindowTitles: !1,
};
function tb(e) {
  return Object.keys(e).reduce((t, n) => {
    if (n === `captureWindowTitles`) t[n] = !!e[n];
    else {
      let r = e[n];
      Array.isArray(r)
        ? (t[n] = (e) => r.includes(e))
        : (typeof r == `function` || r === !1) && (t[n] = r);
    }
    return t;
  }, {});
}
var nb = q((e = {}) => {
    let t = { ...eb, ...tb(e) };
    return {
      name: `ElectronBreadcrumbs`,
      setup(e) {
        let n = e.getOptions(),
          r = !!n?.enableLogs;
        function i(e, n, i, a) {
          let o = e.emit.bind(e);
          e.emit = (e, ...s) => {
            if (i && i(e)) {
              let i = {
                category: `electron`,
                message: `${n}.${e}`,
                timestamp: new Date().getTime() / 1e3,
                type: `ui`,
              };
              (a &&
                ((i.data = { ...$y(a) }),
                !t.captureWindowTitles && i.data?.title && delete i.data?.title),
                Rm(i));
              let o = { "sentry.origin": `auto.electron.events` };
              (i.data?.id && (o.id = i.data.id),
                i.data?.url && (o.url = i.data.url),
                r && Ih(Am`electron.${n}.${e}`, o));
            }
            return o(e, ...s);
          };
        }
        (Qy(),
          o.app.whenReady().then(
            () => {
              (t.screen && i(o.screen, `screen`, t.screen),
                t.powerMonitor && i(o.powerMonitor, `powerMonitor`, t.powerMonitor));
            },
            () => {},
          ),
          t.app && i(o.app, `app`, t.app),
          t.autoUpdater && i(o.autoUpdater, `autoUpdater`, t.autoUpdater),
          t.browserWindow &&
            o.app.on(`browser-window-created`, (e, r) => {
              let a = r.webContents.id;
              i(r, n?.getRendererName?.(r.webContents) || `window`, t.browserWindow, a);
            }),
          t.webContents &&
            o.app.on(`web-contents-created`, (e, r) => {
              let a = r.id;
              i(r, n?.getRendererName?.(r) || `renderer`, t.webContents, a);
            }));
      },
    };
  }),
  rb = q(() => ({
    name: `OnUncaughtException`,
    setup(e) {
      let t = e.getOptions();
      global.process.on(`uncaughtException`, (n) => {
        (Hf(n, {
          originalException: n,
          captureContext: { level: `fatal` },
          data: { mechanism: { handled: !1, type: `generic` } },
        }),
          e.flush(t.shutdownTimeout || 2e3).then(
            () => {
              if (t?.onFatalError) t.onFatalError(n);
              else if (global.process.listenerCount(`uncaughtException`) <= 2) {
                (console.error(`Uncaught Exception:`), console.error(n));
                let e = n.stack,
                  t = `Uncaught Exception:\n${e === void 0 ? `${n.name}: ${n.message}` : e}`;
                o.dialog.showErrorBox(`A JavaScript error occurred in the main process`, t);
              }
            },
            () => {},
          ));
      });
    },
  }));
function ib() {
  let e = Gl().getScopeData(),
    t = U().getScopeData(),
    n = H().getScopeData();
  return (yf(e, t), yf(e, n), (e.eventProcessors = []), e);
}
function ab(e) {
  (U().addScopeListener((t) => {
    e(ib(), t);
  }),
    H().addScopeListener((t) => {
      e(ib(), t);
    }),
    Gl().addScopeListener((t) => {
      e(ib(), t);
    }));
}
var ob = `7.5.0`,
  sb = `sentry.javascript.electron`;
function cb(e) {
  return {
    name: sb,
    packages: [{ name: `npm:@sentry/electron`, version: ob }],
    version: ob,
    settings: { infer_ip: e ? `auto` : `never` },
  };
}
function lb() {
  return `${(o.app.name || o.app.getName()).replace(/\W/g, `-`)}@${o.app.getVersion()}`;
}
function ub() {
  return o.app.isPackaged ? `production` : `development`;
}
async function db(e) {
  let t = { message: `test` },
    n = {};
  for (let r of e.getEventProcessors()) {
    if (t === null) break;
    t = await r(t, n);
  }
  return (delete t?.message, t || {});
}
var fb;
(function (e) {
  ((e[(e.Classic = 1)] = `Classic`),
    (e[(e.Protocol = 2)] = `Protocol`),
    (e[(e.Both = 3)] = `Both`));
})((fb ||= {}));
function pb(e) {
  return {
    createUrl: (t) => `${e}://${t}/sentry_key`,
    urlMatches: function (e, t) {
      return e.startsWith(this.createUrl(t));
    },
    createKey: (t) => `${e}.${t}`,
    namespace: e,
  };
}
var mb = `sentry-electron-renderer-id`,
  hb = `__sentry_message_port_message__`;
function gb(e) {
  return !!(e && typeof e == `object` && hb in e);
}
function _b() {
  return { [hb]: !0 };
}
var vb = hl(process.versions.electron),
  yb = { major: vb.major || 0, minor: vb.minor || 0, patch: vb.patch || 0 },
  bb = yb.major,
  xb = [
    `clean-exit`,
    `abnormal-exit`,
    `killed`,
    `crashed`,
    `oom`,
    `launch-failed`,
    `integrity-failure`,
  ];
function Sb() {
  return (0, c.join)(o.app.getPath(`userData`), `sentry`);
}
function Cb() {
  return yb.major >= 25;
}
function wb(e, t, n) {
  Cb()
    ? e.handle(
        t,
        async (e) => (
          n({
            windowId: e.headers.get(`sentry-electron-renderer-id`) || void 0,
            url: e.url,
            body: Buffer.from(await e.arrayBuffer()),
          }),
          new Response(``)
        ),
      )
    : e.registerStringProtocol(t, (e, t) => {
        (n({ windowId: e.headers[mb], url: e.url, body: e.uploadData?.[0]?.bytes }), t(``));
      });
}
function Tb(e, t) {
  if (e.registerPreloadScript) e.registerPreloadScript({ type: `frame`, filePath: t });
  else {
    let n = e.getPreloads();
    e.setPreloads([t, ...n]);
  }
}
var Eb = class {
    constructor() {
      ((this._entries = []), (this._waiters = []), (this._value = 1));
    }
    async runExclusive(e) {
      let t = await this._acquire();
      try {
        return await e();
      } finally {
        t();
      }
    }
    _acquire() {
      return new Promise((e, t) => {
        (this._entries.push({ resolve: e, reject: t }), this._dispatch());
      });
    }
    _release() {
      ((this._value += 1), this._dispatch());
    }
    _dispatch() {
      for (let e = this._value; e > 0; e--) {
        let t = this._entries?.shift();
        t && ((this._value -= e), (e = this._value + 1), t.resolve(this._newReleaser()));
      }
      this._drainUnlockWaiters();
    }
    _newReleaser() {
      let e = !1;
      return () => {
        e || ((e = !0), this._release());
      };
    }
    _drainUnlockWaiters() {
      for (let e = this._value; e > 0; e--)
        this._waiters[e - 1] && (this._waiters.forEach((e) => e()), (this._waiters = []));
    }
  },
  Db = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.*\d{0,10}Z$/;
function Ob(e, t) {
  return typeof t == `string` && Db.test(t) ? new Date(t) : t;
}
var kb = class {
    constructor(e, t, n) {
      ((this._lock = new Eb()), (this._path = (0, c.join)(e, `${t}.json`)), (this._initial = n));
    }
    async set(e) {
      await this._lock.runExclusive(async () => {
        this._data = e;
        try {
          if (e === void 0)
            try {
              await g.promises.unlink(this._path);
            } catch {}
          else
            (await g.promises.mkdir((0, c.dirname)(this._path), { recursive: !0 }),
              await g.promises.writeFile(this._path, JSON.stringify(e)));
        } catch (e) {
          B.warn(`Failed to write to store`, e);
        }
      });
    }
    async get() {
      return this._lock.runExclusive(async () => {
        if (this._data === void 0)
          try {
            this._data = JSON.parse(await g.promises.readFile(this._path, `utf8`), Ob);
          } catch {
            this._data = this._initial;
          }
        return this._data;
      });
    }
    async update(e) {
      await this.set(e(await this.get()));
    }
    async clear() {
      await this.set(this._initial);
    }
    async getModifiedDate() {
      try {
        return (await g.promises.stat(this._path))?.mtime;
      } catch {
        return;
      }
    }
  },
  Ab = class extends kb {
    constructor(e, t, n, r = 500) {
      (super(e, t, n), (this._throttleTime = r));
    }
    async set(e) {
      ((this._data = e),
        (this._pendingWrite = {
          data: e,
          timeout:
            this._pendingWrite?.timeout ||
            setTimeout(() => this._writePending(), this._throttleTime),
        }));
    }
    _writePending() {
      if (this._pendingWrite) {
        let e = this._pendingWrite.data;
        ((this._pendingWrite = void 0), super.set(e).catch(() => {}));
      }
    }
  },
  jb = 6e4,
  Mb,
  Nb;
function Pb() {
  return (
    Mb || ((Mb = new kb(Sb(), `session`, void 0)), (Nb = Mb.get().then((e) => e && Cl(e)))),
    Mb
  );
}
function Fb(e) {
  let t = { ...e };
  return (delete t.toJSON, t);
}
var Ib;
function Lb(e) {
  let t = Yf();
  (e && Qf(),
    Pb()
      .set(Fb(t))
      .catch(() => {}),
    (Ib = setInterval(async () => {
      let e = U().getSession();
      e && e.status === `ok` && (await Pb().set(Fb(e)));
    }, jb)));
}
async function Rb() {
  Ib && clearInterval(Ib);
  let e = U().getSession();
  (e
    ? e.status === `ok`
      ? (B.log(`Ending session`), Xf())
      : B.log(`Session was already ended`)
    : B.log(`No session`),
    await Pb().clear(),
    await qf(2e3));
}
async function zb() {
  let e = await Nb,
    t = U(),
    n = t.getSession();
  return (e && ((Nb = void 0), e.status === `ok` && t.setSession(Cl(e))), n);
}
function Bb(e) {
  U().setSession(e);
}
async function Vb() {
  let e = W(),
    t = await Nb;
  if (t && e) {
    if (t.status !== `ok`) {
      Nb = void 0;
      return;
    }
    B.log(`Found previous abnormal session`);
    let n = Cl(t);
    (wl(n, {
      status: `abnormal`,
      errors: (n.errors || 0) + 1,
      release: t.attrs?.release,
      environment: t.attrs?.environment,
    }),
      await e.sendSession(n),
      (Nb = void 0));
  }
}
function Hb() {
  Ib && clearInterval(Ib);
  let e = U().getSession();
  e &&
    e.status === `ok` &&
    (B.log(`Setting session as abnormal ANR`),
    wl(e, { status: `abnormal`, abnormal_mechanism: `anr_foreground` }),
    Qf());
}
function Ub() {
  o.app.on(`before-quit`, () => {
    (o.app.removeListener(`will-quit`, Wb), o.app.on(`will-quit`, Wb));
  });
}
var Wb = async (e) => {
    if (!e.defaultPrevented) {
      (B.log(`[Session] Exit Handler`), e.preventDefault());
      try {
        await Rb();
      } catch (e) {
        B.warn(`[Session] Error ending session:`, e);
      }
      o.app.exit();
    }
  },
  Gb = `MDMP`;
function Kb(e) {
  return {
    signature: e.subarray(0, 4).toString(),
    version: e.readUInt32LE(4),
    streamCount: e.readUInt32LE(8),
    streamDirectoryRva: e.readUInt32LE(12),
    checksum: e.readUInt32LE(16),
    timeDateStamp: new Date(e.readUInt32LE(20) * 1e3),
    flags: e.readBigUInt64LE(24),
  };
}
function qb(e, t) {
  return { dataSize: e.readUInt32LE(t), rva: e.readUInt32LE(t + 4) };
}
function Jb(e, t) {
  return { streamType: e.readUInt32LE(t), location: qb(e, t + 4) };
}
function Yb(e, t) {
  return e.subarray(t.rva, t.rva + t.dataSize);
}
function Xb(e, t) {
  return qb(e, t + 20);
}
function Zb(e, t) {
  let n = e.readUInt32LE(t);
  return e.toString(`utf8`, t + 4, t + 4 + n);
}
function Qb(e, t, n) {
  let r = e.readUInt32LE(n),
    i = e.readUInt16LE(n + 4),
    a = e.readUInt32LE(n + 8);
  if (i === 1) return { name: Zb(t, r), value: Zb(t, a) };
}
function $b(e, t) {
  let n = e.subarray(t.rva, t.rva + t.dataSize);
  if (n.length === 0) return {};
  let r = Xb(n, 0),
    i = e.subarray(r.rva, r.rva + r.dataSize),
    a = i.readUInt32LE(0),
    o = 4,
    s = {};
  for (let t = 0; t < a; t++) {
    let t = Qb(i, e, o);
    if (t) {
      let { name: e, value: n } = t;
      s[e] = n;
    }
    o += 12;
  }
  return s;
}
function ex(e, t) {
  let n = e.subarray(t.rva, t.rva + t.dataSize);
  if (n.length === 0) return {};
  let r = n.readUInt32LE(0),
    i = 4,
    a = {};
  for (let t = 0; t < r; t++) {
    let t = qb(n, i + 4);
    ((a = { ...a, ...$b(e, t) }), (i += 12));
  }
  return a;
}
function tx(e, t) {
  return ex(e, qb(t, 44));
}
function nx(e) {
  if (e.length < 1e4) throw Error(`Minidump was less than 10KB so likely incomplete.`);
  let t;
  try {
    t = Kb(e);
  } catch {
    throw Error(`Failed to parse minidump header`);
  }
  if (t.signature !== `MDMP`) throw Error(`Minidump signature was not '${Gb}'`);
  try {
    for (let n = 0; n < t.streamCount; n++) {
      let r = Jb(e, t.streamDirectoryRva + n * 12);
      if (r.streamType === 1129316353) {
        let n = tx(e, Yb(e, r.location));
        return { header: t, crashpadAnnotations: n };
      }
    }
  } catch {}
  return { header: t };
}
var rx = 30,
  ix = 864e5,
  ax = 1e3,
  ox = 5e3,
  sx = 500,
  cx = ox / sx;
function lx(e) {
  return new Promise((t) => setTimeout(t, e));
}
function ux(e) {
  let t = new Eb();
  return async (n, r) => {
    await t.runExclusive(async () => {
      for (let t of await e())
        try {
          if (n) continue;
          B.log(`Found minidump`, t);
          let e = await g.promises.stat(t),
            i = new Date().getTime() - rx * ix;
          if (e.mtimeMs < i) {
            B.log(`Ignoring minidump as it is over ${rx} days old`);
            continue;
          }
          let a = 0;
          for (; a <= cx;) {
            let n = new Date().getTime() - ax;
            if (e.mtimeMs < n) {
              let e = await g.promises.readFile(t);
              try {
                let n = nx(e);
                (B.log(`Sending minidump`),
                  await r(n, {
                    attachmentType: `event.minidump`,
                    filename: (0, c.basename)(t),
                    data: e,
                  }));
              } catch (e) {
                let t = e instanceof Error ? e.toString() : `Unknown error`;
                B.warn(`Dropping minidump:\n${t}`);
                break;
              }
              break;
            }
            (B.log(`Waiting. Minidump has been modified in the last ${ax} milliseconds.`),
              (a += 1),
              await lx(sx),
              (e = await g.promises.stat(t)));
          }
          a >= cx && B.warn(`Timed out waiting for minidump to stop being modified`);
        } catch (e) {
          B.error(`Failed to load minidump`, e);
        } finally {
          try {
            await g.promises.unlink(t);
          } catch {
            B.warn(`Could not delete minidump`, t);
          }
        }
    });
  };
}
async function dx(e, t = 100) {
  if (t > 2e3) return;
  let n = (0, c.join)(e, `metadata`);
  try {
    (await g.promises.unlink(n), B.log(`Deleted Crashpad metadata file`, n));
  } catch (n) {
    n.code &&
      n.code == `EBUSY` &&
      setTimeout(async () => {
        await dx(e, t * 2);
      }, t);
  }
}
async function fx(e) {
  let t = [];
  for (let n of e)
    try {
      let e = await g.promises.readdir(n);
      t.push(...e.map((e) => (0, c.join)(n, e)));
    } catch {}
  return t;
}
function px() {
  let e = o.app.getPath(`crashDumps`),
    t = process.platform === `win32` ? `reports` : `completed`,
    n = [(0, c.join)(e, t)];
  return (
    (process.platform === `darwin` || process.platform === `linux`) &&
      n.push((0, c.join)(e, `pending`)),
    ux(
      async () => (
        await dx(e).catch((e) => B.error(e)),
        (await fx(n)).filter((e) => e.endsWith(`.dmp`))
      ),
    )
  );
}
var mx = q((e = {}) => {
  let t = e.maxMinidumpsPerSession || 10,
    n,
    r,
    i;
  function a() {
    (B.log(`Starting Electron crashReporter`),
      o.crashReporter.start({
        companyName: ``,
        ignoreSystemCrashHandler: !0,
        productName: o.app.name || o.app.getName(),
        submitURL: `https://f.a.k/e`,
        uploadToServer: !1,
        compress: !0,
      }));
  }
  function s(e) {
    function t(t) {
      setImmediate(async () => n?.set({ scope: t, event: await db(e) }));
    }
    (ab((e) => {
      t(e);
    }),
      t(ib()));
  }
  async function c(e, n) {
    t <= 0 && B.log(`Not sending minidumps because the limit has been reached`);
    let r = e.getOptions().enabled === !1 || t <= 0,
      a = !1;
    return (
      await i?.(r, async (e, r) => {
        a = !0;
        let i = e.crashpadAnnotations?.process_type?.replace(`-process`, ``),
          o = await n(i);
        if (e.crashpadAnnotations) {
          let t = Object.entries(e.crashpadAnnotations).reduce(
            (e, [t, n]) => ((e[`crashpad.${t}`] = n), e),
            {},
          );
          o.contexts = { ...o.contexts, electron: { ...o.contexts?.electron, ...t } };
        }
        t > 0 && (--t, Wf(o, { attachments: [r] }));
      }),
      a
    );
  }
  async function l(e, t, n, r) {
    let { getRendererName: i } = t;
    await c(e, (e) => {
      let t = (e === `renderer` && i ? i(n) : e) || `unknown`;
      return (
        B.log(`'${t}' process '${r.reason}'`),
        {
          contexts: { electron: { crashed_url: $y(n.id)?.url || `unknown`, details: r } },
          level: `fatal`,
          platform: `native`,
          tags: { "event.environment": `native`, "event.process": t, "exit.reason": r.reason },
        }
      );
    });
  }
  async function u(e, t) {
    (B.log(`${t.type} process has ${t.reason}`),
      await c(e, (e) => ({
        contexts: { electron: { details: t } },
        level: `fatal`,
        platform: `native`,
        tags: {
          "event.environment": `native`,
          "event.process": e || t.type,
          "exit.reason": t.reason,
        },
      })));
  }
  return {
    name: `SentryMinidump`,
    setup(e) {
      if (process.mas) return;
      (a(), (n = new Ab(Sb(), `scope_v3`, { scope: new Pl().getScopeData() })), (r = n.get()));
      try {
        i = px();
      } catch (e) {
        B.error(`Failed to create minidump loader`, e);
      }
      let t = e.getOptions();
      if ((s(e), !t?.dsn))
        throw Error(`Attempted to enable Electron native crash reporter but no DSN was supplied`);
      (Qy(),
        o.app.on(`render-process-gone`, async (n, r, i) => {
          xb.includes(i.reason) && (await l(e, t, r, i));
        }),
        o.app.on(`child-process-gone`, async (t, n) => {
          xb.includes(n.reason) && (await u(e, n));
        }),
        o.app.on(`diagnostic-minidump-created`, () => {
          c(e, (e) => ({
            level: `fatal`,
            platform: `native`,
            tags: { "event.environment": `native`, "event.process": e || `unknown` },
          })).catch((e) => B.error(`Failed to capture diagnostic minidumps`, e));
        }));
      let d;
      c(e, async (t) => {
        let n = {
            level: `fatal`,
            platform: `native`,
            tags: { "event.environment": `native`, "event.process": t || `unknown` },
          },
          i = await r;
        return (
          i &&
            (i.scope && vf(n, i.scope),
            (n.release = i.event?.release),
            (n.environment = i.event?.environment),
            (n.contexts = i.event?.contexts),
            (n.sdkProcessingMetadata = {
              dynamicSamplingContext: {
                trace_id: i.scope.propagationContext.traceId,
                release: i.event?.release,
                environment: i.event?.environment,
                public_key: e.getDsn()?.publicKey,
              },
            })),
          (d = await zb()),
          n
        );
      })
        .then(async (e) => {
          e ? d && Bb(d) : await Vb();
        })
        .catch((e) => B.error(e));
    },
  };
});
function hx(e) {
  (delete e.sdkProcessingMetadata?.capturedSpanScope,
    delete e.sdkProcessingMetadata?.capturedSpanIsolationScope);
  for (let t of e.spans || []) delete t.spanRecorder;
}
function gx(e, t) {
  hx(t);
  let n = {
    ...e,
    ...t,
    contexts: {
      ...e.contexts,
      ...t.contexts,
      app: { ...e.contexts?.app, ...t.contexts?.app },
      device: { ...e.contexts?.device, ...t.contexts?.device },
    },
    tags: { ...e.tags, ...t.tags },
    sdk: { ...e.sdk, ...t.sdk },
  };
  return ((e.extra || t.extra) && (n.extra = { ...e.extra, ...t.extra }), n);
}
var _x = Ny(o.app.getAppPath());
function vx(e, t) {
  for (let n of e.exception?.values || [])
    for (let e of n.stacktrace?.frames || []) e.filename &&= K(e.filename, t);
  for (let n of e.debug_meta?.images || [])
    n.type === `sourcemap` && (n.code_file = K(n.code_file, t));
  e.transaction &&= K(e.transaction, t);
  let { request: n = {} } = e;
  if (
    ((n.url &&= K(n.url, t)),
    e.contexts?.feedback?.url &&
      typeof e.contexts.feedback.url == `string` &&
      (e.contexts.feedback.url = K(e.contexts.feedback.url, t)),
    e.spans)
  )
    for (let n of e.spans)
      n.description?.startsWith(`file://`) && (n.description = K(n.description, t));
  return e;
}
function yx(e, t, n) {
  let r = Cd(t[0]),
    i = !1;
  return (
    Td(t, (t, a) => {
      if (a === `replay_event`) {
        i = !0;
        let [a, o] = t,
          s = H().getScopeData();
        ((o.breadcrumbs = s.breadcrumbs),
          (o.tags = s.tags),
          (o.user = s.user),
          (o.environment = e.environment),
          Array.isArray(o.urls) && (o.urls = o.urls.map((e) => K(e, n))),
          o?.request?.url && (o.request.url = K(o.request.url, n)),
          (r = wd(r, [a, o])));
      } else a === `replay_recording` && (r = wd(r, t));
    }),
    i ? r : t
  );
}
function bx(e, t) {
  for (let n of e.profile.frames)
    ((n.abs_path &&= K(n.abs_path, t)),
      `filename` in n && typeof n.filename == `string` && (n.filename = K(n.filename, t)),
      (n.module &&= _x(n.abs_path)));
}
function xx(e, t, n) {
  (n.release && (e.release = n.release), n.environment && (e.environment = n.environment));
  let r = e.profile;
  if (r?.frames)
    for (let e of r.frames)
      ((e.abs_path &&= K(e.abs_path, t)),
        (e.filename &&= K(e.filename, t)),
        (e.module &&= _x(e.abs_path)));
}
function Sx(e, t, n) {
  let [r] = t,
    i = Cd({ ...r, sdk: { name: `sentry.javascript.electron`, version: ob } }),
    a = !1;
  return (
    Td(t, (t, r) => {
      if (r === `profile_chunk`) {
        a = !0;
        let [r, o] = t;
        (xx(o, n, e), (i = wd(i, [r, o])));
      }
    }),
    a ? i : t
  );
}
function Cx() {
  try {
    return require.resolve(`../../preload/default.js`);
  } catch {
    try {
      let e = (0, b.fileURLToPath)({}.url);
      return (0, c.resolve)(e, `..`, `..`, `..`, `..`, `preload`, `default.js`);
    } catch {}
  }
}
var wx = q(() => ({
    name: `PreloadInjection`,
    setup(e) {
      let t = e.getOptions();
      (t.ipcMode & fb.Classic) !== 0 &&
        o.app.once(`ready`, () => {
          let e = Cx();
          if (e && typeof e == `string` && (0, c.isAbsolute)(e) && (0, g.existsSync)(e))
            for (let n of t.getSessions()) Tb(n, e);
          else
            B.log(
              `The preload script could not be injected automatically. This is most likely caused by bundling of the main process`,
            );
        });
    },
  })),
  Tx = q((e = {}) => ({
    name: `MainProcessSession`,
    setup() {
      (Lb(!!e.sendOnCreate), Ub());
    },
  })),
  Ex = { screen: !0, deviceModelManufacturer: !1 };
function Dx() {
  return new Promise((e) => {
    try {
      (0, y.exec)(
        `powershell -NoProfile "Get-CimInstance -ClassName Win32_ComputerSystem | ConvertTo-Json"`,
        (t, n) => {
          t && e({});
          try {
            let t = JSON.parse(n);
            if (t.Manufacturer || t.Model) {
              e({ manufacturer: t.Manufacturer, model: t.Model });
              return;
            }
          } catch {}
          e({});
        },
      );
    } catch {
      e({});
    }
  });
}
function Ox() {
  return new Promise((e) => {
    try {
      (0, y.exec)(`system_profiler SPHardwareDataType -json`, (t, n) => {
        t && e({});
        try {
          let t = JSON.parse(n.trim());
          if (t.SPHardwareDataType?.[0]?.machine_model) {
            e({ manufacturer: `Apple`, model: t.SPHardwareDataType[0].machine_model });
            return;
          }
        } catch {}
        e({});
      });
    } catch {
      e({});
    }
  });
}
function kx() {
  return process.platform === `win32`
    ? Dx()
    : process.platform === `darwin`
      ? Ox()
      : Promise.resolve({});
}
var Ax = q((e = {}) => {
  let t = {},
    n = e.deviceModelManufacturer,
    r = { ...Ex, ...e };
  function i() {
    let e = o.screen.getPrimaryDisplay(),
      n = Math.floor(e.size.width * e.scaleFactor),
      r = Math.floor(e.size.height * e.scaleFactor);
    ((t.screen_density = e.scaleFactor), (t.screen_resolution = `${n}x${r}`));
  }
  async function a() {
    let { manufacturer: e, model: n } = await kx();
    (e || n) && ((t.manufacturer = e), (t.model = n));
  }
  return {
    name: `AdditionalContext`,
    setup() {
      r.screen &&
        o.app.whenReady().then(
          () => {
            (i(),
              o.screen.on(`display-metrics-changed`, () => {
                i();
              }));
          },
          () => {},
        );
    },
    processEvent: async (e) => (n && ((n = !1), await a()), gx(e, { contexts: { device: t } })),
  };
});
function jx(e) {
  let { method: t, options: n } =
      typeof e == `string`
        ? { method: `GET`, options: b.parse(e) }
        : { method: (e.method || `GET`).toUpperCase(), options: e },
    r = `url` in n ? n.url : void 0;
  if (!r) {
    let e = {};
    ((e.protocol = n.protocol || `http:`),
      n.host
        ? (e.host = n.host)
        : ((e.hostname = n.hostname ? n.hostname : `localhost`), n.port && (e.port = n.port)));
    let t = b.parse(n.path || `/`);
    ((e.pathname = t.pathname), (e.search = t.search), (e.hash = t.hash), (r = b.format(e)));
  }
  return { method: t, url: r };
}
function Mx(e, t, n) {
  let r = new Ph(100),
    i = new Ph(100),
    a = (t, n) => {
      if (e.tracing === void 0) return !0;
      if (e.tracing === !1) return !1;
      let i = `${t}:${n}`,
        a = r.get(i);
      if (a !== void 0) return a;
      let o = e.tracing === !0 || e.tracing(t, n);
      return (r.set(i, o), o);
    },
    o = (e, t) => {
      let r = `${e}:${t}`,
        a = i.get(r);
      if (a !== void 0) return a;
      if (n) {
        let e = al(t, n);
        return (i.set(r, e), e);
      }
      return !0;
    },
    s = (e, n, r, i, a) => {
      let o = Dh(a?.statusCode);
      if (
        (Rm(
          {
            type: `http`,
            category: `electron.net`,
            data: { url: r, method: n, status_code: a?.statusCode },
            level: o,
          },
          { event: e, request: i, response: a },
        ),
        !t)
      )
        return;
      let s = { "sentry.origin": `auto.electron.net`, statusCode: a?.statusCode };
      switch (o) {
        case `error`:
          Rh(Am`Electron.net request failed: ${n} ${r}`, s);
          break;
        case `warning`:
          Lh(Am`Electron.net request warning: ${n} ${r}`, s);
          break;
        default:
          Ih(Am`Electron.net request succeeded: ${n} ${r}`, s);
      }
    };
  return function (t) {
    return function (n) {
      let { url: r, method: i } = jx(n),
        c = t.apply(this, [n]);
      if (r.match(/sentry_key/) || c.getHeader(`x-sentry-auth`)) return c;
      let l = a(i, r)
        ? tf({
            name: `${i} ${r}`,
            onlyIfParent: !0,
            attributes: { url: r, type: `net.request`, "http.method": i },
            op: `http.client`,
          })
        : new md();
      if ((l.setAttribute(Zl, `auto.http.electron.net`), o(i, r)))
        for (let [e, t] of Object.entries(Nm({ span: l })))
          (B.log(`[Tracing] Adding ${e} header ${t} to outgoing request to "${r}": `),
            c.setHeader(e, t));
      return c
        .once(`response`, function (t) {
          (e.breadcrumbs !== !1 && s(`response`, i, r, this, t),
            t.statusCode && iu(l, t.statusCode),
            l.end());
        })
        .once(`error`, function (t) {
          (e.breadcrumbs !== !1 && s(`error`, i, r, this, void 0), iu(l, 500), l.end());
        });
    };
  };
}
var Nx = q((e = {}) => ({
    name: `ElectronNet`,
    setup(t) {
      let n = t.getOptions(),
        r = !!n?.enableLogs;
      (e.breadcrumbs !== !1 || e.tracing !== !1) &&
        qc(o.net, `request`, Mx(e, r, n?.tracePropagationTargets));
    },
  })),
  Px = { breadcrumbs: xb, events: [`abnormal-exit`, `launch-failed`, `integrity-failure`] };
function Fx(e, t) {
  let n = `'${t}' process exited with '${e}'`,
    r = Am`'${t}' process exited with '${e}'`;
  switch (e) {
    case `abnormal-exit`:
    case `killed`:
      return { message: n, level: `warning`, log: Lh, messageFmt: r };
    case `crashed`:
    case `oom`:
    case `launch-failed`:
    case `integrity-failure`:
      return { message: n, level: `fatal`, log: Rh, messageFmt: r };
    default:
      return { message: n, level: `debug`, log: Ih, messageFmt: r };
  }
}
var Ix = q((e = {}) => {
    let { breadcrumbs: t, events: n } = e,
      r = wy(e),
      i = {
        breadcrumbs: Array.isArray(t) ? t : t === !1 ? [] : Px.breadcrumbs,
        events: Array.isArray(n) ? n : n === !1 ? [] : Px.events,
      };
    return {
      name: `ChildProcess`,
      setup(e) {
        r.setup?.(e);
        let { breadcrumbs: t, events: n } = i;
        if (Array.from(new Set([...t, ...n])).length > 0) {
          let r = e.getOptions(),
            i = !!r?.enableLogs;
          (o.app.on(`child-process-gone`, (e, r) => {
            let { reason: a } = r,
              { message: o, level: s, log: c, messageFmt: l } = Fx(r.reason, r.type);
            (n.includes(a) && Uf(o, { level: s, tags: { "event.process": r.type } }),
              t.includes(a) &&
                (Rm({ type: `process`, category: `child-process`, message: o, level: s, data: r }),
                i &&
                  c(l, {
                    "sentry.origin": `auto.electron.child-process`,
                    exitCode: r.exitCode,
                    name: r.name,
                    serviceName: r.serviceName,
                  })));
          }),
            o.app.on(`render-process-gone`, (e, a, o) => {
              let { reason: s } = o,
                c = r?.getRendererName?.(a) || `renderer`,
                { message: l, level: u, log: d, messageFmt: f } = Fx(o.reason, c);
              (n.includes(s) && Uf(l, u),
                t.includes(s) &&
                  (Rm({
                    type: `process`,
                    category: `child-process`,
                    message: l,
                    level: u,
                    data: o,
                  }),
                  i &&
                    d(f, {
                      "sentry.origin": `auto.electron.child-process`,
                      exitCode: o.exitCode,
                    })));
            }));
        }
      },
    };
  }),
  Lx = q(() => ({
    name: `Screenshots`,
    async processEvent(e, t, n) {
      if (!n.getOptions().attachScreenshot) return e;
      if (!e.transaction && e.platform !== `native`) {
        let e = 1;
        for (let n of o.BrowserWindow.getAllWindows()) {
          t.attachments ||= [];
          try {
            if (!n.isDestroyed() && n.isVisible()) {
              let r = e === 1 ? `screenshot.png` : `screenshot-${e}.png`,
                i = await n.capturePage();
              (t.attachments.push({ filename: r, data: i.toPNG(), contentType: `image/png` }),
                (e += 1));
            }
          } catch (e) {
            B.error(`Error capturing screenshot`, e);
          }
        }
      }
      return e;
    },
  }));
function Rx(e = {}, t, n) {
  if (e[t]) {
    let r = e[t];
    Array.isArray(r) ? r.push(n) : (e[t] = [r, n]);
  } else e[t] = n;
  return { responseHeaders: e };
}
function zx(e, t, n) {
  e.webRequest.onHeadersReceived((e, r) => {
    r(Rx(e.responseHeaders, t, n));
  });
}
var Bx;
function Vx(e, t) {
  if (!Bx) return;
  let n = t.event_id;
  (Bx.set(n, t), e && (e.contexts = { ...e.contexts, profile: { profile_id: n } }));
}
var Hx = q(() => ({
    name: `RendererProfiling`,
    setup(e) {
      let t = e.getOptions();
      t.enableRendererProfiling &&
        ((Bx = new Ph(10)),
        o.app.on(`ready`, () => {
          t.getSessions().forEach((e) => zx(e, `Document-Policy`, `js-profiling`));
        }),
        e.on?.(`beforeEnvelope`, (e) => {
          let n;
          if (
            (Td(e, (e, t) => {
              if (t === `transaction`)
                for (let t = 1; t < e.length; t++) {
                  let r = e[t];
                  r?.contexts?.profile?.profile_id &&
                    ((n = r.contexts.profile.profile_id), delete r.contexts.profile);
                }
            }),
            !n)
          )
            return;
          let r = Bx?.remove(n);
          r &&
            (bx(r, o.app.getAppPath()),
            (r.release = t.release || lb()),
            (r.environment = t.environment || ub()),
            e[1].push([{ type: `profile` }, r]));
        }));
    },
  })),
  Ux = q(() => ({
    name: `NormalizePaths`,
    setup: (e) => {
      setImmediate(() => {
        e.on(`beforeEnvelope`, (e) => {
          Td(e, (e, t) => {
            t === `profile` && bx(e[1], o.app.getAppPath());
          });
        });
      });
    },
    processEvent(e) {
      return vx(e, o.app.getAppPath());
    },
  }));
function Wx() {
  return o.app.getAppMetrics().reduce((e, t) => e + t.memory.workingSetSize * 1024, 0);
}
var Gx = q(() => ({
  name: `ElectronContext`,
  processEvent(e, t, n) {
    (delete e.contexts?.runtime,
      delete e.contexts?.app?.app_memory,
      e.request?.headers && delete e.request.headers[`User-Agent`]);
    let { release: r = lb(), environment: i = ub() } = n.getOptions();
    return gx(
      {
        contexts: {
          app: {
            app_name: o.app.name || o.app.getName(),
            app_version: o.app.getVersion(),
            build_type: process.mas ? `app-store` : process.windowsStore ? `windows-store` : void 0,
            app_memory: Wx(),
            app_arch: process.arch,
          },
          browser: { name: `Chrome` },
          chrome: { name: `Chrome`, type: `runtime`, version: process.versions.chrome },
          device: { family: `Desktop` },
          node: { name: `Node`, type: `runtime`, version: process.versions.node },
          runtime: { name: `Electron`, version: process.versions.electron },
        },
        environment: i,
        release: r,
        tags: {
          "event.origin": `electron`,
          "event.environment": `javascript`,
          "event.process": `browser`,
        },
      },
      e,
    );
  },
}));
function Kx(e) {
  return {
    name: e.deviceString || `GPU`,
    active: e.active,
    id: `0x${e.deviceId.toString(16).padStart(4, `0`)}`,
    vendor_id: `0x${e.vendorId.toString(16).padStart(4, `0`)}`,
    vendor_name: e.vendorString,
    driver_version: e.driverVersion,
  };
}
var qx = q((e = { infoLevel: `basic` }) => {
    let t;
    return {
      name: `GpuContext`,
      processEvent: async (n) => {
        if (t === void 0) {
          let n = await o.app.getGPUInfo(e.infoLevel).catch(() => void 0);
          t = n ? n.gpuDevice.map(Kx) : [];
        }
        if (t.length === 1) n.contexts = { ...n.contexts, gpu: t[0] };
        else if (t.length > 1) {
          n.contexts = { ...n.contexts };
          for (let e = 0; e < t.length; e++) {
            let r = t[e];
            ((r.type = `gpu`), (n.contexts[`gpu_${e + 1}`] = r));
          }
        }
        return n;
      },
    };
  }),
  Jx = 30,
  Yx = 50;
function Xx(e, t, n, r) {
  let i = { filename: e, function: t === `<anonymous>` ? `?` : t, in_app: !0 };
  return (n !== void 0 && (i.lineno = n), r !== void 0 && (i.colno = r), i);
}
var Zx = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i,
  Qx =
    /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i,
  $x = /\((\S*)(?::(\d+))(?::(\d+))\)/,
  eS = /at (.+?) ?\(data:(.+?),/,
  tS = [
    Jx,
    (e) => {
      let t = e.match(eS);
      if (t) return { filename: `<data:${t[2]}>`, function: t[1] };
      let n = Zx.exec(e);
      if (n) {
        let [, e, t, r] = n;
        return Xx(e, `?`, +t, +r);
      }
      let r = Qx.exec(e);
      if (r) {
        if (r[2] && r[2].indexOf(`eval`) === 0) {
          let e = $x.exec(r[2]);
          e && ((r[2] = e[1]), (r[3] = e[2]), (r[4] = e[3]));
        }
        let [e, t] = iS(r[1] || `?`, r[2]);
        return Xx(t, e, r[3] ? +r[3] : void 0, r[4] ? +r[4] : void 0);
      }
    },
  ],
  nS =
    /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i,
  rS = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
uc(tS, [
  Yx,
  (e) => {
    let t = nS.exec(e);
    if (t) {
      if (t[3] && t[3].indexOf(` > eval`) > -1) {
        let e = rS.exec(t[3]);
        e && ((t[1] = t[1] || `eval`), (t[3] = e[1]), (t[4] = e[2]), (t[5] = ``));
      }
      let e = t[3],
        n = t[1] || `?`;
      return (([n, e] = iS(n, e)), Xx(e, n, t[4] ? +t[4] : void 0, t[5] ? +t[5] : void 0));
    }
  },
]);
var iS = (e, t) => {
    let n = e.indexOf(`safari-extension`) !== -1,
      r = e.indexOf(`safari-web-extension`) !== -1;
    return n || r
      ? [
          e.indexOf(`@`) === -1 ? `?` : e.split(`@`)[0],
          n ? `safari-extension:${t}` : `safari-web-extension:${t}`,
        ]
      : [e, t];
  },
  aS = 50,
  [, oS] = tS,
  [, sS] = Ah(),
  cS = (e, t = 0) => {
    let n = [];
    for (let r of e
      .split(
        `
`,
      )
      .slice(t)) {
      let e = oS(r),
        t = sS(r);
      if (
        (e && t?.in_app !== !1
          ? n.push(e)
          : t && (t.module === void 0 && delete t.module, n.push(t)),
        n.length >= aS)
      )
        break;
    }
    return fc(n);
  },
  lS = uc(Ah(Ny(o.app.getAppPath())));
async function uS(e) {
  if (bb < 34)
    throw Error(
      "Electron >= 34 required to capture stack frames via `frame.collectJavaScriptCallStack()`",
    );
  if (e.isDestroyed()) return;
  let t = await e.mainFrame.collectJavaScriptCallStack();
  if (t) {
    if (t.includes(`Website owner has not opted in`)) {
      B.warn(`Could not collect renderer stack frames.
A 'Document-Policy' header of 'include-js-call-stacks-in-crash-reports' must be set`);
      return;
    }
    return cS(t);
  }
}
function dS(e, ...t) {
  B.log(`[Renderer Event Loop Block] ${e}`, ...t);
}
function fS(e, t) {
  return () => {
    uS(e)
      .then((e) => {
        e && t(e);
      })
      .catch(() => {});
  };
}
function pS(e, t) {
  (dS(`Connecting to debugger`), e.debugger.attach(`1.3`));
  let n = new Map(),
    r = Ny(o.app.getAppPath());
  return (
    e.debugger.on(`message`, (i, a, o) => {
      if (a === `Debugger.scriptParsed`) {
        let e = o;
        n.set(e.scriptId, e.url);
      } else if (a === `Debugger.paused`) {
        let i = o;
        if (i.reason !== `other`) return;
        let a = [...i.callFrames];
        (e.debugger.sendCommand(`Debugger.resume`).then(null, () => {}),
          t(fc(a.map((e) => Nh(e, n.get(e.location.scriptId), r)))));
      }
    }),
    e.debugger.sendCommand(`Debugger.enable`).catch(() => {}),
    () => {
      if (!e.isDestroyed())
        return (
          dS(`Pausing debugger to capture stack trace`),
          e.debugger.sendCommand(`Debugger.pause`)
        );
    }
  );
}
function mS() {
  let e = process.hrtime();
  return {
    getTimeMs: () => {
      let [t, n] = process.hrtime(e);
      return Math.floor(t * 1e3 + n / 1e6);
    },
    reset: () => {
      e = process.hrtime();
    },
  };
}
var hS = `RendererEventLoopBlock`,
  gS = q((e = {}) => {
    let t = new Map(),
      n;
    function r(e) {
      return n?.getRendererName?.(e);
    }
    function i(e, t, n) {
      Hb();
      let i = r(e) || `renderer`;
      Wf({
        level: `error`,
        exception: {
          values: [
            {
              type: `ApplicationNotResponding`,
              value: `Application Not Responding for at least ${t} ms`,
              stacktrace: { frames: n },
              mechanism: { type: `ANR` },
            },
          ],
        },
        tags: { "event.process": i },
      });
    }
    return {
      name: hS,
      setup: (t) => {
        ((n = t.getOptions()),
          bb >= 34 &&
            (o.app.commandLine.appendSwitch(
              `enable-features`,
              `DocumentPolicyIncludeJSCallStacksInCrashReports`,
            ),
            e.captureNativeStacktrace &&
              o.app.on(`ready`, () => {
                n?.getSessions().forEach((e) =>
                  zx(e, `Document-Policy`, `include-js-call-stacks-in-crash-reports`),
                );
              })));
      },
      createRendererEventLoopBlockStatusHandler: () => (n, r) => {
        let a = t.get(r);
        function s() {
          a?.enabled(!1);
        }
        function c() {
          a?.enabled(!0);
        }
        if (a === void 0) {
          dS(`Renderer sent first status message`, n.config);
          let l;
          (n.config.captureStackTrace &&
            (l = (e.captureNativeStacktrace && bb >= 34 ? fS : pS)(r, (e) => {
              (dS(`Event captured with stack frames`), i(r, n.config.anrThreshold, e));
            })),
            (a = Mh(mS, 100, n.config.anrThreshold, async () => {
              (dS(`Watchdog timeout`),
                l ? l() : (dS(`Capturing event`), i(r, n.config.anrThreshold)));
            })),
            r.once(`destroyed`, () => {
              (t?.delete(r),
                o.powerMonitor.off(`suspend`, s),
                o.powerMonitor.off(`resume`, c),
                o.powerMonitor.off(`lock-screen`, s),
                o.powerMonitor.off(`unlock-screen`, c));
            }),
            r.once(`blur`, s),
            r.once(`focus`, c),
            o.powerMonitor.on(`suspend`, s),
            o.powerMonitor.on(`resume`, c),
            o.powerMonitor.on(`lock-screen`, s),
            o.powerMonitor.on(`unlock-screen`, c),
            t.set(r, a));
        }
        (a.poll(),
          n.status !== `alive` &&
            (dS(`Renderer visibility changed '${n.status}'`), a.enabled(n.status === `visible`)));
      },
    };
  });
function _S(e) {
  return e.getIntegrationByName(hS)?.createRendererEventLoopBlockStatusHandler();
}
var vS = 32768;
function yS(e) {
  return new _.Readable({
    read() {
      (this.push(e), this.push(null));
    },
  });
}
function bS(e) {
  let { hostname: t, pathname: n, port: r, protocol: i, search: a } = new b.URL(e);
  return { method: `POST`, hostname: t, path: `${n}${a}`, port: parseInt(r, 10), protocol: i };
}
function xS(e) {
  return Lp(e, SS(e.url, e.headers || {}));
}
function SS(e, t) {
  return (
    (t[`Content-Type`] = `application/x-sentry-envelope`),
    function (n) {
      return o.app.whenReady().then(
        () =>
          new Promise((r, i) => {
            let a = yS(n.body),
              s = { ...t };
            n.body.length > vS &&
              ((s[`content-encoding`] = `gzip`), (a = a.pipe((0, x.createGzip)())));
            let c = o.net.request(bS(e));
            for (let [e, t] of Object.entries(s)) c.setHeader(e, t);
            (c.on(`response`, (e) => {
              (e.on(`error`, i), e.on(`data`, () => {}), e.on(`end`, () => {}));
              let t = e.headers[`retry-after`] ?? null,
                n = e.headers[`x-sentry-rate-limits`] ?? null;
              r({
                statusCode: e.statusCode,
                headers: {
                  "retry-after": Array.isArray(t) ? t[0] || null : t,
                  "x-sentry-rate-limits": Array.isArray(n) ? n[0] || null : n,
                },
              });
            }),
              c.on(`error`, i),
              a.pipe(c));
          }),
      );
    }
  );
}
var CS = 864e5;
function wS(e, t) {
  let n = Date.now() - CS * t;
  return (e?.date?.getTime() || 0) < n;
}
function TS(e) {
  let t = e[0];
  if (typeof t.sent_at == `string`) return new Date(t.sent_at);
}
function ES(e) {
  function t(...e) {
    B.log(`[Offline Store]:`, ...e);
  }
  let n = {
      maxAgeDays: e.maxAgeDays || 30,
      maxQueueSize: e.maxQueueSize || 30,
      queuePath: e.queuePath || (0, c.join)(Sb(), `queue`),
    },
    r = new kb(n.queuePath, `queue-v2`, []);
  function i(e) {
    g.promises.unlink((0, c.join)(n.queuePath, e)).catch(() => {});
  }
  function a(e) {
    for (; e[0] && wS(e[0], n.maxAgeDays);) {
      let n = e.shift();
      (t(`Removing stale envelope`, n), i(n.id));
    }
  }
  async function o(e, o, s) {
    t(`${o}ing envelope into offline storage`);
    let l = V();
    try {
      let t = kd(e);
      (await g.promises.mkdir(n.queuePath, { recursive: !0 }),
        await g.promises.writeFile((0, c.join)(n.queuePath, l), t));
    } catch (e) {
      t(`Failed to save`, e);
    }
    await r.update((t) =>
      o === `push` && (a(t), t.length >= n.maxQueueSize)
        ? (i(l), t)
        : (t[o]({ id: l, date: s || TS(e) || new Date() }), t),
    );
  }
  let s;
  return {
    push: async (e) => {
      await o(e, `push`);
    },
    unshift: async (e) => {
      await o(e, `unshift`, s);
    },
    shift: async () => {
      t(`Popping envelope from offline storage`);
      let e;
      if ((await r.update((t) => (a(t), (e = t.shift()), t)), e))
        try {
          let t = await g.promises.readFile((0, c.join)(n.queuePath, e.id));
          return (i(e.id), (s = e.date), jd(t));
        } catch (e) {
          t(`Failed to read`, e);
        }
    },
  };
}
function DS(e = xS) {
  return (t) => Cm(e)({ flushAtStartup: !0, createStore: ES, ...t });
}
function OS(e) {
  let t,
    n = [],
    r;
  return (
    Td(e, (e, i) => {
      if (i === `event` || i === `transaction` || i === `feedback`)
        t = Array.isArray(e) ? e[1] : void 0;
      else if (i === `attachment`) {
        let [t, r] = e;
        n.push({
          filename: t.filename,
          attachmentType: t.attachment_type,
          contentType: t.content_type,
          data: r,
        });
      } else i === `profile` && (r = e[1]);
    }),
    t ? [t, n, r] : void 0
  );
}
function kS(e) {
  let t;
  return (
    Td(e, (e, n) => {
      n === `profile_chunk` && (t = e[1]);
    }),
    t
  );
}
async function AS(e) {
  let t = e.getIntegrationByName(`Context`),
    n = e.getIntegrationByName(`AdditionalContext`),
    r = {},
    i = {};
  ((r = (await t?.processEvent?.(r, i, e)) || r), (r = (await n?.processEvent?.(r, i, e)) || r));
  let a = {};
  return (
    r.contexts?.os?.name && (a[`os.name`] = r.contexts.os.name),
    r.contexts?.os?.version && (a[`os.version`] = r.contexts.os.version),
    r.contexts?.device?.brand && (a[`device.brand`] = r.contexts.device.brand),
    r.contexts?.device?.model && (a[`device.model`] = r.contexts.device.model),
    r.contexts?.device?.family && (a[`device.family`] = r.contexts.device.family),
    a
  );
}
var jS;
function MS(e) {
  return (
    jS === void 0 &&
      ((jS = {}),
      AS(e)
        .then((e) => {
          jS = e;
        })
        .catch(() => {})),
    jS || {}
  );
}
var NS, PS;
function FS() {
  ((NS ||= new Set()), (PS ||= new Map()));
  for (let e of o.webContents.getAllWebContents()) {
    let t = e.id;
    NS.has(t) ||
      e.isDestroyed() ||
      e.executeJavaScript(`window.__SENTRY_RENDERER_ID__`).then((n) => {
        n &&
          NS &&
          PS &&
          (NS.add(t),
          PS.set(n, t),
          e.once(`destroyed`, () => {
            (NS?.delete(t), PS?.delete(n));
          }));
      }, B.error);
  }
}
function IS(e, t, n, r, i) {
  let a = (i && e?.getRendererName?.(i)) || `renderer`;
  ((t.breadcrumbs = t.breadcrumbs || []),
    delete t.environment,
    delete t.sdk?.name,
    delete t.sdk?.version,
    delete t.sdk?.packages,
    n && (t.sdkProcessingMetadata = { ...t.sdkProcessingMetadata, dynamicSamplingContext: n }),
    Wf(gx(t, { tags: { "event.process": a } }), { attachments: r }));
}
var LS;
function RS(e, t, n, r) {
  let i = jd(n),
    [a] = i,
    s = a.trace;
  s &&
    ((LS ||= e.getDsn()?.publicKey),
    (s.release = t.release),
    (s.environment = t.environment),
    (s.public_key = LS));
  let c = OS(i);
  if (c) {
    let [e, n, i] = c;
    (i && Vx(e, i), IS(t, e, s, n, r));
  } else if (kS(i)) {
    let e = Sx(t, i, o.app.getAppPath());
    W()?.getTransport()?.send(e);
  } else {
    let e = yx(t, i, o.app.getAppPath());
    W()?.getTransport()?.send(e);
  }
}
function zS(e) {
  return e != null && Object.keys(e).length > 0;
}
function BS(e, t) {
  let n;
  try {
    n = JSON.parse(t);
  } catch {
    B.warn(`sentry-electron received an invalid scope message`);
    return;
  }
  let r = H();
  (zS(n.user) && r.setUser(n.user),
    zS(n.tags) && r.setTags(n.tags),
    zS(n.extra) && r.setExtras(n.extra));
  for (let e of n.attachments || []) r.addAttachment(e);
  let i = n.breadcrumbs.pop();
  i && r.addBreadcrumb(i, e?.maxBreadcrumbs || 100);
}
function VS(e, t, n, r) {
  let i = (n && t?.getRendererName?.(n)) || `renderer`,
    a = r || {};
  (t.release && (a[`sentry.release`] = { value: t.release, type: `string` }),
    t.environment && (a[`sentry.environment`] = { value: t.environment, type: `string` }),
    (a[`sentry.sdk.name`] = { value: `sentry.javascript.electron`, type: `string` }),
    (a[`sentry.sdk.version`] = { value: ob, type: `string` }),
    (a[`electron.process`] = { value: i, type: `string` }));
  let o = MS(e);
  return (
    o[`os.name`] && (a[`os.name`] = { value: o[`os.name`], type: `string` }),
    o[`os.version`] && (a[`os.version`] = { value: o[`os.version`], type: `string` }),
    o[`device.brand`] && (a[`device.brand`] = { value: o[`device.brand`], type: `string` }),
    o[`device.model`] && (a[`device.model`] = { value: o[`device.model`], type: `string` }),
    o[`device.family`] && (a[`device.family`] = { value: o[`device.family`], type: `string` }),
    a
  );
}
function HS(e, t, n, r) {
  ((n.attributes = VS(e, t, r, n.attributes)), _p(e, n));
}
function US(e, t, n, r) {
  ((n.attributes = VS(e, t, r, n.attributes)), Ep(e, n));
}
function WS(e, t, n) {
  if (o.app.isReady())
    throw Error(`Sentry SDK should be initialized before the Electron app 'ready' event is fired`);
  let r = {
    scheme: t.namespace,
    privileges: { bypassCSP: !0, corsEnabled: !0, supportFetchAPI: !0, secure: !0 },
  };
  (o.protocol.registerSchemesAsPrivileged([r]),
    (o.protocol.registerSchemesAsPrivileged = new Proxy(o.protocol.registerSchemesAsPrivileged, {
      apply: (e, t, n) => {
        e([...n[0], r]);
      },
    })));
  let i = _S(e);
  o.app
    .whenReady()
    .then(() => {
      for (let r of n.getSessions())
        wb(r.protocol, t.namespace, (r) => {
          let a = () => {
              let e = r.windowId ? PS?.get(r.windowId) : void 0;
              return e ? o.webContents.fromId(e) : void 0;
            },
            s = r.body;
          if (t.urlMatches(r.url, `start`)) FS();
          else if (t.urlMatches(r.url, `scope`) && s) BS(n, s.toString());
          else if (t.urlMatches(r.url, `envelope`) && s) RS(e, n, s, a());
          else if (t.urlMatches(r.url, `structured-log`) && s)
            HS(e, n, JSON.parse(s.toString()), a());
          else if (t.urlMatches(r.url, `metric`) && s) US(e, n, JSON.parse(s.toString()), a());
          else if (i && t.urlMatches(r.url, `status`) && s) {
            let e = a();
            if (e) {
              let t = JSON.parse(s.toString()).status;
              i(t, e);
            }
          }
        });
    })
    .catch((e) => B.error(e));
}
function GS(e, t, n) {
  (o.ipcMain.on(t.createKey(`start`), ({ sender: e }) => {
    let t = e.id;
    ((NS ||= new Set()),
      !NS.has(t) &&
        (e.isDestroyed() ||
          (NS.add(t),
          e.once(`destroyed`, () => {
            NS?.delete(t);
          }))));
  }),
    o.ipcMain.on(t.createKey(`scope`), (e, t) => BS(n, t)),
    o.ipcMain.on(t.createKey(`envelope`), ({ sender: t }, r) => RS(e, n, r, t)),
    o.ipcMain.on(t.createKey(`structured-log`), ({ sender: t }, r) => HS(e, n, r, t)),
    o.ipcMain.on(t.createKey(`metric`), ({ sender: t }, r) => US(e, n, r, t)));
  let r = _S(e);
  r && o.ipcMain.on(t.createKey(`status`), ({ sender: e }, t) => r(t, e));
}
function KS(e, t) {
  let n = pb(t.ipcNamespace);
  ((t.ipcMode & fb.Protocol) > 0 && WS(e, n, t), (t.ipcMode & fb.Classic) > 0 && GS(e, n, t));
}
function qS(e) {
  B.log(`[Utility Process] ${e}`);
}
function JS() {
  o.utilityProcess?.fork &&
    (o.utilityProcess.fork = new Proxy(o.utilityProcess.fork, {
      apply: (e, t, n) => {
        let r = e.apply(t, n);
        function i() {
          let [, , e] = n;
          return e?.serviceName || `pid:${r.pid}`;
        }
        return (
          r.on(`message`, (e) => {
            if (gb(e)) {
              qS(`SDK started in utility process '${i()}'`);
              let { port1: e, port2: t } = new o.MessageChannelMain();
              (t.on(`message`, (e) => {
                (e.data instanceof Uint8Array || typeof e.data == `string`) && YS(e.data);
              }),
                t.start(),
                r.postMessage(_b(), [e]));
            }
          }),
          (r.on = new Proxy(r.on, {
            apply: (e, t, [n, r]) =>
              n === `message`
                ? e.apply(t, [
                    `message`,
                    (e) => {
                      if (!gb(e)) return r(e);
                    },
                  ])
                : e.apply(t, [n, r]),
          })),
          r
        );
      },
    }));
}
function YS(e) {
  let t = jd(e),
    n = OS(t);
  if (n) {
    let [e, t] = n;
    XS(e, t);
  } else W()?.getTransport()?.send(t);
}
function XS(e, t) {
  (delete e.environment,
    delete e.release,
    delete e.sdk?.name,
    delete e.sdk?.version,
    delete e.sdk?.packages,
    Wf(gx(e, { tags: { "event.process": `utility` } }), { attachments: t }));
}
function ZS(e) {
  let t = [
    mx(),
    nb(),
    Nx(),
    Gx(),
    Ix(),
    rb(),
    wx(),
    Ax(),
    Lx(),
    qx(),
    gS(),
    Tx(),
    Gm(),
    Hm(),
    ch(),
    wh(),
    Hy(),
    _y(),
    Xv(),
    fy(),
    yv({ cloudResource: !1 }),
    Ux(),
  ];
  return (e.attachScreenshot && t.push(Lx()), e.enableRendererProfiling && t.push(Hx()), t);
}
function QS(e) {
  let [t = 0] = process.versions.electron.split(`.`).map(Number);
  if (t < 23) throw Error(`Sentry Electron SDK requires Electron 23 or higher`);
  let n = {
      _metadata: { sdk: cb(!!e.sendDefaultPii) },
      ipcMode: fb.Both,
      ipcNamespace: `sentry-ipc`,
      release: lb(),
      environment: ub(),
      defaultIntegrations: ZS(e),
      transport: DS(),
      transportOptions: {},
      getSessions: () => [o.session.defaultSession],
      ...e,
      stackParser: dc(e.stackParser || lS),
      includeServerName: !1,
    },
    r = { ...n, integrations: op(n) };
  (r.debug && B.enable(), eC(r), JS(), j_());
  let i = H();
  i.update(r.initialScope);
  let a = new Fy(r);
  (r.sendDefaultPii === !0 && a.on(`beforeSendSession`, jm),
    a.on(`beforeCaptureLog`, (e) => {
      e.attributes = { ...e.attributes, "electron.process": `browser`, ...MS(a) };
    }),
    i.setClient(a),
    a.init(),
    KS(a, r),
    r.skipOpenTelemetrySetup || Jy(a));
}
var $S = [
  { userAdded: `ElectronMinidump`, toRemove: `SentryMinidump` },
  { userAdded: `BrowserWindowSession`, toRemove: `MainProcessSession` },
];
function eC(e) {
  for (let { userAdded: t, toRemove: n } of $S)
    e.integrations.some((e) => e.name === t) &&
      (e.integrations = e.integrations.filter((e) => e.name !== n));
}
function tC() {
  var e =
      typeof SuppressedError == `function`
        ? SuppressedError
        : function (e, t) {
            var n = Error();
            return ((n.name = `SuppressedError`), (n.error = e), (n.suppressed = t), n);
          },
    t = {},
    n = [];
  function r(e, t) {
    if (t != null) {
      if (Object(t) !== t)
        throw TypeError(
          `using declarations can only be used with objects, functions, null, or undefined.`,
        );
      if (e) var r = t[Symbol.asyncDispose || Symbol.for(`Symbol.asyncDispose`)];
      if (r === void 0 && ((r = t[Symbol.dispose || Symbol.for(`Symbol.dispose`)]), e)) var i = r;
      if (typeof r != `function`) throw TypeError(`Object is not disposable.`);
      (i &&
        (r = function () {
          try {
            i.call(t);
          } catch (e) {
            return Promise.reject(e);
          }
        }),
        n.push({ v: t, d: r, a: e }));
    } else e && n.push({ d: t, a: e });
    return t;
  }
  return {
    e: t,
    u: r.bind(null, !1),
    a: r.bind(null, !0),
    d: function () {
      var r,
        i = this.e,
        a = 0;
      function o() {
        for (; (r = n.pop());)
          try {
            if (!r.a && a === 1) return ((a = 0), n.push(r), Promise.resolve().then(o));
            if (r.d) {
              var e = r.d.call(r.v);
              if (r.a) return ((a |= 2), Promise.resolve(e).then(o, s));
            } else a |= 1;
          } catch (e) {
            return s(e);
          }
        if (a === 1) return i === t ? Promise.resolve() : Promise.reject(i);
        if (i !== t) throw i;
      }
      function s(n) {
        return ((i = i === t ? n : new e(n, i)), o());
      }
      return o();
    },
  };
}
  aE = e.t((e, t) => {
    function n(e, t, n) {
      return (
        e === e && (n !== void 0 && (e = e <= n ? e : n), t !== void 0 && (e = e >= t ? e : t)),
        e
      );
    }
    t.exports = n;
  }),
  oE = e.t((e, t) => {
    var r = aE(),
      i = n.ko();
    function a(e, t, n) {
      return (
        n === void 0 && ((n = t), (t = void 0)),
        n !== void 0 && ((n = i(n)), (n = n === n ? n : 0)),
        t !== void 0 && ((t = i(t)), (t = t === t ? t : 0)),
        r(i(e), t, n)
      );
    }
    t.exports = a;
  }),
  sE = e.a(oE()),
F();
function WD(e) {
  let t = BigInt(1e9);
  return BigInt(Math.trunc(e[0])) * t + BigInt(Math.trunc(e[1]));
}
function GD(e) {
  return { low: Number(BigInt.asUintN(32, e)), high: Number(BigInt.asUintN(32, e >> BigInt(32))) };
}
function KD(e) {
  return GD(WD(e));
}
function qD(e) {
  return WD(e).toString();
}
var JD = typeof BigInt < `u` ? qD : ii;
function YD(e) {
  return e;
}
function XD(e) {
  if (e !== void 0) return UD(e);
}
var ZD = { encodeHrTime: KD, encodeSpanContext: UD, encodeOptionalSpanContext: XD };
function QD(e) {
  if (e === void 0) return ZD;
  let t = e.useLongBits ?? !0,
    n = e.useHex ?? !1;
  return {
    encodeHrTime: t ? KD : JD,
    encodeSpanContext: n ? YD : UD,
    encodeOptionalSpanContext: n ? YD : XD,
  };
}
function $D(e) {
  let t = { attributes: tO(e.attributes), droppedAttributesCount: 0 },
    n = e.schemaUrl;
  return (n && n !== `` && (t.schemaUrl = n), t);
}
function eO(e) {
  return { name: e.name, version: e.version };
}
function tO(e) {
  return Object.keys(e).map((t) => nO(t, e[t]));
}
function nO(e, t) {
  return { key: e, value: rO(t) };
}
function rO(e) {
  let t = typeof e;
  return t === `string`
    ? { stringValue: e }
    : t === `number`
      ? Number.isInteger(e)
        ? { intValue: e }
        : { doubleValue: e }
      : t === `boolean`
        ? { boolValue: e }
        : e instanceof Uint8Array
          ? { bytesValue: e }
          : Array.isArray(e)
            ? { arrayValue: { values: e.map(rO) } }
            : t === `object` && e != null
              ? { kvlistValue: { values: Object.entries(e).map(([e, t]) => nO(e, t)) } }
              : {};
}
var iO = 256,
  aO = 512;
function oO(e, t) {
  let n = (e & 255) | iO;
  return (t && (n |= aO), n);
}
function sO(e, t) {
  let n = e.spanContext(),
    r = e.status,
    i = e.parentSpanContext?.spanId ? t.encodeSpanContext(e.parentSpanContext?.spanId) : void 0;
  return {
    traceId: t.encodeSpanContext(n.traceId),
    spanId: t.encodeSpanContext(n.spanId),
    parentSpanId: i,
    traceState: n.traceState?.serialize(),
    name: e.name,
    kind: e.kind == null ? 0 : e.kind + 1,
    startTimeUnixNano: t.encodeHrTime(e.startTime),
    endTimeUnixNano: t.encodeHrTime(e.endTime),
    attributes: tO(e.attributes),
    droppedAttributesCount: e.droppedAttributesCount,
    events: e.events.map((e) => lO(e, t)),
    droppedEventsCount: e.droppedEventsCount,
    status: { code: r.code, message: r.message },
    links: e.links.map((e) => cO(e, t)),
    droppedLinksCount: e.droppedLinksCount,
    flags: oO(n.traceFlags, e.parentSpanContext?.isRemote),
  };
}
function cO(e, t) {
  return {
    attributes: e.attributes ? tO(e.attributes) : [],
    spanId: t.encodeSpanContext(e.context.spanId),
    traceId: t.encodeSpanContext(e.context.traceId),
    traceState: e.context.traceState?.serialize(),
    droppedAttributesCount: e.droppedAttributesCount || 0,
    flags: oO(e.context.traceFlags, e.context.isRemote),
  };
}
function lO(e, t) {
  return {
    attributes: e.attributes ? tO(e.attributes) : [],
    name: e.name,
    timeUnixNano: t.encodeHrTime(e.time),
    droppedAttributesCount: e.droppedAttributesCount || 0,
  };
}
function uO(e, t) {
  return { resourceSpans: fO(e, QD(t)) };
}
function dO(e) {
  let t = new Map();
  for (let n of e) {
    let e = t.get(n.resource);
    e || ((e = new Map()), t.set(n.resource, e));
    let r = `${n.instrumentationScope.name}@${n.instrumentationScope.version || ``}:${n.instrumentationScope.schemaUrl || ``}`,
      i = e.get(r);
    (i || ((i = []), e.set(r, i)), i.push(n));
  }
  return t;
}
function fO(e, t) {
  let n = dO(e),
    r = [],
    i = n.entries(),
    a = i.next();
  for (; !a.done;) {
    let [e, n] = a.value,
      o = [],
      s = n.values(),
      c = s.next();
    for (; !c.done;) {
      let e = c.value;
      if (e.length > 0) {
        let n = e.map((e) => sO(e, t));
        o.push({
          scope: eO(e[0].instrumentationScope),
          spans: n,
          schemaUrl: e[0].instrumentationScope.schemaUrl,
        });
      }
      c = s.next();
    }
    let l = $D(e),
      u = { resource: l, scopeSpans: o, schemaUrl: l.schemaUrl };
    (r.push(u), (a = i.next()));
  }
  return r;
}
var pO = {
  serializeRequest: (e) => {
    let t = uO(e, { useHex: !0, useLongBits: !1 });
    return new TextEncoder().encode(JSON.stringify(t));
  },
  deserializeResponse: (e) => {
    if (e.length === 0) return {};
    let t = new TextDecoder();
    return JSON.parse(t.decode(e));
  },
};
