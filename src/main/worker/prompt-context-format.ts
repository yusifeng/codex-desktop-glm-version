function formatAppContext(instructions: string): string {
  return `<app-context>\n${instructions.trim()}\n</app-context>`;
}

function joinInstructionSections(...sections: Array<string | null | undefined>): string {
  return sections.map((section) => section?.trim()).filter((section) => section != null && section.length > 0).join(`\n\n`);
}

export { formatAppContext, joinInstructionSections };
if (typeof module !== `undefined`) module.exports = { formatAppContext, joinInstructionSections };
