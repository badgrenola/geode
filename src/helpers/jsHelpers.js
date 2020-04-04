const range = (length) => [...Array(length).keys()]

const roundToDP = (num, dp) => {
  const divisor = Math.pow(10, dp)
  return Math.round((num + Number.EPSILON) * divisor) / divisor
}

const reduceTotal = (valuesArray) => {
  return valuesArray.reduce((total, value) => total + value)
}

const bytesToMB = (sizeInBytes) => {
  return roundToDP(sizeInBytes / 1000 / 1000, 2)
}

export { bytesToMB, range, roundToDP, reduceTotal }