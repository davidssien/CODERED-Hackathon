import data from "../../data/demo-addresses.json";
import type { DemoLocation } from "./types";

// Use sourced school coordinates; recompute counts from current plant records.
export const DEMO_LOCATIONS: DemoLocation[] = data.addresses.map(place => ({
  id: place.id, label: place.label, address: place.address,
  coordinates: { latitude: place.lat, longitude: place.lng }, locationSource: "geocoded",
}));
export const DEMO_GENERATED_AT = data.generatedAt;
