import { atomWithStorage } from "jotai/utils";

export const colorscheme = atomWithStorage<"light" | "dark" | "system">(
  "colorscheme",
  "dark",
);

export const mapStyleAtom = atomWithStorage<string>(
  "mapStyle",
  "mapbox://styles/mapbox/standard",
);
