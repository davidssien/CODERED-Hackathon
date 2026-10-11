import { NextRequest, NextResponse } from "next/server";

type BoundaryScope = "state" | "county" | "place" | "postcode";

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

interface LayerQuery {
  service: string;
  layers: number[];
  fallbackLabel: string;
}

const QUERIES: Record<BoundaryScope, LayerQuery> = {
  state: {
    service:
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer",
    layers: [0],
    fallbackLabel: "State",
  },
  county: {
    service:
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer",
    layers: [1],
    fallbackLabel: "County",
  },
  place: {
    service:
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer",
    // Incorporated places first, then census-designated places.
    layers: [4, 5],
    fallbackLabel: "City / Town",
  },
  postcode: {
    service:
      "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer",
    // Current top-level ZCTA layer, with the Census 2020 layer as fallback.
    layers: [1, 11],
    fallbackLabel: "ZIP Code",
  },
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
  service: string,
  layerId: number,
  longitude: number,
  latitude: number,
  fallbackLabel: string,
) {
  const params = new URLSearchParams({
    where: "1=1",
    geometry: `${longitude},${latitude}`,
    geometryType: "esriGeometryPoint",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "GEOID,BASENAME,NAME,ZCTA5",
    returnGeometry: "true",
    outSR: "4326",
    f: "geojson",
  });

  const response = await fetch(
    `${service}/${layerId}/query?${params.toString()}`,
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
  const name = String(
    properties.BASENAME ??
      properties.NAME ??
      properties.ZCTA5 ??
      fallbackLabel,
  );
  const geoid = String(properties.GEOID ?? properties.ZCTA5 ?? "");

  const featureCollection: GeoJsonFeatureCollection = {
    type: "FeatureCollection",
    features: [feature],
  };

  return {
    featureCollection,
    name,
    geoid,
    bbox: featureCollectionBounds(featureCollection),
  };
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get("latitude"));
  const longitude = Number(request.nextUrl.searchParams.get("longitude"));
  const rawScope = request.nextUrl.searchParams.get("scope") ?? "place";

  if (!(rawScope in QUERIES)) {
    return NextResponse.json(
      { error: "Boundary scope must be state, county, place, or postcode." },
      { status: 400 },
    );
  }

  const scope = rawScope as BoundaryScope;

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

  const query = QUERIES[scope];
  let result = null;

  for (const layerId of query.layers) {
    result = await queryLayer(
      query.service,
      layerId,
      longitude,
      latitude,
      query.fallbackLabel,
    );

    if (result) break;
  }

  if (!result) {
    return NextResponse.json(
      { error: `No ${scope} boundary contains that point.` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...result,
    scope,
  });
}
