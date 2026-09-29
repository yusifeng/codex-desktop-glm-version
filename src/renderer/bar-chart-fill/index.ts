import "@rchunk/rolldown-runtime";
import { $3 as initializeJsxRuntime, I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

interface BarChartFillProps extends Record<string, unknown> {
  className?: string;
  fill?: string;
  height?: number | string;
  width?: number | string;
}

const paths = [
  "M2 9.20001C2 8.53727 2.53726 8.00001 3.2 8.00001H5.064C5.72674 8.00001 6.264 8.53727 6.264 9.20001V15.6C6.264 16.2628 5.72674 16.8 5.064 16.8H3.2C2.53726 16.8 2 16.2628 2 15.6V9.20001Z",
  "M13.736 7.60001C13.736 6.93727 14.2733 6.40001 14.936 6.40001H16.8C17.4627 6.40001 18 6.93727 18 7.60001V15.6C18 16.2628 17.4627 16.8 16.8 16.8H14.936C14.2733 16.8 13.736 16.2628 13.736 15.6V7.60001Z",
  "M7.864 4.40001C7.864 3.73727 8.40126 3.20001 9.064 3.20001H10.936C11.5987 3.20001 12.136 3.73727 12.136 4.40001V16C12.136 16.4418 11.7778 16.8 11.336 16.8H8.664C8.22217 16.8 7.864 16.4418 7.864 16V4.40001Z",
] as const;

let jsx: JsxRuntime;

function BarChartFill(props: BarChartFillProps = {}): unknown {
  return jsx.jsxs("svg", {
    width: "1em",
    height: "1em",
    viewBox: "0 0 20 20",
    fill: "currentColor",
    ...props,
    children: paths.map((d) => jsx.jsx("path", { d })),
  });
}

initializeJsxRuntime();
jsx = getJsxRuntime();

export default BarChartFill;
