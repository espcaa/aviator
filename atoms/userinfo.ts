import { atomWithStorage } from "jotai/utils";

export const nameAtom = atomWithStorage("full_name", "John Doe");
export const emailAtom = atomWithStorage("email", "false");
