// This is to lazy-load node-fetch as it's now an ESM-only module.

/** @type {import('node-fetch').default} */
let fetch_;

/** @type {import('node-fetch').default} */
module.exports = async function fetch() {
  fetch_ ??= (await import('node-fetch')).default;

  return fetch_.apply(null, arguments);
};
