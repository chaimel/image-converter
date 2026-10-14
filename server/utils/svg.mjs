import { DOMParser } from '@xmldom/xmldom'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
const SELF_CONTAINED =
  'Use a self-contained SVG with embedded raster images and no scripts, event handlers, animation, or external links.'
const UTF8_MESSAGE = 'Save this SVG as UTF-8 text before converting it.'
const XML_WHITESPACE = new Set([9, 10, 13, 32])
const cssAttributes = new Set([
  'style',
  'fill',
  'stroke',
  'filter',
  'clip-path',
  'mask',
  'cursor',
  'marker',
  'marker-start',
  'marker-mid',
  'marker-end',
  'color-profile',
])
const blockedElements = new Set([
  'script',
  'foreignobject',
  'iframe',
  'object',
  'embed',
  'handler',
  // SMIL can change an otherwise safe href or event attribute after validation.
  'animate',
  'animatemotion',
  'animatetransform',
  'set',
  'discard',
])

export class SvgValidationError extends Error {}

function blocked() {
  throw new SvgValidationError(SELF_CONTAINED)
}

function allowedReference(value) {
  const reference = value.trim()
  return (
    reference.startsWith('#') ||
    /^data:image\/(?:png|jpeg|webp|gif|avif);base64,[a-z\d+/=\s]+$/i.test(reference)
  )
}

function checkCss(value) {
  // This is a deliberately restricted static-SVG policy, not a general CSS sanitizer.
  // Reject escapes instead of interpreting every CSS spelling of imports and URLs.
  const css = value.replace(/\/\*[\s\S]*?\*\//g, '')
  if (/\\|@import\b|(?:-webkit-)?image-set\s*\(|\bimage\s*\(/i.test(css)) blocked()
  for (const match of css.matchAll(/url\s*\(\s*([^)]*?)\s*\)/gi)) {
    const reference = match[1]
      .trim()
      .replace(/^(['"])([\s\S]*)\1$/, '$2')
      .trim()
    if (!allowedReference(reference)) blocked()
  }
}

/** Validate the static, self-contained SVG subset that the converter can preserve offline. */
export function validateSvg(bytes) {
  // XML may be preceded by a BOM, whitespace, or comments of any length. Do not sniff
  // just the first kilobyte: preserved SVG markup is also opened outside the converter.
  if (
    (bytes[0] === 0xff && bytes[1] === 0xfe) ||
    (bytes[0] === 0xfe && bytes[1] === 0xff) ||
    (bytes[0] === 0 && bytes[1] === 0x3c) ||
    (bytes[0] === 0x3c && bytes[1] === 0)
  )
    throw new SvgValidationError(UTF8_MESSAGE)

  let start = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
  while (XML_WHITESPACE.has(bytes[start])) start++
  // Also recognize UTF-16 without a BOM, including leading XML whitespace.
  if (
    (bytes[start] === 0 &&
      (bytes[start + 1] === 0x3c ||
        XML_WHITESPACE.has(bytes[start + 1]) ||
        (start > 0 && XML_WHITESPACE.has(bytes[start - 1])))) ||
    (bytes[start] === 0x3c && bytes[start + 1] === 0)
  ) {
    throw new SvgValidationError(UTF8_MESSAGE)
  }
  if (bytes[start] !== 0x3c) return undefined
  let xml
  try {
    xml = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new SvgValidationError(UTF8_MESSAGE)
  }
  const encoding = xml.match(/<\?xml\b[^?]*\bencoding\s*=\s*(['"])([^'"]+)\1/i)?.[2]
  if (encoding && !/^(?:utf-8|utf8|us-ascii)$/i.test(encoding)) throw new SvgValidationError(UTF8_MESSAGE)
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) blocked()

  let doc
  try {
    doc = new DOMParser({
      onError: () => {
        throw new Error('Invalid XML')
      },
    }).parseFromString(xml, 'application/xml')
  } catch {
    throw new SvgValidationError('This SVG is not well-formed XML.')
  }
  const root = doc.documentElement
  if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== SVG_NAMESPACE)) {
    throw new SvgValidationError('The file does not contain a valid SVG root.')
  }

  const pending = [doc]
  while (pending.length) {
    const node = pending.pop()
    if (node.nodeType === 7 && node.target.toLowerCase() === 'xml-stylesheet') blocked()
    if (node.nodeType === 1) {
      const name = node.localName.toLowerCase()
      if (blockedElements.has(name)) blocked()
      for (let index = 0; index < node.attributes.length; index++) {
        const attribute = node.attributes.item(index)
        const attributeName = attribute.localName.toLowerCase()
        if (
          /^on/i.test(attributeName) ||
          attributeName === 'srcdoc' ||
          (attributeName === 'base' &&
            (attribute.namespaceURI === XML_NAMESPACE || attribute.name === 'xml:base'))
        )
          blocked()
        if (['href', 'src'].includes(attributeName) && !allowedReference(attribute.value)) blocked()
        // DOM attribute values are entity-decoded before reference checks.
        if (!attribute.namespaceURI && cssAttributes.has(attributeName)) checkCss(attribute.value)
      }
      if (name === 'style') checkCss(node.textContent || '')
    }
    for (let child = node.firstChild; child; child = child.nextSibling) pending.push(child)
  }
  return doc
}
