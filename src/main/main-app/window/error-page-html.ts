export function buildWindowErrorPage(appName: string): string {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${appName}</title>
  </head>
  <body>
    <main>
      <h1>Something went wrong…</h1>
    </main>
  </body>
</html>
`.trim();
}

if (typeof module !== "undefined") module.exports = { buildWindowErrorPage };
