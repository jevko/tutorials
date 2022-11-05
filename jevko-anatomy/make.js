import {parseJevko} from 'https://cdn.jsdelivr.net/gh/jevko/parsejevko.js@v0.1.6/mod.js'

const trimPrefixes = jevko => {
  const {subjevkos, suffix} = jevko

  const ret = []

  for (const {prefix, jevko} of subjevkos) {
    ret.push({prefix: prefix.trim(), jevko: trimPrefixes(jevko)})
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

const ttt = tag => jevko => {
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


const ss = ttt('span')

const sss = clz => jevko => {
  const subs = [
    {prefix: ".", jevko: {subjevkos: [], suffix: clz}},
    ...jevko.subjevkos
  ]
  return ss({subjevkos: subs, suffix: jevko.suffix})
}

const ctx = new Map([
  ['', toHtml],
  ['#', ttt('h1')],
  ['p', ttt('p')],
  ['em', ttt('em')],
  ['pre', ttt('pre')],
  ['br', ttt('br')],
  ['sub', sss('sub')],
  ['suf', sss('suf')],
  ['prefix', sss('prefix')],
  ['jevko', sss('jevko')],
])

const ex2 = `
# {Anatomy of a jevko}

p {This is an informal description of the various elements of the Jevko syntax.}

p {{The name } em {Jevko} { /ˈdʒef.kɔ/ is derived from Polish } em{drzewko} { /ˈdʐɛf.kɔ/, meaning } em{small tree}{.}}

p {This relates to the fact that Jevko is meant to be a minimal syntax for simple flexible tree structures.}

p {{We shall call a specific instance of a Jevko tree a } jevko{.{inline}jevko}{.}}

p {An example of a jevko looks like this:}

pre {
jevko {first name [string]
last name [string]
is alive [boolean]
age [integer]
address [
  street address [string]
  city [string]
  state [string]
  postal code [string]
]
children [list]
spouse []
object}
}

p {We will now break this example down and identify and name its parts.}

p {{A jevko is made out of a number of } sub{.{inline}{subjevkos}} { followed by a } suf{.{inline}{suffix}}{:}}

pre {
sub {first name [string]}
sub {last name [string]}
sub {is alive [boolean]}
sub {age [number]}
sub {address [
  street address [string]
  city [string]
  state [string]
  postal code [string]
]}
sub {children [array]}
sub {spouse []}
suf {object}
}

p {{A }sub{.{inline}subjevko}{ is a kind of a name-value pair:}}

pre {
  sub {first name [string]}
}

p {
  {A subjevko is made out of a } prefix{.{inline}{prefix}} { followed by a } jevko{.{inline}{jevko}} { wrapped in [square brackets]:}
}

pre {
prefix {first name }{[}jevko {.{inline}string}{]}
}

p {Notice that this subjevko's jevko can be broken down like this:}

pre {
sub {}
suf {string}
}

p {It has no subjevkos of its own, only a suffix.}

p {{A jevko without subjevkos like this is called } em{trivial}{.}}

p {A subjevko whose jevko is trivial is itself called trivial.}

p {Let's look at some more interesting subjevkos.}

p {For example this one:}

pre {
  prefix{spouse }{[}jevko {.{inline}}{]}
}

p {The jevko in this subjevko can't be seen -- it has no subjevkos and an empty suffix.}

p {{Such a jevko is called }em{empty}{.}}

p {An empty jevko is a special case of a trivial jevko.}

p {Another interesting subjevko is this one:}
pre {
prefix {address }{[}
jevko {  street address [string]
  city [string]
  state [string]
  postal code [string]
}{]}
}

p {Its jevko has 4 subjevkos:}
pre {
sub {  street address [string]}
sub {  city [string]}
sub {  state [string]}
sub {  postal code [string]}
suf {}
}
p {{A jevko with at least one subjevko is called }em{complex}{.}}

p {A subjevko whose jevko is complex is itself called complex.}

# {Whitespace}

p {Whitespace is characters such as spaces, new lines, and tabs.}

p {All whitespace in a jevko is part of text.}

p {Text in a jevko means a prefix or a suffix.}

p {{Text which is made only of whitespace is called }em{blank}{. Blank text may be empty.}}

p {A trivial jevko with a blank suffix is itself called blank. For example:}

pre {
suf {    }
}

p {A subjevko with a blank prefix and a blank jevko is called blank. For example:}

pre {
sub {  [  ]}
}

p {A subjevko with an empty prefix and an empty jevko is called empty. It looks like this:}

pre {
sub {[]}
}
`

const html2 = `<style>${Deno.readTextFileSync('style.css')}\n${Deno.readTextFileSync('spec.css')}</style>${toHtml(trimPrefixes(parseJevko(ex2, {opener: '{', closer: '}'})))}`

console.log(html2)