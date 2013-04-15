: child-io :
=

##Abstract
#### Create child process for executing dangerous(user-made) function.

##Documents
#### Preparing

##Install##

To install the most recent release from npm, run:

	npm install child-io

##Usage##

> general  
	
	var IO = require('child-io').IO();
	IO.exec(func | file, [options]);
  
	Default of options = {
	  limit: 300 (ms)
	}

> ex.1  

	var IO = require('child-io').IO();
	IO.on('data', function(ret){
	  console.log('Result: ' + ret); // "Result: true"
	}).on('end', function(msec){
	  console.log('Killed child_process. Execute time is: ' + msec + ' ms');
	}).exec('function(){ return true; }');

  

##Change Log##

* 2013/4/15
	+ 0.1.0 release  
	+ npm release  
