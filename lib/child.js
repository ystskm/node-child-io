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
    var rt = fn.apply(process, m.args.concat(sender));
    if(typeof rt != 'undefined')
      sender(rt);
  } catch(e) {
    process.send({
      type: 'error',
      args: e.message
    });
  }
  function sender(args) {
    process.send({
      args: args
    });
    process.exit();
  }
}

function onMessageError() {
  process.send({
    type: 'error',
    args: 'Duplicated execute is not allowed.'
  });
}
