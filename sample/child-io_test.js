/**
 * [node-child-io] child-io_test.js
 * 動作を理解するためのサンプル。
 */
const IO = require('../index').IO;
let io = null;

// (1) simple case
io = new IO();
io.on('error', e=>{
  console.log('(1) Error Occurs.', e);
}).on('data', d=>{
  console.log('(1) Data: ' + JSON.stringify(d)); // <- Go here
}).on('end', ms=>{
  console.log('(1) End of IO1. ' + ms + 'ms'); // <- Go here for last
}).exec(()=>{ return { hoge: 'fuga' }; });

// (2) asynchronous and keep aliving
io = new IO();
io.on('error', e=>{
  console.log('(2) Error Occurs.', e);
}).on('data', d=>{
  console.log('(2) Data: ' + d); // <- Go here (2 times)
}).on('end', ms=>{
  console.log('(2) End of IO2. ' + ms + 'ms'); // <- Go here for last
}).exec(sender=>{ process.nextTick(()=>{ sender('one', true), sender('two'); }) });

// (3) timeout error
io = new IO({ timeout: 300 });
io.on('error', e=>{
  console.log('(3) Error Occurs.', e); // <- Go here for last.
}).on('timeout', e=>{
  console.error(e); // <- Go here once
}).on('data', d=>{
  console.log('(3) Data: ' + d);
}).on('end', ms=>{
  console.log('(3) End of IO3. ' + ms + 'ms');
}).exec(sender=>{ setTimeout(()=>{ sender(true); }, 500) });

// (4) function wrapped for asynchronous error
setTimeout(()=>{
  
  io = new IO();
  io.on('error', e=>{
    console.log('(4) Error Occurs.', e); // <- Go here for last.
  }).on('timeout', e=>{
    console.error(e);
  }).on('data', d=>{
    console.log('(4) Data: ' + d);
  }).on('end', ms=>{
    console.log('(4) End of IO4. ' + ms + 'ms');
  }).exec(sender=>{ var wrap = sender.wrap;
    process.nextTick(wrap(()=>hoge));
  });
  
}, 1000);
