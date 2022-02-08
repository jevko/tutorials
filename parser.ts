type Jevko = {
  subjevkos: Subjevko[],
  suffix: string,
}
type Subjevko = {
  prefix: string,
  jevko: Jevko,
}

const opener = '['
const closer = ']'
const escaper = '`'

function Jevko(subjevkos = [], suffix = ''): Jevko {
  return {subjevkos, suffix}
}
function Subjevko(prefix, jevko): Subjevko {
  return {prefix, jevko}
}

export function parseJevko(str: string): Jevko {
  // perhaps rename to ancestors
  const parents: Jevko[] = []

  let parent = Jevko()
  let text = ''
  let isEscaped = false

  let line = 1
  let column = 1

  for (let i = 0; i < str.length; ++i) {
    const chr = str[i]

    if (isEscaped) {
      if (chr === escaper || chr === opener || chr === closer) {
        text += chr
        isEscaped = false
      } else throw SyntaxError(
        `Invalid digraph (${escaper}${chr}) at ${line}:${column}!`
      )
    } else if (chr === escaper) {
      isEscaped = true
    } else if (chr === opener) {
      const jevko = Jevko()
      parent.subjevkos.push(Subjevko(text, jevko))
      parents.push(parent)
      parent = jevko
      text = ''
    } else if (chr === closer) {
      parent.suffix = text
      text = ''
      if (parents.length < 1) throw SyntaxError(
        `Unexpected closer (${closer}) at ${line}:${column}!`
      )
      parent = parents.pop()
    } else {
      text += chr
    }

    if (chr === '\n') {
      ++line
      column = 1
    } else {
      ++column
    }
  }
  if (isEscaped) throw SyntaxError(
    `Unexpected end after escaper (${escaper})!`
  )
  if (parents.length > 0) throw SyntaxError(
    `Unexpected end: missing ${parents.length} closer(s) (${closer})!`
  )
  parent.suffix = text
  return parent
}