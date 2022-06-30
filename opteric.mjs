/**
 * @typedef {object} FlagsAndOptions
 * @prop {string[]} flags The parsed flags.
 * @prop {Record<string, string>} options The parsed options.
 * @prop {string} content The content of the text without the flags and options.
 */

/**
 * Parses flags and options from text.
 *
 * @param {string} text The text to parse.
 * @returns {FlagsAndOptions} The parsed flags and options.
 */
function parse(text) {
  if (typeof text !== 'string')
    throw new TypeError("Argument 'text' must be of type string.");

  const flags = [],
    options = {},
    len = text.length + 1;
  let content;

  for (
    let i = 0,
      parsing = '',
      isParsing = false,
      optContent = '',
      isParsingContent = false;
    i < len;
    i++
  ) {
    const char = text[i],
      charPrev = text[i - 1],
      charNext = text[i + 1];

    if (isParsing) {
      if (char === ' ' || char === undefined) {
        isParsing = false;

        if (charNext !== ' ' && charNext !== '-' && charNext !== undefined) {
          isParsingContent = true;

          continue;
        }

        flags.push(parsing);

        parsing = '';

        if (content[0] === '-') content = '';
      } else parsing += char;
    } else if (isParsingContent) {
      if ((char === ' ' && charNext === '-') || char === undefined) {
        isParsingContent = false;
        options[parsing] = optContent;
        parsing = '';
        optContent = '';
      } else optContent += char;
    } else if ((charPrev === ' ' || charPrev === undefined) && char === '-') {
      const truncateLen = i - 1;

      i++;
      isParsing = true;

      if (charNext === '-') i++;

      if (content === undefined)
        content = charPrev === undefined ? text : text.slice(0, truncateLen);

      parsing += text[i];
    }
  }

  if (content === undefined) content = text;

  return { flags, options, content };
}

export default parse;
