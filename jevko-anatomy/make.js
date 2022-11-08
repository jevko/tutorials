import {parseJevkoStream, trimPrefixes, jevkoStreamToTree, removeByPrefix} from 'https://cdn.jsdelivr.net/gh/jevko/jevkostream.js@0.1.0/mod.js'

const toHtml = jevko => {
  const {subjevkos, suffix} = jevko

  if (subjevkos.length === 0) return suffix

  if (suffix.trim() !== '') throw Error('nonblank suffix')

  let ret = ''

  for (const {prefix, jevko} of subjevkos) {
    ret += ctx.get(prefix)(jevko)
  }

  return ret
}

const makeTag = tag => jevko => {
  const {subjevkos, suffix} = jevko

  const attrs = []
  const children = []
  const classes = []
  for (const s of subjevkos) {
    const {prefix, jevko} = s
    if (prefix === '.') classes.push(jevko.suffix)
    else if (prefix.endsWith('=')) attrs.push(`${prefix}"${jevko.suffix}"`)
    else children.push(s)
  }

  if (classes.length > 0) attrs.push(`class="${classes.join(' ')}"`)

  return `<${tag} ${attrs.join(' ')}>${toHtml({subjevkos: children, suffix})}</${tag}>`
}


const span = makeTag('span')

const makeSpanWithClass = (...clzs) => jevko => {
  const subs = [
    ...clzs.map(clz => ({prefix: ".", jevko: {subjevkos: [], suffix: clz}})),
    ...jevko.subjevkos
  ]
  return span({subjevkos: subs, suffix: jevko.suffix})
}

// todo: extract
const suffixToJevko = suffix => {
  return {
    subjevkos: [],
    suffix,
  }
}

const makeTextNode = text => {
  return {
    prefix: "", 
    jevko: suffixToJevko(text),
  }
}

const makeTagWithAnchor = tag => {
  const t = makeTag(tag)
  return jevko => {
    const id = jevko.suffix.toLowerCase().replaceAll(' ', '-')

    const tree = sourceToTree(
      `a {id={${id}}href={#${id}}{#}}`
    )

    const j2 = {
      subjevkos: [
        ...jevko.subjevkos,
        ...tree.subjevkos,
        makeTextNode(' ' + jevko.suffix),
      ],
      suffix: "",
    }

    return t(j2)
  }
}

const ctx = new Map([
  ['', toHtml],
  ['#', makeTagWithAnchor('h1')],
  ['##', makeTagWithAnchor('h2')],
  ['a', makeTag('a')],
  ['p', makeTag('p')],
  ['em', makeTag('em')],
  ['pre', makeTag('pre')],
  ['code', makeTag('code')],
  ['br', makeTag('br')],
  ['sub', makeSpanWithClass('sub')],
  ['suf', makeSpanWithClass('suf')],
  ['suffix', makeSpanWithClass('suf', 'inline')],
  ['prefix', makeSpanWithClass('prefix')],
  ['jevko', makeSpanWithClass('jevko')],
  ['gray', makeSpanWithClass('gray')],
])

const source = Deno.readTextFileSync('source.jevko')

const css = `${Deno.readTextFileSync('style.css')}\n${Deno.readTextFileSync('spec.css')}`

const sourceToTree = source => {
  const stream = parseJevkoStream(
    trimPrefixes(
      removeByPrefix(
        jevkoStreamToTree({
          end: (parent) => parent
        })
      )
    ),
    {
      opener: '{',
      closer: '}',
    }
  )
  
  stream.chunk(source)
  return stream.end()
}

const content = toHtml(sourceToTree(source))

const document = `<!doctype html>\n<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />\n<style>${css}</style>${content}`

console.log(document)