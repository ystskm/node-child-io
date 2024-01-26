/**
 * Basic test for CHILD-IO
 * サンプルに基づいた実行を行う
 */
const NULL = null, TRUE = true, FALSE = false, UNDEF = undefined;
const ci = require('foonyah-ci');
let IO = require('../index').IO, io = NULL;
module.exports = ci.testCase({
  'I01': t=>{

    // Simple case
    t.expect(4);
    const datas = [ { hoge: 'fuga' } ];
    let evs = 1;
    io = new IO();
    io.on('error', e=>{
      evs--;
      t.fail(e);
    }).on('data', d=>{
      evs--;
      const nx_d = datas.shift();
      t.ok(nx_d != NULL, 'Data expected');
      t.equals(JSON.stringify(d), JSON.stringify(nx_d), 'Data'); // <- Go here
    }).on('end', ms=>{
      t.equals(datas.length, 0, 'Empty data candidate');
      t.equals(evs, 0, 'Correct event count');
      t.done(`End of IO1. ${ms}ms`);
    }).exec(function() { return { hoge: 'fuga' }; });

  },
  'I01-a': t=>{

    t.expect(4);
    // Simple case (Arrow Function)
    const datas = [ { hoge: 'fuga' } ];
    let evs = 1;
    io = new IO();
    io.on('error', e=>{
      evs--;
      t.fail(e);
    }).on('data', d=>{
      evs--;
      const nx_d = datas.shift();
      t.ok(nx_d != NULL, 'Data expected');
      t.equals(JSON.stringify(d), JSON.stringify(nx_d), 'Data'); // <- Go here
    }).on('end', ms=>{
      
      t.equals(datas.length, 0, 'Empty data candidate');
      t.equals(evs, 0, 'Correct event count');
      t.done(`End of IO1-a. ${ms}ms`);
      
    }).exec(()=>{ return { hoge: 'fuga' }; });

  },
  'I02': t=>{
 
    t.expect(6);
    // Asynchronous and keep aliving
    const datas = [ 'one', 'two' ];
    let evs = 2;
    io = new IO();
    io.on('error', e=>{
      evs--;
      t.fail(e);
    }).on('data', d=>{
      evs--;
      const nx_d = datas.shift();
      t.ok(nx_d != NULL, 'Data expected');
      t.equals(JSON.stringify(d), JSON.stringify(nx_d), 'Data');
    }).on('end', ms=>{
      
      t.equals(datas.length, 0, 'Empty data candidate');
      t.equals(evs, 0, 'Correct event count');
      t.done(`End of IO2. ${ms}ms`);
      
    }).exec(function(sender) { process.nextTick(function() { sender('one', true), sender('two'); }); });

  },
  'I03': t=>{

    t.expect(4);
    // Timeout error
    const datas = [ ];
    let evs = 2;
    io = new IO([ ], {
      timeout: 300
    });
    io.on('error', e=>{

      // console.log('error', e);
      evs--;
      t.ok(TRUE, 'Error Occurs: ' + e);
      t.equals(datas.length, 0, 'Empty data candidate');
      t.equals(evs, 0, 'Correct event count');
      t.done(`End of IO3.`);
      
    }).on('timeout', e=>{

      // console.log('timeout');
      evs--;
      t.ok(TRUE, 'Timeout Occurs: ' + e);

    }).on('data', d=>{
      console.log('I03.data:', d);
      evs--;
      t.ok(FALSE, 'Data emitted unexpectedly'); // <- Go here for last at error.
    }).on('end', ms=>{
      t.fail('End emitted unexpectedly');
    }).exec(sender=>{
      setTimeout(()=>sender(TRUE), 500);
    });

  },
  'I04': t=>{
    // Function wrapped for asynchronous error
    setTimeout(()=>{
      
      t.expect(3);
      // Wrapped error
      const datas = [ ];
      let evs = 1;
      io = new IO();
      io.on('error', e=>{
        
        // console.log('error', e);
        evs--;
        t.ok(TRUE, e); // <- Go here for last at error.
        t.equals(datas.length, 0, 'Empty data candidate');
        t.equals(evs, 0, 'Correct event count');
        t.done(`End of IO4.`);
        
      }).on('timeout', e=>{
        // console.log('timeout');
        evs--;
        t.fail('Timeout occurs unexpectedly.' + e);
      }).on('data', d=>{
        console.log('I04.data:', d);
        evs--;
        t.ok(FALSE, 'Data emitted unexpectedly'); // <- Go here for last at error.
      }).on('end', ms=>{
        t.fail('End emitted unexpectedly');
      }).exec(sender=>{
        process.nextTick(sender.wrap(()=>hoge));
      });
      
    }, 1000);
  },
  'PKG01': t=>{

    // Simple case
    t.expect(4);
    const datas = [ `google.auth=true, OAuth2=true` ];
    let evs = 1;
    io = new IO([ ], {
      wkdir: 'test/synquery/TK6lBkEf', // 実行されるルートベースで考える。
      modules: [ 'googleapis' ]
    });
    io.on('error', e=>{
      evs--;
      t.fail(e);
    }).on('timeout', e=>{
      // console.log('timeout');
      evs--;
      t.fail('Timeout occurs unexpectedly.' + e);
    }).on('data', d=>{
      console.log('data:', d);
      evs--;
      const nx_d = datas.shift();
      t.ok(nx_d != NULL, 'Data expected');
      t.equals(JSON.stringify(d), JSON.stringify(nx_d), 'Data'); // <- Go here
    }).on('end', ms=>{

      t.equals(datas.length, 0, 'Empty data candidate');
      t.equals(evs, 0, 'Correct event count');
      t.done(`End of PKG01. ${ms}ms`);

    }).exec(sender=>{
      // const google = { };
      const { google } = require(process.env.NODE_PATH + '/googleapis');
      // const { google } = require('googleapis');
      // console.log('google?', google);
      return `google.auth=${!!google.auth}, OAuth2=${!!(google.auth && google.auth.OAuth2)}`;
    }, {
      timeout: 12000
    });

  },
}, __filename.split('/').pop());

function pipe(fnc) {
  return ()=>new Promise(fnc);
}
