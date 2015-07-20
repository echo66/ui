"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var UILoop = (function () {
  function UILoop(fps) {
    _classCallCheck(this, UILoop);

    this.fps = fps || 60;

    this.__queue = [];
    this.__isRunning = false;
    this.__rAFId = null;

    this.then = Date.now();
    this.interval = 1000 / fps;
  }

  _createClass(UILoop, {
    register: {
      value: function register(func) {
        var args = arguments[1] === undefined ? [] : arguments[1];
        var ctx = arguments[2] === undefined ? null : arguments[2];

        var ticket = { func: func, args: args, ctx: ctx };
        this.__queue.push(ticket);
      }
    },
    hasRegisteredCallbacks: {
      value: function hasRegisteredCallbacks() {
        return !!this.__queue.length;
      }
    },
    start: {
      value: function start() {
        var _this = this;

        if (this.__isRunning) {
          return;
        }

        this.__isRunning = true;
        this.__rAFId = window.requestAnimationFrame(function () {
          return _this.draw();
        });
      }
    },
    stop: {
      value: function stop() {
        if (!this.__isRunning) {
          return;
        }

        this.__isRunning = false;
        window.cancelAnimationFrame(this.__rAFId);
      }
    },
    exec: {
      value: function exec() {
        if (!this.__queue.length) {
          return;
        }

        // callbacks must be called in the same order they were registered FIFO
        for (var i = 0; i < this.__queue.length; i++) {
          var ticket = this.__queue[i];
          ticket.func.apply(ticket.ctx, ticket.args);
          this.__queue.splice(i, 1);
          // decrement to keep in sync with callbacks length
          i = i - 1;
        }
      }
    },
    draw: {
      value: function draw(e) {
        var _this = this;

        if (!this.__isRunning) {
          return;
        }

        this.__rAFId = window.requestAnimationFrame(function () {
          return _this.draw();
        });

        this.now = Date.now();
        this.delta = this.now - this.then;

        if (this.delta > this.interval) {
          this.then = this.now - this.delta % this.interval;
          this.exec();
        }
      }
    }
  });

  return UILoop;
})();

module.exports = UILoop;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBQU0sTUFBTTtBQUVDLFdBRlAsTUFBTSxDQUVFLEdBQUcsRUFBRTswQkFGYixNQUFNOztBQUdSLFFBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQzs7QUFFckIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsUUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDekIsUUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7O0FBRXBCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztHQUM1Qjs7ZUFYRyxNQUFNO0FBYVYsWUFBUTthQUFBLGtCQUFDLElBQUksRUFBeUI7WUFBdkIsSUFBSSxnQ0FBRyxFQUFFO1lBQUUsR0FBRyxnQ0FBRyxJQUFJOztBQUNsQyxZQUFJLE1BQU0sR0FBRyxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxHQUFHLEVBQUgsR0FBRyxFQUFFLENBQUM7QUFDakMsWUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7T0FDM0I7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsZUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7T0FDOUI7O0FBRUQsU0FBSzthQUFBLGlCQUFHOzs7QUFDTixZQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFBRSxpQkFBTztTQUFFOztBQUVqQyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN4QixZQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQztpQkFBTSxNQUFLLElBQUksRUFBRTtTQUFBLENBQUMsQ0FBQztPQUNoRTs7QUFFRCxRQUFJO2FBQUEsZ0JBQUc7QUFDTCxZQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUFFLGlCQUFPO1NBQUU7O0FBRWxDLFlBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLGNBQU0sQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7T0FDM0M7O0FBRUQsUUFBSTthQUFBLGdCQUFHO0FBQ0wsWUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQUUsaUJBQU87U0FBRTs7O0FBR3JDLGFBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM1QyxjQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdCLGdCQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQyxjQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRTFCLFdBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ1g7T0FDRjs7QUFFRCxRQUFJO2FBQUEsY0FBQyxDQUFDLEVBQUU7OztBQUNOLFlBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQUUsaUJBQU87U0FBRTs7QUFFbEMsWUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUM7aUJBQU0sTUFBSyxJQUFJLEVBQUU7U0FBQSxDQUFDLENBQUM7O0FBRS9ELFlBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDOztBQUVsQyxZQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtBQUM5QixjQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxBQUFDLENBQUM7QUFDcEQsY0FBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2I7T0FDRjs7OztTQTdERyxNQUFNOzs7QUFnRVosTUFBTSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMiLCJmaWxlIjoiZXM2L2NvbXBvbmVudHMvc2VnbWVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIFVJTG9vcCB7XG5cbiAgY29uc3RydWN0b3IoZnBzKSB7XG4gICAgdGhpcy5mcHMgPSBmcHMgfHwgNjA7XG5cbiAgICB0aGlzLl9fcXVldWUgPSBbXTtcbiAgICB0aGlzLl9faXNSdW5uaW5nID0gZmFsc2U7XG4gICAgdGhpcy5fX3JBRklkID0gbnVsbDtcblxuICAgIHRoaXMudGhlbiA9IERhdGUubm93KCk7XG4gICAgdGhpcy5pbnRlcnZhbCA9IDEwMDAgLyBmcHM7XG4gIH1cblxuICByZWdpc3RlcihmdW5jLCBhcmdzID0gW10sIGN0eCA9IG51bGwpIHtcbiAgICB2YXIgdGlja2V0ID0geyBmdW5jLCBhcmdzLCBjdHggfTtcbiAgICB0aGlzLl9fcXVldWUucHVzaCh0aWNrZXQpO1xuICB9XG5cbiAgaGFzUmVnaXN0ZXJlZENhbGxiYWNrcygpIHtcbiAgICByZXR1cm4gISF0aGlzLl9fcXVldWUubGVuZ3RoO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgaWYgKHRoaXMuX19pc1J1bm5pbmcpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLl9faXNSdW5uaW5nID0gdHJ1ZTtcbiAgICB0aGlzLl9fckFGSWQgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHRoaXMuZHJhdygpKTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgaWYgKCF0aGlzLl9faXNSdW5uaW5nKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fX2lzUnVubmluZyA9IGZhbHNlO1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9fckFGSWQpO1xuICB9XG5cbiAgZXhlYygpIHtcbiAgICBpZiAoIXRoaXMuX19xdWV1ZS5sZW5ndGgpIHsgcmV0dXJuOyB9XG5cbiAgICAvLyBjYWxsYmFja3MgbXVzdCBiZSBjYWxsZWQgaW4gdGhlIHNhbWUgb3JkZXIgdGhleSB3ZXJlIHJlZ2lzdGVyZWQgRklGT1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fX3F1ZXVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdGlja2V0ID0gdGhpcy5fX3F1ZXVlW2ldO1xuICAgICAgdGlja2V0LmZ1bmMuYXBwbHkodGlja2V0LmN0eCwgdGlja2V0LmFyZ3MpO1xuICAgICAgdGhpcy5fX3F1ZXVlLnNwbGljZShpLCAxKTtcbiAgICAgIC8vIGRlY3JlbWVudCB0byBrZWVwIGluIHN5bmMgd2l0aCBjYWxsYmFja3MgbGVuZ3RoXG4gICAgICBpID0gaSAtIDE7XG4gICAgfVxuICB9XG5cbiAgZHJhdyhlKSB7XG4gICAgaWYgKCF0aGlzLl9faXNSdW5uaW5nKSB7IHJldHVybjsgfVxuXG4gICAgdGhpcy5fX3JBRklkID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB0aGlzLmRyYXcoKSk7XG5cbiAgICB0aGlzLm5vdyA9IERhdGUubm93KCk7XG4gICAgdGhpcy5kZWx0YSA9IHRoaXMubm93IC0gdGhpcy50aGVuO1xuXG4gICAgaWYgKHRoaXMuZGVsdGEgPiB0aGlzLmludGVydmFsKSB7XG4gICAgICB0aGlzLnRoZW4gPSB0aGlzLm5vdyAtICh0aGlzLmRlbHRhICUgdGhpcy5pbnRlcnZhbCk7XG4gICAgICB0aGlzLmV4ZWMoKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVSUxvb3A7Il19