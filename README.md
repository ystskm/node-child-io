#:: child-io ::

##Abstract
#### Create child process for safe execution of dangerous(e.g. user-made) function.

##Documents
#### Preparing

##Install##

To install the most recent release from npm, run:

	npm install child-io

##Usage##

> general  
	
	var io = require('child-io').IO([argv]);
	io.exec(func | file, [options]);
  
- `argv` (Array)  
  process arguments used when child_process is .fork()ed.  
  
- `func` (Function|String) | `file` (String)  
  executing original function.  
  eval() or require() should be success to extract item.
  
- `options` (Object)
  * limit  : (Default = 300)  
    max time to finish executing (millisecond).  
    When exceeded the time, "timeout" event is emitted with Error 'Execution time is over'.  
  * replace: (Default = {})
    String replacement for using variable in executing function.
  * args   : (Default = [])  
    given arguments when the function is executed.  
    the data send function "sender" will be put to.  
  
- Event
  * data
  * end
  * timeout
  * error
  
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
	
> see [child-io\_test.js](https://github.com/ystskm/node-child-io/blob/master/sample/child-io_test.js) for more deep use.

##Note##

Use FakeChild class when v8debug is tied up.

##Change Log##

+ 2013/4/16
  - 0.2.0 release
  - add option key 'args'
  - add "timeout" event
  - add wrap function for asynchronous use
  - add more explanation for each arguments,
  - add list of Event

+ 2013/4/15
  - 0.1.3 release
  - npm release
