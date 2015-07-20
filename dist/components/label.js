"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var _require = require("../helpers/utils");

var uniqueId = _require.uniqueId;
var accessors = _require.accessors;

var _require2 = require("../core/layer");

var Layer = _require2.Layer;

var Label = (function (_Layer) {
  function Label() {
    _classCallCheck(this, Label);

    _get(_core.Object.getPrototypeOf(Label.prototype), "constructor", this).call(this);

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

    this.marginTop(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) {
        return d.marginTop || 2;
      }
      d.marginTop = v;
    });
  }

  _inherits(Label, _Layer);

  _createClass(Label, {
    xZoom: {
      value: function xZoom(factor) {
        this.draw();
      }
    },
    update: {
      value: function update(data) {
        _get(_core.Object.getPrototypeOf(Label.prototype), "update", this).call(this, data);

        this.items = this.g.selectAll("." + this.param("unitClass")).data(this.data());

        var sel = this.items.enter().append("g").classed("item", true).classed(this.param("unitClass"), true);

        sel.append("rect").attr("class", "bounding-box").attr("fill", "transparent");

        sel.append("text").attr("class", "text");

        this.items.exit().remove();
      }
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

        var _marginTop = this.marginTop();

        // scales for bounding box position
        var w = function (d) {
          var width = _xScale(minDomain + _w(d));
          return width < 0 ? 0 : width;
        };

        var x = function (d) {
          return _xScale(_x(d));
        };

        var h = function (d) {
          // console.log([d, _yScale, _h, _h(d), _yScale(_h(d)), this.param('height')]);
          return _this.param("height") - _yScale(_h(d)) || _this.param("height");
        };

        var y = function (d) {
          return _yScale(_y(d)) - h(d) || 0;
        };

        // scales for text-position
        var tx = function (d) {
          var ret;
          switch (_align(d)) {
            case "left":
              ret = x(d) + parseInt(_margin().left, 10);
              break;
            case "center":
              ret = x(d) + w(d) / 2;
              break;
            case "right":
              ret = x(d) + w(d) - parseInt(_margin().right, 10);
              break;
          }

          return ret;
        };

        var anchor = function (d) {
          var ret;
          switch (_align(d)) {
            case "left":
              ret = "start";
              break;
            case "center":
              ret = "middle";
              break;
            case "right":
              ret = "end";
              break;
          }

          return ret;
        };

        var ty = function (d) {
          var ret;
          switch (_valign(d)) {
            case "top":
              // ret = y(d) + parseInt(_margin().top, 10);
              ret = y(d) + parseInt(_marginTop(d), 10);
              break;
            case "middle":
              ret = y(d) + h(d) / 2;
              break;
            case "bottom":
              ret = y(d) + h(d) - parseInt(_margin().bottom, 10);
              break;
          }

          return ret;
        };

        // based on small manual testing - can probably be improved
        var dy = function (d) {
          var ret;
          switch (_valign(d)) {
            case "top":
              ret = _verticalAlignment.top;
              break;
            case "middle":
              ret = _verticalAlignment.middle;
              break;
            case "bottom":
              ret = _verticalAlignment.bottom;
              break;
          }

          return ret;
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
      }
    }
  });

  return Label;
})(Layer);

accessors.getFunction(Label.prototype, ["x", "y", "width", "height", "text", "color", "align", "valign", "margin", "sortIndex", "bgColor", "marginTop"]);

function factory() {
  return new Label();
}
factory.Label = Label;

module.exports = factory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7ZUFFaUIsT0FBTyxDQUFDLGtCQUFrQixDQUFDOztJQUFuRCxRQUFRLFlBQVIsUUFBUTtJQUFFLFNBQVMsWUFBVCxTQUFTOztnQkFDVCxPQUFPLENBQUMsZUFBZSxDQUFDOztJQUFsQyxLQUFLLGFBQUwsS0FBSzs7SUFFTCxLQUFLO0FBRUUsV0FGUCxLQUFLLEdBRUs7MEJBRlYsS0FBSzs7QUFHUCxxQ0FIRSxLQUFLLDZDQUdDOztBQUVSLFFBQUksUUFBUSxHQUFHO0FBQ2IsVUFBSSxFQUFFLE9BQU87O0FBRWIsdUJBQWlCLEVBQUUsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRTtLQUNoRSxDQUFDOztBQUVGLFFBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7OztBQUd0QixRQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVMsQ0FBQyxFQUFZO1VBQVYsQ0FBQyxnQ0FBRyxJQUFJOztBQUN6QixVQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7QUFBRSxlQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7T0FBRTtBQUNyQyxPQUFDLENBQUMsQ0FBQyxHQUFJLENBQUMsQ0FBQyxBQUFDLENBQUM7S0FDWixDQUFDLENBQUM7O0FBRUgsUUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFTLENBQUMsRUFBWTtVQUFWLENBQUMsZ0NBQUcsSUFBSTs7QUFDekIsVUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO0FBQUUsZUFBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO09BQUU7QUFDckMsT0FBQyxDQUFDLENBQUMsR0FBSSxDQUFDLENBQUMsQUFBQyxDQUFDO0tBQ1osQ0FBQyxDQUFDOztBQUVILFFBQUksQ0FBQyxJQUFJLENBQUMs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QUUsU0FBUyxFQUFFLFdBQVcsQ0FDcEMsQ0FBQyxDQUFDOztBQUVILFNBQVMsT0FBTyxHQUFHO0FBQUUsU0FBTyxJQUFJLEtBQUssRUFBRSxDQUFDO0NBQUU7QUFDMUMsT0FBTyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7O0FBRXRCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIiwiZmlsZSI6ImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciB7IHVuaXF1ZUlkLCBhY2Nlc3NvcnMgfSA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvdXRpbHMnKTtcbnZhciB7IExheWVyIH0gPSByZXF1aXJlKCcuLi9jb3JlL2xheWVyJyk7XG5cbmNsYXNzIExhYmVsIGV4dGVuZHMgTGF5ZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICB0eXBlOiAnbGFiZWwnLFxuICAgICAgLy8gZXhwb3NlIHRvIGFsbG93IHR3ZWFraW5nIHZlcnRpY2FsIGFsaWdubWVudCBmb3IgZGVzaWduIGFkanVzdG1lbnRzXG4gICAgICB2ZXJ0aWNhbEFsaWdubWVudDogeyB0b3A6ICcxZW0nLCBtaWRkbGU6ICcwLjVlbScsIGJvdHRvbTogJzAnIH1cbiAgICB9O1xuXG4gICAgdGhpcy5wYXJhbXMoZGVmYXVsdHMpO1xuXG4gICAgLy8gZGF0YSBhY2Nlc3NvcnNcbiAgICB0aGlzLnkoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiArZC55IHx8IDA7IH1cbiAgICAgIGQueSA9ICgrdik7XG4gICAgfSk7XG5cbiAgICB0aGlzLngoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiArZC54IHx8IDA7IH1cbiAgICAgIGQueCA9ICgrdik7XG4gICAgfSk7XG5cbiAgICB0aGlzLnRleHQoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiAoZC50ZXh0ICsgJycpOyB9XG4gICAgICBkLnRleHQgPSAodiArICcnKTtcbiAgICB9KTtcblxuICAgIHRoaXMuYmdDb2xvcihmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHsgcmV0dXJuIGQuYmdDb2xvciArICcnOyB9XG4gICAgICBkLmJnQ29sb3IgPSAodiArICcnKTtcbiAgICB9KTtcblxuICAgIC8vIHRoZSBmb2xsb3dpbmcgY2FuIGFsc28gYmUgc2V0dGVkIGFzIGdsb2JhbCBwYXJhbXNcbiAgICAvLyB3aGljaCBhcmUgYWN0aW5nIGFzIGRlZmF1bHQgdmFsdWVzXG4gICAgdGhpcy53aWR0aChmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHsgcmV0dXJuICtkLndpZHRoOyB9XG4gICAgICBkLndpZHRoID0gKCt2KTtcbiAgICB9KTtcblxuICAgIHRoaXMuaGVpZ2h0KGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgeyByZXR1cm4gK2QuaGVpZ2h0OyB9XG4gICAgICBkLmhlaWdodCA9ICgrdik7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbG9yKGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgeyByZXR1cm4gZC5jb2xvciB8fMKgJyMwMDAwMDAnOyB9XG4gICAgICBkLmNvbG9yID0gKHYgKyAnJyk7XG4gICAgfSk7XG5cbiAgICAvLyAnbGVmdCcsICdjZW50ZXInLCAndG9wJ1xuICAgIHRoaXMuYWxpZ24oZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiBkLmFsaWduIHx8wqAnbGVmdCc7IH1cbiAgICAgIGQuYWxpZ24gPSAodiArICcnKTtcbiAgICB9KTtcblxuICAgIC8vICd0b3AnLCAnbWlkZGxlJywgJ2JvdHRvbSdcbiAgICB0aGlzLnZhbGlnbihmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHsgcmV0dXJuIGQudmFsaWduIHx8wqAndG9wJzsgfVxuICAgICAgZC52YWxpZ24gPSAodiArICcnKTtcbiAgICB9KTtcblxuICAgIHRoaXMubWFyZ2luKHsgdG9wOiAwLCByaWdodDogMCwgYm90dG9tOiAwLCBsZWZ0OiAwIH0pO1xuXG4gICAgdGhpcy5tYXJnaW5Ub3AoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSB7IHJldHVybiBkLm1hcmdpblRvcCB8fMKgMjsgfVxuICAgICAgZC5tYXJnaW5Ub3AgPSB2O1xuICAgIH0pO1xuICB9XG5cbiAgeFpvb20oZmFjdG9yKSB7XG4gICAgdGhpcy5kcmF3KCk7XG4gIH1cblxuICB1cGRhdGUoZGF0YSkge1xuICAgIHN1cGVyLnVwZGF0ZShkYXRhKTtcblxuICAgIHRoaXMuaXRlbXMgPSB0aGlzLmcuc2VsZWN0QWxsKCcuJyArIHRoaXMucGFyYW0oJ3VuaXRDbGFzcycpKVxuICAgICAgLmRhdGEodGhpcy5kYXRhKCkpO1xuXG4gICAgdmFyIHNlbCA9IHRoaXMuaXRlbXMuZW50ZXIoKVxuICAgICAgLmFwcGVuZCgnZycpXG4gICAgICAuY2xhc3NlZCgnaXRlbScsIHRydWUpXG4gICAgICAuY2xhc3NlZCh0aGlzLnBhcmFtKCd1bml0Q2xhc3MnKSwgdHJ1ZSk7XG5cbiAgICBzZWwuYXBwZW5kKCdyZWN0JylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdib3VuZGluZy1ib3gnKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCAndHJhbnNwYXJlbnQnKTtcblxuICAgIHNlbC5hcHBlbmQoJ3RleHQnKVxuICAgICAuYXR0cignY2xhc3MnLCAndGV4dCcpO1xuXG4gICAgdGhpcy5pdGVtcy5leGl0KCkucmVtb3ZlKCk7XG4gIH1cblxuICBkcmF3KGVsID0gbnVsbCkge1xuICAgIGVsID0gZWwgfHwgdGhpcy5pdGVtcztcblxuICAgIHZhciBfeFNjYWxlID0gdGhpcy5iYXNlLnhTY2FsZTtcbiAgICB2YXIgX3lTY2FsZSA9IHRoaXMueVNjYWxlO1xuXG4gICAgdmFyIF93ID0gdGhpcy53aWR0aCgpO1xuICAgIHZhciBfaCA9IHRoaXMuaGVpZ2h0KCk7XG4gICAgdmFyIF94ID0gdGhpcy54KCk7XG4gICAgdmFyIF95ID0gdGhpcy55KCk7XG4gICAgdmFyIF9hbGlnbiAgPSB0aGlzLmFsaWduKCk7XG4gICAgdmFyIF92YWxpZ24gPSB0aGlzLnZhbGlnbigpO1xuICAgIHZhciBfbWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICB2YXIgX3ZlcnRpY2FsQWxpZ25tZW50ID0gdGhpcy5wYXJhbXMoKS52ZXJ0aWNhbEFsaWdubWVudDtcbiAgICB2YXIgbWluRG9tYWluID0gX3hTY2FsZS5kb21haW4oKVswXTtcblxuICAgIHZhciBfbWFyZ2luVG9wID0gdGhpcy5tYXJnaW5Ub3AoKTtcblxuICAgIC8vIHNjYWxlcyBmb3IgYm91bmRpbmcgYm94IHBvc2l0aW9uXG4gICAgdmFyIHcgPSAoZCkgPT4ge1xuICAgICAgdmFyIHdpZHRoID0gX3hTY2FsZShtaW5Eb21haW4gKyBfdyhkKSk7XG4gICAgICByZXR1cm4gd2lkdGggPCAwID8gMCA6IHdpZHRoO1xuICAgIH07XG5cbiAgICB2YXIgeCA9IChkKSA9PiB7XG4gICAgICByZXR1cm4gX3hTY2FsZShfeChkKSk7XG4gICAgfTtcblxuICAgIHZhciBoID0gKGQpID0+IHtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFtkLCBfeVNjYWxlLCBfaCwgX2goZCksIF95U2NhbGUoX2goZCkpLCB0aGlzLnBhcmFtKCdoZWlnaHQnKV0pO1xuICAgICAgcmV0dXJuICh0aGlzLnBhcmFtKCdoZWlnaHQnKSAtIF95U2NhbGUoX2goZCkpKSB8fCB0aGlzLnBhcmFtKCdoZWlnaHQnKTtcbiAgICB9O1xuXG4gICAgdmFyIHkgPSAoZCkgPT4ge1xuICAgICAgcmV0dXJuIChfeVNjYWxlKF95KGQpKSAtIGgoZCkpIHx8IDA7XG4gICAgfTtcblxuICAgIC8vIHNjYWxlcyBmb3IgdGV4dC1wb3NpdGlvblxuICAgIHZhciB0eCA9IChkKSA9PiB7XG4gICAgICB2YXIgcmV0O1xuICAgICAgc3dpdGNoIChfYWxpZ24oZCkpIHtcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgICAgcmV0ID0geChkKSArIHBhcnNlSW50KF9tYXJnaW4oKS5sZWZ0LCAxMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NlbnRlcic6XG4gICAgICAgICAgcmV0ID0geChkKSArICh3KGQpIC8gMik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgICByZXQgPSB4KGQpICsgdyhkKSAtIHBhcnNlSW50KF9tYXJnaW4oKS5yaWdodCwgMTApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cbiAgICB2YXIgYW5jaG9yID0gKGQpID0+IHtcbiAgICAgIHZhciByZXQ7XG4gICAgICBzd2l0Y2ggKF9hbGlnbihkKSkge1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgICByZXQgPSAnc3RhcnQnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjZW50ZXInOlxuICAgICAgICAgIHJldCA9ICdtaWRkbGUnO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgICAgcmV0ID0gJ2VuZCc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuICAgIHZhciB0eSA9IChkKSA9PiB7XG4gICAgICB2YXIgcmV0O1xuICAgICAgc3dpdGNoIChfdmFsaWduKGQpKSB7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgLy8gcmV0ID0geShkKSArIHBhcnNlSW50KF9tYXJnaW4oKS50b3AsIDEwKTtcbiAgICAgICAgICByZXQgPSB5KGQpICsgcGFyc2VJbnQoX21hcmdpblRvcChkKSwgMTApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtaWRkbGUnOlxuICAgICAgICAgIHJldCA9IHkoZCkgKyAoaChkKSAvIDIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgIHJldCA9IHkoZCkgKyBoKGQpIC0gcGFyc2VJbnQoX21hcmdpbigpLmJvdHRvbSwgMTApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmV0O1xuICAgIH07XG5cbiAgICAvLyBiYXNlZCBvbiBzbWFsbCBtYW51YWwgdGVzdGluZyAtIGNhbiBwcm9iYWJseSBiZSBpbXByb3ZlZFxuICAgIHZhciBkeSA9IChkKSA9PiB7XG4gICAgICB2YXIgcmV0O1xuICAgICAgc3dpdGNoIChfdmFsaWduKGQpKSB7XG4gICAgICAgIGNhc2UgJ3RvcCc6XG4gICAgICAgICAgcmV0ID0gX3ZlcnRpY2FsQWxpZ25tZW50LnRvcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbWlkZGxlJzpcbiAgICAgICAgICByZXQgPSBfdmVydGljYWxBbGlnbm1lbnQubWlkZGxlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3R0b20nOlxuICAgICAgICAgIHJldCA9IF92ZXJ0aWNhbEFsaWdubWVudC5ib3R0b207XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcblxuICAgIGVsLnNlbGVjdEFsbCgnLmJvdW5kaW5nLWJveCcpXG4gICAgICAuYXR0cigneCcsIHgpXG4gICAgICAuYXR0cigneScsIHkpXG4gICAgICAuYXR0cignd2lkdGgnLCB3KVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGgpXG4gICAgICAuYXR0cignZmlsbCcsIChkKSA9PiB7IHJldHVybiB0aGlzLmJnQ29sb3IoKShkKTsgfSk7XG5cbiAgICBlbC5zZWxlY3RBbGwoJy50ZXh0JylcbiAgICAgIC50ZXh0KChkKSA9PiB7IHJldHVybiB0aGlzLnRleHQoKShkKTsgfSlcbiAgICAgIC5hdHRyKCdmaWxsJywgKGQpID0+IHsgcmV0dXJuIHRoaXMuY29sb3IoKShkKTsgfSlcbiAgICAgIC5hdHRyKCd4JywgdHgpXG4gICAgICAuYXR0cigneScsIHR5KVxuICAgICAgLmF0dHIoJ2R5JywgZHkpXG4gICAgICAuYXR0cigndGV4dC1hbmNob3InLCBhbmNob3IpO1xuXG4gICAgaWYgKCEhdGhpcy5lYWNoKCkpIHsgZWwuZWFjaCh0aGlzLmVhY2goKSk7IH1cbiAgfVxufVxuXG5hY2Nlc3NvcnMuZ2V0RnVuY3Rpb24oTGFiZWwucHJvdG90eXBlLFtcbiAgJ3gnLCAneScsICd3aWR0aCcsICdoZWlnaHQnLCAndGV4dCcsXG4gICdjb2xvcicsICdhbGlnbicsICd2YWxpZ24nLCAnbWFyZ2luJyxcbiAgJ3NvcnRJbmRleCcsICdiZ0NvbG9yJywgJ21hcmdpblRvcCdcbl0pO1xuXG5mdW5jdGlvbiBmYWN0b3J5KCkgeyByZXR1cm4gbmV3IExhYmVsKCk7IH1cbmZhY3RvcnkuTGFiZWwgPSBMYWJlbDtcblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuIl19