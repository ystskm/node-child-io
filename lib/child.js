/***/

process.on('message', onMessage), process.ny = true, process.send({
  type: 'ready'
});

function onMessage(m) {
  if(process.ny === false)
    return onMessageError();
  process.ny = false, sender.wrap = wrap;
  wrap(function() {
    var fn = null, cached = null;
    try {
      fn = eval('(' + m.action + ')');
    } catch(e) {
      cached = e;
    }
    if(typeof fn != 'function')
      fn = require(m.action);
    if(typeof fn != 'function' && cached)
      throw cached;
    var rt = fn.apply(process, m.args.concat(sender));
    if(typeof rt != 'undefined')
      sender(rt);
  })();
  function wrap(fn) {
    return function() {
      try {
        fn();
      } catch(e) {
        sender(e.message, false, 'error');
      }
    };
  }
  function sender(args, alive, type) {
    process.send({
      type: type,
      args: args
    });
    if(alive !== true)
      process.exit();
  }
}

function onMessageError() {
  process.send({
    type: 'error',
    args: 'Duplicated execute is not allowed.'
  });
}
