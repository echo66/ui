"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var _require = require("./utils");

var uniqueId = _require.uniqueId;

var _require2 = require("events");

var EventEmitter = _require2.EventEmitter;

var Zoomer = (function (_EventEmitter) {
  function Zoomer() {
    _classCallCheck(this, Zoomer);

    _get(_core.Object.getPrototypeOf(Zoomer.prototype), "constructor", this).call(this);
    // alias `emit` method
    this.trigger = this.emit;
  }

  _inherits(Zoomer, _EventEmitter);

  _createClass(Zoomer, {
    select: {
      value: function select(selector, ctx) {
        var _this = this;

        ctx = ctx || document;
        var elms = ctx.querySelectorAll(selector);
        elms = [].map.call(elms, function (elm) {
          return elm;
        });

        elms.forEach(function (elm) {
          _this.delegateEvents(elm);
        });
        // allow chainning
        return this;
      }
    },
    delegateEvents: {

      // bind events on one element

      value: function delegateEvents(elm) {
        var _this = this;

        var zx = 0;
        var zy = 0;
        var xponent = 1.005;
        var zoomerX;

        // mouseMove
        var onMouseMove = function (evt) {
          if (evt.which !== 1) {
            return;
          }

          var deltaX = zx - parseInt(evt.pageX - zoomerX, 10);
          var deltaY = zy - evt.pageY;
          var zoomVal = Math.abs(deltaY);

          var zFactor = deltaY > 0 ? zFactor = Math.pow(xponent, zoomVal) : zFactor = 1 / Math.pow(xponent, zoomVal);

          var e = {
            anchor: zx,
            factor: zFactor,
            delta: { x: deltaX, y: deltaY },
            originalEvent: evt // keep track of the original event
          };

          _this.trigger("mousemove", e);
        };

        // mouseUp
        var onMouseUp = function (evt) {
          document.body.removeEventListener("mousemove", onMouseMove);
          document.body.removeEventListener("mouseup", onMouseUp);
          // document.body.classList.remove('zooming');
          // event should be the same as in mouse move
          _this.trigger("mouseup", evt);
        };

        // mouseDown
        elm.addEventListener("mousedown", function (evt) {
          zoomerX = elm.getBoundingClientRect().left;
          zy = evt.pageY;
          zx = parseInt(evt.pageX - zoomerX, 10);

          var e = { anchor: zx, originalEvent: e };
          _this.trigger("mousedown", e);
          // document.body.classList.add('zooming');
          document.body.addEventListener("mousemove", onMouseMove);
          document.body.addEventListener("mouseup", onMouseUp);
          document.body.addEventListener("mouseleave", onMouseUp);
        });
      }
    }
  });

  return Zoomer;
})(EventEmitter);

function factory() {
  return new Zoomer();
}
factory.Zoomer = Zoomer;

module.exports = factory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7ZUFFTSxPQUFPLENBQUMsU0FBUyxDQUFDOztJQUEvQixRQUFRLFlBQVIsUUFBUTs7Z0JBQ1MsT0FBTyxDQUFDLFFBQVEsQ0FBQzs7SUFBbEMsWUFBWSxhQUFaLFlBQVk7O0lBRVosTUFBTTtBQUVDLFdBRlAsTUFBTSxHQUVJOzBCQUZWLE1BQU07O0FBR1IscUNBSEUsTUFBTSw2Q0FHQTs7QUFFUixRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7R0FDMUI7O1lBTkcsTUFBTTs7ZUFBTixNQUFNO0FBUVYsVUFBTTthQUFBLGdCQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7OztBQUNwQixXQUFHLEdBQUcsR0FBRyxJQUFJLFFBQVEsQ0FBQztBQUN0QixZQUFJLElBQUksR0FBRyxHQUFHLENBQUUsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0MsWUFBSSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLEdBQUcsRUFBRTtBQUFFLGlCQUFPLEdBQUcsQ0FBQztTQUFFLENBQUMsQ0FBQzs7QUFFeEQsWUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEdBQUcsRUFBSztBQUFFLGdCQUFLLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUFFLENBQUMsQ0FBQzs7QUFFckQsZUFBTyxJQUFJLENBQUM7T0FDYjs7QUFHRCxrQkFBYzs7OzthQUFBLHdCQUFDLEdBQUcsRUFBRTs7O0FBQ2xCLFlBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLFlBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNYLFlBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNwQixZQUFJLE9BQU8sQ0FBQzs7O0FBR1osWUFBSSxXQUFXLEdBQUcsVUFBQyxHQUFHLEVBQUs7QUFDekIsY0FBSSxHQUFHLENBQUMsS0FBSyxLQUFLLENBQUMsRUFBRTtBQUFFLG1CQUFPO1dBQUU7O0FBRWhDLGNBQUksTUFBTSxHQUFHLEVBQUUsR0FBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxPQUFPLEVBQUUsRUFBRSxDQUFDLEFBQUMsQ0FBQztBQUN0RCxjQUFJLE1BQU0sR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUM1QixjQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUUvQixjQUFJLE9BQU8sR0FBRyxBQUFDLE1BQU0sR0FBRyxDQUFDLEdBQ3ZCLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FDcEMsT0FBTyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFM0MsY0FBSSxDQUFDLEdBQUc7QUFDTixrQkFBTSxFQUFFLEVBQUU7QUFDVixrQkFBTSxFQUFFLE9BQU87QUFDZixpQkFBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFO0FBQy9CLHlCQUFhLEVBQUUsR0FBRztBQUFBLFdBQ25CLENBQUM7O0FBRUYsZ0JBQUssT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM5QixDQUFDOzs7QUFHRixZQUFJLFNBQVMsR0FBRyxVQUFDLEdBQUcsRUFBSztBQUN2QixrQkFBUSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDNUQsa0JBQVEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDOzs7QUFHeEQsZ0JBQUssT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUM5QixDQUFDOzs7QUFHRixXQUFHLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFVBQUMsR0FBRyxFQUFLO0FBQ3pDLGlCQUFPLEdBQUcsR0FBRyxDQUFDLHFCQUFxQixFQUFFLENBQUMsSUFBSSxDQUFDO0FBQzNDLFlBQUUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQ2YsWUFBRSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQzs7QUFFdkMsY0FBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUN6QyxnQkFBSyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUU3QixrQkFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDekQsa0JBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3JELGtCQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztTQUN6RCxDQUFDLENBQUM7T0FDSjs7OztTQXJFRyxNQUFNO0dBQVMsWUFBWTs7QUF3RWpDLFNBQVMsT0FBTyxHQUFHO0FBQUUsU0FBTyxJQUFJLE1BQU0sRUFBRSxDQUFDO0NBQUU7QUFDM0MsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7O0FBRXhCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIiwiZmlsZSI6ImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciB7IHVuaXF1ZUlkIH0gPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgeyBFdmVudEVtaXR0ZXIgfSA9IHJlcXVpcmUoJ2V2ZW50cycpO1xuXG5jbGFzcyBab29tZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gICAgLy8gYWxpYXMgYGVtaXRgIG1ldGhvZFxuICAgIHRoaXMudHJpZ2dlciA9IHRoaXMuZW1pdDtcbiAgfVxuXG4gIHNlbGVjdChzZWxlY3RvciwgY3R4KSB7XG4gICAgY3R4ID0gY3R4IHx8wqBkb2N1bWVudDtcbiAgICB2YXIgZWxtcyA9IGN0eCAucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgZWxtcyA9IFtdLm1hcC5jYWxsKGVsbXMsIGZ1bmN0aW9uKGVsbSkgeyByZXR1cm4gZWxtOyB9KTtcblxuICAgIGVsbXMuZm9yRWFjaCgoZWxtKSA9PiB7IHRoaXMuZGVsZWdhdGVFdmVudHMoZWxtKTsgfSk7XG4gICAgLy8gYWxsb3cgY2hhaW5uaW5nXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBiaW5kIGV2ZW50cyBvbiBvbmUgZWxlbWVudFxuICBkZWxlZ2F0ZUV2ZW50cyhlbG0pIHtcbiAgICB2YXIgenggPSAwO1xuICAgIHZhciB6eSA9IDA7XG4gICAgdmFyIHhwb25lbnQgPSAxLjAwNTtcbiAgICB2YXIgem9vbWVyWDtcblxuICAgIC8vIG1vdXNlTW92ZVxuICAgIHZhciBvbk1vdXNlTW92ZSA9IChldnQpID0+IHtcbiAgICAgIGlmIChldnQud2hpY2ggIT09IDEpIHsgcmV0dXJuOyB9XG5cbiAgICAgIHZhciBkZWx0YVggPSB6eCAtIChwYXJzZUludChldnQucGFnZVggLSB6b29tZXJYLCAxMCkpO1xuICAgICAgdmFyIGRlbHRhWSA9IHp5IC0gZXZ0LnBhZ2VZO1xuICAgICAgdmFyIHpvb21WYWwgPSBNYXRoLmFicyhkZWx0YVkpO1xuXG4gICAgICB2YXIgekZhY3RvciA9IChkZWx0YVkgPiAwKSA/XG4gICAgICAgIHpGYWN0b3IgPSBNYXRoLnBvdyh4cG9uZW50LCB6b29tVmFsKSA6XG4gICAgICAgIHpGYWN0b3IgPSAxIC8gTWF0aC5wb3coeHBvbmVudCwgem9vbVZhbCk7XG5cbiAgICAgIHZhciBlID0ge1xuICAgICAgICBhbmNob3I6IHp4LFxuICAgICAgICBmYWN0b3I6IHpGYWN0b3IsXG4gICAgICAgIGRlbHRhOiB7IHg6IGRlbHRhWCwgeTogZGVsdGFZIH0sXG4gICAgICAgIG9yaWdpbmFsRXZlbnQ6IGV2dCAvLyBrZWVwIHRyYWNrIG9mIHRoZSBvcmlnaW5hbCBldmVudFxuICAgICAgfTtcblxuICAgICAgdGhpcy50cmlnZ2VyKCdtb3VzZW1vdmUnLCBlKTtcbiAgICB9O1xuXG4gICAgLy8gbW91c2VVcFxuICAgIHZhciBvbk1vdXNlVXAgPSAoZXZ0KSA9PiB7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlKTtcbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIG9uTW91c2VVcCk7XG4gICAgICAvLyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ3pvb21pbmcnKTtcbiAgICAgIC8vIGV2ZW50IHNob3VsZCBiZSB0aGUgc2FtZSBhcyBpbiBtb3VzZSBtb3ZlXG4gICAgICB0aGlzLnRyaWdnZXIoJ21vdXNldXAnLCBldnQpO1xuICAgIH07XG5cbiAgICAvLyBtb3VzZURvd25cbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGV2dCkgPT4ge1xuICAgICAgem9vbWVyWCA9IGVsbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5sZWZ0O1xuICAgICAgenkgPSBldnQucGFnZVk7XG4gICAgICB6eCA9IHBhcnNlSW50KGV2dC5wYWdlWCAtIHpvb21lclgsIDEwKTtcblxuICAgICAgdmFyIGUgPSB7IGFuY2hvcjogengsIG9yaWdpbmFsRXZlbnQ6IGUgfTtcbiAgICAgIHRoaXMudHJpZ2dlcignbW91c2Vkb3duJywgZSk7XG4gICAgICAvLyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ3pvb21pbmcnKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgb25Nb3VzZU1vdmUpO1xuICAgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Nb3VzZVVwKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIG9uTW91c2VVcCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmFjdG9yeSgpIHsgcmV0dXJuIG5ldyBab29tZXIoKTsgfVxuZmFjdG9yeS5ab29tZXIgPSBab29tZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcblxuIl19