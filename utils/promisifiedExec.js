const { promisify } = require('node:util');
const { exec: exec_ } = require('node:child_process');

const exec = promisify(exec_);

module.exports = exec;
