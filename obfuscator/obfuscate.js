const crypto = require('crypto');

function obfuscateScript(script) {
    const encoded = Buffer.from(script).toString('base64');
    const randomKey = crypto.randomBytes(4).toString('hex');
    return `-- Obfuscated Script --
local key = "${randomKey}"
local obfuscated = "${encoded}"
loadstring(obfuscated)()`;
}

module.exports = obfuscateScript;
