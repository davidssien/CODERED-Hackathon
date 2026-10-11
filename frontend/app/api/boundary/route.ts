import { NextRequest, NextResponse } from "next/server";

const TIGERWEB =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer";

type Position = number[];
type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

type GeoJsonFeature = {
  type: "Feature";
  properties?: Record<string, unknown> | null;
  geometry?: GeoJsonGeometry | null;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

function extendBounds(
  coordinates: unknown,
  bounds: [number, number, number, number],
) {
  if (!Array.isArray(coordinates)) return;

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    const [longitude, latitude] = coordinates as Position;
    bounds[0] = Math.min(bounds[0], longitude);
    bounds[1] = Math.min(bounds[1], latitude);
    bounds[2] = Math.max(bounds[2], longitude);
    bounds[3] = Math.max(bounds[3], latitude);
    return;
  }

  coordinates.forEach((item) => extendBounds(item, bounds));
}

function featureCollectionBounds(
  collection: GeoJsonFeatureCollection,
): [number, number, number, number] | undefined {
  const bounds: [number, number, number, number] = [
    Infinity,
    Infinity,
    -Infinity,
    -Infinity,
  ];

  collection.features.forEach((feature) => {
    if (feature.geometry) {
      extendBounds(feature.geometry.coordinates, bounds);
    }
  });

  return bounds.every(Number.isFinite) ? bounds : undefined;
}

async function queryLayer(
  layerId: number,
  longitude: number,
  latitude: number,
) {
  const params = new URLSearchParams({
    where: "1=1",
    geometry: `${longitude},${latitude}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "GEOID,BASENAME,NAME",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });

  const response = await fetch(
    `${TIGERWEB}/${layerId}/query?${params.toString()}`,
    {
      cache: "no-store",
      headers: {
        Accept: "application/geo+json,application/json",
      },
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as GeoJsonFeatureCollection;
  if (!data?.features?.length) return null;

  const feature = data.features[0];
  const properties = feature.properties ?? {};
  const name =
    String(properties.BASENAME ?? properties.NAME ?? "City / Town");
  const geoid = String(properties.GEOID ?? "");

  return {
    featureCollection: {
      type: "FeatureCollection" as const,
      features: [feature],
    },
    name,
    geoid,
    bbox: featureCollectionBounds({
      type: "FeatureCollection",
      features: [feature],
    }),
  };
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("latitude"));
  const longitude = Number(request.nextUrl.searchParams.get("longitude"));

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "Valid latitude and longitude are required." },
      { status: 400 },
    );
  }

  // Current TIGERweb layer 4 = incorporated places, layer 5 = census
  // designated places. Trying both covers cities as well as many named
  // unincorporated communities.
  const result =
    (await queryLayer(4, longitude, latitude)) ??
    (await queryLayer(5, longitude, latitude));

  if (!result) {
    return NextResponse.json(
      { error: "No city or place boundary contains that point." },
      { status: 404 },
    );
  }

  return NextResponse.json(result);
}
