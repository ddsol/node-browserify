/*
  Because browserify calls fs.readFile in a loop, and fs.readFile calls fs.open, a large number of pending opens can exceed the ulimit (also on Windows).
  This module patches fs.open to queue calls to actual open if there are too many outstanding opens.
*/

var fs              = require('fs')
  , origOpen        = fs.open
  , openingCount    = 0
  , pendingOpenings = [];

function contOpen(){
  while (pendingOpenings.length && openingCount<100) {
    var args=pendingOpenings.shift()
      , cb=args.pop();

    args.push(function(){
      openingCount--;
      cb.apply(this,arguments);
      contOpen();
    });

    openingCount++;
    origOpen.apply(fs,args);
  }
}

fs.open=function(){
  pendingOpenings.push(Array.prototype.slice.call(arguments));
  contOpen();
}
