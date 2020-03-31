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
  JP2000: 3471
};

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
  LOGLUV: 32845
};

const Orientation = {
  TOPLEFT: 1,
  TOPRIGHT: 2,
  BOTRIGHT: 3,
  BOTLEFT: 4,
  LEFTTOP: 5,
  RIGHTTOP: 6,
  RIGHTBOT: 7,
  LEFTBOT: 8
};

const PlanarConfiguration = {
  CONTIG: 1,
  SEPARATE: 2
};

const ResolutionUnit = {
  NONE: 1,
  INCH: 2,
  CENTIMETER: 3
};

const ExtraSamples = {
  UNSPECIFIED: 0,
  ASSOCALPHA: 1,
  UNASSALPHA: 2
};
