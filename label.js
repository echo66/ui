"use strict";

var _babelHelpers = require("babel-runtime/helpers")["default"];
var _core = require("babel-runtime/core-js")["default"];
var _require = require("layer");

var Layer = _require.Layer;
var _require2 = require("utils");

var accessors = _require2.accessors;
var uniqueId = _require2.uniqueId;
var Label = (function (Layer) {
  function Label() {
    _babelHelpers.classCallCheck(this, Label);

    _babelHelpers.get(_core.Object.getPrototypeOf(Label.prototype), "constructor", this).call(this);

    var defaults = {
      type: "label",
      // expose to allow tweaking vertical alignment for design adjustments
      verticalAlignment: { top: "1em", middle: "0.5em", bottom: "0" }
    };

    this.params(defaults);

    // data accessors
    this.y(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return +d.y || 0;
      }
      d.y = +v;
    });

    this.x(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return +d.x || 0;
      }
      d.x = +v;
    });

    this.text(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return d.text + "";
      }
      d.text = v + "";
    });

    this.bgColor(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return d.bgColor + "";
      }
      d.bgColor = v + "";
    });

    // the following can also be setted as global params
    // which are acting as default values
    this.width(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return +d.width;
      }
      d.width = +v;
    });

    this.height(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return +d.height;
      }
      d.height = +v;
    });

    this.color(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return d.color || "#000000";
      }
      d.color = v + "";
    });

    // 'left', 'center', 'top'
    this.align(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return d.align || "left";
      }
      d.align = v + "";
    });

    // 'top', 'middle', 'bottom'
    this.valign(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];
      if (v === null) {
        return d.valign || "top";
      }
      d.valign = v + "";
    });

    this.margin({ top: 0, right: 0, bottom: 0, left: 0 });
  }

  _babelHelpers.inherits(Label, Layer);

  _babelHelpers.prototypeProperties(Label, null, {
    xZoom: {
      value: function xZoom(factor) {
        this.draw();
      },
      writable: true,
      configurable: true
    },
    update: {
      value: function update(data) {
        _babelHelpers.get(_core.Object.getPrototypeOf(Label.prototype), "update", this).call(this, data);

        this.items = this.g.selectAll("." + this.param("unitClass")).data(this.data(), this.sortIndex());

        var sel = this.items.enter().append("g").classed("item", true).classed(this.param("unitClass"), true);

        sel.append("rect").attr("class", "bounding-box").attr("fill", "transparent");

        sel.append("text").attr("class", "text");

        this.items.exit().remove();
      },
      writable: true,
      configurable: true
    },
    draw: {
      value: function draw() {
        var _this = this;
        var el = arguments[0] === undefined ? null : arguments[0];
        el = el || this.items;

        var _xScale = this.base.xScale;
        var _yScale = this.yScale;

        var _w = this.width();
        var _h = this.height();
        var _x = this.x();
        var _y = this.y();
        var _align = this.align();
        var _valign = this.valign();
        var _margin = this.margin();
        var _verticalAlignment = this.params().verticalAlignment;
        var minDomain = _xScale.domain()[0];

        // scales for bounding box position
        var w = function (d) {
          var width = _xScale(minDomain + _w(d));
          return width < 0 ? 0 : width;
        };

        var x = function (d) {
          return _xScale(_x(d));
        };

        var h = function (d) {
          return _this.param("height") - _yScale(_h(d)) || _this.param("height");
        };

        var y = function (d) {
          return _yScale(_y(d)) - h(d) || 0;
        };

        // scales for text-position
        var tx = function (d) {
          switch (_align(d)) {
            case "left":
              return x(d) + parseInt(_margin().left, 10);
              break;
            case "center":
              return x(d) + w(d) / 2;
              break;
            case "right":
              return x(d) + w(d) - parseInt(_margin().right, 10);
              break;
          }
        };

        var anchor = function (d) {
          switch (_align(d)) {
            case "left":
              return "start";
              break;
            case "center":
              return "middle";
              break;
            case "right":
              return "end";
              break;
          }
        };

        var ty = function (d) {
          switch (_valign(d)) {
            case "top":
              return y(d) + parseInt(_margin().top, 10);
              break;
            case "middle":
              return y(d) + h(d) / 2;
              break;
            case "bottom":
              return y(d) + h(d) - parseInt(_margin().bottom, 10);
              break;
          }
        };

        // based on small manual testing - can probably be improved
        var dy = function (d) {
          switch (_valign(d)) {
            case "top":
              return _verticalAlignment.top;
              break;
            case "middle":
              return _verticalAlignment.middle;
              break;
            case "bottom":
              return _verticalAlignment.bottom;
              break;
          }
        };

        el.selectAll(".bounding-box").attr("x", x).attr("y", y).attr("width", w).attr("height", h).attr("fill", function (d) {
          return _this.bgColor()(d);
        });

        el.selectAll(".text").text(function (d) {
          return _this.text()(d);
        }).attr("fill", function (d) {
          return _this.color()(d);
        }).attr("x", tx).attr("y", ty).attr("dy", dy).attr("text-anchor", anchor);

        if (!!this.each()) {
          el.each(this.each());
        }
      },
      writable: true,
      configurable: true
    }
  });

  return Label;
})(Layer);

accessors.getFunction(Label.prototype, ["x", "y", "width", "height", "text", "color", "align", "valign", "margin", "sortIndex", "bgColor"]);

function factory() {
  return new Label();
}
factory.Label = Label;

module.exports = factory;

//# sourceMappingURL=data:application/json;base64,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O1NBQUUsQ0FBQyxDQUNoRCxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUNiLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQ2IsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FDZCxJQUFJLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFBOztBQUU5QixZQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7QUFBRSxZQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQUU7T0FDN0M7Ozs7OztTQXZNRyxLQUFLO0dBQVMsS0FBSzs7QUEwTXpCLFNBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBQyxDQUNwQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUNuQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQ3BDLFdBQVcsRUFBRSxTQUFTLENBQ3ZCLENBQUMsQ0FBQzs7QUFFSCxTQUFTLE9BQU8sR0FBRztBQUFFLFNBQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztDQUFFO0FBQzFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDOztBQUV0QixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyIsImZpbGUiOiIuL2xhYmVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgeyBMYXllciB9ID0gcmVxdWlyZSgnbGF5ZXInKTtcbnZhciB7IGFjY2Vzc29ycywgdW5pcXVlSWQgfSA9IHJlcXVpcmUoJ3V0aWxzJyk7XG5cbmNsYXNzIExhYmVsIGV4dGVuZHMgTGF5ZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICB0eXBlOiAnbGFiZWwnLFxuICAgICAgLy8gZXhwb3NlIHRvIGFsbG93IHR3ZWFraW5nIHZlcnRpY2FsIGFsaWdubWVudCBmb3IgZGVzaWduIGFkanVzdG1lbnRzXG4gICAgICB2ZXJ0aWNhbEFsaWdubWVudDogeyB0b3A6ICcxZW0nLCBtaWRkbGU6ICcwLjVlbScsIGJvdHRvbTogJzAnIH1cbiAgICB9O1xuXG4gICAgdGhpcy5wYXJhbXMoZGVmYXVsdHMpO1xuXG4gICAgLy8gZGF0YSBhY2Nlc3NvcnNcbiAgICB0aGlzLnkoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiArZC55IHx8IDAgfVxuICAgICAgZC55ID0gKCt2KTtcbiAgICB9KTtcblxuICAgIHRoaXMueChmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHsgcmV0dXJuICtkLnggfHwgMCB9XG4gICAgICBkLnggPSAoK3YpO1xuICAgIH0pO1xuXG4gICAgdGhpcy50ZXh0KGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgeyByZXR1cm4gKGQudGV4dCArICcnKSB9XG4gICAgICBkLnRleHQgPSAodiArICcnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuYmdDb2xvcihmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHsgcmV0dXJuIGQuYmdDb2xvciArICcnOyB9XG4gICAgICBkLmJnQ29sb3IgPSAodiArICcnKTtcbiAgICB9KTtcblxuICAgIC8vIHRoZSBmb2xsb3dpbmcgY2FuIGFsc28gYmUgc2V0dGVkIGFzIGdsb2JhbCBwYXJhbXNcbiAgICAvLyB3aGljaCBhcmUgYWN0aW5nIGFzIGRlZmF1bHQgdmFsdWVzXG4gICAgdGhpcy53aWR0aChmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHsgcmV0dXJuICtkLndpZHRoIH1cbiAgICAgIGQud2lkdGggPSAoK3YpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5oZWlnaHQoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiArZC5oZWlnaHQgfVxuICAgICAgZC5oZWlnaHQgPSAoK3YpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb2xvcihmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHsgcmV0dXJuIGQuY29sb3IgfHzCoCcjMDAwMDAwJyB9XG4gICAgICBkLmNvbG9yID0gKHYgKyAnJyk7XG4gICAgfSk7XG5cbiAgICAvLyAnbGVmdCcsICdjZW50ZXInLCAndG9wJ1xuICAgIHRoaXMuYWxpZ24oZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiBkLmFsaWduIHx8wqAnbGVmdCcgfVxuICAgICAgZC5hbGlnbiA9ICh2ICsgJycpO1xuICAgIH0pO1xuXG4gICAgLy8gJ3RvcCcsICdtaWRkbGUnLCAnYm90dG9tJ1xuICAgIHRoaXMudmFsaWduKGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgeyByZXR1cm4gZC52YWxpZ24gfHzCoCd0b3AnIH1cbiAgICAgIGQudmFsaWduID0gKHYgKyAnJyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLm1hcmdpbih7IHRvcDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMCwgbGVmdDogMCB9KTtcbiAgfVxuXG4gIHhab29tKGZhY3Rvcikge1xuICAgIHRoaXMuZHJhdygpO1xuICB9XG5cbiAgdXBkYXRlKGRhdGEpIHtcbiAgICBzdXBlci51cGRhdGUoZGF0YSk7XG5cbiAgICB0aGlzLml0ZW1zID0gdGhpcy5nLnNlbGVjdEFsbCgnLicgKyB0aGlzLnBhcmFtKCd1bml0Q2xhc3MnKSlcbiAgICAgIC5kYXRhKHRoaXMuZGF0YSgpLCB0aGlzLnNvcnRJbmRleCgpKTtcblxuICAgIHZhciBzZWwgPSB0aGlzLml0ZW1zLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmNsYXNzZWQoJ2l0ZW0nLCB0cnVlKVxuICAgICAgLmNsYXNzZWQodGhpcy5wYXJhbSgndW5pdENsYXNzJyksIHRydWUpO1xuXG4gICAgc2VsLmFwcGVuZCgncmVjdCcpXG4gICAgICAuYXR0cignY2xhc3MnLCAnYm91bmRpbmctYm94JylcbiAgICAgIC5hdHRyKCdmaWxsJywgJ3RyYW5zcGFyZW50JylcblxuICAgIHNlbC5hcHBlbmQoJ3RleHQnKVxuICAgICAuYXR0cignY2xhc3MnLCAndGV4dCcpO1xuXG4gICAgdGhpcy5pdGVtcy5leGl0KCkucmVtb3ZlKCk7XG4gIH1cblxuICBkcmF3KGVsID0gbnVsbCkge1xuICAgIGVsID0gZWwgfHwgdGhpcy5pdGVtcztcblxuICAgIHZhciBfeFNjYWxlID0gdGhpcy5iYXNlLnhTY2FsZTtcbiAgICB2YXIgX3lTY2FsZSA9IHRoaXMueVNjYWxlO1xuXG4gICAgdmFyIF93ID0gdGhpcy53aWR0aCgpO1xuICAgIHZhciBfaCA9IHRoaXMuaGVpZ2h0KCk7XG4gICAgdmFyIF94ID0gdGhpcy54KCk7XG4gICAgdmFyIF95ID0gdGhpcy55KCk7XG4gICAgdmFyIF9hbGlnbiAgPSB0aGlzLmFsaWduKCk7XG4gICAgdmFyIF92YWxpZ24gPSB0aGlzLnZhbGlnbigpO1xuICAgIHZhciBfbWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICB2YXIgX3ZlcnRpY2FsQWxpZ25tZW50ID0gdGhpcy5wYXJhbXMoKS52ZXJ0aWNhbEFsaWdubWVudDtcbiAgICB2YXIgbWluRG9tYWluID0gX3hTY2FsZS5kb21haW4oKVswXTtcblxuICAgIC8vIHNjYWxlcyBmb3IgYm91bmRpbmcgYm94IHBvc2l0aW9uXG4gICAgdmFyIHcgPSAoZCkgPT4ge1xuICAgICAgdmFyIHdpZHRoID0gX3hTY2FsZShtaW5Eb21haW4gKyBfdyhkKSk7XG4gICAgICByZXR1cm4gd2lkdGggPCAwID8gMCA6IHdpZHRoO1xuICAgIH1cblxuICAgIHZhciB4ID0gKGQpID0+IHtcbiAgICAgIHJldHVybiBfeFNjYWxlKF94KGQpKTtcbiAgICB9XG5cbiAgICB2YXIgaCA9IChkKSA9PiB7XG4gICAgICByZXR1cm4gKHRoaXMucGFyYW0oJ2hlaWdodCcpIC0gX3lTY2FsZShfaChkKSkpIHx8IHRoaXMucGFyYW0oJ2hlaWdodCcpO1xuICAgIH1cblxuICAgIHZhciB5ID0gKGQpID0+IHtcbiAgICAgIHJldHVybiAoX3lTY2FsZShfeShkKSkgLSBoKGQpKSB8fCAwO1xuICAgIH1cblxuICAgIC8vIHNjYWxlcyBmb3IgdGV4dC1wb3NpdGlvblxuICAgIHZhciB0eCA9IChkKSA9PiB7XG4gICAgICBzd2l0Y2ggKF9hbGlnbihkKSkge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICByZXR1cm4geChkKSArIHBhcnNlSW50KF9tYXJnaW4oKS5sZWZ0LCAxMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgcmV0dXJuIHgoZCkgKyAodyhkKSAvIDIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcmV0dXJuIHgoZCkgKyB3KGQpIC0gcGFyc2VJbnQoX21hcmdpbigpLnJpZ2h0LCAxMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHZhciBhbmNob3IgPSAoZCkgPT4ge1xuICAgICAgc3dpdGNoIChfYWxpZ24oZCkpIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcmV0dXJuICdzdGFydCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgcmV0dXJuICdtaWRkbGUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcmV0dXJuICdlbmQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdHkgPSAoZCkgPT4ge1xuICAgICAgc3dpdGNoIChfdmFsaWduKGQpKSB7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgcmV0dXJuIHkoZCkgKyBwYXJzZUludChfbWFyZ2luKCkudG9wLCAxMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21pZGRsZSc6XG4gICAgICAgICAgcmV0dXJuIHkoZCkgKyAoaChkKSAvIDIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgIHJldHVybiB5KGQpICsgaChkKSAtIHBhcnNlSW50KF9tYXJnaW4oKS5ib3R0b20sIDEwKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gYmFzZWQgb24gc21hbGwgbWFudWFsIHRlc3RpbmcgLSBjYW4gcHJvYmFibHkgYmUgaW1wcm92ZWRcbiAgICB2YXIgZHkgPSAoZCkgPT4ge1xuICAgICAgc3dpdGNoIChfdmFsaWduKGQpKSB7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgcmV0dXJuIF92ZXJ0aWNhbEFsaWdubWVudC50b3A7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ21pZGRsZSc6XG4gICAgICAgICAgcmV0dXJuIF92ZXJ0aWNhbEFsaWdubWVudC5taWRkbGU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2JvdHRvbSc6XG4gICAgICAgICAgcmV0dXJuIF92ZXJ0aWNhbEFsaWdubWVudC5ib3R0b207XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZWwuc2VsZWN0QWxsKCcuYm91bmRpbmctYm94JylcbiAgICAgIC5hdHRyKCd4JywgeClcbiAgICAgIC5hdHRyKCd5JywgeSlcbiAgICAgIC5hdHRyKCd3aWR0aCcsIHcpXG4gICAgICAuYXR0cignaGVpZ2h0JywgaClcbiAgICAgIC5hdHRyKCdmaWxsJywgKGQpID0+IHsgcmV0dXJuIHRoaXMuYmdDb2xvcigpKGQpOyB9KTtcblxuICAgIGVsLnNlbGVjdEFsbCgnLnRleHQnKVxuICAgICAgLnRleHQoKGQpID0+IHsgcmV0dXJuIHRoaXMudGV4dCgpKGQpOyB9KVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAoZCkgPT4geyByZXR1cm4gdGhpcy5jb2xvcigpKGQpOyB9KVxuICAgICAgLmF0dHIoJ3gnLCB0eClcbiAgICAgIC5hdHRyKCd5JywgdHkpXG4gICAgICAuYXR0cignZHknLCBkeSlcbiAgICAgIC5hdHRyKCd0ZXh0LWFuY2hvcicsIGFuY2hvcilcblxuICAgIGlmICghIXRoaXMuZWFjaCgpKSB7IGVsLmVhY2godGhpcy5lYWNoKCkpOyB9XG4gIH1cbn1cblxuYWNjZXNzb3JzLmdldEZ1bmN0aW9uKExhYmVsLnByb3RvdHlwZSxbXG4gICd4JywgJ3knLCAnd2lkdGgnLCAnaGVpZ2h0JywgJ3RleHQnLFxuICAnY29sb3InLCAnYWxpZ24nLCAndmFsaWduJywgJ21hcmdpbicsXG4gICdzb3J0SW5kZXgnLCAnYmdDb2xvcidcbl0pO1xuXG5mdW5jdGlvbiBmYWN0b3J5KCkgeyByZXR1cm4gbmV3IExhYmVsKCk7IH1cbmZhY3RvcnkuTGFiZWwgPSBMYWJlbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuIl19