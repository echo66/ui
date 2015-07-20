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

var MovableWaveform = (function (_Layer) {
  function MovableWaveform() {
    _classCallCheck(this, MovableWaveform);

    _get(_core.Object.getPrototypeOf(MovableWaveform.prototype), "constructor", this).call(this);
    // set layer defaults
    this.params({
      type: "movable-waveform",
      opacity: 1,
      edits: ["x", "y", "width", "height"],
      handlerWidth: 2,
      handlerOpacity: 0
    });

    this.__minWidth = 1;

    // initialize data accessors
    this.y(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.y || 0;
      d.y = +v;
    });

    this.height(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.height || 1;
      d.height = +v;
    });

    this.duration(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.duration || 1;
      d.duration = +v;
    });

    this.start(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return +d.start || 0;
      d.start = +v;
    });

    this.color(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return d.color ? d.color + "" : "#000000";
      d.color = v + "";
    });

    this.opacity(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return d.opacity;
      d.opacity = v + "";
    });

    this.waveform(function (d) {
      var v = arguments[1] === undefined ? null : arguments[1];

      if (v === null) return d.waveform;
      d.waveform = v;
    });
  }

  _inherits(MovableWaveform, _Layer);

  _createClass(MovableWaveform, {
    getAccessors: {

      // @NOTE add some caching system ?

      value: function getAccessors() {
        var _this = this;

        // reverse yScale to have logical sizes
        // only y is problematic this way
        var xScale = this.base.xScale;
        var yScale = this.yScale.copy();
        yScale.range(yScale.range().slice(0).reverse());
        var height = yScale.range()[1];
        var minDomain = xScale.domain()[0];

        var _x = this.start();
        var _y = this.y();
        var _w = this.duration();
        var _h = this.height();

        var _color = this.color();
        var _opacity = this.opacity();

        // define accesors
        var x = function (d) {
          return xScale(_x(d));
        };
        var w = function (d) {
          var width = xScale(minDomain + _w(d));
          return width < 0 ? 0 : width;
        };
        var h = function (d) {
          return yScale(_h(d));
        };
        var y = function (d) {
          return height - h(d) - yScale(_y(d));
        };

        var color = function (d) {
          return _color(d);
        };
        var opacity = function (d) {
          return _opacity(d) || _this.param("opacity");
        };

        var _handlerWidth = parseInt(this.param("handlerWidth"), 10);
        var _halfHandler = _handlerWidth * 0.5;

        // handler position
        var rhx = function (d) {
          var width = w(d);

          return width < _handlerWidth * 2 ? _handlerWidth + _this.__minWidth : width - _halfHandler;
        };

        var waveform = function (d) {
          return d.waveform;
        };

        return { w: w, h: h, x: x, y: y, color: color, opacity: opacity, xScale: xScale, yScale: yScale, rhx: rhx, waveform: waveform };
      }
    },
    setWaveform: {
      value: function setWaveform() {

        var mydata;
        var range;
        var domain;

        var area = d3.svg.area().defined(function (d, i) {
          return true;
        }).x(function (d, i) {

          var S = d3.scale.linear().domain(domain).range(range);

          return S(d.x);
        }).y0(function (d, i) {
          return i % 2 === 0 ? mydata[i].y : mydata[i - 1].y;
        }).y1(function (d, i) {
          return i % 2 === 0 ? mydata[i + 1].y : mydata[i].y;
        });

        // console.log(this.g.selectAll('.' + this.param('unitClass')));

        var accessors = this.getAccessors();

        this.g.selectAll("." + this.param("unitClass")).selectAll("path").style("fill", "red").style("stroke", "red")
        // .style('shape-rendering', 'crispEdges')
        .attr("x", 0).attr("y", 0).attr("d", function (d) {
          range = [0, accessors.w(d)];
          domain = [0, d.waveform.length - 1];
          mydata = d.waveform;
          var pathStr = area(d.waveform);
          mydata = null;
          return pathStr;
        });
      }
    },
    update: {
      value: function update(data) {

        console.info("MovableWaveform::update");

        _get(_core.Object.getPrototypeOf(MovableWaveform.prototype), "update", this).call(this, data);

        this.items = this.g.selectAll("." + this.param("unitClass")).data(this.data());

        var sel = this.items.enter().append("g").classed("item", true).classed(this.param("unitClass"), true);

        sel.append("rect");

        sel.append("path");

        if (this.param("interactions").editable) {
          sel.append("line").attr("class", "handle left").attr("stroke-width", this.param("handlerWidth")).attr("stroke-opacity", this.param("handlerOpacity"));

          sel.append("line").attr("class", "handle right").attr("stroke-width", this.param("handlerWidth")).attr("stroke-opacity", this.param("handlerOpacity"));
        }

        this.items.exit().remove();

        this.setWaveform();
      }
    },
    draw: {
      value: function draw() {
        var el = arguments[0] === undefined ? null : arguments[0];

        console.info("MovableWaveform::draw");

        el = el || this.items;

        var accessors = this.getAccessors();

        el.attr("transform", function (d) {
          return "translate(" + accessors.x(d) + ", " + accessors.y(d) + ")";
        });

        // var dddd = [];
        // for (var I=0; I<20; I++) {
        //   dddd[I] = {
        //     x: I,
        //     y: 50 * Math.random()
        //   };
        // }
        // // console.log(dddd);

        el.selectAll("rect").attr("x", 0).attr("y", 0).attr("width", accessors.w).attr("height", accessors.h).attr("fill", accessors.color).attr("fill-opacity", accessors.opacity);

        if (!!this.each()) {
          el.each(this.each());
        }

        if (this.param("interactions").editable) {

          var _handlerWidth = parseInt(this.param("handlerWidth"), 10);
          var _halfHandler = _handlerWidth * 0.5;

          el.selectAll(".handle.left").attr("x1", _halfHandler).attr("x2", _halfHandler).attr("y1", 0).attr("y2", accessors.h).style("stroke", accessors.color);

          el.selectAll(".handle.right").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", accessors.h).attr("transform", function (d) {
            return "translate(" + accessors.rhx(d) + ", 0)";
          }).style("stroke", accessors.color);
        }

        // var mydata;

        // var area = d3.svg.area()
        //   .defined((d, i) => {
        //     return true;
        //   })
        //   .x((d, i) => {
        //     return i;
        //   })
        //   .y0((d, i) => {
        //     return i % 2 === 0 ? (mydata[i].y) : (mydata[i - 1].y);
        //   })
        //   .y1((d, i) => {
        //     return i % 2 === 0 ? (mydata[i + 1].y) : (mydata[i].y);
        //   });

        // el.selectAll('path')
        //   .style('fill', 'red')
        //   .style('stroke', 'red')
        //   .style('shape-rendering', 'crispEdges')
        //   .attr('x', 0)
        //   .attr('y', 0)
        //   .attr('d', (d) => {
        //     mydata = accessors.waveform(d);
        //     // // console.log(mydata);
        //     var pathStr = area(accessors.waveform(d));
        //     // // console.log(pathStr);
        //     mydata = null;
        //     return pathStr;
        //   });

        this.setWaveform();
      }
    },
    xZoom: {
      value: function xZoom(val) {
        this.draw();
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

        var classList = e.target.classList;
        var mode = "move";
        // if the target is an handler
        if (classList.contains("left")) {
          mode = "resizeLeft";
        }
        if (classList.contains("right")) {
          mode = "resizeRight";
        }

        this[mode](item, e.originalEvent.dx, e.originalEvent.dy);
      }
    },
    move: {
      value: function move(item, dx, dy) {
        item = this.d3.select(item);
        var datum = item.datum();

        // console.info("MovableWaveform::move");
        // // console.info(item);
        // // console.info(datum);

        // define constrains
        var constrains = this.param("edits");
        var canX = !! ~constrains.indexOf("x");
        var canY = !! ~constrains.indexOf("y");
        // early return if cannot edit x and y
        if (!canX && !canY) {
          return;
        }
        // else lock the corresponding axis
        if (!canX) {
          dx = 0;
        }
        if (!canY) {
          dy = 0;
        }

        var accessors = this.getAccessors();

        var xScale = accessors.xScale;
        var yScale = accessors.yScale;
        var xRange = xScale.range();
        var yRange = yScale.range();

        var x = accessors.x(datum);
        var w = accessors.w(datum);
        var h = accessors.h(datum);
        var y = yScale(this.y()(datum));

        // handle x position - lock to boundaries
        var targetX = x + dx;
        if (targetX >= xRange[0] && targetX + w <= xRange[1]) {
          x = targetX;
        } else if (targetX < xRange[0]) {
          x = xRange[0];
        } else if (targetX + w > xRange[1]) {
          x = xRange[1] - w;
        }

        // handle y position - lock to boundaries
        // var targetY = y + dy;
        var targetY = 0;
        var yDisplayed = yRange[1] - h - targetY;

        if (yDisplayed >= yRange[0] && yDisplayed + h <= yRange[1]) {
          y = targetY;
        } else if (yDisplayed < yRange[0]) {
          y = yRange[1] - h;
        } else if (yDisplayed + h > yRange[1]) {
          y = yRange[0];
        }

        var xValue = xScale.invert(x);
        var yValue = yScale.invert(y);

        this.start()(datum, xValue);
        this.y()(datum, yValue);

        this.draw(item);
      }
    },
    resizeLeft: {
      value: function resizeLeft(item, dx, dy) {
        item = this.d3.select(item);
        var datum = item.datum();

        var constrains = this.param("edits");
        var canW = !! ~constrains.indexOf("width");
        // early return if cannot edit
        if (!canW) {
          return;
        }

        var accessors = this.getAccessors();
        var xRange = accessors.xScale.range();

        var x = accessors.x(datum);
        var w = accessors.w(datum);

        var targetX = x + dx;
        var targetW = w - dx;

        if (targetX >= xRange[0] && targetW >= this.__minWidth) {
          x = targetX;
          w = targetW;
        }

        var xValue = accessors.xScale.invert(x);
        var minDomain = accessors.xScale.domain()[0];
        var wValue = accessors.xScale.invert(w) - minDomain;

        this.start()(datum, xValue);
        this.duration()(datum, wValue);

        this.draw(item);
      }
    },
    resizeRight: {
      value: function resizeRight(item, dx, dy) {
        item = this.d3.select(item);
        var datum = item.datum();

        var constrains = this.param("edits");
        var canW = !! ~constrains.indexOf("width");
        // early return if cannot edit
        if (!canW) {
          return;
        }

        var accessors = this.getAccessors();
        var xRange = accessors.xScale.range();

        var x = accessors.x(datum);
        var w = accessors.w(datum);

        var targetW = w + dx;

        if (targetW >= this.__minWidth && x + targetW <= xRange[1]) {
          w = targetW;
        }

        var minDomain = accessors.xScale.domain()[0];
        var wValue = accessors.xScale.invert(w) - minDomain;
        this.duration()(datum, wValue);

        this.draw(item);
      }
    }
  });

  return MovableWaveform;
})(Layer);

// add and initialize our accessors
accessors.getFunction(MovableWaveform.prototype, ["y", "width", "color", "height", "duration", "start", "sortIndex", "opacity", "waveform"]);

function factory() {
  return new MovableWaveform();
}
factory.MovableWaveform = MovableWaveform;

module.exports = factory;

// brushItem(extent, mode) {
/*
mode = mode || 'xy'; // default tries to match both
 var modeX = mode.indexOf('x') >= 0;
var modeY = mode.indexOf('y') >= 0;
var matchX = false, matchY = false;
 // data mappers
var start = this.start();
var duration = this.duration();
var y = this.y();
var height = this.height();
 this.g.selectAll('.selectable').classed('selected', (d, i) => {
  // var offsetTop = (that.top() || 0) + (that.base.margin().top || 0);
  // var offsetLeft = (that.left || 0) + (that.base.margin().left || 0);
   // X match
  if (modeX) {
    var x1 = start(d);
    var x2 = x1 + duration(d);
    //            begining sel               end sel
    var matchX1 = extent[0][0] <= x1 && x2 < extent[1][0];
    var matchX2 = extent[0][0] <= x2 && x1 < extent[1][0];
     matchX = (matchX1 || matchX2);
  } else {
    matchX = true;
  }
   // Y match
  if (modeY) {
    var y1 = y(d);
    var y2 = y1 + height(d);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7ZUFFaUIsT0FBTyxDQUFDLGtCQUFrQixDQUFDOztJQUFuRCxRQUFRLFlBQVIsUUFBUTtJQUFFLFNBQVMsWUFBVCxTQUFTOztnQkFDVCxPQUFPLENBQUMsZUFBZSxDQUFDOztJQUFsQyxLQUFLLGFBQUwsS0FBSzs7SUFFTCxlQUFlO0FBRVIsV0FGUCxlQUFlLEdBRUw7MEJBRlYsZUFBZTs7QUFHakIscUNBSEUsZUFBZSw2Q0FHVDs7QUFFUixRQUFJLENBQUMsTUFBTSxDQUFDO0FBQ1YsVUFBSSxFQUFFLGtCQUFrQjtBQUN4QixhQUFPLEVBQUUsQ0FBQztBQUNWLFdBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQztBQUNwQyxrQkFBWSxFQUFFLENBQUM7QUFDZixvQkFBYyxFQUFFLENBQUM7S0FDbEIsQ0FBQyxDQUFDOztBQUVILFFBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDOzs7QUFHcEIsUUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFTLENBQUMsRUFBWTtVQUFWLENBQUMsZ0NBQUcsSUFBSTs7QUFDekIsVUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxPQUFDLENBQUMsQ0FBQyxHQUFJLENBQUMsQ0FBQyxBQUFDLENBQUM7S0FDWixDQUFDLENBQUM7O0FBRUgsUUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFTLENBQUMsRUFBWTtVQUFWLENBQUMsZ0NBQUcsSUFBSTs7QUFDOUIsVUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQztBQUN0QyxPQUFDLENBQUMsTUFBTSxHQUFJLENBQUMsQ0FBQyxBQUFDLENBQUM7S0FDakIsQ0FBQyxD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QVMsQ0FBQztBQUNwRCxZQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUUvQixZQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ2pCOzs7O1NBbGRHLGVBQWU7R0FBUyxLQUFLOzs7QUF1ZG5DLFNBQVMsQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxDQUMvQyxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FDekYsQ0FBQyxDQUFDOztBQUVILFNBQVMsT0FBTyxHQUFHO0FBQUUsU0FBTyxJQUFJLGVBQWUsRUFBRSxDQUFDO0NBQUU7QUFDcEQsT0FBTyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7O0FBRTFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIiwiZmlsZSI6ImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciB7IHVuaXF1ZUlkLCBhY2Nlc3NvcnMgfSA9IHJlcXVpcmUoJy4uL2hlbHBlcnMvdXRpbHMnKTtcbnZhciB7IExheWVyIH0gPSByZXF1aXJlKCcuLi9jb3JlL2xheWVyJyk7XG5cbmNsYXNzIE1vdmFibGVXYXZlZm9ybSBleHRlbmRzIExheWVyIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIC8vIHNldCBsYXllciBkZWZhdWx0c1xuICAgIHRoaXMucGFyYW1zKHtcbiAgICAgIHR5cGU6ICdtb3ZhYmxlLXdhdmVmb3JtJyxcbiAgICAgIG9wYWNpdHk6IDEsXG4gICAgICBlZGl0czogWyd4JywgJ3knLCAnd2lkdGgnLCAnaGVpZ2h0J10sXG4gICAgICBoYW5kbGVyV2lkdGg6IDIsXG4gICAgICBoYW5kbGVyT3BhY2l0eTogMFxuICAgIH0pO1xuXG4gICAgdGhpcy5fX21pbldpZHRoID0gMTtcblxuICAgIC8vIGluaXRpYWxpemUgZGF0YSBhY2Nlc3NvcnNcbiAgICB0aGlzLnkoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSByZXR1cm4gK2QueSB8fMKgMDtcbiAgICAgIGQueSA9ICgrdik7XG4gICAgfSk7XG5cbiAgICB0aGlzLmhlaWdodChmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHJldHVybiArZC5oZWlnaHQgfHzCoDE7XG4gICAgICBkLmhlaWdodCA9ICgrdik7XG4gICAgfSk7XG5cbiAgICB0aGlzLmR1cmF0aW9uKGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgcmV0dXJuICtkLmR1cmF0aW9uIHx8wqAxO1xuICAgICAgZC5kdXJhdGlvbiA9ICgrdik7XG4gICAgfSk7XG5cbiAgICB0aGlzLnN0YXJ0KGZ1bmN0aW9uKGQsIHYgPSBudWxsKSB7XG4gICAgICBpZiAodiA9PT0gbnVsbCkgcmV0dXJuICtkLnN0YXJ0IHx8IDA7XG4gICAgICBkLnN0YXJ0ID0gKCt2KTtcbiAgICB9KTtcblxuICAgIHRoaXMuY29sb3IoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSByZXR1cm4gZC5jb2xvciA/IGQuY29sb3IgKyAnJyA6ICcjMDAwMDAwJztcbiAgICAgIGQuY29sb3IgPSB2ICsgJyc7XG4gICAgfSk7XG5cbiAgICB0aGlzLm9wYWNpdHkoZnVuY3Rpb24oZCwgdiA9IG51bGwpIHtcbiAgICAgIGlmICh2ID09PSBudWxsKSByZXR1cm4gZC5vcGFjaXR5O1xuICAgICAgZC5vcGFjaXR5ID0gdiArICcnO1xuICAgIH0pO1xuXG4gICAgdGhpcy53YXZlZm9ybShmdW5jdGlvbihkLCB2ID0gbnVsbCkge1xuICAgICAgaWYgKHYgPT09IG51bGwpIHJldHVybiBkLndhdmVmb3JtO1xuICAgICAgZC53YXZlZm9ybSA9IHY7XG4gICAgfSk7XG4gIH1cblxuICAvLyBATk9URSBhZGQgc29tZSBjYWNoaW5nIHN5c3RlbSA/XG4gIGdldEFjY2Vzc29ycygpIHtcbiAgICAvLyByZXZlcnNlIHlTY2FsZSB0byBoYXZlIGxvZ2ljYWwgc2l6ZXNcbiAgICAvLyBvbmx5IHkgaXMgcHJvYmxlbWF0aWMgdGhpcyB3YXlcbiAgICB2YXIgeFNjYWxlID0gdGhpcy5iYXNlLnhTY2FsZTtcbiAgICB2YXIgeVNjYWxlID0gdGhpcy55U2NhbGUuY29weSgpO1xuICAgIHlTY2FsZS5yYW5nZSh5U2NhbGUucmFuZ2UoKS5zbGljZSgwKS5yZXZlcnNlKCkpO1xuICAgIHZhciBoZWlnaHQgPSB5U2NhbGUucmFuZ2UoKVsxXTtcbiAgICB2YXIgbWluRG9tYWluID0geFNjYWxlLmRvbWFpbigpWzBdO1xuXG4gICAgdmFyIF94ID0gdGhpcy5zdGFydCgpO1xuICAgIHZhciBfeSA9IHRoaXMueSgpO1xuICAgIHZhciBfdyA9IHRoaXMuZHVyYXRpb24oKTtcbiAgICB2YXIgX2ggPSB0aGlzLmhlaWdodCgpO1xuXG4gICAgdmFyIF9jb2xvciAgICA9IHRoaXMuY29sb3IoKTtcbiAgICB2YXIgX29wYWNpdHkgID0gdGhpcy5vcGFjaXR5KCk7XG5cbiAgICAvLyBkZWZpbmUgYWNjZXNvcnNcbiAgICB2YXIgeCA9IChkKSA9PiB7IHJldHVybiB4U2NhbGUoX3goZCkpOyB9O1xuICAgIHZhciB3ID0gKGQpID0+IHtcbiAgICAgIHZhciB3aWR0aCA9IHhTY2FsZShtaW5Eb21haW4gKyBfdyhkKSk7XG4gICAgICByZXR1cm4gd2lkdGggPCAwID8gMCA6IHdpZHRoO1xuICAgIH07XG4gICAgdmFyIGggPSAoZCkgPT4geyBcbiAgICAgIHJldHVybiB5U2NhbGUoX2goZCkpOyBcbiAgICB9O1xuICAgIHZhciB5ID0gKGQpID0+IHsgXG4gICAgICByZXR1cm4gaGVpZ2h0IC0gaChkKSAtIHlTY2FsZShfeShkKSk7IFxuICAgIH07XG5cbiAgICB2YXIgY29sb3IgPSAoZCkgPT4geyBcbiAgICAgIHJldHVybiBfY29sb3IoZCk7IFxuICAgIH07XG4gICAgdmFyIG9wYWNpdHkgPSAoZCkgPT4ge1xuICAgICByZXR1cm4gKF9vcGFjaXR5KGQpIHx8wqB0aGlzLnBhcmFtKCdvcGFjaXR5JykpOyBcbiAgICB9O1xuXG4gICAgdmFyIF9oYW5kbGVyV2lkdGggPSBwYXJzZUludCh0aGlzLnBhcmFtKCdoYW5kbGVyV2lkdGgnKSwgMTApO1xuICAgIHZhciBfaGFsZkhhbmRsZXIgPSBfaGFuZGxlcldpZHRoICogMC41O1xuXG4gICAgLy8gaGFuZGxlciBwb3NpdGlvblxuICAgIHZhciByaHggPSAoZCkgPT4ge1xuICAgICAgbGV0IHdpZHRoID0gdyhkKTtcblxuICAgICAgcmV0dXJuICh3aWR0aCA8IChfaGFuZGxlcldpZHRoICogMikpID9cbiAgICAgICAgX2hhbmRsZXJXaWR0aCArIHRoaXMuX19taW5XaWR0aCA6IHdpZHRoIC0gX2hhbGZIYW5kbGVyO1xuICAgIH07XG5cbiAgICB2YXIgd2F2ZWZvcm0gPSAoZCkgPT4ge1xuICAgICAgcmV0dXJuIGQud2F2ZWZvcm07XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdywgaCwgeCwgeSwgY29sb3IsIG9wYWNpdHksIHhTY2FsZSwgeVNjYWxlLCByaHgsIHdhdmVmb3JtIH07XG4gIH1cblxuICBzZXRXYXZlZm9ybSgpIHtcblxuICAgIHZhciBteWRhdGE7XG4gICAgdmFyIHJhbmdlO1xuICAgIHZhciBkb21haW47XG5cbiAgICB2YXIgYXJlYSA9IGQzLnN2Zy5hcmVhKClcbiAgICAgIC5kZWZpbmVkKChkLCBpKSA9PiB7IFxuICAgICAgICByZXR1cm4gdHJ1ZTsgXG4gICAgICB9KVxuICAgICAgLngoKGQsIGkpID0+IHsgXG5cbiAgICAgICAgdmFyIFMgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgICAgICAgICAgICAgICAuZG9tYWluKGRvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgLnJhbmdlKHJhbmdlKTtcblxuICAgICAgICByZXR1cm4gUyhkLngpOyBcbiAgICAgIH0pXG4gICAgICAueTAoKGQsIGkpID0+IHsgXG4gICAgICAgIHJldHVybiBpICUgMiA9PT0gMCA/IChteWRhdGFbaV0ueSkgOiAobXlkYXRhW2kgLSAxXS55KTsgXG4gICAgICB9KVxuICAgICAgLnkxKChkLCBpKSA9PiB7IFxuICAgICAgICByZXR1cm4gaSAlIDIgPT09IDAgPyAobXlkYXRhW2kgKyAxXS55KSA6IChteWRhdGFbaV0ueSk7IFxuICAgICAgfSk7XG5cblxuICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZy5zZWxlY3RBbGwoJy4nICsgdGhpcy5wYXJhbSgndW5pdENsYXNzJykpKTtcblxuICAgIHZhciBhY2Nlc3NvcnMgPSB0aGlzLmdldEFjY2Vzc29ycygpO1xuXG4gICAgdGhpcy5nLnNlbGVjdEFsbCgnLicgKyB0aGlzLnBhcmFtKCd1bml0Q2xhc3MnKSkuc2VsZWN0QWxsKCdwYXRoJylcbiAgICAgIC5zdHlsZSgnZmlsbCcsICdyZWQnKVxuICAgICAgLnN0eWxlKCdzdHJva2UnLCAncmVkJylcbiAgICAgIC8vIC5zdHlsZSgnc2hhcGUtcmVuZGVyaW5nJywgJ2NyaXNwRWRnZXMnKVxuICAgICAgLmF0dHIoJ3gnLCAwKVxuICAgICAgLmF0dHIoJ3knLCAwKVxuICAgICAgLmF0dHIoJ2QnLCAoZCkgPT4ge1xuICAgICAgICByYW5nZSA9IFswLCBhY2Nlc3NvcnMudyhkKV07XG4gICAgICAgIGRvbWFpbiA9IFswLCBkLndhdmVmb3JtLmxlbmd0aC0xXTtcbiAgICAgICAgbXlkYXRhID0gZC53YXZlZm9ybTtcbiAgICAgICAgdmFyIHBhdGhTdHIgPSBhcmVhKGQud2F2ZWZvcm0pO1xuICAgICAgICBteWRhdGEgPSBudWxsO1xuICAgICAgICByZXR1cm4gcGF0aFN0cjtcbiAgICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlKGRhdGEpIHtcblxuICAgIGNvbnNvbGUuaW5mbyhcIk1vdmFibGVXYXZlZm9ybTo6dXBkYXRlXCIpO1xuXG4gICAgc3VwZXIudXBkYXRlKGRhdGEpO1xuXG4gICAgdGhpcy5pdGVtcyA9IHRoaXMuZy5zZWxlY3RBbGwoJy4nICsgdGhpcy5wYXJhbSgndW5pdENsYXNzJykpXG4gICAgICAuZGF0YSh0aGlzLmRhdGEoKSk7XG5cbiAgICB2YXIgc2VsID0gdGhpcy5pdGVtcy5lbnRlcigpXG4gICAgICAuYXBwZW5kKCdnJylcbiAgICAgIC5jbGFzc2VkKCdpdGVtJywgdHJ1ZSlcbiAgICAgIC5jbGFzc2VkKHRoaXMucGFyYW0oJ3VuaXRDbGFzcycpLCB0cnVlKTtcblxuICAgIHNlbC5hcHBlbmQoJ3JlY3QnKTtcblxuICAgIHNlbC5hcHBlbmQoJ3BhdGgnKTtcblxuICAgIGlmICh0aGlzLnBhcmFtKCdpbnRlcmFjdGlvbnMnKS5lZGl0YWJsZSkge1xuICAgICAgc2VsLmFwcGVuZCgnbGluZScpXG4gICAgICAgIC5hdHRyKCdjbGFzcycsICdoYW5kbGUgbGVmdCcpXG4gICAgICAgIC5hdHRyKCdzdHJva2Utd2lkdGgnLCB0aGlzLnBhcmFtKCdoYW5kbGVyV2lkdGgnKSlcbiAgICAgICAgLmF0dHIoJ3N0cm9rZS1vcGFjaXR5JywgdGhpcy5wYXJhbSgnaGFuZGxlck9wYWNpdHknKSk7XG5cbiAgICAgIHNlbC5hcHBlbmQoJ2xpbmUnKVxuICAgICAgICAuYXR0cignY2xhc3MnLCAnaGFuZGxlIHJpZ2h0JylcbiAgICAgICAgLmF0dHIoJ3N0cm9rZS13aWR0aCcsIHRoaXMucGFyYW0oJ2hhbmRsZXJXaWR0aCcpKVxuICAgICAgICAuYXR0cignc3Ryb2tlLW9wYWNpdHknLCB0aGlzLnBhcmFtKCdoYW5kbGVyT3BhY2l0eScpKTtcbiAgICB9XG5cbiAgICB0aGlzLml0ZW1zLmV4aXQoKS5yZW1vdmUoKTtcblxuICAgIHRoaXMuc2V0V2F2ZWZvcm0oKTtcbiAgfVxuXG4gIGRyYXcoZWwgPSBudWxsKSB7XG4gICAgY29uc29sZS5pbmZvKFwiTW92YWJsZVdhdmVmb3JtOjpkcmF3XCIpO1xuXG4gICAgZWwgPSBlbCB8fCB0aGlzLml0ZW1zO1xuXG4gICAgdmFyIGFjY2Vzc29ycyA9IHRoaXMuZ2V0QWNjZXNzb3JzKCk7XG5cbiAgICBlbC5hdHRyKCd0cmFuc2Zvcm0nLCAoZCkgPT4ge1xuICAgICAgcmV0dXJuICd0cmFuc2xhdGUoJyArIGFjY2Vzc29ycy54KGQpICsgJywgJyArIGFjY2Vzc29ycy55KGQpICsgJyknO1xuICAgIH0pO1xuXG5cbiAgICAvLyB2YXIgZGRkZCA9IFtdO1xuICAgIC8vIGZvciAodmFyIEk9MDsgSTwyMDsgSSsrKSB7XG4gICAgLy8gICBkZGRkW0ldID0ge1xuICAgIC8vICAgICB4OiBJLCBcbiAgICAvLyAgICAgeTogNTAgKiBNYXRoLnJhbmRvbSgpXG4gICAgLy8gICB9O1xuICAgIC8vIH1cbiAgICAvLyAvLyBjb25zb2xlLmxvZyhkZGRkKTtcblxuXG4gICAgZWwuc2VsZWN0QWxsKCdyZWN0JylcbiAgICAgIC5hdHRyKCd4JywgMClcbiAgICAgIC5hdHRyKCd5JywgMClcbiAgICAgIC5hdHRyKCd3aWR0aCcsIGFjY2Vzc29ycy53KVxuICAgICAgLmF0dHIoJ2hlaWdodCcsIGFjY2Vzc29ycy5oKVxuICAgICAgLmF0dHIoJ2ZpbGwnLCBhY2Nlc3NvcnMuY29sb3IpXG4gICAgICAuYXR0cignZmlsbC1vcGFjaXR5JywgYWNjZXNzb3JzLm9wYWNpdHkpO1xuXG4gICAgaWYgKCEhdGhpcy5lYWNoKCkpIHsgZWwuZWFjaCh0aGlzLmVhY2goKSk7IH1cblxuICAgIGlmICh0aGlzLnBhcmFtKCdpbnRlcmFjdGlvbnMnKS5lZGl0YWJsZSkge1xuXG4gICAgICB2YXIgX2hhbmRsZXJXaWR0aCA9IHBhcnNlSW50KHRoaXMucGFyYW0oJ2hhbmRsZXJXaWR0aCcpLCAxMCk7XG4gICAgICB2YXIgX2hhbGZIYW5kbGVyID0gX2hhbmRsZXJXaWR0aCAqIDAuNTtcblxuICAgICAgZWwuc2VsZWN0QWxsKCcuaGFuZGxlLmxlZnQnKVxuICAgICAgICAuYXR0cigneDEnLCBfaGFsZkhhbmRsZXIpXG4gICAgICAgIC5hdHRyKCd4MicsIF9oYWxmSGFuZGxlcilcbiAgICAgICAgLmF0dHIoJ3kxJywgMClcbiAgICAgICAgLmF0dHIoJ3kyJywgYWNjZXNzb3JzLmgpXG4gICAgICAgIC5zdHlsZSgnc3Ryb2tlJywgYWNjZXNzb3JzLmNvbG9yKTtcblxuICAgICAgZWwuc2VsZWN0QWxsKCcuaGFuZGxlLnJpZ2h0JylcbiAgICAgICAgLmF0dHIoJ3gxJywgMClcbiAgICAgICAgLmF0dHIoJ3gyJywgMClcbiAgICAgICAgLmF0dHIoJ3kxJywgMClcbiAgICAgICAgLmF0dHIoJ3kyJywgYWNjZXNzb3JzLmgpXG4gICAgICAgIC5hdHRyKCd0cmFuc2Zvcm0nLCAoZCkgPT4ge1xuICAgICAgICAgIHJldHVybiAndHJhbnNsYXRlKCcgKyBhY2Nlc3NvcnMucmh4KGQpICsgJywgMCknO1xuICAgICAgICB9KVxuICAgICAgICAuc3R5bGUoJ3N0cm9rZScsIGFjY2Vzc29ycy5jb2xvcik7XG4gICAgfVxuXG4gICAgLy8gdmFyIG15ZGF0YTtcblxuICAgIC8vIHZhciBhcmVhID0gZDMuc3ZnLmFyZWEoKVxuICAgIC8vICAgLmRlZmluZWQoKGQsIGkpID0+IHsgXG4gICAgLy8gICAgIHJldHVybiB0cnVlOyBcbiAgICAvLyAgIH0pXG4gICAgLy8gICAueCgoZCwgaSkgPT4geyBcbiAgICAvLyAgICAgcmV0dXJuIGk7IFxuICAgIC8vICAgfSlcbiAgICAvLyAgIC55MCgoZCwgaSkgPT4geyBcbiAgICAvLyAgICAgcmV0dXJuIGkgJSAyID09PSAwID8gKG15ZGF0YVtpXS55KSA6IChteWRhdGFbaSAtIDFdLnkpOyBcbiAgICAvLyAgIH0pXG4gICAgLy8gICAueTEoKGQsIGkpID0+IHsgXG4gICAgLy8gICAgIHJldHVybiBpICUgMiA9PT0gMCA/IChteWRhdGFbaSArIDFdLnkpIDogKG15ZGF0YVtpXS55KTsgXG4gICAgLy8gICB9KTtcblxuICAgIC8vIGVsLnNlbGVjdEFsbCgncGF0aCcpXG4gICAgLy8gICAuc3R5bGUoJ2ZpbGwnLCAncmVkJylcbiAgICAvLyAgIC5zdHlsZSgnc3Ryb2tlJywgJ3JlZCcpXG4gICAgLy8gICAuc3R5bGUoJ3NoYXBlLXJlbmRlcmluZycsICdjcmlzcEVkZ2VzJylcbiAgICAvLyAgIC5hdHRyKCd4JywgMClcbiAgICAvLyAgIC5hdHRyKCd5JywgMClcbiAgICAvLyAgIC5hdHRyKCdkJywgKGQpID0+IHtcbiAgICAvLyAgICAgbXlkYXRhID0gYWNjZXNzb3JzLndhdmVmb3JtKGQpO1xuICAgIC8vICAgICAvLyAvLyBjb25zb2xlLmxvZyhteWRhdGEpO1xuICAgIC8vICAgICB2YXIgcGF0aFN0ciA9IGFyZWEoYWNjZXNzb3JzLndhdmVmb3JtKGQpKTtcbiAgICAvLyAgICAgLy8gLy8gY29uc29sZS5sb2cocGF0aFN0cik7XG4gICAgLy8gICAgIG15ZGF0YSA9IG51bGw7XG4gICAgLy8gICAgIHJldHVybiBwYXRoU3RyO1xuICAgIC8vICAgfSk7XG5cbiAgICB0aGlzLnNldFdhdmVmb3JtKCk7XG4gIH1cblxuICB4Wm9vbSh2YWwpIHtcbiAgICB0aGlzLmRyYXcoKTtcbiAgfVxuXG4gIC8vIGxvZ2ljIHBlcmZvcm1lZCB0byBzZWxlY3QgYW4gaXRlbSBmcm9tIHRoZSBicnVzaFxuICBoYW5kbGVCcnVzaChleHRlbnQsIGUpIHtcbiAgLy8gYnJ1c2hJdGVtKGV4dGVudCwgbW9kZSkge1xuICAgIC8qXG4gICAgbW9kZSA9IG1vZGUgfHwgJ3h5JzsgLy8gZGVmYXVsdCB0cmllcyB0byBtYXRjaCBib3RoXG5cbiAgICB2YXIgbW9kZVggPSBtb2RlLmluZGV4T2YoJ3gnKSA+PSAwO1xuICAgIHZhciBtb2RlWSA9IG1vZGUuaW5kZXhPZigneScpID49IDA7XG4gICAgdmFyIG1hdGNoWCA9IGZhbHNlLCBtYXRjaFkgPSBmYWxzZTtcblxuICAgIC8vIGRhdGEgbWFwcGVyc1xuICAgIHZhciBzdGFydCA9IHRoaXMuc3RhcnQoKTtcbiAgICB2YXIgZHVyYXRpb24gPSB0aGlzLmR1cmF0aW9uKCk7XG4gICAgdmFyIHkgPSB0aGlzLnkoKTtcbiAgICB2YXIgaGVpZ2h0ID0gdGhpcy5oZWlnaHQoKTtcblxuICAgIHRoaXMuZy5zZWxlY3RBbGwoJy5zZWxlY3RhYmxlJykuY2xhc3NlZCgnc2VsZWN0ZWQnLCAoZCwgaSkgPT4ge1xuICAgICAgLy8gdmFyIG9mZnNldFRvcCA9ICh0aGF0LnRvcCgpIHx8IDApICsgKHRoYXQuYmFzZS5tYXJnaW4oKS50b3AgfHwgMCk7XG4gICAgICAvLyB2YXIgb2Zmc2V0TGVmdCA9ICh0aGF0LmxlZnQgfHwgMCkgKyAodGhhdC5iYXNlLm1hcmdpbigpLmxlZnQgfHwgMCk7XG5cbiAgICAgIC8vIFggbWF0Y2hcbiAgICAgIGlmIChtb2RlWCkge1xuICAgICAgICB2YXIgeDEgPSBzdGFydChkKTtcbiAgICAgICAgdmFyIHgyID0geDEgKyBkdXJhdGlvbihkKTtcbiAgICAgICAgLy8gICAgICAgICAgICBiZWdpbmluZyBzZWwgICAgICAgICAgICAgICBlbmQgc2VsXG4gICAgICAgIHZhciBtYXRjaFgxID0gZXh0ZW50WzBdWzBdIDw9IHgxICYmIHgyIDwgZXh0ZW50WzFdWzBdO1xuICAgICAgICB2YXIgbWF0Y2hYMiA9IGV4dGVudFswXVswXSA8PSB4MiAmJiB4MSA8IGV4dGVudFsxXVswXTtcblxuICAgICAgICBtYXRjaFggPSAobWF0Y2hYMSB8fCBtYXRjaFgyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1hdGNoWCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFkgbWF0Y2hcbiAgICAgIGlmIChtb2RlWSkge1xuICAgICAgICB2YXIgeTEgPSB5KGQpO1xuICAgICAgICB2YXIgeTIgPSB5MSArIGhlaWdodChkKTtcbiAgICAgICAgLy8gICAgICAgICAgICBiZWdpbmluZyBzZWwgICAgICAgICAgICAgICBlbmQgc2VsXG4gICAgICAgIHZhciBtYXRjaFkxID0gZXh0ZW50WzBdWzFdIDw9IHkxICYmIHkyIDwgZXh0ZW50WzFdWzFdO1xuICAgICAgICB2YXIgbWF0Y2hZMiA9IGV4dGVudFswXVsxXSA8PSB5MiAmJiB5MSA8PSBleHRlbnRbMV1bMV07XG5cbiAgICAgICAgbWF0Y2hZID0gKG1hdGNoWTEgfHwgbWF0Y2hZMik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtYXRjaFkgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbWF0Y2hYICYmIG1hdGNoWTtcbiAgICB9KTtcbiAgICAqL1xuICB9XG5cbiAgaGFuZGxlRHJhZyhpdGVtLCBlKSB7XG4gICAgaWYgKGl0ZW0gPT09IG51bGwpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgY2xhc3NMaXN0ID0gZS50YXJnZXQuY2xhc3NMaXN0O1xuICAgIHZhciBtb2RlID0gJ21vdmUnO1xuICAgIC8vIGlmIHRoZSB0YXJnZXQgaXMgYW4gaGFuZGxlclxuICAgIGlmIChjbGFzc0xpc3QuY29udGFpbnMoJ2xlZnQnKSkgeyBtb2RlID0gJ3Jlc2l6ZUxlZnQnOyB9XG4gICAgaWYgKGNsYXNzTGlzdC5jb250YWlucygncmlnaHQnKSkgeyBtb2RlID0gJ3Jlc2l6ZVJpZ2h0JzsgfVxuXG4gICAgdGhpc1ttb2RlXShpdGVtLCBlLm9yaWdpbmFsRXZlbnQuZHgsIGUub3JpZ2luYWxFdmVudC5keSk7XG4gIH1cblxuICBtb3ZlKGl0ZW0sIGR4LCBkeSkge1xuICAgIGl0ZW0gPSB0aGlzLmQzLnNlbGVjdChpdGVtKTtcbiAgICB2YXIgZGF0dW0gPSBpdGVtLmRhdHVtKCk7XG5cbiAgICAvLyBjb25zb2xlLmluZm8oXCJNb3ZhYmxlV2F2ZWZvcm06Om1vdmVcIik7XG4gICAgLy8gLy8gY29uc29sZS5pbmZvKGl0ZW0pO1xuICAgIC8vIC8vIGNvbnNvbGUuaW5mbyhkYXR1bSk7XG5cbiAgICAvLyBkZWZpbmUgY29uc3RyYWluc1xuICAgIHZhciBjb25zdHJhaW5zID0gdGhpcy5wYXJhbSgnZWRpdHMnKTtcbiAgICB2YXIgY2FuWCA9ICEhfmNvbnN0cmFpbnMuaW5kZXhPZigneCcpO1xuICAgIHZhciBjYW5ZID0gISF+Y29uc3RyYWlucy5pbmRleE9mKCd5Jyk7XG4gICAgLy8gZWFybHkgcmV0dXJuIGlmIGNhbm5vdCBlZGl0IHggYW5kIHlcbiAgICBpZiAoIWNhblggJiYgIWNhblkpIHsgcmV0dXJuOyB9XG4gICAgLy8gZWxzZSBsb2NrIHRoZSBjb3JyZXNwb25kaW5nIGF4aXNcbiAgICBpZiAoIWNhblgpIHsgZHggPSAwOyB9XG4gICAgaWYgKCFjYW5ZKSB7IGR5ID0gMDsgfVxuXG4gICAgdmFyIGFjY2Vzc29ycyA9IHRoaXMuZ2V0QWNjZXNzb3JzKCk7XG5cbiAgICB2YXIgeFNjYWxlID0gYWNjZXNzb3JzLnhTY2FsZTtcbiAgICB2YXIgeVNjYWxlID0gYWNjZXNzb3JzLnlTY2FsZTtcbiAgICB2YXIgeFJhbmdlID0geFNjYWxlLnJhbmdlKCk7XG4gICAgdmFyIHlSYW5nZSA9IHlTY2FsZS5yYW5nZSgpO1xuXG4gICAgdmFyIHggPSBhY2Nlc3NvcnMueChkYXR1bSk7XG4gICAgdmFyIHcgPSBhY2Nlc3NvcnMudyhkYXR1bSk7XG4gICAgdmFyIGggPSBhY2Nlc3NvcnMuaChkYXR1bSk7XG4gICAgdmFyIHkgPSB5U2NhbGUodGhpcy55KCkoZGF0dW0pKTtcblxuICAgIC8vIGhhbmRsZSB4IHBvc2l0aW9uIC0gbG9jayB0byBib3VuZGFyaWVzXG4gICAgdmFyIHRhcmdldFggPSB4ICsgZHg7XG4gICAgaWYgKHRhcmdldFggPj0geFJhbmdlWzBdICYmICh0YXJnZXRYICsgdykgPD0geFJhbmdlWzFdKSB7XG4gICAgICB4ID0gdGFyZ2V0WDtcbiAgICB9IGVsc2UgaWYgKHRhcmdldFggPCB4UmFuZ2VbMF0pIHtcbiAgICAgIHggPSB4UmFuZ2VbMF07XG4gICAgfSBlbHNlIGlmICgodGFyZ2V0WCArIHcpID4geFJhbmdlWzFdKSB7XG4gICAgICB4ID0geFJhbmdlWzFdIC0gdztcbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgeSBwb3NpdGlvbiAtIGxvY2sgdG8gYm91bmRhcmllc1xuICAgIC8vIHZhciB0YXJnZXRZID0geSArIGR5O1xuICAgIHZhciB0YXJnZXRZID0gMDtcbiAgICB2YXIgeURpc3BsYXllZCA9IHlSYW5nZVsxXSAtIGggLSB0YXJnZXRZO1xuXG4gICAgaWYgKHlEaXNwbGF5ZWQgPj0geVJhbmdlWzBdICYmICh5RGlzcGxheWVkICsgaCkgPD0geVJhbmdlWzFdKSB7XG4gICAgICB5ID0gdGFyZ2V0WTtcbiAgICB9IGVsc2UgaWYgKHlEaXNwbGF5ZWQgPCB5UmFuZ2VbMF0pIHtcbiAgICAgIHkgPSB5UmFuZ2VbMV0gLSBoO1xuICAgIH0gZWxzZSBpZiAoKHlEaXNwbGF5ZWQgKyBoKSA+IHlSYW5nZVsxXSkge1xuICAgICAgeSA9IHlSYW5nZVswXTtcbiAgICB9XG5cbiAgICB2YXIgeFZhbHVlID0geFNjYWxlLmludmVydCh4KTtcbiAgICB2YXIgeVZhbHVlID0geVNjYWxlLmludmVydCh5KTtcblxuICAgIHRoaXMuc3RhcnQoKShkYXR1bSwgeFZhbHVlKTtcbiAgICB0aGlzLnkoKShkYXR1bSwgeVZhbHVlKTtcblxuICAgIHRoaXMuZHJhdyhpdGVtKTtcbiAgfVxuXG4gIHJlc2l6ZUxlZnQoaXRlbSwgZHgsIGR5KSB7XG4gICAgaXRlbSA9IHRoaXMuZDMuc2VsZWN0KGl0ZW0pO1xuICAgIHZhciBkYXR1bSA9IGl0ZW0uZGF0dW0oKTtcblxuICAgIHZhciBjb25zdHJhaW5zID0gdGhpcy5wYXJhbSgnZWRpdHMnKTtcbiAgICB2YXIgY2FuVyA9ICEhfmNvbnN0cmFpbnMuaW5kZXhPZignd2lkdGgnKTtcbiAgICAvLyBlYXJseSByZXR1cm4gaWYgY2Fubm90IGVkaXRcbiAgICBpZiAoIWNhblcpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgYWNjZXNzb3JzID0gdGhpcy5nZXRBY2Nlc3NvcnMoKTtcbiAgICB2YXIgeFJhbmdlID0gYWNjZXNzb3JzLnhTY2FsZS5yYW5nZSgpO1xuXG4gICAgdmFyIHggPSBhY2Nlc3NvcnMueChkYXR1bSk7XG4gICAgdmFyIHcgPSBhY2Nlc3NvcnMudyhkYXR1bSk7XG5cbiAgICB2YXIgdGFyZ2V0WCA9IHggKyBkeDtcbiAgICB2YXIgdGFyZ2V0VyA9IHcgLSBkeDtcblxuICAgIGlmICh0YXJnZXRYID49IHhSYW5nZVswXSAmJiB0YXJnZXRXID49IHRoaXMuX19taW5XaWR0aCkge1xuICAgICAgeCA9IHRhcmdldFg7XG4gICAgICB3ID0gdGFyZ2V0VztcbiAgICB9XG5cbiAgICB2YXIgeFZhbHVlID0gYWNjZXNzb3JzLnhTY2FsZS5pbnZlcnQoeCk7XG4gICAgdmFyIG1pbkRvbWFpbiA9IGFjY2Vzc29ycy54U2NhbGUuZG9tYWluKClbMF07XG4gICAgdmFyIHdWYWx1ZSA9IGFjY2Vzc29ycy54U2NhbGUuaW52ZXJ0KHcpIC0gbWluRG9tYWluO1xuXG4gICAgdGhpcy5zdGFydCgpKGRhdHVtLCB4VmFsdWUpO1xuICAgIHRoaXMuZHVyYXRpb24oKShkYXR1bSwgd1ZhbHVlKTtcblxuICAgIHRoaXMuZHJhdyhpdGVtKTtcbiAgfVxuXG4gIHJlc2l6ZVJpZ2h0KGl0ZW0sIGR4LCBkeSkge1xuICAgIGl0ZW0gPSB0aGlzLmQzLnNlbGVjdChpdGVtKTtcbiAgICB2YXIgZGF0dW0gPSBpdGVtLmRhdHVtKCk7XG5cbiAgICB2YXIgY29uc3RyYWlucyA9IHRoaXMucGFyYW0oJ2VkaXRzJyk7XG4gICAgdmFyIGNhblcgPSAhIX5jb25zdHJhaW5zLmluZGV4T2YoJ3dpZHRoJyk7XG4gICAgLy8gZWFybHkgcmV0dXJuIGlmIGNhbm5vdCBlZGl0XG4gICAgaWYgKCFjYW5XKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIGFjY2Vzc29ycyA9IHRoaXMuZ2V0QWNjZXNzb3JzKCk7XG4gICAgdmFyIHhSYW5nZSA9IGFjY2Vzc29ycy54U2NhbGUucmFuZ2UoKTtcblxuICAgIHZhciB4ID0gYWNjZXNzb3JzLngoZGF0dW0pO1xuICAgIHZhciB3ID0gYWNjZXNzb3JzLncoZGF0dW0pO1xuXG4gICAgdmFyIHRhcmdldFcgPSB3ICsgZHg7XG5cbiAgICBpZiAodGFyZ2V0VyA+PSB0aGlzLl9fbWluV2lkdGggJiYgKHggKyB0YXJnZXRXKSA8PSB4UmFuZ2VbMV0pIHtcbiAgICAgIHcgPSB0YXJnZXRXO1xuICAgIH1cblxuICAgIHZhciBtaW5Eb21haW4gPSBhY2Nlc3NvcnMueFNjYWxlLmRvbWFpbigpWzBdO1xuICAgIHZhciB3VmFsdWUgPSBhY2Nlc3NvcnMueFNjYWxlLmludmVydCh3KSAtIG1pbkRvbWFpbjtcbiAgICB0aGlzLmR1cmF0aW9uKCkoZGF0dW0sIHdWYWx1ZSk7XG5cbiAgICB0aGlzLmRyYXcoaXRlbSk7XG4gIH1cblxufVxuXG4vLyBhZGQgYW5kIGluaXRpYWxpemUgb3VyIGFjY2Vzc29yc1xuYWNjZXNzb3JzLmdldEZ1bmN0aW9uKE1vdmFibGVXYXZlZm9ybS5wcm90b3R5cGUsIFtcbiAgJ3knLCAnd2lkdGgnLCAnY29sb3InLCAnaGVpZ2h0JywgJ2R1cmF0aW9uJywgJ3N0YXJ0JywgJ3NvcnRJbmRleCcsICdvcGFjaXR5JywgJ3dhdmVmb3JtJ1xuXSk7XG5cbmZ1bmN0aW9uIGZhY3RvcnkoKSB7IHJldHVybiBuZXcgTW92YWJsZVdhdmVmb3JtKCk7IH1cbmZhY3RvcnkuTW92YWJsZVdhdmVmb3JtID0gTW92YWJsZVdhdmVmb3JtO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnk7XG4iXX0=