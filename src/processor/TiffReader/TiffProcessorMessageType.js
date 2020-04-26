const TiffProcessorMessageType = {
  ERROR: -1,

  HEADER_LOADED: 2,

  PIXEL_STATS_LOADED: 3,
  PIXEL_STATS_LOAD_ERROR: -3,

  TEST_IMG_DOWNLOAD: 4
}

export { TiffProcessorMessageType }