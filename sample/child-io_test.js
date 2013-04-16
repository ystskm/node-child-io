var IO = require('../index').IO, io = null;

// simple case
io = new IO();
io.on('error', function(e){
  console.log('Error Occurs.');
  throw e;
}).on('data', function(d){
  console.log('Data: ' + JSON.stringify(d)); // <- Go here
}).on('end', function(ms){
  console.log('End of IO1. ' + ms + 'ms');
}).exec(function(){ return { hoge: 'fuga' }; });

// asynchronous and keep aliving
io = new IO();
io.on('error', function(e){
  console.log('Error Occurs.');
  throw e;
}).on('data', function(d){
  console.log('Data: ' + d); // <- Go here (2 times)
}).on('end', function(ms){
  console.log('End of IO2. ' + ms + 'ms');
}).exec(function(sender){ process.nextTick(function(){ sender('one', true), sender('two'); }); });

// timeout error
io = new IO();
io.on('error', function(e){
  console.log('Error Occurs.');
  throw e;
}).on('timeout', function(e){
  console.error(e); // <- Go here
}).on('data', function(d){
  console.log('Data: ' + d);
}).on('end', function(ms){
  console.log('End of IO3. ' + ms + 'ms');
}).exec(function(sender){ setTimeout(function(){ sender(true); }, 500); });

// function wrapped for asynchronous error
setTimeout(function(){
  
  io = new IO();
  io.on('error', function(e){
    console.log('Error Occurs.');
    throw e; // <- Go here
  }).on('timeout', function(e){
    console.error(e);
  }).on('data', function(d){
    console.log('Data: ' + d);
  }).on('end', function(ms){
    console.log('End of IO4. ' + ms + 'ms');
  }).exec(function(sender){ var wrap = sender.wrap;
    process.nextTick(wrap(function(){ hoge; }));
  });
  
}, 1000);
