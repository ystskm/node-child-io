var cp = require('child_process');
var inherits = require('util').inherits, Emitter = require('events').EventEmitter;

var Default = {
  limit: 300,
  args: []
};

exports.IO = IO;

function IO(args) {
  if(!(this instanceof IO))
    return new IO();
  Emitter.call(this);
  this.cp = cp.fork(__dirname + '/child', (Array.isArray(args) ? args: [])
      .concat(typeof v8debug == 'undefined' ? []: ['--debug']));
}
inherits(IO, Emitter);

IO.prototype.exec = function(action, options) {

  if(typeof action == 'function')
    action = action.toString();
  if(options == null || typeof options != 'object')
    options = {};
  
  for(var i in Default)
    if(options[i] == null)
      options[i] = Default[i];
  
  var self = this, cp = this.cp, limit = options.limit;
  var t = null, emitted = false, n = Date.now();

  cp.on('error', function(err) {
    self.emit('error', err);
  }).on('message', function(d) {
    if(d.type == 'error')
      return emitted = true, self.emit('error', new Error(d.args)), cp.kill();
    self.emit.apply(self, ['data'].concat(d.args));
  }).on('exit', function() {
    if(t != null)
      clearTimeout(t);
    if(emitted === true)
      return;
    self.emit('end', Date.now() - n);
  });

  process.nextTick(function() {
    t = setTimeout(function() {
      emitted = true, cp.kill(), self.emit('timeout', new Error(
        'Execution time is over: ' + limit + ' ms'));
    }, limit);
    cp.send({
      action: action,
      args: Array.isArray(options.args) ? options.args: []
    });
  });

};
