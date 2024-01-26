/** [child-io] child-io.js
 * 本パッケージで export されるクラス（オブジェクト）IO の定義ファイル
 */
const NULL = null, TRUE = true, FALSE = false, UNDEF = undefined;
const fs = require('fs'), cp = require('child_process');
const inherits = require('util').inherits, Emitter = require('events').EventEmitter;
const CommunicateType = {
  intra: 'INTERNAL'
};
const Default = {
  pwd: process.env.PWD,
  timeout: 5_000, // default execution limit = 5 sec
  replace: { },
  escape: TRUE,
  args: [ ],
  escape: defaultEscape
};
inherits(IO, Emitter);
Object.assign(IO.prototype, { exec });
module.exports = {
  IO
};
// <-- END_OF_MAIN <--

/**
 * @class IO
 */
function IO(args, options) {

  const io = this;
  if(!(io instanceof IO)) {
    return new IO(args, options);
  }
  Emitter.call(io);
  const io_opts = io.options = Object.assign({ silent: FALSE }, options);
  const io_defs = io.defaults = Object.assign({ }, Default);
  if(io_opts.timeout || io_opts.limit) {
    io_defs.timeout = io_opts.timeout || io_opts.limit;
  }
  io.x_count = 0;
  let wd;
  if(is('string', io_opts.wkdir) && io_opts.modules) {
    // (1) フォルダを作る => (2) package.json を作る => exec => (3) npm i を実行する => action
    // npm i コマンドが長すぎる場合は、子プロセスは終了する。
    // 独自モジュールの必要性がなければ、作らない。
    // TODO fake の場合も　npm i を実行する。
    try {
      wd = process.cwd();
      // clean-up working directory path
      const subary = (io_opts.wkdir).split('/').filter(c=>!!c && ![ '.', '..' ].includes(c));
      // making directory recursively
      subary.forEach(sub=>{
        try {
          wd += `/${sub}`; 
          // fs.mkdirSync(wd += `/${sub}`);
        } catch(e) { 
          // IGNORE (e.g.EEXIST: file already exists)
        }
      });
      io.relPath = `./${wd.slice(Default.pwd.length + 1)}`; // not: process.cwd();
      const dependencies = { };
      if(isArray(io_opts.modules)) {
        io_opts.modules.forEach(n => {
          const p = n.split('@');
          dependencies[ p[0] ] = p[1] || "*";
        });
      } else {
        dependencies = Object.assign(dependencies, io_opts.modules);
      }
      fs.writeFileSync(io_opts.pkgPath = `${wd}/package.json`, JSON.stringify({
        
        name: subary.pop(), version: "1.0.0",
        updated: new Date().toISOString(),
        dependencies
        
      }, NULL, '  '));
    } catch(e) {
      wd = NULL;
      outLog(`Prepare commands won't work properly to make directory: ${io_opts.wkdir}`, e);
    }
  }
  // If in debug mode, execute as single process.
  const cwd = io.cwd = wd || process.cwd();
  const env = Object.assign({ }, process.env, { 
    NODE_PATH: `${io.cwd}/node_modules`, PWD: Default.pwd
  });
  const forkOpts = io.forkOpts = {
    cwd,
    env,
    silent: io_opts.silent
  };
  const forkArgs = io.forkArgs = args = isArray(args) ? args: [ ];
  const in_v8dbg = typeof v8debug != 'undefined';
  if(in_v8dbg) { 
    outLog(`[PID=${process.pid}] Currently, typeof v8debug is NOT undefined.`);
  }
  // OLD: io.cp / NEW: io.fp v0.1.3~
  io.cp = io.fp = !in_v8dbg ? cp.fork(require('path').resolve(__dirname, './child'), forkArgs, forkOpts)
    : require(`${__dirname}/fake-child`)(forkArgs, forkOpts);
  // fp.unref();

}

/**
 * @prototype IO.prototype.exec
 */
function exec(action, options) {

  const io = this, fp = io.fp;
  const io_opts = io.options, io_defs = io.defaults;
  const x_opts = options == NULL || !is('object', options) ? { }: options;
  const ending = ()=>{ 
    if(!fp.connected) {
      // 既に切断済み
      return;
    }
    if((isFunction(x_opts.reuse) ? x_opts.reuse.call(io): x_opts) === TRUE) {
      // 継続利用
      return;
    }
    
    fp.kill();
  };
  if(isFunction(action)) {
    action = action.toString();
  }
  
  let i;
  for(i in io_defs) {
    if(x_opts[i] == NULL) x_opts[i] = io_defs[i];
  }
  // (2024.1.26 sakamoto) upversion compatibility
  if(x_opts.limit != NULL) {
    x_opts.timeout = x_opts.limit;
  }

  let escape = x_opts.escape
  if(escape && !isFunction(escape)) { // when escape sets "true"
    escape = Default.escape;
  }

  const replace = x_opts.replace || x_opts.replacs || { }; // support both "replace" and "replaces"
  for(i in replace) {
    action = action.replace(new RegExp(i, 'g'), escape ? escape(replace[ i ]): replace[ i ]);
  }

  let t = NULL, emitted = FALSE, n = Date.now();
  fp.on('error', e=>{
    io.emit('error', e);
  }).on('message', (m = { })=>{
    const { type, args = [ ], message } = m;
    switch(type) {

      case 'error':
        emitted = TRUE;
        io.emit('error', new Error(is('string', m) ? m: args || message || 'unknown'));
        ending();
        return;
      case CommunicateType.intra:
        outLog(`(internal)`, isFunction(args.toString) ? args.toString(): args);
        return;
      default:
        io.emit(...[ 'data' ].concat(m.args));
        return;

    }
  }).on('exit', ()=>{

    if(t != NULL) {
      clearTimeout(t);
    }
    if(emitted === TRUE) {
      return;
    }
    io.emit('end', Date.now() - n);

  });
  return Promise.resolve().then(()=>{

    io.x_count++;
    const timeout = x_opts.timeout; // 子プロセスの存続時間
    // outLog(`Execute count[${io.x_count}] with timeout:${timeout} ...`);
    t = setTimeout(()=>{
      emitted = TRUE;
      // (2024.01.26 sakamoto) event "timeout" is NOT a popular event name so logging for being recognized the outbreak of timeout.
      // "timeout" イベントはポピュラーに意識させるイベントではないので、見落とされることがあります。この場合、kill イベントにより発生した exit が通知されず
      // コマンドがハングしたように見えることがありました。そのため、timeout イベントでは続いて error イベント も出力することとします。
      // これにより利用者は error イベントと end イベントの 2 つの実装のみで着実な運用をすることができるようになります。
      // outLog(`Execution time ${limit} ms exceeded. A timeout event will fire ...`);
      const e = new Error(`Execution time is over: ${timeout} ms`);
      io.emit('timeout', e);
      io.emit('error', e);
      ending();
    }, timeout);
    const package = Object.assign({ }, io_opts.package);
    if(io_opts.pkgPath) {
      // (3) 作成した package.json を、npm install する（実行時間に含める）
      // => cp 内で行うと、何故か処理が進まなくなる。どうして ... ?（v6.11.0 でも v18.17.0 でも同じ）
      // => node 実行中が原因 ... ?
      // => npm test で実行中は npm の exec (spawn) がブロックされているという見立てが正しい！
      // npm i を走らせるとどうも調子が悪い ...
      // Error [ERR_IPC_CHANNEL_CLOSED]: Channel close
      fp.send({ action: `exec:npm i`, type: CommunicateType.intra });
    }
    const args = isArray(x_opts.args) ? x_opts.args: [ ];
    fp.send({ package, action, args });

  })['catch'](e=>{
    if(emitted === TRUE) {
      return;
    }
    io.emit('error', e);
    ending();
  });
  

}

/**
 * @static @utility
 */
function defaultEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

// ---
function outLog() {
  console.log(...[`${new Date().toISOString()} - [child-io:main=child-io.js]`].concat(casting(arguments)))
}

// ---
function casting(x) {
  return Array.from(x);
}
function is(ty, x) {
  return ty == typeof x;
}
function isFunction(x) {
  return is('function', x); // a little bit dangerous
}
function isArray(x) {
  return Array.isArray(x);
}
