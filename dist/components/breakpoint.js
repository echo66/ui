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

var Breakpoint = (function (_Layer) {
  function Breakpoint() {
    _classCallCheck(this, Breakpoint);

    _get(_core.Object.getPrototypeOf(Breakpoint.prototype), "constructor", this).call(this);

    var defaults = {
      type: "breakpoint",
      id: uniqueId(name),
      opacity: 1,
      color: "#000000",
      lineColor: "#000000",
      displayLine: true,
      radius: 3,
      interpolate: "linear"
    };

    this.params(defaults);

    this.cx(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.cx;
      d.cx = +v;
    });

    this.cy(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.cy;
      d.cy = +v;
    });

    this.r(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.r;
      d.r = +v;
    });

    this.opacity(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.opacity;
      d.opacity = +v;
    });

    this.color(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return d.color;
      d.color = v + "";
    });

    this.circleClass(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return d.circleClass;
      d.circleClass = v + "";
    });
  }

  _inherits(Breakpoint, _Layer);

  _createClass(Breakpoint, {
    sortData: {

      // creates a copy of the data ordered in time axis to draw the line

      value: function sortData() {
        var cx = this.cx();
        var data = this.data().slice(0).sort(function (a, b) {
          return cx(a) - cx(b);
        });
        return data;
      }
    },
    xZoom: {
      value: function xZoom() {
        // var xScale = this.base.xScale;
        // var min = xScale.domain()[0],
        //     max = xScale.domain()[1];

        // // var nuData = [];
        // var dv = extend(this.defaultDataView(), this.dataView());
        // var that = this;

        // this.data().forEach(function(d, i) {
        //   var start = dv.xc(d);
        //   var duration = dv.duration(d);
        //   var end = start + duration;

        //   // rethink when feeling smarter
        //   if((start > min && end < max) || (start < min && end < max && end > min) || (start > min && start < max && end > max) || (end > max && start < min)) nuData.push(d);
        // });
        this.update();
      }
    },
    update: {
      value: function update(data) {
        _get(_core.Object.getPrototypeOf(Breakpoint.prototype), "update", this).call(this, data);

        // this.sortData();

        this.items = this.g.selectAll("." + this.param("unitClass")).data(this.data());

        // create line
        if (this.param("displayLine")) {
          this.line = this.d3.svg.line().interpolate(this.param("interpolate"));

          var path = this.g.select("path");
          // create path if not exists
          if (!path[0][0]) {
            path = this.g.append("path");
          }
          // remove line if no data
          if (this.data().length === 0) {
            path.remove();
          }
        }

        var _circleClass = this.circleClass();
        var circleClass = function (d) {
          return _circleClass(d) || "";
        };

        // create points
        var sel = this.items.enter().append("g").classed("item", true).classed(this.param("unitClass"), true);

        sel.append("circle");

        var exit = this.items.exit();
        exit.remove();

        this.items.each(function (d, i) {
          var elt = d3.select(this);
          elt.classed(d.circleClass, true);
        });
      }
    },
    draw: {
      value: function draw(el) {
        var _this = this;

        el = el || this.items;

        // this.sortData();

        var _xScale = this.base.xScale;
        var _yScale = this.yScale;
        var _cx = this.cx();
        var _cy = this.cy();
        var _r = this.r();
        var _color = this.color();
        var _opacity = this.opacity();

        var cx = function (d) {
          return _xScale(_cx(d));
        };
        var cy = function (d) {
          return _yScale(_cy(d));
        };
        var r = function (d) {
          return _r(d) || _this.param("radius");
        };
        var color = function (d) {
          return _color(d) || _this.param("color");
        };
        var opacity = function (d) {
          return _opacity(d) || _this.param("opacity");
        };

        // draw line
        if (this.param("displayLine")) {
          this.line.x(cx).y(cy);

          this.g.select("path").attr("d", this.line(this.sortData())).attr("stroke", this.param("lineColor")).attr("stroke-width", 1).attr("stroke-opacity", this.param("opacity")).attr("fill", "none");
        }

        // draw circles
        el.selectAll("circle").attr("fill", color).attr("fill-opacity", opacity).attr("cx", 0).attr("cy", 0).attr("r", r).attr("transform", function (d) {
          return "translate(" + cx(d) + ", " + cy(d) + ")";
        });

        if (!!this.each()) {
          el.each(this.each());
        }

        this.items.each(function (d, i) {
          var elt = d3.select(this);
          elt.classed(d.circleClass, true);
        });
      }
    },
    handleBrush: {

      // logic performed to select an item from the brush

      value: function handleBrush(extent, e) {}
    },
    handleDrag: {
      value: function handleDrag(item, e) {
        if (item === null) {
          return;
        }

        this.move(item, e.originalEvent.dx, e.originalEvent.dy);
      }
    },
    move: {
      value: function move(item, dx, dy) {
        item = this.d3.select(item);
        var datum = item.datum();

        var xScale = this.base.xScale;
        var yScale = this.yScale;
        var yRange = yScale.range();

        var cx = this.cx();
        var cy = this.cy();
        var x = xScale(cx(datum));
        var y = yScale(cy(datum));
        // update range
        x += dx;

        // clamp y
        var targetY = y + dy;
        if (targetY <= yRange[0] && targetY >= yRange[1]) {
          y = targetY;
        }

        // range to domain
        var xValue = xScale.invert(x);
        var yValue = yScale.invert(y);
        // update data
        cx(datum, xValue);
        cy(datum, yValue);
        // redraw view
        this.draw(item);
      }
    }
  });

  return Breakpoint;
})(Layer);

// add data accessors
accessors.getFunction(Breakpoint.prototype, ["cx", "cy", "r", "opacity", "color", "circleClass"]);

function factory() {
  return new Breakpoint();
}
factory.Breakpoint = Breakpoint;

module.exports = factory;

/*
mode = mode || 'xy'; // default tries to match both
 var modeX = mode.indexOf('x') >= 0;
var modeY = mode.indexOf('y') >= 0;
var matchX = false;
var matchY = false;
 var r  = this.r();
var cx = this.cx();
var cy = this.cy();
 this.g.selectAll('.selectable').classed('selected', (d, i) => {
  var halfR = r(d) * 0.5;
   // X match
  if (modeX) {
    var x1 = cx(d) - halfR;
    var x2 = cx(d) + halfR;
    //            begining sel               end sel
    var matchX1 = extent[0][0] <= x1 && x2 < extent[1][0];
    var matchX2 = extent[0][0] <= x2 && x1 < extent[1][0];
     matchX = (matchX1 || matchX2);
  } else {
    matchX = true;
  }
   // Y match
  if (modeY) {
    var y1 = cy(d) - halfR;
    var y2 = cy(d) + halfR;
    //            begining sel               end sel
    var matchY1 = extent[0][1] <= y1 && y2 < extent[1][1];
    var matchY2 = extent[0][1] <= y2 && y1 <= extent[1][1];
    matchY = (matchY1 || matchY2);
  } else {
    matchY = true;
  }
   return matchX && matchY;
});
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7ZUFFaUIsT0FBTyxDQUFDLGtCQUFrQixDQUFDOztJQUFuRCxRQUFRLFlBQVIsUUFBUTtJQUFFLFNBQVMsWUFBVCxTQUFTOztnQkFDVCxPQUFPLENBQUMsZUFBZSxDQUFDOztJQUFsQyxLQUFLLGFBQUwsS0FBSzs7SUFFTCxVQUFVO0FBRUgsV0FGUCxVQUFVLEdBRUE7MEJBRlYsVUFBVTs7QUFHWixxQ0FIRSxVQUFVLDZDQUdKOztBQUVSLFFBQUksUUFBUSxHQUFHO0FBQ2IsVUFBSSxFQUFFLFlBQVk7QUFDbEIsUUFBRSxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDbEIsYUFBTyxFQUFFLENBQUM7QUFDVixXQUFLLEVBQUUsU0FBUztBQUNoQixlQUFTLEVBQUUsU0FBUztBQUNwQixpQkFBVyxFQUFFLElBQUk7QUFDakIsWUFBTSxFQUFFLENBQUM7QUFDVCxpQkFBVyxFQUFFLFFBQVE7S0FDdEIsQ0FBQzs7QUFFRixRQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUV0QixRQUFJLENBQUMsRUFBRSxDQUFDLFVBQVMsQ0FBQyxFQUFZO1VBQVYsQ0FBQyxnQ0FBRyxJQUFJOztBQUMxQixVQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDN0IsT0FBQyxDQUFDLEVBQUUsR0FBSSxDQUFDLENBQUMsQUFBQyxDQUFDO0tBQ2IsQ0FBQyxDQUFDOztBQUVILFFBQUksQ0FBQyxFQUFFLENBQUMsVUFBUyxDQUFDLEVBQVk7VUFBVixDQUFDLGdDQUFHLElBQUk7O0FBQzFCLFVBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUM3QixPQUFDLENBQUMsRUFBRSxHQUFJLENBQUMsQ0FBQyxBQUFDLENBQUM7S0FDYixDQUFDLENBQUM7O0FBRUgsUUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFTLENBQUMsRUFBWTtVQUFWLENBQUMsZ0NBQUcsSUFBSTs7QUFDekIsVUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVCLE9BQUMsQ0FBQyxDQUFDLEdBQUksQ0FBQyxDQUFDLEFBQUMsQ0FBQztLQUNaLENBQUMsQ0FBQzs7QUFFSCxRQUFJLENBQUMsT0FBTyxDQUFDLFVBQVMsQ0FBQyxFQUFZO1VBQVYsQ0FBQyxnQ0FBRyxJQUFJOztBQUMvQixVQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDbEMsT0FBQyxDQUFDLE9BQU8sR0FBSSxDQUFDLENBQUMsQUFBQyxDQUFDO0tBQ2xCLENBQUMsQ0FBQzs7QUFFSCxRQUFJLENBQUMsS0FBSyxDQUFDLFVBQVMsQ0FBQyxFQUFZO1VBQVYsQ0FBQyxnQ0FBRyxJQUFJOztBQUM3QixVQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQy9CLE9BQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUNsQixDQUFDLENBQUM7O0FBRUgsUUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFTLENBQUMsRUFBWTtVQUFWLENBQUMsZ0NBQUcsSUFBSTs7QUFDbkMsVUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQztBQUNyQyxPQUFDLENBQUMsV0FBVyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDeEIsQ0FBQyxDQUFDO0dBQ0o7O1lBL0NHLFVBQVU7O2VBQVYsVUFBVTtBQWtEZCxZQUFROzs7O2FBQUEsb0JBQUc7QUFDVCxZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDbkIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFLO0FBQUUsaUJBQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFFLENBQUMsQ0FBQztBQUMxRSxlQUFPLElBQUksQ0FBQztPQUNiOztBQUVELFNBQUs7YUFBQSxpQkFBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkosWUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO09BQ2pCOztBQUVELFVBQU07YUFBQSxnQkFBQyxJQUFJLEVBQUU7QUFDWCx5Q0E3RUUsVUFBVSx3Q0E2RUMsSUFBSSxFQUFFOzs7O0FBSW5CLFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FDekQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDOzs7QUFHckIsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFO0FBQzdCLGNBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQzs7QUFFdEUsY0FBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRWpDLGNBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFBRSxnQkFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1dBQUU7O0FBRWxELGNBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFBRSxnQkFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1dBQUU7U0FDakQ7O0FBR0QsWUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3RDLFlBQUksV0FBVyxHQUFHLFVBQUMsQ0FBQyxFQUFLO0FBQUUsaUJBQU8sWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUFFLENBQUM7OztBQUkzRCxZQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUN6QixNQUFNLENBQUMsR0FBRyxDQUFDLENBQ1gsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FDckIsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRTFDLFdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRXJCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDN0IsWUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUVkLFlBQUksQ0FBQyxLQUFLLENBQ1AsSUFBSSxDQUFDLFVBQVMsQ0FBQyxFQUFFLENBQUMsRUFBQztBQUNsQixjQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLGFBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNsQyxDQUFDLENBQUM7T0FDTjs7QUFFRCxRQUFJO2FBQUEsY0FBQyxFQUFFLEVBQUU7OztBQUNQLFVBQUUsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQzs7OztBQUl0QixZQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvQixZQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzFCLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUNwQixZQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDcEIsWUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQ25CLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMxQixZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRTlCLFlBQUksRUFBRSxHQUFHLFVBQUMsQ0FBQyxFQUFLO0FBQUUsaUJBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQUUsQ0FBQztBQUM1QyxZQUFJLEVBQUUsR0FBRyxVQUFDLENBQUMsRUFBSztBQUFFLGlCQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLEdBQUksVUFBQyxDQUFDLEVBQUs7QUFBRSxpQkFBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBSyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7U0FBRSxDQUFDO0FBQzFELFlBQUksS0FBSyxHQUFLLFVBQUMsQ0FBQyxFQUFLO0FBQUUsaUJBQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQUUsQ0FBQztBQUNsRSxZQUFJLE9BQU8sR0FBRyxVQUFDLENBQUMsRUFBSztBQUFFLGlCQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxNQUFLLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUFFLENBQUM7OztBQUd0RSxZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUU7QUFDN0IsY0FBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztBQUV0QixjQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FDbEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQ3JDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUN2QyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUN2QixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUM3QyxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ3pCOzs7QUFHRCxVQUFFLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUNuQixJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUNuQixJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxDQUM3QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUNiLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQ2IsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FDWixJQUFJLENBQUMsV0FBVyxFQUFFLFVBQUMsQ0FBQyxFQUFLO0FBQ3hCLGlCQUFPLFlBQVksR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDbEQsQ0FBQyxDQUFDOztBQUVMLFlBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtBQUFFLFlBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7U0FBRTs7QUFFNUMsWUFBSSxDQUFDLEtBQUssQ0FDUCxJQUFJLENBQUMsVUFBUyxDQUFDLEVBQUUsQ0FBQyxFQUFDO0FBQ2xCLGNBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUIsYUFBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2xDLENBQUMsQ0FBQztPQUVOOztBQUdELGVBQVc7Ozs7YUFBQSxxQkFBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBNkN0Qjs7QUFFRCxjQUFVO2FBQUEsb0JBQUMsSUFBSSxFQUFFLENBQUMsRUFBRTtBQUNsQixZQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7QUFBRSxpQkFBTztTQUFFOztBQUU5QixZQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO09BQ3pEOztBQUVELFFBQUk7YUFBQSxjQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQ2pCLFlBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRXpCLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzlCLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDekIsWUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDOztBQUU1QixZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDbkIsWUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQ25CLFlBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUMxQixZQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7O0FBRTFCLFNBQUMsSUFBSSxFQUFFLENBQUM7OztBQUdSLFlBQUksT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDckIsWUFBSSxPQUFPLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDaEQsV0FBQyxHQUFHLE9BQU8sQ0FBQztTQUNiOzs7QUFHRCxZQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLFlBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTlCLFVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDbEIsVUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQzs7QUFFbEIsWUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNqQjs7OztTQTdQRyxVQUFVO0dBQVMsS0FBSzs7O0FBa1E5QixTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsQ0FDMUMsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxhQUFhLENBQ25ELENBQUMsQ0FBQzs7QUFFSCxTQUFTLE9BQU8sR0FBRztBQUFFLFNBQU8sSUFBSSxVQUFVLEVBQUUsQ0FBQztDQUFFO0FBQy9DLE9BQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDOztBQUVoQyxNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyIsImZpbGUiOiJlczYvY29tcG9uZW50cy9zZWdtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgeyB1bmlxdWVJZCwgYWNjZXNzb3JzIH0gPSByZXF1aXJlKCcuLi9oZWxwZXJzL3V0aWxzJyk7XG52YXIgeyBMYXllciB9ID0gcmVxdWlyZSgnLi4vY29yZS9sYXllcicpO1xuXG5jbGFzcyBCcmVha3BvaW50IGV4dGVuZHMgTGF5ZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICB0eXBlOiAnYnJlYWtwb2ludCcsXG4gICAgICBpZDogdW5pcXVlSWQobmFtZSksXG4gICAgICBvcGFjaXR5OiAxLFxuICAgICAgY29sb3I6ICcjMDAwMDAwJyxcbiAgICAgIGxpbmVDb2xvcjogJyMwMDAwMDAnLFxuICAgICAgZGlzcGxheUxpbmU6IHRydWUsXG4gICAgICByYWRpdXM6IDMsXG4gICAgICBpbnRlcnBvbGF0ZTogJ2xpbmVhcidcbiAgICB9O1xuXG4gICAgdGhpcy5wYXJhbXMoZGVmYXVsdHMpO1xuXG4gICAgdGhpcy5jeChmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHJldHVybiArZC5jeDtcbiAgICAgIGQuY3ggPSAoK3YpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jeShmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHJldHVybiArZC5jeTtcbiAgICAgIGQuY3kgPSAoK3YpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yKGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgcmV0dXJuICtkLnI7XG4gICAgICBkLnIgPSAoK3YpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5vcGFjaXR5KGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgcmV0dXJuICtkLm9wYWNpdHk7XG4gICAgICBkLm9wYWNpdHkgPSAoK3YpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jb2xvcihmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHJldHVybiBkLmNvbG9yO1xuICAgICAgZC5jb2xvciA9IHYgKyAnJztcbiAgICB9KTtcblxuICAgIHRoaXMuY2lyY2xlQ2xhc3MoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSByZXR1cm4gZC5jaXJjbGVDbGFzcztcbiAgICAgIGQuY2lyY2xlQ2xhc3MgPSB2ICsgJyc7XG4gICAgfSk7XG4gIH1cblxuICAvLyBjcmVhdGVzIGEgY29weSBvZiB0aGUgZGF0YSBvcmRlcmVkIGluIHRpbWUgYXhpcyB0byBkcmF3IHRoZSBsaW5lXG4gIHNvcnREYXRhKCkge1xuICAgIHZhciBjeCA9IHRoaXMuY3goKTtcbiAgICB2YXIgZGF0YSA9IHRoaXMuZGF0YSgpLnNsaWNlKDApLnNvcnQoKGEsIGIpID0+IHsgcmV0dXJuIGN4KGEpIC0gY3goYik7IH0pO1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgeFpvb20oKSB7XG4gICAgLy8gdmFyIHhTY2FsZSA9IHRoaXMuYmFzZS54U2NhbGU7XG4gICAgICAvLyB2YXIgbWluID0geFNjYWxlLmRvbWFpbigpWzBdLFxuICAgICAgLy8gICAgIG1heCA9IHhTY2FsZS5kb21haW4oKVsxXTtcblxuICAgICAgLy8gLy8gdmFyIG51RGF0YSA9IFtdO1xuICAgICAgLy8gdmFyIGR2ID0gZXh0ZW5kKHRoaXMuZGVmYXVsdERhdGFWaWV3KCksIHRoaXMuZGF0YVZpZXcoKSk7XG4gICAgICAvLyB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgIC8vIHRoaXMuZGF0YSgpLmZvckVhY2goZnVuY3Rpb24oZCwgaSkge1xuICAgICAgLy8gICB2YXIgc3RhcnQgPSBkdi54YyhkKTtcbiAgICAgIC8vICAgdmFyIGR1cmF0aW9uID0gZHYuZHVyYXRpb24oZCk7XG4gICAgICAvLyAgIHZhciBlbmQgPSBzdGFydCArIGR1cmF0aW9uO1xuXG4gICAgICAvLyAgIC8vIHJldGhpbmsgd2hlbiBmZWVsaW5nIHNtYXJ0ZXJcbiAgICAgIC8vICAgaWYoKHN0YXJ0ID4gbWluICYmIGVuZCA8IG1heCkgfHwgKHN0YXJ0IDwgbWluICYmIGVuZCA8IG1heCAmJiBlbmQgPiBtaW4pIHx8IChzdGFydCA+IG1pbiAmJiBzdGFydCA8IG1heCAmJiBlbmQgPiBtYXgpIHx8IChlbmQgPiBtYXggJiYgc3RhcnQgPCBtaW4pKSBudURhdGEucHVzaChkKTtcbiAgICAgIC8vIH0pO1xuICAgICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIHVwZGF0ZShkYXRhKSB7XG4gICAgc3VwZXIudXBkYXRlKGRhdGEpO1xuXG4gICAgLy8gdGhpcy5zb3J0RGF0YSgpO1xuXG4gICAgdGhpcy5pdGVtcyA9IHRoaXMuZy5zZWxlY3RBbGwoJy4nICsgdGhpcy5wYXJhbSgndW5pdENsYXNzJykpXG4gICAgICAuZGF0YSh0aGlzLmRhdGEoKSk7XG5cbiAgICAvLyBjcmVhdGUgbGluZVxuICAgIGlmICh0aGlzLnBhcmFtKCdkaXNwbGF5TGluZScpKSB7XG4gICAgICB0aGlzLmxpbmUgPSB0aGlzLmQzLnN2Zy5saW5lKCkuaW50ZXJwb2xhdGUodGhpcy5wYXJhbSgnaW50ZXJwb2xhdGUnKSk7XG5cbiAgICAgIHZhciBwYXRoID0gdGhpcy5nLnNlbGVjdCgncGF0aCcpO1xuICAgICAgLy8gY3JlYXRlIHBhdGggaWYgbm90IGV4aXN0c1xuICAgICAgaWYgKCFwYXRoWzBdWzBdKSB7IHBhdGggPSB0aGlzLmcuYXBwZW5kKCdwYXRoJyk7IH1cbiAgICAgIC8vIHJlbW92ZSBsaW5lIGlmIG5vIGRhdGFcbiAgICAgIGlmICh0aGlzLmRhdGEoKS5sZW5ndGggPT09IDApIHsgcGF0aC5yZW1vdmUoKTsgfVxuICAgIH1cblxuICAgIFxuICAgIHZhciBfY2lyY2xlQ2xhc3MgPSB0aGlzLmNpcmNsZUNsYXNzKCk7XG4gICAgdmFyIGNpcmNsZUNsYXNzID0gKGQpID0+IHsgcmV0dXJuIF9jaXJjbGVDbGFzcyhkKSB8fCAnJzsgfTtcblxuXG4gICAgLy8gY3JlYXRlIHBvaW50c1xuICAgIHZhciBzZWwgPSB0aGlzLml0ZW1zLmVudGVyKClcbiAgICAgIC5hcHBlbmQoJ2cnKVxuICAgICAgLmNsYXNzZWQoJ2l0ZW0nLCB0cnVlKVxuICAgICAgLmNsYXNzZWQodGhpcy5wYXJhbSgndW5pdENsYXNzJyksIHRydWUpO1xuXG4gICAgc2VsLmFwcGVuZCgnY2lyY2xlJyk7XG5cbiAgICB2YXIgZXhpdCA9IHRoaXMuaXRlbXMuZXhpdCgpO1xuICAgIGV4aXQucmVtb3ZlKCk7XG5cbiAgICB0aGlzLml0ZW1zXG4gICAgICAuZWFjaChmdW5jdGlvbihkLCBpKXtcbiAgICAgICAgdmFyIGVsdCA9IGQzLnNlbGVjdCh0aGlzKTtcbiAgICAgICAgZWx0LmNsYXNzZWQoZC5jaXJjbGVDbGFzcywgdHJ1ZSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIGRyYXcoZWwpIHtcbiAgICBlbCA9IGVsIHx8wqB0aGlzLml0ZW1zO1xuXG4gICAgLy8gdGhpcy5zb3J0RGF0YSgpO1xuXG4gICAgdmFyIF94U2NhbGUgPSB0aGlzLmJhc2UueFNjYWxlO1xuICAgIHZhciBfeVNjYWxlID0gdGhpcy55U2NhbGU7XG4gICAgdmFyIF9jeCA9IHRoaXMuY3goKTtcbiAgICB2YXIgX2N5ID0gdGhpcy5jeSgpO1xuICAgIHZhciBfciAgPSB0aGlzLnIoKTtcbiAgICB2YXIgX2NvbG9yID0gdGhpcy5jb2xvcigpO1xuICAgIHZhciBfb3BhY2l0eSA9IHRoaXMub3BhY2l0eSgpO1xuXG4gICAgdmFyIGN4ID0gKGQpID0+IHsgcmV0dXJuIF94U2NhbGUoX2N4KGQpKTsgfTtcbiAgICB2YXIgY3kgPSAoZCkgPT4geyByZXR1cm4gX3lTY2FsZShfY3koZCkpOyB9O1xuICAgIHZhciByICA9IChkKSA9PiB7IHJldHVybiBfcihkKSB8fCB0aGlzLnBhcmFtKCdyYWRpdXMnKTsgfTtcbiAgICB2YXIgY29sb3IgICA9IChkKSA9PiB7IHJldHVybiBfY29sb3IoZCkgfHzCoHRoaXMucGFyYW0oJ2NvbG9yJyk7IH07XG4gICAgdmFyIG9wYWNpdHkgPSAoZCkgPT4geyByZXR1cm4gX29wYWNpdHkoZCkgfHwgdGhpcy5wYXJhbSgnb3BhY2l0eScpOyB9O1xuXG4gICAgLy8gZHJhdyBsaW5lXG4gICAgaWYgKHRoaXMucGFyYW0oJ2Rpc3BsYXlMaW5lJykpIHtcbiAgICAgIHRoaXMubGluZS54KGN4KS55KGN5KTtcblxuICAgICAgdGhpcy5nLnNlbGVjdCgncGF0aCcpXG4gICAgICAgIC5hdHRyKCdkJywgdGhpcy5saW5lKHRoaXMuc29ydERhdGEoKSkpXG4gICAgICAgIC5hdHRyKCdzdHJva2UnLCB0aGlzLnBhcmFtKCdsaW5lQ29sb3InKSlcbiAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIDEpXG4gICAgICAgIC5hdHRyKCdzdHJva2Utb3BhY2l0eScsIHRoaXMucGFyYW0oJ29wYWNpdHknKSlcbiAgICAgICAgLmF0dHIoJ2ZpbGwnLCAnbm9uZScpO1xuICAgIH1cblxuICAgIC8vIGRyYXcgY2lyY2xlc1xuICAgIGVsLnNlbGVjdEFsbCgnY2lyY2xlJylcbiAgICAgIC5hdHRyKCdmaWxsJywgY29sb3IpXG4gICAgICAuYXR0cignZmlsbC1vcGFjaXR5Jywgb3BhY2l0eSlcbiAgICAgIC5hdHRyKCdjeCcsIDApXG4gICAgICAuYXR0cignY3knLCAwKVxuICAgICAgLmF0dHIoJ3InLCByKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsIChkKSA9PiB7XG4gICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyBjeChkKSArICcsICcgKyBjeShkKSArICcpJztcbiAgICAgIH0pO1xuXG4gICAgaWYgKCEhdGhpcy5lYWNoKCkpIHsgZWwuZWFjaCh0aGlzLmVhY2goKSk7IH1cblxuICAgIHRoaXMuaXRlbXNcbiAgICAgIC5lYWNoKGZ1bmN0aW9uKGQsIGkpe1xuICAgICAgICB2YXIgZWx0ID0gZDMuc2VsZWN0KHRoaXMpO1xuICAgICAgICBlbHQuY2xhc3NlZChkLmNpcmNsZUNsYXNzLCB0cnVlKTtcbiAgICAgIH0pO1xuXG4gIH1cblxuICAvLyBsb2dpYyBwZXJmb3JtZWQgdG8gc2VsZWN0IGFuIGl0ZW0gZnJvbSB0aGUgYnJ1c2hcbiAgaGFuZGxlQnJ1c2goZXh0ZW50LCBlKSB7XG5cbiAgICAvKlxuICAgIG1vZGUgPSBtb2RlIHx8ICd4eSc7IC8vIGRlZmF1bHQgdHJpZXMgdG8gbWF0Y2ggYm90aFxuXG4gICAgdmFyIG1vZGVYID0gbW9kZS5pbmRleE9mKCd4JykgPj0gMDtcbiAgICB2YXIgbW9kZVkgPSBtb2RlLmluZGV4T2YoJ3knKSA+PSAwO1xuICAgIHZhciBtYXRjaFggPSBmYWxzZTtcbiAgICB2YXIgbWF0Y2hZID0gZmFsc2U7XG5cbiAgICB2YXIgciAgPSB0aGlzLnIoKTtcbiAgICB2YXIgY3ggPSB0aGlzLmN4KCk7XG4gICAgdmFyIGN5ID0gdGhpcy5jeSgpO1xuXG4gICAgdGhpcy5nLnNlbGVjdEFsbCgnLnNlbGVjdGFibGUnKS5jbGFzc2VkKCdzZWxlY3RlZCcsIChkLCBpKSA9PiB7XG4gICAgICB2YXIgaGFsZlIgPSByKGQpICogMC41O1xuXG4gICAgICAvLyBYIG1hdGNoXG4gICAgICBpZiAobW9kZVgpIHtcbiAgICAgICAgdmFyIHgxID0gY3goZCkgLSBoYWxmUjtcbiAgICAgICAgdmFyIHgyID0gY3goZCkgKyBoYWxmUjtcbiAgICAgICAgLy8gICAgICAgICAgICBiZWdpbmluZyBzZWwgICAgICAgICAgICAgICBlbmQgc2VsXG4gICAgICAgIHZhciBtYXRjaFgxID0gZXh0ZW50WzBdWzBdIDw9IHgxICYmIHgyIDwgZXh0ZW50WzFdWzBdO1xuICAgICAgICB2YXIgbWF0Y2hYMiA9IGV4dGVudFswXVswXSA8PSB4MiAmJiB4MSA8IGV4dGVudFsxXVswXTtcblxuICAgICAgICBtYXRjaFggPSAobWF0Y2hYMSB8fCBtYXRjaFgyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hdGNoWCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFkgbWF0Y2hcbiAgICAgIGlmIChtb2RlWSkge1xuICAgICAgICB2YXIgeTEgPSBjeShkKSAtIGhhbGZSO1xuICAgICAgICB2YXIgeTIgPSBjeShkKSArIGhhbGZSO1xuICAgICAgICAvLyAgICAgICAgICAgIGJlZ2luaW5nIHNlbCAgICAgICAgICAgICAgIGVuZCBzZWxcbiAgICAgICAgdmFyIG1hdGNoWTEgPSBleHRlbnRbMF1bMV0gPD0geTEgJiYgeTIgPCBleHRlbnRbMV1bMV07XG4gICAgICAgIHZhciBtYXRjaFkyID0gZXh0ZW50WzBdWzFdIDw9IHkyICYmIHkxIDw9IGV4dGVudFsxXVsxXTtcbiAgICAgICAgbWF0Y2hZID0gKG1hdGNoWTEgfHwgbWF0Y2hZMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXRjaFkgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbWF0Y2hYICYmIG1hdGNoWTtcbiAgICB9KTtcbiAgICAqL1xuICB9XG5cbiAgaGFuZGxlRHJhZyhpdGVtLCBlKSB7XG4gICAgaWYgKGl0ZW0gPT09IG51bGwpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLm1vdmUoaXRlbSwgZS5vcmlnaW5hbEV2ZW50LmR4LCBlLm9yaWdpbmFsRXZlbnQuZHkpO1xuICB9XG5cbiAgbW92ZShpdGVtLCBkeCwgZHkpIHtcbiAgICBpdGVtID0gdGhpcy5kMy5zZWxlY3QoaXRlbSk7XG4gICAgdmFyIGRhdHVtID0gaXRlbS5kYXR1bSgpO1xuXG4gICAgdmFyIHhTY2FsZSA9IHRoaXMuYmFzZS54U2NhbGU7XG4gICAgdmFyIHlTY2FsZSA9IHRoaXMueVNjYWxlO1xuICAgIHZhciB5UmFuZ2UgPSB5U2NhbGUucmFuZ2UoKTtcblxuICAgIHZhciBjeCA9IHRoaXMuY3goKTtcbiAgICB2YXIgY3kgPSB0aGlzLmN5KCk7XG4gICAgdmFyIHggPSB4U2NhbGUoY3goZGF0dW0pKTtcbiAgICB2YXIgeSA9IHlTY2FsZShjeShkYXR1bSkpO1xuICAgIC8vIHVwZGF0ZSByYW5nZVxuICAgIHggKz0gZHg7XG5cbiAgICAvLyBjbGFtcCB5XG4gICAgdmFyIHRhcmdldFkgPSB5ICsgZHk7XG4gICAgaWYgKHRhcmdldFkgPD0geVJhbmdlWzBdICYmIHRhcmdldFkgPj0geVJhbmdlWzFdKSB7XG4gICAgICB5ID0gdGFyZ2V0WTtcbiAgICB9XG5cbiAgICAvLyByYW5nZSB0byBkb21haW5cbiAgICB2YXIgeFZhbHVlID0geFNjYWxlLmludmVydCh4KTtcbiAgICB2YXIgeVZhbHVlID0geVNjYWxlLmludmVydCh5KTtcbiAgICAvLyB1cGRhdGUgZGF0YVxuICAgIGN4KGRhdHVtLCB4VmFsdWUpO1xuICAgIGN5KGRhdHVtLCB5VmFsdWUpO1xuICAgIC8vIHJlZHJhdyB2aWV3XG4gICAgdGhpcy5kcmF3KGl0ZW0pO1xuICB9XG5cbn1cblxuLy8gYWRkIGRhdGEgYWNjZXNzb3JzXG5hY2Nlc3NvcnMuZ2V0RnVuY3Rpb24oQnJlYWtwb2ludC5wcm90b3R5cGUsIFtcbiAgJ2N4JywgJ2N5JywgJ3InLCAnb3BhY2l0eScsICdjb2xvcicsICdjaXJjbGVDbGFzcydcbl0pO1xuXG5mdW5jdGlvbiBmYWN0b3J5KCkgeyByZXR1cm4gbmV3IEJyZWFrcG9pbnQoKTsgfVxuZmFjdG9yeS5CcmVha3BvaW50ID0gQnJlYWtwb2ludDtcblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuIl19