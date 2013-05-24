/***/
var domain = require('domain'); // TODO
var inherits = require('util').inherits, Emitter = require('events').EventEmitter;

module.exports = FakeChild;
function FakeChild(){
  if(!(this instanceof FakeChild))
    return new FakeChild();
  Emitter.call(this);
  this.parent = process, this.ny = true;
}
inherits(FakeChild, Emitter);

var FakeChildProtos = {
  send: send,
  exit: exit
};
for(var i in FakeChildProtos)
  FakeChild.prototype[i] = FakeChildProtos[i];

function send(m){
  onMessage.call(this, m);
}

function exit() {
  this.emit('exit');
}

function onMessage(m) {
  var cp = this;
  if(cp.ny === false)
    return onMessageError();
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
        sender(e.message, false, 'error');
      }
    };
  }
  function sender(args, alive, type) {
    cp.emit('message', {
      type: type,
      args: args
    });
    if(alive !== true)
      cp.exit();
  }
  function onMessageError() {
    cp.emit('message', {
      type: 'error',
      args: 'Duplicated execute is not allowed.'
    });
  }
}

