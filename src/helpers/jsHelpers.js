const range = (length) => [...Array(length).keys()]

const rangeSkipping = (length, jump) => range(length).filter(i => i%jump === 0)

const roundToDP = (num, dp) => {
  const divisor = Math.pow(10, dp)
  return Math.round((num + Number.EPSILON) * divisor) / divisor
}

const toPrecision = (x, p) => {
  return Number.parseFloat(x).toPrecision(p);
}

const reduceTotal = (valuesArray) => {
  return valuesArray.reduce((total, value) => total + value)
}

const bytesToMB = (sizeInBytes) => {
  return roundToDP(sizeInBytes / 1000 / 1000, 2)
}

const isObject = value => {
  return value && typeof value === 'object' && value.constructor === Object
}

export { bytesToMB, range, rangeSkipping, roundToDP, toPrecision, reduceTotal, isObject }