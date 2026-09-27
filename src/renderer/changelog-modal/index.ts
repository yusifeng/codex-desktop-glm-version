import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface ChangelogPost {
  bodyMarkdown: string;
  date: string;
  image?: string | null;
  summary?: string | null;
  title: string;
  url: string;
  version?: string | null;
}

export interface ChangelogModalProps {
  onClose(): void;
  post: ChangelogPost;
}

let jsx: JsxRuntime;

function changelogBody(post: ChangelogPost): string {
  const [heading, ...lines] = post.bodyMarkdown.split("\n");
  if (heading?.trim() !== `# ${post.title.trim()}`) return post.bodyMarkdown;
  const body = lines.join("\n").trimStart();
  if (post.summary == null) return body;
  const paragraphEnd = body.search(/\n\s*\n/);
  const firstParagraph = paragraphEnd === -1 ? body : body.slice(0, paragraphEnd);
  return firstParagraph.replace(/\s+/g, " ").trim() === post.summary.replace(/\s+/g, " ").trim()
    ? paragraphEnd === -1 ? "" : body.slice(paragraphEnd).trimStart()
    : body;
}

function ChangelogModal(props: ChangelogModalProps): unknown {
  const body = changelogBody(props.post);
  return jsx.jsxs("dialog", {
    open: true,
    "aria-label": "Changelog",
    children: [
      jsx.jsx("button", { type: "button", "aria-label": "Close changelog", onClick: props.onClose, children: "×" }),
      props.post.image
        ? jsx.jsx("img", { alt: "", src: props.post.image, referrerPolicy: "no-referrer" })
        : null,
      jsx.jsxs("article", {
        children: [
          jsx.jsxs("div", {
            children: [
              jsx.jsx("time", { dateTime: props.post.date, children: props.post.date }),
              props.post.version ? jsx.jsx("code", { children: `v${props.post.version}` }) : null,
            ],
          }),
          jsx.jsx("h2", { children: props.post.title }),
          props.post.summary ? jsx.jsx("p", { children: props.post.summary }) : null,
          body.trim() === ""
            ? null
            : jsx.jsx("a", { href: props.post.url, target: "_blank", rel: "noreferrer", children: body }),
        ],
      }),
    ],
  });
}

function initializeChangelogModal(): void {
  jsx = getJsxRuntime();
}

initializeChangelogModal();

export { ChangelogModal };
