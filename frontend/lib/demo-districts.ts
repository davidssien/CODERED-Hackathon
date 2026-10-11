interface Polygon {
  type: "Polygon";
  coordinates: number[][][];
}
interface FeatureCollection<T> {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: { score: number; simulated: boolean }; geometry: T }[];
}
import type { Coordinates } from "./types";

export const DEMO_DISTRICT_DISCLAIMER = "Simulated district scores — illustrative grid only, not actual district boundaries.";

export function createDemoDistricts(coordinates: Coordinates): FeatureCollection<Polygon> {
  const wrap = (longitude: number) => ((longitude + 180) % 360 + 360) % 360 - 180;
  const latitude = Math.max(-89.8, Math.min(89.8, coordinates.latitude));
  const longitude = wrap(coordinates.longitude);
  const features: FeatureCollection<Polygon>["features"] = [];
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 3; column++) {
      const west = longitude + (column - 1.5) * 0.06;
      const east = west + 0.06;
      const south = latitude + (row - 1.5) * 0.06;
      const north = south + 0.06;
      // Split antimeridian-crossing cells so wrapping never creates a world-wide polygon.
      const cuts = [west, ...[-180, 180].filter(value => value > west && value < east), east];
      for (let part = 0; part < cuts.length - 1; part++) {
        const midpoint = (cuts[part] + cuts[part + 1]) / 2;
        const shift = wrap(midpoint) - midpoint;
        const left = cuts[part] + shift;
        const right = cuts[part + 1] + shift;
        features.push({
          type: "Feature",
          properties: { score: [22, 58, 86, 71, 39, 93, 48, 79, 18][row * 3 + column], simulated: true },
          geometry: { type: "Polygon", coordinates: [[[left, south], [right, south], [right, north], [left, north], [left, south]]] },
        });
      }
    }
  }
  return { type: "FeatureCollection", features };
}
