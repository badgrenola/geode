// https://www.awaresystems.be/imaging/tiff/tifftags/compression.html
const Compression = {
  NONE: 1,
  CCITTRLE: 2,
  CCITTFAX3: 3,
  CCITT_T4: 3,
  CCITTFAX4: 4,
  CCITT_T6: 4,
  LZW: 5,
  OJPEG: 6,
  JPEG: 7,
  NEXT: 32766,
  CCITTRLEW: 32771,
  PACKBITS: 32773,
  THUNDERSCAN: 32809,
  IT8CTPAD: 32895,
  IT8LW: 32896,
  IT8MP: 32897,
  IT8BL: 32898,
  PIXARFILM: 32908,
  PIXARLOG: 32909,
  DEFLATE: 32946,
  ADOBE_DEFLATE: 8,
  DCS: 32947,
  JBIG: 34661,
  SGILOG: 34676,
  SGILOG24: 34677,
  JP2000: 3471,
}

const PhotometricInterpretation = {
  MINISWHITE: 0,
  MINISBLACK: 1,
  RGB: 2,
  PALETTE: 3,
  MASK: 4,
  SEPARATED: 5,
  YCBCR: 6,
  CIELAB: 8,
  ICCLAB: 9,
  ITULAB: 10,
  LOGL: 32844,
  LOGLUV: 32845,
}

const Orientation = {
  TOPLEFT: 1,
  TOPRIGHT: 2,
  BOTRIGHT: 3,
  BOTLEFT: 4,
  LEFTTOP: 5,
  RIGHTTOP: 6,
  RIGHTBOT: 7,
  LEFTBOT: 8,
}

const PlanarConfiguration = {
  CONTIG: 1,
  SEPARATE: 2,
}

const ResolutionUnit = {
  NONE: 1,
  INCH: 2,
  CENTIMETER: 3,
}

const ExtraSamples = {
  UNSPECIFIED: 0,
  ASSOCALPHA: 1,
  UNASSALPHA: 2,
}

const SampleFormat = {
  UINT: 1,
  INT: 2,
  IEEEFP: 3,
  VOID: 4,
  COMPLEXINT: 5,
  COMPLEXIEEEFP: 6,
}

const ProjLinearUnitsGeoKey = {
  Meter:	9001,
  Foot:	9002,
  Foot_US_Survey:	9003,
  Foot_Modified_American:	9004,
  Foot_Clarke:	9005,
  Foot_Indian:	9006,
  Link:	9007,
  Link_Benoit:	9008,
  Link_Sears:	9009,
  Chain_Benoit:	9010,
  Chain_Sears:	9011,
  Yard_Sears:	9012,
  Yard_Indian:	9013,
  Fathom:	9014,
  Mile_International_Nautical:	9015,
}

const ProjCoordTransGeoKey = {
  TransverseMercator:	1,
  TransvMercator_Modified_Alaska: 2,
  ObliqueMercator:	3,
  ObliqueMercator_Laborde:	4,
  ObliqueMercator_Rosenmund:	5,
  ObliqueMercator_Spherical:	6,
  Mercator:	7,
  LambertConfConic_2SP:	8,
  LambertConfConic_Helmert:	9,
  LambertAzimEqualArea:	10,
  AlbersEqualArea:	11,
  AzimuthalEquidistant:	12,
  EquidistantConic:	13,
  Stereographic:	14,
  PolarStereographic:	15,
  ObliqueStereographic:	16,
  Equirectangular:	17,
  CassiniSoldner:	18,
  Gnomonic:	19,
  MillerCylindrical:	20,
  Orthographic:	21,
  Polyconic:	22,
  Robinson:	23,
  Sinusoidal:	24,
  VanDerGrinten:	25,
  NewZealandMapGrid:	26,
  TransvMercator_SouthOriented:27
}

const ProjectionGeoKey = {
  UserDefined: 32767,
}

const ProjectedCSTypeGeoKey = {
  UserDefined: 32767,
}

const GTModelTypeGeoKey = {
  ModelTypeProjected: 1,
  ModelTypeGeographic: 2,
  ModelTypeGeocentric: 3,
}

const GTRasterTypeGeoKey = {
  PixelIsArea: 1,
  PixelIsPoint:2,
}

const GeographicTypeGeoKey = {
  UserDefined: 32767,
}

const GeogAngularUnitsGeoKey = {
  Radian: 9101,
  Degree: 9102,
  Arc_Minute: 9103,
  Arc_Second: 9104,
  Grad: 9105,
  Gon: 9106,
  DMS: 9107,
  DMS_Hemisphere: 9108,
}

const enumsObject = {
  Compression: Compression,
  PhotometricInterpretation: PhotometricInterpretation,
  Orientation: Orientation,
  PlanarConfiguration: PlanarConfiguration,
  ResolutionUnit: ResolutionUnit,
  ExtraSamples: ExtraSamples,
  SampleFormat: SampleFormat,
  ProjLinearUnitsGeoKey: ProjLinearUnitsGeoKey,
  ProjCoordTransGeoKey: ProjCoordTransGeoKey,
  ProjectionGeoKey: ProjectionGeoKey,
  ProjectedCSTypeGeoKey: ProjectedCSTypeGeoKey,
  GTModelTypeGeoKey: GTModelTypeGeoKey,
  GTRasterTypeGeoKey: GTRasterTypeGeoKey,
  GeographicTypeGeoKey: GeographicTypeGeoKey,
  GeogAngularUnitsGeoKey: GeogAngularUnitsGeoKey,
}

export { enumsObject }