import {parseJevko} from 'https://cdn.jsdelivr.net/gh/jevko/parsejevko.js@v0.1.6/mod.js'

const trimPrefixesAndRemoveComments = jevko => {
  const {subjevkos, suffix} = jevko

  const ret = []

  for (const {prefix, jevko} of subjevkos) {
    const trimmed = prefix.trim()
    if (trimmed === '--') continue
    ret.push({prefix: trimmed, jevko: trimPrefixesAndRemoveComments(jevko)})
  }

  return {subjevkos: ret, suffix}
}

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

const makeSpanWithClass = clz => jevko => {
  const subs = [
    {prefix: ".", jevko: {subjevkos: [], suffix: clz}},
    ...jevko.subjevkos
  ]
  return span({subjevkos: subs, suffix: jevko.suffix})
}

const ctx = new Map([
  ['', toHtml],
  ['#', makeTag('h1')],
  ['##', makeTag('h2')],
  ['p', makeTag('p')],
  ['em', makeTag('em')],
  ['pre', makeTag('pre')],
  ['br', makeTag('br')],
  ['sub', makeSpanWithClass('sub')],
  ['suf', makeSpanWithClass('suf')],
  ['prefix', makeSpanWithClass('prefix')],
  ['jevko', makeSpanWithClass('jevko')],
  ['gray', makeSpanWithClass('gray')],
])

const source = Deno.readTextFileSync('source.jevko')

const css = `${Deno.readTextFileSync('style.css')}\n${Deno.readTextFileSync('spec.css')}`

const content = toHtml(trimPrefixesAndRemoveComments(parseJevko(source, {opener: '{', closer: '}'})))

const document = `<!doctype html>\n<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />\n<style>${css}</style>${content}`

console.log(document)