var IO = require('../index').IO, io = null;

io = new IO();
io.on('error', function(e){
  console.log('Error Occurs.');
  throw e;
}).on('data', function(d){
  console.log('Data: ' + d);
}).on('end', function(ms){
  console.log('End of IO1. ' + ms + 'ms');
}).exec(function(){ return true; });

io = new IO();
io.on('error', function(e){
  console.log('Error Occurs.');
  throw e;
}).on('data', function(d){
  console.log('Data: ' + d);
}).on('end', function(ms){
  console.log('End of IO2. ' + ms + 'ms');
}).exec(function(sender){ process.nextTick(function(){ sender(false) }); });


