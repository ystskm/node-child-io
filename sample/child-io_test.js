var IO = require('../index').IO();

IO.on('error', function(e){
  console.log('Error Occurs.');
  throw e;
}).on('data', function(d){
  console.log('Data: ' + d);
}).on('end', function(){
  console.log('End of IO.');
}).exec(function(){ return true; });



