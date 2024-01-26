/** [child-io] child.js
 * 実行時にフォークされるサブプロセスのスクリプト
 */
const NULL = null, TRUE = true, FALSE = false, UNDEF = undefined;
onmessage.pipe = onmessage.pipe || Promise.resolve();
process.on('message', onmessage);
process.stdout.on('data', onOut);
process.stderr.on('data', onErr);
// <-- END_OF_MAIN <--

/**
 * @static onMessage:<function>
 */
function onmessage(m) {
  const sp = process;
  const { action, args, type } = m;
  // outLog('onmessage at forked process ...');
  // console.log('[child.js] receiving a message!', m); // slient: true にしない限り出力される。
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
function onOut(buf) {
  sender(buf.toString(), TRUE, 'stdout');
}
function onErr(buf) {
  sender(buf.toString(), TRUE, 'stderr');
}
function sender(args, alive, type = 'data') {
  const sp = process;
  if(args instanceof Error) {
    args = args.message;
    alive = FALSE;
    type = 'error';
  }
  if(!sp.connected) {
    return;
  }
  sp.send({ type, args });
  // alive === TRUE をセットして sender を呼び出した場合、処理を継続する。
  //（最長、タイムアウトまで）
  if(alive === TRUE) {
    return;
  }
  sp.exit();
}

// ---
function outLog() {
  console.log(...[`${new Date().toISOString()} - [child-io:child.js]`].concat(casting(arguments)))
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
