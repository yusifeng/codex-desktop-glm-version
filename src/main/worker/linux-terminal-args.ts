import { quoteShellArg } from "./shell-quoting";

export function buildLinuxTerminalArgs(command: string, directory: string, shell = "/bin/sh"): string[] {
  switch (command.split("/").at(-1)) {
    case "kitty": return ["--directory", directory];
    case "ghostty": return [`--working-directory=${directory}`];
    case "konsole": return ["--workdir", directory];
    case "alacritty":
    case "gnome-terminal":
    case "kgx":
    case "mate-terminal":
    case "tilix": return ["--working-directory", directory];
    case "x-terminal-emulator":
    case "zutty": return ["-e", shell, "-lc", `cd ${quoteShellArg(directory)} && exec ${quoteShellArg(shell)}`];
    default: throw Error(`Unsupported Linux terminal command: ${command.split("/").at(-1)}`);
  }
}

if (typeof module !== "undefined") module.exports = { buildLinuxTerminalArgs };
