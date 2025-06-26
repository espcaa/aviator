import { atom } from "jotai";
import { Airline } from "@/types";

export const airline_atom = atom<Airline | null>(null);
export const departure_airport = atom("");
export const arrival_airport = atom("");
