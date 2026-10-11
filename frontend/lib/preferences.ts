import type { PermitType } from "./types";

export interface Preferences {
  theme: "light" | "dark";
  display: "map" | "satellite";
  districts: boolean;
  permitTypes: PermitType[];
}

export const defaultPreferences: Preferences = {
  theme: "light",
  display: "map",
  districts: true,
  permitTypes: ["new", "expansion", "renewal"],
};
