# Jevko parser tutorial

(not finished)

In this tutorial we will break down and describe a simple Jevko parser to make it easy to implement in any programming language.

This tutorial is aimed at hackers who would like to quickly implement support for Jevko in their favorite programming language, to enable others to start using it.

The idea is that this tutorial be kept as simple and as easy as possible, to reduce the barrier of entry to absolute minimum.

The parser we will be breaking down is written in TypeScript, but no advanced features of the language are used, and the code is explained in detail. TypeScript simply plays the role of executable pseudocode.

# Prerequisites

## Data types

[spec](https://github.com/jevko/specifications/blob/master/draft-standard-grammar.md)

### Jevko

```abnf
; start symbol, main rule #1
Jevko = *Subjevko Suffix
```

<!-- <details>
<summary>ABNF</summary>
todo
</details> -->

A tree with subtrees.

```ts
type Jevko = {
  subjevkos: Subjevko[],
  suffix: string,
}
```

```abnf
; aliases
Suffix = Text
```

```ts
function Jevko(subjevkos = [], suffix = ''): Jevko {
  return {subjevkos, suffix}
}
```

### Subjevko

```abnf
; main rule #2, mutually recursive with #1
Subjevko = Prefix Opener Jevko Closer
```

```abnf
; main rule #2, mutually recursive with #1
Subjevko = Prefix "[" Jevko "]"
```

A subtree with a prefix.

```ts
type Subjevko = {
  prefix: string,
  jevko: Jevko,
}
```

```abnf
Prefix = Text
```

```ts
function Subjevko(prefix, jevko): Subjevko {
  return {prefix, jevko}
}
```

## Delimiters

```abnf
; delimiters
Delimiter = Opener / Closer / Escaper

Opener  = %x5b ; left square bracket 
Closer  = %x5d ; right square bracket
Escaper = %x60 ; grave accent
```

```ts
const opener = '['
const closer = ']'
const escaper = '`'
```

# Parse function

```ts
export function parseJevko(str: string): Jevko
```

Stack of parents/ancestors of the current parent:

```ts
const parents: Jevko[] = []
```

```ts
let parent = Jevko()
let text = ''
```

```abnf
; text
Text = *Symbol
Symbol = Digraph / Character
```

So the parser has two modes: regular and escaped.

```ts
let isEscaped = false
```

```abnf
Digraph = Escaper Delimiter
```

```abnf
; text
Text = *Symbol
Symbol = Digraph / Character
Digraph = Escaper Delimiter
; Character is any code point which is not a Delimiter
Character = %x0-5a / %x5c / %x5e-5f / %x61-10ffff
```

## Iterate -- main loop

```ts
for (let i = 0; i < str.length; ++i)
```

```ts
const chr = str[i]
```

## Escaping/Digraphs

In escaped mode there are only 3 valid characters.

```ts
if (isEscaped) {
  if (chr === escaper || chr === opener || chr === closer) {
    text += chr
    isEscaped = false
  } else throw SyntaxError(`Invalid digraph (${escaper}${chr})!`)
}
```

```abnf
Digraph = Escaper Delimiter
```

in non-escaped mode there are 3 special characters/delimiters. First is the escaper:

```ts
else if (chr === escaper) {
  isEscaped = true
}
```

```abnf
; text
Text = *Symbol
Symbol = Digraph / Character
Digraph = Escaper Delimiter
; Character is any code point which is not a Delimiter
Character = %x0-5a / %x5c / %x5e-5f / %x61-10ffff
```

## Opening

second is the opener:

```ts
else if (chr === opener) {
  const jevko = Jevko()
  parent.subjevkos.push(Subjevko(text, jevko))
  parents.push(parent)
  parent = jevko
  text = ''
}
```

## Closing

third is the closer:

```ts
else if (chr === closer) {
  parent.suffix = text
  text = ''
  if (parents.length < 1) throw SyntaxError(`Unexpected closer (${closer})!`)
  parent = parents.pop()
}
```

## Text -- Characters

other characters are non-special:

```ts
else {
  text += chr
}
```

```abnf
; Character is any code point which is not a Delimiter
Character = %x0-5a / %x5c / %x5e-5f / %x61-10ffff
```

```abnf
; text
Text = *Symbol
Symbol = Digraph / Character
Digraph = Escaper Delimiter
; Character is any code point which is not a Delimiter
Character = %x0-5a / %x5c / %x5e-5f / %x61-10ffff
```

## Final

After the main loop we check if we are in a valid state:

```ts
if (isEscaped) throw SyntaxError(`Unexpected end after escaper (${escaper})!`)
if (parents.length > 0) throw SyntaxError(`Unexpected end: missing ${parents.length} closer(s) (${closer})!`)
```

we assign the final suffix for the top-level Jevko

```ts
parent.suffix = text
```

and finally we return the top-level Jevko:

```ts
return parent
```

# Now you can

Write one in your favorite language and share it as a library!

# Appendix

## Lines and columns

At the top of the parse fn

```ts
let line = 1
let column = 1
```

At the end of the parse loop

```ts
if (chr === '\n') {
  ++line
  column = 1
} else {
  ++column
}
```

in escaping

```ts
throw SyntaxError(`Invalid digraph (${escaper}${chr}) at ${line}:${column}!`)
```

in closing

```ts
throw SyntaxError(`Unexpected closer (${closer}) at ${line}:${column}!`)
```

## Configurable delimiters

```ts
export const parseJevko = (str: string, {
  opener = '[',
  closer = ']',
  escaper = '`'
} = {}): Jevko
```