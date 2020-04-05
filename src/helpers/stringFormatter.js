const isObject = (value) => {
  return value && typeof value === 'object' && value.constructor === Object
}

const prettyFormatData = (data, fieldName) => {
  //Empty data
  if (!data) {
    return 'None'
  }

  //Array data
  if (Array.isArray(data)) {
    return data.join('<br />')
  }

  //Object
  if (isObject(data)) {
    return JSON.stringify(data)
  }

  //GeoAsciiParams
  // if (fieldName === 'GeoAsciiParamsTag') {
  //   return formatGeoAsciiParams(data)
  // }

  //Any other
  return data
}

const formatGeoAsciiParams = (data) => {
  const split = data.split('|').filter((item) => item.trim() !== '')
  const pretty = split.map((entry) => {
    if (entry.includes('[')) {
      return formatGeoAsciiArrayString(entry)
    }
    return entry
  })
  return pretty.join('<br />')
}

const formatGeoAsciiArrayString = (arrayString) => {
  //Split at the =
  const split = arrayString.split('=')

  //Get the params as JSON
  const paramsJSON = getGeoAsciiParamsJSON(split[1])

  return `${split[0]} = ${JSON.stringify(paramsJSON)}`
}

const getGeoAsciiParamsJSON = (paramsString) => {
  let stringToConvert = paramsString.trim()
  let result = convertGeoAsciiParamSections(stringToConvert)
  while (result.success) {
    result = convertGeoAsciiParamSections(result.string)
  }
  return result.string
}

const convertGeoAsciiParamSections = (paramsString) => {
  //Get matches
  const regex = /[A-Z]+(\[(?:\[??[^\[]*?\]))/g
  const results = paramsString.match(regex)

  let finalString = paramsString
  if (results) {
    results.forEach((result, i) => {
      //First entry is the whole thing
      finalString = finalString.replace(
        result,
        JSON.stringify(convertGeoAsciiSection(result))
      )
    })
  }

  // console.log(result)
  // matches.forEach((match) => {
  //   console.log(match)
  // })

  return {
    success: results && results.length > 0,
    string: finalString,
  }
}

const convertGeoAsciiSection = (sectionString) => {
  //UNIT["Degree",0.0174532925199433]
  const split = sectionString.split('[')
  const key = split[0]
  const values = split[1].replace(']', '').split(',')
  console.log(split[1])
  console.log(values)
  return {
    key,
    values,
  }
}

const old_getGeoAsciiParamsJSON = (paramsString) => {
  console.log(paramsString)
  //Go through each char at once, keeping track of state
  const chars = paramsString.trim().split('')

  let inString = false
  let currentString = ''
  let finalString = '{'

  chars.forEach((char) => {
    if (char === '"') {
      if (inString) {
        //Close string
        inString = false
        finalString += `key:"${currentString}"`
        currentString = ''
      } else {
        //Start string
        inString = true
      }
    } else if (char === '[') {
      finalString += ':{'
    } else if (char === ']') {
      if (finalString.charAt(finalString.length - 1) !== ',') {
        finalString += '}'
      } else {
        finalString += '}'
      }
    } else if (!inString) {
      finalString += char
    } else if (char === ',') {
      if (finalString.charAt(finalString.length - 1) !== ',') {
        finalString += ','
      }
    } else if (inString) {
      currentString += char
    }
  })

  finalString += '}'

  //Fix unquoted keys
  //https://gist.github.com/larruda/967110d74d98c1cd4ee1
  finalString = finalString.replace(
    /(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9]+)(['"])?:/g,
    '$1"$3":'
  )

  console.log(finalString)

  return JSON.parse(finalString)
}

export { prettyFormatData, getGeoAsciiParamsJSON }
