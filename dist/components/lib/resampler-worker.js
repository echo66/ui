/*
  @OBSOLETE
*/
"use strict";

var buffer = [];
var minMaxProxy;

/*
self.addEventListener('message', function(message) {

  var data = message.data;

  switch (data.cmd) {
    case 'initialize':
      buffer = data.buffer instanceof ArrayBuffer ?
        new Float32Array(data.buffer) : data.buffer;

      minMaxProxy = new Function('return ' + data.minMax);
      break;
    case 'downSample':
      var minMax = minMaxProxy();

      data.downSampledView = minMax(
        buffer,
        data.extractAtTimes,
        data.sampleRate,
        data.windowSize,
        data.defaultValue
      );

      self.postMessage(data);
      break;
  }
}, false);
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0EsWUFBWSxDQUFDOztBQUViLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixJQUFJLFdBQVcsQ0FBQyIsImZpbGUiOiJlczYvY29tcG9uZW50cy9zZWdtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAgQE9CU09MRVRFXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYnVmZmVyID0gW107XG52YXIgbWluTWF4UHJveHk7XG5cbi8qXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbihtZXNzYWdlKSB7XG5cbiAgdmFyIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG5cbiAgc3dpdGNoIChkYXRhLmNtZCkge1xuICAgIGNhc2UgJ2luaXRpYWxpemUnOlxuICAgICAgYnVmZmVyID0gZGF0YS5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciA/XG4gICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZGF0YS5idWZmZXIpIDogZGF0YS5idWZmZXI7XG5cbiAgICAgIG1pbk1heFByb3h5ID0gbmV3IEZ1bmN0aW9uKCdyZXR1cm4gJyArIGRhdGEubWluTWF4KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2Rvd25TYW1wbGUnOlxuICAgICAgdmFyIG1pbk1heCA9IG1pbk1heFByb3h5KCk7XG5cbiAgICAgIGRhdGEuZG93blNhbXBsZWRWaWV3ID0gbWluTWF4KFxuICAgICAgICBidWZmZXIsXG4gICAgICAgIGRhdGEuZXh0cmFjdEF0VGltZXMsXG4gICAgICAgIGRhdGEuc2FtcGxlUmF0ZSxcbiAgICAgICAgZGF0YS53aW5kb3dTaXplLFxuICAgICAgICBkYXRhLmRlZmF1bHRWYWx1ZVxuICAgICAgKTtcblxuICAgICAgc2VsZi5wb3N0TWVzc2FnZShkYXRhKTtcbiAgICAgIGJyZWFrO1xuICB9XG59LCBmYWxzZSk7XG4qL1xuXG4iXX0=