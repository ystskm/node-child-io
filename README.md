# child-io
  
[![Rank](https://nodei.co/npm/child-io.png?downloads=true&amp;downloadRank=true&amp;stars=true)](https://nodei.co/npm/child-io/)  
[![Version](https://badge.fury.io/js/child-io.png)](https://npmjs.org/package/child-io)
[![Build status](https://travis-ci.org/ystskm/node-child-io.png)](https://travis-ci.org/ystskm/node-child-io)  
  
#### Create child process for safe execution of dangerous(e.g. user-made) function.

## Install
To install the most recent release from [npm](http://npmjs.org/), run:

```sh
	npm i child-io
```

## Usage
	
```js
	const io = require('child-io').IO([forkArgs, [options]]);
	io.exec(func | file, [execOpts]);
```
  
- `forkArgs` &lt;Array>  
  process arguments used when child_process is `.fork()` ed.  
  

  
- `options` &lt;Object>
  * wkdir: [&lt;String>]  
  * modules: [&lt;Array>]
  
- `func` &lt;Function>|&lt;String> | `file` &lt;String>  
  executing original function.  
  eval() or require() should be success to extract item.
  
- `execOpts` &lt;Object>
  * timeout: [&lt;Number>] (alias: limit, Default = 5_000ms)
    max time to finish executing (millisecond).  
  * reuse  : [&lt;Function>|&lt;Any>]  
    Judge whether kill or not after execute the process.
  * replace: [&lt;Object>] (Default = { })
    String replacement for using variable in executing function.
  * escape : [&lt;Function>|<Any>] (Default = true)
    Escape the replaced string not to fail eval().
    when truely value is given, the function below is used.
    
    function defaultEscaper(s) {
      return s.replace(/['"]/g, '\\"').replace(/[\r\n]/g, '\\n');
    }
    
  * args   : [&lt;Array>] (Default = [ ])  
    given arguments when the function is executed.  
    the data send function "sender" will be put to.  
  
- Event
  * data
  * end
  * timeout
  * error
  
#### simple return

```js
	const io = require('child-io').IO();
	io.on('data', function(ret){
	  console.log('Result: ' + ret); // "Result: true"
	}).on('end', function(msec){
	  console.log('Killed child_process(sync). Execute time is: ' + msec + ' ms');
	}).exec(function(){ return true; });
```

#### use asynchronous callback 
  
```js
	const io = require('child-io').IO();
	io.on('data', function(ret){
	  console.log('Result: ' + ret); // "Result: false"
	}).on('end', function(msec){
	  console.log('Killed child_process(async). Execute time is: ' + msec + ' ms');
	}).exec(function(sender){ process.nextTick(function(){ sender(false) }); });
```
	
see [child-io\_test.js](https://github.com/ystskm/node-child-io/blob/master/sample/child-io_test.js) for more deep use.

## Note
 __FakeChild__ class is used automatically when v8debug is tied up.
 In that case, message _Currently, typeof v8debug is NOT undefined._ is shown. 

## Change Log

+ 2024/1/26
  - 0.4.1 release
  - emit "error" event on timeout
  - new option: reuse

+ 2014/6/26
  - 0.3.3 release
  - option "escape" is included and the default is `true`

+ 2013/5/24
  - 0.3.1 release
  - add FakeChild class for --debug environment

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
