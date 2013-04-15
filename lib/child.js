var cp = require('child_process');

process.on('message', onMessage);
process.ny = true;

function onMessage(m) {
  if(process.ny === false)
    return onMessageError();
  process.ny = false;
  try {
    var fn = null;
    try {
      fn = eval('(' + m.action + ')');
    } catch(e) {}
    if(typeof fn != 'function')
      fn = require(m.action);
    process.send({
      args: fn()
    });
    process.exit();
  } catch(e) {
    process.send({
      type: 'error',
      args: e.message
    });
  }
}

function onMessageError() {
  process.send({
    type: 'error',
    args: 'Duplicated execute is not allowed.'
  });
}
