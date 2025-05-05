import { atomWithStorage } from "jotai/utils";

export const colorscheme = atomWithStorage<"light" | "dark" | "system">(
  "colorscheme",
  "dark",
);
