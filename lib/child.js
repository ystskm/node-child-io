/***/

process.on('message', onMessage);
process.ny = true;

function onMessage(m) {

  var cp = process;
  if(cp.ny === false)
    return onDupError();

  cp.ny = false, sender.wrap = wrap;
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
        sender(e);
      }
    };
  }
  function onDupError() {
    sender(new Error('Duplicated execute is not allowed.'));
  }

  function sender(args, alive, type) {
    if(args instanceof Error)
      args = args.message, alive = false, type = 'error';
    cp.send({
      type: type,
      args: args
    });
    if(alive !== true)
      cp.exit();
  }

}
