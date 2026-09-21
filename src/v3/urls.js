import {v3Base} from "./config.js";

// ── hydrography ──────────────────────────────────────────────────────────────
// global/ holds the whole-network products. Everything else is published whole per HydroBASINS
// level-2 region (the TDXHydroRegion number) in region=<region>/, each one an unbroken run of riverIndex.
const hydrographyBase = () => `${v3Base()}/hydrography`;
const hydrographyGlobal = () => `${hydrographyBase()}/global`;
const _requireRegion = (region, fn) => {
  if (region === undefined || region === null || region === "") throw new Error(`${fn} requires a region number`);
  return region;
};
const hydrographyRegion = ({region} = {}) => `${hydrographyBase()}/region=${_requireRegion(region, "hydrographyRegion")}`;
const _regionFile = (kind, suffix) => ({region} = {}) => {
  _requireRegion(region, `the ${kind} file`);
  return `${hydrographyRegion({region})}/${kind}_${region}${suffix}`;
};
// global products
const streamsPmtiles = () => `${hydrographyGlobal()}/streams.pmtiles`;
const catchmentsPmtiles = () => `${hydrographyGlobal()}/catchments.pmtiles`;
const regionsPmtiles = () => `${hydrographyGlobal()}/regions.pmtiles`;
const regionsGeoparquet = () => `${hydrographyGlobal()}/regions.geo.parquet`;
const hydrographyMetadataZarr = () => `${hydrographyGlobal()}/metadata.zarr`;
const riverNamesJson = () => `${hydrographyGlobal()}/riverNames.json`;
// the global table without a region, that region's slice of it with one
const hydrographyMetadataParquet = ({region} = {}) => (region == null
  ? `${hydrographyGlobal()}/metadata.parquet`
  : _regionFile("metadata", ".parquet")({region}));
const watershedsParquet = ({region} = {}) => (region == null
  ? `${hydrographyGlobal()}/watersheds.parquet`
  : _regionFile("watersheds", ".parquet")({region}));
// per-region geometry
const streamsGeoparquet = _regionFile("streams", ".geo.parquet");
const catchmentsGeoparquet = _regionFile("catchments", ".geo.parquet");
const confluencesGeoparquet = _regionFile("confluences", ".geo.parquet");
const boundaryGeoparquet = _regionFile("boundary", ".geo.parquet");

// ── retrospective ────────────────────────────────────────────────────────────
const allowedResolutions = ["hourly", "daily", "monthly", "yearly"];
const retrospectiveZarr = ({resolution = "hourly"} = {}) => {
  if (!allowedResolutions.includes(resolution)) {
    throw new Error(`Invalid resolution: ${resolution}. Must be one of ${allowedResolutions.join(", ")}.`);
  }
  return `${v3Base()}/retrospective/${resolution}.zarr`;
}
const returnPeriodsZarr = () => `${v3Base()}/retrospective/return-periods.zarr`;
const maximumsZarr = () => `${v3Base()}/retrospective/maximums.zarr`;

// ── forecasts ────────────────────────────────────────────────────────────────
const _datePartition = date => {
  if (!/^\d{4}-?\d{2}-?\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Must be YYYYMMDD or YYYY-MM-DD.`);
  }
  const ymd = date.replace(/-/g, "");
  return `year=${ymd.slice(0, 4)}/month=${ymd.slice(4, 6)}/day=${ymd.slice(6, 8)}`;
};
const forecastDir = ({date}) => `${v3Base()}/forecasts15/${_datePartition(date)}`;
const forecastZarr = ({date}) => `${forecastDir({date})}/discharge.zarr`;

// ── flood maps (FLDPLN) ──────────────────────────────────────────────────────
// Individual tile stores are deliberately absent: their `lat=*/lon=*/*.zarr` paths come from
// manifest.json, which is the source of truth for the tiling, so a builder here would be a second
// one. The boundaries pmtiles is here for the same reason streamsPmtiles() is — a map layer needs
// the url without reading anything.
const _floodMapsManifestFile = "manifest.json";
const _floodMapsTileBoundariesFile = "tile_boundaries.pmtiles";
const floodMapsBase = () => `${v3Base()}/flood-maps`;
// flood-maps/ is itself a zarr v3 group: its zarr.json carries the manifest as attributes and
// its rivers/ subgroup holds the riverIndex -> store index (FloodMapsIndex.open()). manifest.json
// is the same attributes as plain JSON for readers without zarr.
const floodMapsRoot = () => `${floodMapsBase()}/zarr.json`;
const floodMapsManifest = () => `${floodMapsBase()}/${_floodMapsManifestFile}`;
const floodMapsTileBoundaries = () => `${floodMapsBase()}/${_floodMapsTileBoundariesFile}`;

// ── map-styles ─────────────────────────────────────────────────────────────
const stylesets = Object.freeze(["timeseries", "max-flow", "time-to-peak", "below-q95"]);
const streamsStyles = ({date, styleset}) => {
  if (!styleset) throw new Error("streamsStyles requires a styleset, consult stylesets for valid values");
  if (!stylesets.includes(styleset)) {
    throw new Error(`Invalid styleset: ${styleset}. Must be one of ${stylesets.join(", ")}.`);
  }
  return `${forecastDir({date})}/maps/${styleset}/styles`;
};

export {
  // hydrography url builders
  hydrographyBase, hydrographyGlobal, hydrographyRegion,
  streamsPmtiles, catchmentsPmtiles, regionsPmtiles, regionsGeoparquet,
  hydrographyMetadataZarr, hydrographyMetadataParquet, watershedsParquet, riverNamesJson,
  streamsGeoparquet, catchmentsGeoparquet, confluencesGeoparquet, boundaryGeoparquet,
  // retrospective url builders
  retrospectiveZarr, returnPeriodsZarr, maximumsZarr,
  // forecast url builders
  forecastDir, forecastZarr,
  // flood map (FLDPLN) url builders
  floodMapsBase, floodMapsRoot, floodMapsManifest, floodMapsTileBoundaries,
  // map-styles url builders
  stylesets, streamsStyles,
}
