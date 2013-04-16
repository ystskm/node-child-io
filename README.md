:: child-io ::
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
  simple return

	var io = require('child-io').IO();
	io.on('data', function(ret){
	  console.log('Result: ' + ret); // "Result: true"
	}).on('end', function(msec){
	  console.log('Killed child_process(sync). Execute time is: ' + msec + ' ms');
	}).exec(function(){ return true; });

> ex.2  
  use asynchronous callback 
  
	var io = require('child-io').IO();
	io.on('data', function(ret){
	  console.log('Result: ' + ret); // "Result: false"
	}).on('end', function(msec){
	  console.log('Killed child_process(async). Execute time is: ' + msec + ' ms');
	}).exec(function(sender){ process.nextTick(function(){ sender(false) }); });
	

##Change Log##

* 2013/4/15
	+ 0.1.3 release  
	+ npm release  
