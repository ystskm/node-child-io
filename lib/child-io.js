var cp = require('child_process');
var inherits = require('util').inherits, Emitter = require('events').EventEmitter;

var Default = {
  limit: 300,
  replace: {},
  escape: true,
  args: []
};

function defaultEscaper(s) {
  return s.replace(/['"]/g, '\\"').replace(/[\r\n]/g, '\\n');
}

exports.IO = IO;

function IO(args) {
  if(!(this instanceof IO))
    return new IO();
  Emitter.call(this);
  // if in debug mode, execute as single process.
  args = Array.isArray(args) ? args: [];
  this.cp = typeof v8debug == 'undefined' ? cp.fork(__dirname + '/child', args)
    : require(__dirname + '/fake-child')(args);
}
inherits(IO, Emitter);

IO.prototype.exec = function(action, options) {

  if(typeof action == 'function')
    action = action.toString();
  if(options == null || typeof options != 'object')
    options = {};

  for( var i in Default)
    if(options[i] == null)
      options[i] = Default[i];

  var escape = options.escape
  if(escape && typeof escape != 'function')
    escape = defaultEscaper;

  for( var i in options.replace) {
    action = action.replace(new RegExp(i, 'g'), escape
      ? escape(options.replace[i]): options.replace[i]);
  }

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

  process.nextTick(execute);

  function execute() {
    t = setTimeout(function() {
      emitted = true, cp.kill(), self.emit('timeout', new Error(
        'Execution time is over: ' + limit + ' ms'));
    }, limit);
    cp.send({
      action: action,
      args: Array.isArray(options.args) ? options.args: []
    })
  }
};
