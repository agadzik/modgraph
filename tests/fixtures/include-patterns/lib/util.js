const { format } = require('./formatter');

function util() {
  console.log('Util function');
  format();
}

module.exports = { util };