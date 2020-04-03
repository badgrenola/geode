const range = (length) => [...Array(length).keys()]
const roundToDP = (num, dp) => {
  const divisor = Math.pow(10, dp)
  return Math.round((num + Number.EPSILON) * divisor) / divisor
}
const reduceTotal = (valuesArray) => {
  return valuesArray.reduce((total, value) => total + value)
}

export { range, roundToDP, reduceTotal }