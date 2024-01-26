/** [child-io] fake-child.js
 * デバッグ実行時にフォークされるプロセスのスクリプト
 */
const NULL = null, TRUE = true, FALSE = false, UNDEF = undefined;
onmessage.pipe = onmessage.pipe || Promise.resolve();
const inherits = require('util').inherits, Emitter = require('events').EventEmitter;
inherits(FakeChild, Emitter);
Object.assign(FakeChild.prototype, { send, exit, kill, sender });
module.exports = FakeChild;
// <-- END_OF_MAIN <--

/**
 * @class FakeChild
 */
function FakeChild(forkArgs, forkOpts) {
  const sp = this;
  if(!(sp instanceof FakeChild)) {
    return new FakeChild(forkArgs, forkOpts);
  }
  Emitter.call(sp);
  sp.parent = process;
  if(forkOpts.cwd) sp.cwd = forkOpts.cwd
  if(forkOpts.env) process.env.NODE_PATH = forkOpts.env.NODE_PATH;
  sp.connected = TRUE;
}

/**
 * @prototype FakeChild.prototype.send
 */
function send(m){
  const sp = this;
  onmessage.call(sp, m);
}

/**
 * @prototype FakeChild.prototype.exit
 */
function exit() {
  const sp = this;
  sp.emit('exit', 0);
  sp.connected = FALSE;
}

/**
 * @prototype FakeChild.prototype.kill
 */
function kill(sig) {
  const sp = this;
  // outLog(`TODO: function kill is not implemented yet. sig=${sig}`);
  sp.emit('exit', 9); // SIGKILL
  sp.connected = FALSE;
}

function onmessage(m) {
  const sp = this;
  const sender = sp.sender.bind(sp);
  outLog('onmessage at fake-child ...');
  // console.log('NODE-PATH?', process.env.NODE_PATH);
  const { action, args, type } = m;
  // console.log('[fake-child.js] receiving a message!', m); // 常に出力される。
  sender.wrap = wrap;
  let rt;
  onmessage.pipe = Promise.resolve(onmessage.pipe).then(()=>{

    let cmd;
    switch(TRUE) {

      case action.indexOf('require:') == 0:
        cmd = action.replace(/^require:/, '');
        // outLog('require: ' + cmd, 'at: ' + process.cwd());
        sender(Object.keys(require('googleapis')), TRUE, type);
        // outLog('FIN require');
        return;

      case action.indexOf('exec:') == 0:
        cmd = action.replace(/^exec:/, '');
        // outLog('exec: ' + cmd, 'at: ' + process.cwd());
        sender(require('child_process').execSync(cmd, args || { }).toString(), TRUE, type);
        // outLog('FIN exec');
        return;

    }
    rt = eval(`(${action})`); // => 関数もしくは結果
    if(isFunction(rt)) {
      // outLog('aciton exec: ' + action);
      rt = rt.apply(sp, args.concat(sender));
      // outLog('FIN action');
    }
    if(rt === UNDEF) {
      return;
    }
    return Promise.resolve(rt).then(sender); 
    // => string を返した場合は、単純にそれを返して終了する。
    // 処理を継続したい場合は send する action には引数を渡さない。
    
  })['catch'](e=>{
    outLog('onmessage:', e);
    sender(new Error(`Sender error: ${e ? e.message || e: 'unkndown'} ... ${rt && rt.constructor && rt.constructor.name || rt}`));
  })['catch'](e=>{
    outLog('onmessage.pipe:', e);
    // !! SHOULD ALWAYS RESOLVED !!
  });
  function wrap(fnc) {
    return ()=>{
      try { return fnc(); } catch(e) { sender(e); }
    };
  }
}
function onOut( ) {
  /* UNUSED */
}
function onErr( ) {
  /* UNUSED */
}
function sender(args, alive, type) {
  const sp = this;
  if(args instanceof Error) {
    args = args.message;
    alive = FALSE;
    type = 'error';
  }
  if(!sp.connected) {
    return;
  }
  sp.emit('message', { type, args });
  // alive === TRUE をセットして sender を呼び出した場合、処理を継続する。
  //（最長、タイムアウトまで）
  if(alive === TRUE) {
    return;
  }
  sp.exit();
}

// ---
function outLog() {
  console.log(...[`${new Date().toISOString()} - [child-io:fake-child.js]`].concat(casting(arguments)))
}

// ---
function casting(x) {
  return Array.from(x);
}
function is(ty, x) {
  return typeof x == ty;
}
function isFunction(x) {
  return is('function', x);
}
function isArray(x) {
  return Array.isArray(x)
}
