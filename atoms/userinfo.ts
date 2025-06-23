import { atomWithStorage } from "jotai/utils";

export const nameAtom = atomWithStorage("full_name", "false");
export const emailAtom = atomWithStorage("email", "false");
