"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var d3 = require("d3");
var EventEmitter = require("events").EventEmitter;
var shortId = require("shortid");

var _require = require("../helpers/utils");

var accessors = _require.accessors;
var uniqueId = _require.uniqueId;
var UILoop = _require.UILoop;
var throttle = _require.throttle;

var Timeline = (function (_EventEmitter) {
  function Timeline() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Timeline);

    _get(_core.Object.getPrototypeOf(Timeline.prototype), "constructor", this).call(this);
    this.name(options.name || shortId.generate());
    this.cname(uniqueId(this.name()));
    // options
    // from: https://github.com/wavesjs/ui/issues/1
    this.lockZoomOutOnInitialDomain = options.lockZoomOutOnInitialDomain || false;

    // defaults
    this.margin({ top: 0, right: 0, bottom: 0, left: 0 });
    this.xDomain([0, 0]);
    this.yDomain([0, 1]);
    // initialize
    this.layers = {};
    this.xScale = d3.scale.linear();
    this.yScale = d3.scale.linear();
    // alias `EventEmitter.emit`
    this.trigger = this.emit;
    // keep track of scales initialization
    this.__scalesInitialized = false;
    // @TODO define if it should be a getter
    this.fps = 60;
    this.throttleRate = 1000 / 50;
    this.uiLoop = new UILoop(this.fps);
    // bind draw method for call from d3
    this.draw = this.draw.bind(this);

    this.DOMReady = false;

    // add d3 as an instance member
    // this.d3 = d3;
  }

  _inherits(Timeline, _EventEmitter);

  _createClass(Timeline, {
    initScales: {

      // initialize the scales of the timeline
      // is called the first time a layer is added

      value: function initScales() {
        var xRange = [0, this.width()];
        if (this.swapX) {
          xRange.reverse();
        } // used ?

        var yRange = [this.height(), 0];
        if (this.swapY) {
          yRange.reverse();
        } // used ?

        this.xScale.domain(this.xDomain()).range(xRange);

        this.yScale.domain(this.yDomain()).range(yRange);

        // keep a reference unmodified scale range for use in the layers when zooming
        this.originalXscale = this.xScale.copy();
        this.__scalesInitialized = true;
      }
    },
    add: {

      // --------------------------------------------------
      // layers initialization related methods
      // --------------------------------------------------

      // alias for layer - symetry with remove

      value: function add(layer) {
        if (this.__scalesInitialized === false) {
          this.initScales();
        }

        layer.load(this, d3);
        layer.setScales();
        layer.delegateEvents();
        layer.init();

        // allow to dynamically add a layer after after the timeline has been drawn
        if (!!this.boundingBox) {
          layer.createGroup(this.boundingBox);
        }

        // add the layer to the stack
        this.layers[layer.param("cname")] = layer;

        this.emit("new-layer", layer);

        return this;
      }
    },
    remove: {

      // remove a layer

      value: function remove(layer) {
        if (layer.param("isEditable") && layer.undelegateEvents) {
          layer.undelegateEvents();
        }

        layer.g.remove();
        delete this.layers[layer.param("cname")];

        // TODO: I should add some additional info in the event.
        this.emit("removed-layer");

        return this;
      }
    },
    delegateEvents: {

      // --------------------------------------------------
      // events
      // --------------------------------------------------

      value: function delegateEvents() {
        var _this = this;

        // !!! remember to unbind when deleting element !!!
        var body = document.body;
        var target;
        var that = this;

        // is actually not listened in make editable
        this.svg.on("mousedown", function () {
          target = d3.event.target;
          var originalEvent = d3.event;
          d3.select(d3.event.target).each(function (datum) {
            var e = {
              target: target,
              d: datum,
              originalEvent: originalEvent
            };
            that.trigger("mousedown", e);
          });
        });

        this.svg.on("mouseup", function () {
          var originalEvent = d3.event;
          d3.select(d3.event.target).each(function (datum) {
            var e = {
              target: target,
              d: datum,
              originalEvent: originalEvent
            };
            that.trigger("mouseup", e);
          });
        });

        this.svg.on("mouseenter", function () {
          _this.trigger("mouseenter", d3.event);
        });

        this.svg.on("mousemove", throttle(function () {
          _this.trigger("mousemove", d3.event);
        }, this.throttleRate, { leading: false }));

        // this.svg.on('mousemove', () => {
        //   console.log('mousemove');
        //   this.trigger('mousemove', d3.event);
        // });

        // choose which one we really want
        // or use two different names
        this.svg.on("mouseleave", function () {
          // this.xZoomSet(); // was in makeEditable - check if really needed
          _this.trigger("mouseleave", d3.event);
        });

        body.addEventListener("mouseleave", function (e) {
          if (e.fromElement !== body) {
            return;
          }
          _this.trigger("mouseleave", e);
        });

        // @NOTE: how removeListeners for drag behavior
        var dragBehavior = d3.behavior.drag();
        // dragBehavior.on('dragstart', function() {
        //   console.log(d3.event);
        // });

        // @NOTE throttle doesn't work here
        // for unknown reason d3.event is null most of the time
        dragBehavior.on("drag", function () {
          // dragBehavior.on('drag', throttle(() => {
          // we drag only selected items
          var originalEvent = d3.event;
          // @NOTE shouldn't rely on `selected` class here
          _this.selection.selectAll(".selected").each(function (datum) {
            var e = {
              // group - allow to redraw only the current dragged item
              currentTarget: this,
              // element (which part of the element is actually dragged,
              // ex. line or rect in a segment)
              target: target,
              d: datum,
              originalEvent: originalEvent
            };

            that.trigger("drag", e);
          });
        });
        // }, this.throttleRate));

        this.svg.call(dragBehavior);

        // var brush = d3.svg.brush()
        //   .x(this.xScale)
        //   .y(this.yScale);

        // brush.on('brushstart', function() {
        //   console.log('brushstart', d3.event);
        // });

        // brush.on('brush', function() {
        //   console.log('brush', d3.event);
        // });

        // brush.on('brushend', function() {
        //   console.log('brushend', d3.event);
        // });

        // this.boundingBox.call(brush);
      }
    },
    undelegateEvents: {

      // should clean event delegation, in conjonction with a `remove` method

      value: function undelegateEvents() {}
    },
    xZoom: {

      // sets the brushing state for interaction and a css class for styles
      // @TODO define how the brush should work
      // brushing(state = null) {
      //   if (state === null) { return this._brushing; }

      //   this._brushing = state;
      //   d3.select(document.body).classed('brushing', state);
      // }

      value: function xZoom(zoom) {
        // in px to domain
        zoom.anchor = this.originalXscale.invert(zoom.anchor);
        // this.zoomFactor = zoom.factor;
        this.xZoomCompute(zoom, this);

        if (this.lockZoomOutOnInitialDomain) {
          this.lockZoomOut();
        }

        // redraw layers
        for (var key in this.layers) {
          var layer = this.layers[key];
          if ("xScale" in layer) {
            this.xZoomCompute(zoom, layer);
          }
          if ("xZoom" in layer) {
            layer.xZoom(zoom);
          }
        }
      }
    },
    lockZoomOut: {

      // don't allow to zoom out of the initial domain
      // see: https://github.com/wavesjs/ui/issues/1

      value: function lockZoomOut() {
        var xScaleDomain = this.xScale.domain();
        var xDomain = this.xDomain();

        if (xScaleDomain[0] < xDomain[0] || xScaleDomain[1] > xDomain[1]) {
          var min = Math.max(xDomain[0], xScaleDomain[0]);
          var max = Math.min(xDomain[1], xScaleDomain[1]);

          this.xScale.domain([min, max]);
        }
      }
    },
    xZoomCompute: {
      value: function xZoomCompute(zoom, layer) {
        var deltaY = zoom.delta.y;
        var deltaX = zoom.delta.x;
        var anchor = zoom.anchor;
        var factor = zoom.factor;

        // start and length (instead of end)
        var targetStart = layer.originalXscale.domain()[0];
        var currentLength = layer.originalXscale.domain()[1] - targetStart;

        // length after scaling
        var targetLength = currentLength * factor;
        // unchanged length in px
        var rangeLength = layer.originalXscale.range()[1] - layer.originalXscale.range()[0];

        // zoom
        if (deltaY) {
          var offsetOrigin = (anchor - targetStart) / currentLength * rangeLength;
          var offsetFinal = (anchor - targetStart) / targetLength * rangeLength;
          targetStart += (offsetFinal - offsetOrigin) / rangeLength * targetLength;
        }

        // translate x
        if (deltaX) {
          var translation = deltaX / rangeLength * targetLength;
          targetStart += translation;
        }
        // updating the scale
        layer.xScale.domain([targetStart, targetStart + targetLength]);
      }
    },
    xZoomSet: {

      // @NOTE - used ? - is called from make editable

      value: function xZoomSet() {
        // saves new scale reference
        this.originalXscale = this.xScale.copy();

        for (var key in this.layers) {
          var layer = this.layers[key];
          if ("xScale" in layer) {
            layer.originalXscale = layer.xScale.copy();
          }
          if ("zoomEnd" in layer) {
            layer.zoomEnd();
          }
        }
      }
    },
    draw: {

      // --------------------------------------------------
      // main interface methods
      // --------------------------------------------------

      value: function draw(sel) {
        // draw should be called only once
        if (this.svg) {
          return this.update();
        }

        // assume a timeline is unique and can be bound only to one element
        this.selection = sel || this.selection;
        var el = d3.select(this.selection[0][0]);
        // normalize dimensions based on the margins
        this.width(this.width() - this.margin().left - this.margin().right);
        this.height(this.height() - this.margin().top - this.margin().bottom);

        // 1. create svg element
        // @NOTE viewbox: do we really want this behavior ?
        //       doesn't work well with foreignobject canvas
        // cf. http://stackoverflow.com/questions/3120739/resizing-svg-in-html
        var margin = this.margin();
        var outerWidth = this.width() + margin.left + margin.right;
        var outerHeight = this.height() + margin.top + margin.bottom;
        var viewBox = "0 0 " + outerWidth + " " + outerHeight;

        this.svg = el.append("svg").attr("width", outerWidth).attr("height", outerHeight)
        // .attr('width', '100%')
        // .attr('height', '100%')
        // .attr('viewBox', viewBox)
        .attr("data-cname", this.cname()).attr("data-name", this.name()).style("display", "block");

        // 2. create layout group and clip path
        var clipPathId = "bouding-box-clip-" + this.cname();

        this.svg.append("defs").append("clipPath").attr("id", clipPathId).append("rect").attr("x", 0).attr("y", 0).attr("width", outerWidth).attr("height", outerHeight);

        this.boundingBox = this.svg.append("g").attr("class", "bounding-box").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("clip-path", "url(#" + clipPathId + ")");

        // 3. delegate events
        this.delegateEvents();

        // 4. create layers groups
        for (var key in this.layers) {
          this.layers[key].createGroup(this.boundingBox);
        }

        // 5. update view
        this.update();

        return this;
      }
    },
    update: {

      // update layers
      // @param layerIds <string|object|array> optionnal
      //      layers to update or instance(s)

      value: function update() {
        var _this = this;

        for (var _len = arguments.length, layers = Array(_len), _key = 0; _key < _len; _key++) {
          layers[_key] = arguments[_key];
        }

        var toUpdate = {};

        if (layers.length === 0) {
          toUpdate = this.layers;
        } else {
          layers.forEach(function (layer) {
            toUpdate[layer.param("cname")] = layer;
          });
        }

        // update selected layers
        for (var key in toUpdate) {
          toUpdate[key].update();
        }
        for (var key in toUpdate) {
          toUpdate[key].draw();
        }

        var hasQueue = this.uiLoop.hasRegisteredCallbacks();
        // start rAF
        this.uiLoop.start();

        requestAnimationFrame(function () {
          if (hasQueue && !_this.uiLoop.hasRegisteredCallbacks()) {
            var eventName = _this.DOMReady ? "DOMUpdate" : "DOMReady";
            _this.emit(eventName);
            _this.DOMReady = true;
          }
        });
      }
    },
    focus: {
      value: function focus(layer) {
        for (var lid in this.layers) {
          this.layers[lid].focus = false;
          this.layers[lid].undelegateEvents();
          if (this.layers[lid] == layer) {
            this.layers[lid].focus = true;
            this.layers[lid].delegateEvents();
          }
        }
      }
    },
    getFocusedLayer: {
      value: function getFocusedLayer() {
        for (var lid in this.layers) {
          if (this.layers[lid].focus) {
            return this.layers[lid];
          }
        }
      }
    },
    resetFocus: {
      value: function resetFocus() {
        for (var lid in this.layers) this.layers[lid].delegateEvents();
      }
    },
    destroy: {

      // destroy the timeline

      value: function destroy() {}
    }
  });

  return Timeline;
})(EventEmitter);

// generic getters(setters) accessors and defaults
// accessors.getFunction(Timeline.prototype, [ ]);
accessors.getValue(Timeline.prototype, ["name", "cname", "xDomain", "yDomain", "height", "width", "margin"]);

function factory(options) {
  return new Timeline(options);
}
factory.d3 = d3; // make d3 available though the factory
factory.Timeline = Timeline;

module.exports = factory;

//

// this.layers.forEach((layer) => this.remove(layer));
// this.undelegateEvents();
// this.svg.remove();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7QUFFYixJQUFJLEVBQUUsR0FBYyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEMsSUFBSSxZQUFZLEdBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQztBQUNuRCxJQUFJLE9BQU8sR0FBUyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7O2VBQ1MsT0FBTyxDQUFDLGtCQUFrQixDQUFDOztJQUFyRSxTQUFTLFlBQVQsU0FBUztJQUFFLFFBQVEsWUFBUixRQUFRO0lBQUUsTUFBTSxZQUFOLE1BQU07SUFBRSxRQUFRLFlBQVIsUUFBUTs7SUFFckMsUUFBUTtBQUNELFdBRFAsUUFBUSxHQUNjO1FBQWQsT0FBTyxnQ0FBRyxFQUFFOzswQkFEcEIsUUFBUTs7QUFFVixxQ0FGRSxRQUFRLDZDQUVGO0FBQ1IsUUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQzlDLFFBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7OztBQUdsQyxRQUFJLENBQUMsMEJBQTBCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixJQUFJLEtBQUssQ0FBQzs7O0FBRzlFLFFBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN0RCxRQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsUUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFD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LENBQUM7V0FBRTtBQUN0RSxjQUFJLFNBQVMsSUFBSSxLQUFLLEVBQUU7QUFBRSxpQkFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO1dBQUU7U0FDN0M7T0FDRjs7QUFNRCxRQUFJOzs7Ozs7YUFBQSxjQUFDLEdBQUcsRUFBRTs7QUFFUixZQUFJLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFBRSxpQkFBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FBRTs7O0FBR3ZDLFlBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDdkMsWUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXpDLFlBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3BFLFlBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7Ozs7QUFNdEUsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzNCLFlBQUksVUFBVSxHQUFJLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDNUQsWUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUM3RCxZQUFJLE9BQU8sR0FBRyxNQUFNLEdBQUcsVUFBVSxHQUFHLEdBQUcsR0FBRyxXQUFXLENBQUM7O0FBRXRELFlBQUks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QUFNLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQ25FLENBQUMsQ0FBQzs7QUFFSCxTQUFTLE9BQU8sQ0FBQyxPQUFPLEVBQUU7QUFBRSxTQUFPLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0NBQUU7QUFDM0QsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDaEIsT0FBTyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7O0FBRTVCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDIiwiZmlsZSI6ImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciBkMyAgICAgICAgICAgID0gcmVxdWlyZSgnZDMnKTtcbnZhciBFdmVudEVtaXR0ZXIgID0gcmVxdWlyZSgnZXZlbnRzJykuRXZlbnRFbWl0dGVyO1xudmFyIHNob3J0SWQgICAgICAgPSByZXF1aXJlKCdzaG9ydGlkJyk7XG52YXIgeyBhY2Nlc3NvcnMsIHVuaXF1ZUlkLCBVSUxvb3AsIHRocm90dGxlIH0gPSByZXF1aXJlKCcuLi9oZWxwZXJzL3V0aWxzJyk7XG5cbmNsYXNzIFRpbWVsaW5lIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm5hbWUob3B0aW9ucy5uYW1lIHx8IHNob3J0SWQuZ2VuZXJhdGUoKSk7XG4gICAgdGhpcy5jbmFtZSh1bmlxdWVJZCh0aGlzLm5hbWUoKSkpO1xuICAgIC8vIG9wdGlvbnNcbiAgICAvLyBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vd2F2ZXNqcy91aS9pc3N1ZXMvMVxuICAgIHRoaXMubG9ja1pvb21PdXRPbkluaXRpYWxEb21haW4gPSBvcHRpb25zLmxvY2tab29tT3V0T25Jbml0aWFsRG9tYWluIHx8wqBmYWxzZTtcblxuICAgIC8vIGRlZmF1bHRzXG4gICAgdGhpcy5tYXJnaW4oeyB0b3A6IDAsIHJpZ2h0OiAwLCBib3R0b206IDAsIGxlZnQ6IDAgfSk7XG4gICAgdGhpcy54RG9tYWluKFswLCAwXSk7XG4gICAgdGhpcy55RG9tYWluKFswLCAxXSk7XG4gICAgLy8gaW5pdGlhbGl6ZVxuICAgIHRoaXMubGF5ZXJzID0ge307XG4gICAgdGhpcy54U2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKTtcbiAgICB0aGlzLnlTY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICAgIC8vIGFsaWFzIGBFdmVudEVtaXR0ZXIuZW1pdGBcbiAgICB0aGlzLnRyaWdnZXIgPSB0aGlzLmVtaXQ7XG4gICAgLy8ga2VlcCB0cmFjayBvZiBzY2FsZXMgaW5pdGlhbGl6YXRpb25cbiAgICB0aGlzLl9fc2NhbGVzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAvLyBAVE9ETyBkZWZpbmUgaWYgaXQgc2hvdWxkIGJlIGEgZ2V0dGVyXG4gICAgdGhpcy5mcHMgPSA2MDtcbiAgICB0aGlzLnRocm90dGxlUmF0ZSA9IDEwMDAgLyA1MDtcbiAgICB0aGlzLnVpTG9vcCA9IG5ldyBVSUxvb3AodGhpcy5mcHMpO1xuICAgIC8vIGJpbmQgZHJhdyBtZXRob2QgZm9yIGNhbGwgZnJvbSBkM1xuICAgIHRoaXMuZHJhdyA9IHRoaXMuZHJhdy5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5ET01SZWFkeSA9IGZhbHNlO1xuXG4gICAgLy8gYWRkIGQzIGFzIGFuIGluc3RhbmNlIG1lbWJlclxuICAgIC8vIHRoaXMuZDMgPSBkMztcbiAgfVxuXG4gIC8vIGluaXRpYWxpemUgdGhlIHNjYWxlcyBvZiB0aGUgdGltZWxpbmVcbiAgLy8gaXMgY2FsbGVkIHRoZSBmaXJzdCB0aW1lIGEgbGF5ZXIgaXMgYWRkZWRcbiAgaW5pdFNjYWxlcygpIHtcbiAgICB2YXIgeFJhbmdlID0gWzAsIHRoaXMud2lkdGgoKV07XG4gICAgaWYgKHRoaXMuc3dhcFgpIHsgeFJhbmdlLnJldmVyc2UoKTsgfSAvLyB1c2VkID9cblxuICAgIHZhciB5UmFuZ2UgPSBbdGhpcy5oZWlnaHQoKSwgMF07XG4gICAgaWYgKHRoaXMuc3dhcFkpIHsgeVJhbmdlLnJldmVyc2UoKTsgfSAvLyB1c2VkID9cblxuICAgIHRoaXMueFNjYWxlXG4gICAgICAuZG9tYWluKHRoaXMueERvbWFpbigpKVxuICAgICAgLnJhbmdlKHhSYW5nZSk7XG5cbiAgICB0aGlzLnlTY2FsZVxuICAgICAgLmRvbWFpbih0aGlzLnlEb21haW4oKSlcbiAgICAgIC5yYW5nZSh5UmFuZ2UpO1xuXG4gICAgLy8ga2VlcCBhIHJlZmVyZW5jZSB1bm1vZGlmaWVkIHNjYWxlIHJhbmdlIGZvciB1c2UgaW4gdGhlIGxheWVycyB3aGVuIHpvb21pbmdcbiAgICB0aGlzLm9yaWdpbmFsWHNjYWxlID0gdGhpcy54U2NhbGUuY29weSgpO1xuICAgIHRoaXMuX19zY2FsZXNJbml0aWFsaXplZCA9IHRydWU7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBsYXllcnMgaW5pdGlhbGl6YXRpb24gcmVsYXRlZCBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gYWxpYXMgZm9yIGxheWVyIC0gc3ltZXRyeSB3aXRoIHJlbW92ZVxuICBhZGQobGF5ZXIpIHtcbiAgICBpZiAodGhpcy5fX3NjYWxlc0luaXRpYWxpemVkID09PSBmYWxzZSkge1xuICAgICAgdGhpcy5pbml0U2NhbGVzKCk7XG4gICAgfVxuXG4gICAgbGF5ZXIubG9hZCh0aGlzLCBkMyk7XG4gICAgbGF5ZXIuc2V0U2NhbGVzKCk7XG4gICAgbGF5ZXIuZGVsZWdhdGVFdmVudHMoKTtcbiAgICBsYXllci5pbml0KCk7XG5cbiAgICAvLyBhbGxvdyB0byBkeW5hbWljYWxseSBhZGQgYSBsYXllciBhZnRlciBhZnRlciB0aGUgdGltZWxpbmUgaGFzIGJlZW4gZHJhd25cbiAgICBpZiAoISF0aGlzLmJvdW5kaW5nQm94KSB7XG4gICAgICBsYXllci5jcmVhdGVHcm91cCh0aGlzLmJvdW5kaW5nQm94KTtcbiAgICB9XG5cbiAgICAvLyBhZGQgdGhlIGxheWVyIHRvIHRoZSBzdGFja1xuICAgIHRoaXMubGF5ZXJzW2xheWVyLnBhcmFtKCdjbmFtZScpXSA9IGxheWVyO1xuXG4gICAgdGhpcy5lbWl0KFwibmV3LWxheWVyXCIsIGxheWVyKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gcmVtb3ZlIGEgbGF5ZXJcbiAgcmVtb3ZlKGxheWVyKSB7XG4gICAgaWYgKGxheWVyLnBhcmFtKCdpc0VkaXRhYmxlJykgJiYgbGF5ZXIudW5kZWxlZ2F0ZUV2ZW50cykge1xuICAgICAgbGF5ZXIudW5kZWxlZ2F0ZUV2ZW50cygpO1xuICAgIH1cblxuICAgIGxheWVyLmcucmVtb3ZlKCk7XG4gICAgZGVsZXRlIHRoaXMubGF5ZXJzW2xheWVyLnBhcmFtKCdjbmFtZScpXTtcblxuICAgIC8vIFRPRE86IEkgc2hvdWxkIGFkZCBzb21lIGFkZGl0aW9uYWwgaW5mbyBpbiB0aGUgZXZlbnQuXG4gICAgdGhpcy5lbWl0KFwicmVtb3ZlZC1sYXllclwiKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gZXZlbnRzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZGVsZWdhdGVFdmVudHMoKSB7XG4gICAgLy8gISEhIHJlbWVtYmVyIHRvIHVuYmluZCB3aGVuIGRlbGV0aW5nIGVsZW1lbnQgISEhXG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5ib2R5O1xuICAgIHZhciB0YXJnZXQ7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgLy8gaXMgYWN0dWFsbHkgbm90IGxpc3RlbmVkIGluIG1ha2UgZWRpdGFibGVcbiAgICB0aGlzLnN2Zy5vbignbW91c2Vkb3duJywgKCkgPT4ge1xuICAgICAgdGFyZ2V0ID0gZDMuZXZlbnQudGFyZ2V0O1xuICAgICAgdmFyIG9yaWdpbmFsRXZlbnQgPSBkMy5ldmVudDtcbiAgICAgIGQzLnNlbGVjdChkMy5ldmVudC50YXJnZXQpLmVhY2goIChkYXR1bSkgPT4ge1xuICAgICAgICB2YXIgZSA9IHtcbiAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgICBkOiBkYXR1bSxcbiAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBvcmlnaW5hbEV2ZW50XG4gICAgICAgIH07XG4gICAgICAgIHRoYXQudHJpZ2dlcignbW91c2Vkb3duJywgZSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMuc3ZnLm9uKCdtb3VzZXVwJywgKCkgPT4ge1xuICAgICAgdmFyIG9yaWdpbmFsRXZlbnQgPSBkMy5ldmVudDtcbiAgICAgIGQzLnNlbGVjdChkMy5ldmVudC50YXJnZXQpLmVhY2goIChkYXR1bSkgPT4ge1xuICAgICAgICB2YXIgZSA9IHtcbiAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgICBkOiBkYXR1bSxcbiAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBvcmlnaW5hbEV2ZW50XG4gICAgICAgIH07XG4gICAgICAgIHRoYXQudHJpZ2dlcignbW91c2V1cCcsIGUpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnN2Zy5vbignbW91c2VlbnRlcicsICgpID0+IHtcbiAgICAgIHRoaXMudHJpZ2dlcignbW91c2VlbnRlcicsIGQzLmV2ZW50KTtcbiAgICB9KTtcblxuICAgIHRoaXMuc3ZnLm9uKCdtb3VzZW1vdmUnLCB0aHJvdHRsZSgoKSA9PiB7XG4gICAgICB0aGlzLnRyaWdnZXIoJ21vdXNlbW92ZScsIGQzLmV2ZW50KTtcbiAgICB9LCB0aGlzLnRocm90dGxlUmF0ZSwgeyBsZWFkaW5nOiBmYWxzZSB9KSk7XG5cbiAgICAvLyB0aGlzLnN2Zy5vbignbW91c2Vtb3ZlJywgKCkgPT4ge1xuICAgIC8vICAgY29uc29sZS5sb2coJ21vdXNlbW92ZScpO1xuICAgIC8vICAgdGhpcy50cmlnZ2VyKCdtb3VzZW1vdmUnLCBkMy5ldmVudCk7XG4gICAgLy8gfSk7XG5cbiAgICAvLyBjaG9vc2Ugd2hpY2ggb25lIHdlIHJlYWxseSB3YW50XG4gICAgLy8gb3IgdXNlIHR3byBkaWZmZXJlbnQgbmFtZXNcbiAgICB0aGlzLnN2Zy5vbignbW91c2VsZWF2ZScsICgpID0+IHtcbiAgICAgIC8vIHRoaXMueFpvb21TZXQoKTsgLy8gd2FzIGluIG1ha2VFZGl0YWJsZSAtIGNoZWNrIGlmIHJlYWxseSBuZWVkZWRcbiAgICAgIHRoaXMudHJpZ2dlcignbW91c2VsZWF2ZScsIGQzLmV2ZW50KTtcbiAgICB9KTtcblxuICAgIGJvZHkuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VsZWF2ZScsIChlKSA9PiB7XG4gICAgICBpZiAoZS5mcm9tRWxlbWVudCAhPT0gYm9keSkgeyByZXR1cm47IH1cbiAgICAgIHRoaXMudHJpZ2dlcignbW91c2VsZWF2ZScsIGUpO1xuICAgIH0pO1xuXG4gICAgLy8gQE5PVEU6IGhvdyByZW1vdmVMaXN0ZW5lcnMgZm9yIGRyYWcgYmVoYXZpb3JcbiAgICB2YXIgZHJhZ0JlaGF2aW9yID0gZDMuYmVoYXZpb3IuZHJhZygpO1xuICAgIC8vIGRyYWdCZWhhdmlvci5vbignZHJhZ3N0YXJ0JywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICBjb25zb2xlLmxvZyhkMy5ldmVudCk7XG4gICAgLy8gfSk7XG5cbiAgICAvLyBATk9URSB0aHJvdHRsZSBkb2Vzbid0IHdvcmsgaGVyZVxuICAgIC8vIGZvciB1bmtub3duIHJlYXNvbiBkMy5ldmVudCBpcyBudWxsIG1vc3Qgb2YgdGhlIHRpbWVcbiAgICBkcmFnQmVoYXZpb3Iub24oJ2RyYWcnLCAoKSA9PiB7XG4gICAgLy8gZHJhZ0JlaGF2aW9yLm9uKCdkcmFnJywgdGhyb3R0bGUoKCkgPT4ge1xuICAgICAgLy8gd2UgZHJhZyBvbmx5IHNlbGVjdGVkIGl0ZW1zXG4gICAgICB2YXIgb3JpZ2luYWxFdmVudCA9IGQzLmV2ZW50O1xuICAgICAgLy8gQE5PVEUgc2hvdWxkbid0IHJlbHkgb24gYHNlbGVjdGVkYCBjbGFzcyBoZXJlXG4gICAgICB0aGlzLnNlbGVjdGlvbi5zZWxlY3RBbGwoJy5zZWxlY3RlZCcpLmVhY2goZnVuY3Rpb24oZGF0dW0pIHtcbiAgICAgICAgdmFyIGUgPSB7XG4gICAgICAgICAgLy8gZ3JvdXAgLSBhbGxvdyB0byByZWRyYXcgb25seSB0aGUgY3VycmVudCBkcmFnZ2VkIGl0ZW1cbiAgICAgICAgICBjdXJyZW50VGFyZ2V0OiB0aGlzLFxuICAgICAgICAgIC8vIGVsZW1lbnQgKHdoaWNoIHBhcnQgb2YgdGhlIGVsZW1lbnQgaXMgYWN0dWFsbHkgZHJhZ2dlZCxcbiAgICAgICAgICAvLyBleC4gbGluZSBvciByZWN0IGluIGEgc2VnbWVudClcbiAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcbiAgICAgICAgICBkOiBkYXR1bSxcbiAgICAgICAgICBvcmlnaW5hbEV2ZW50OiBvcmlnaW5hbEV2ZW50XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhhdC50cmlnZ2VyKCdkcmFnJywgZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICAvLyB9LCB0aGlzLnRocm90dGxlUmF0ZSkpO1xuXG4gICAgdGhpcy5zdmcuY2FsbChkcmFnQmVoYXZpb3IpO1xuXG4gICAgLy8gdmFyIGJydXNoID0gZDMuc3ZnLmJydXNoKClcbiAgICAvLyAgIC54KHRoaXMueFNjYWxlKVxuICAgIC8vICAgLnkodGhpcy55U2NhbGUpO1xuXG4gICAgLy8gYnJ1c2gub24oJ2JydXNoc3RhcnQnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdicnVzaHN0YXJ0JywgZDMuZXZlbnQpO1xuICAgIC8vIH0pO1xuXG4gICAgLy8gYnJ1c2gub24oJ2JydXNoJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICBjb25zb2xlLmxvZygnYnJ1c2gnLCBkMy5ldmVudCk7XG4gICAgLy8gfSk7XG5cbiAgICAvLyBicnVzaC5vbignYnJ1c2hlbmQnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgIGNvbnNvbGUubG9nKCdicnVzaGVuZCcsIGQzLmV2ZW50KTtcbiAgICAvLyB9KTtcblxuICAgIC8vIHRoaXMuYm91bmRpbmdCb3guY2FsbChicnVzaCk7XG4gIH1cblxuICAvLyBzaG91bGQgY2xlYW4gZXZlbnQgZGVsZWdhdGlvbiwgaW4gY29uam9uY3Rpb24gd2l0aCBhIGByZW1vdmVgIG1ldGhvZFxuICB1bmRlbGVnYXRlRXZlbnRzKCkge1xuICAgIC8vXG4gIH1cblxuICAvLyBzZXRzIHRoZSBicnVzaGluZyBzdGF0ZSBmb3IgaW50ZXJhY3Rpb24gYW5kIGEgY3NzIGNsYXNzIGZvciBzdHlsZXNcbiAgLy8gQFRPRE8gZGVmaW5lIGhvdyB0aGUgYnJ1c2ggc2hvdWxkIHdvcmtcbiAgLy8gYnJ1c2hpbmcoc3RhdGUgPSBudWxsKSB7XG4gIC8vICAgaWYgKHN0YXRlID09PSBudWxsKSB7IHJldHVybiB0aGlzLl9icnVzaGluZzsgfVxuXG4gIC8vICAgdGhpcy5fYnJ1c2hpbmcgPSBzdGF0ZTtcbiAgLy8gICBkMy5zZWxlY3QoZG9jdW1lbnQuYm9keSkuY2xhc3NlZCgnYnJ1c2hpbmcnLCBzdGF0ZSk7XG4gIC8vIH1cblxuICB4Wm9vbSh6b29tKSB7XG4gICAgLy8gaW4gcHggdG8gZG9tYWluXG4gICAgem9vbS5hbmNob3IgPSB0aGlzLm9yaWdpbmFsWHNjYWxlLmludmVydCh6b29tLmFuY2hvcik7XG4gICAgLy8gdGhpcy56b29tRmFjdG9yID0gem9vbS5mYWN0b3I7XG4gICAgdGhpcy54Wm9vbUNvbXB1dGUoem9vbSwgdGhpcyk7XG5cbiAgICBpZiAodGhpcy5sb2NrWm9vbU91dE9uSW5pdGlhbERvbWFpbikge1xuICAgICAgdGhpcy5sb2NrWm9vbU91dCgpO1xuICAgIH1cblxuICAgIC8vIHJlZHJhdyBsYXllcnNcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5sYXllcnMpIHtcbiAgICAgIHZhciBsYXllciA9IHRoaXMubGF5ZXJzW2tleV07XG4gICAgICBpZiAoJ3hTY2FsZScgaW4gbGF5ZXIpIHsgdGhpcy54Wm9vbUNvbXB1dGUoem9vbSwgbGF5ZXIpOyB9XG4gICAgICBpZiAoJ3hab29tJyBpbiBsYXllcikgeyBsYXllci54Wm9vbSh6b29tKTsgfVxuICAgIH1cbiAgfVxuXG4gIC8vIGRvbid0IGFsbG93IHRvIHpvb20gb3V0IG9mIHRoZSBpbml0aWFsIGRvbWFpblxuICAvLyBzZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS93YXZlc2pzL3VpL2lzc3Vlcy8xXG4gIGxvY2tab29tT3V0KCkge1xuICAgIHZhciB4U2NhbGVEb21haW4gPSB0aGlzLnhTY2FsZS5kb21haW4oKTtcbiAgICB2YXIgeERvbWFpbiA9IHRoaXMueERvbWFpbigpO1xuXG4gICAgaWYgKHhTY2FsZURvbWFpblswXSA8IHhEb21haW5bMF0gfHwgeFNjYWxlRG9tYWluWzFdID4geERvbWFpblsxXSkge1xuICAgICAgdmFyIG1pbiA9IE1hdGgubWF4KHhEb21haW5bMF0sIHhTY2FsZURvbWFpblswXSk7XG4gICAgICB2YXIgbWF4ID0gTWF0aC5taW4oeERvbWFpblsxXSwgeFNjYWxlRG9tYWluWzFdKTtcblxuICAgICAgdGhpcy54U2NhbGUuZG9tYWluKFttaW4sIG1heF0pO1xuICAgIH1cbiAgfVxuXG4gIHhab29tQ29tcHV0ZSh6b29tLCBsYXllcikge1xuICAgIHZhciBkZWx0YVkgPSB6b29tLmRlbHRhLnk7XG4gICAgdmFyIGRlbHRhWCA9IHpvb20uZGVsdGEueDtcbiAgICB2YXIgYW5jaG9yID0gem9vbS5hbmNob3I7XG4gICAgdmFyIGZhY3RvciA9IHpvb20uZmFjdG9yO1xuXG4gICAgLy8gc3RhcnQgYW5kIGxlbmd0aCAoaW5zdGVhZCBvZiBlbmQpXG4gICAgdmFyIHRhcmdldFN0YXJ0ID0gbGF5ZXIub3JpZ2luYWxYc2NhbGUuZG9tYWluKClbMF07XG4gICAgdmFyIGN1cnJlbnRMZW5ndGggPSBsYXllci5vcmlnaW5hbFhzY2FsZS5kb21haW4oKVsxXSAtIHRhcmdldFN0YXJ0O1xuXG4gICAgLy8gbGVuZ3RoIGFmdGVyIHNjYWxpbmdcbiAgICB2YXIgdGFyZ2V0TGVuZ3RoID0gY3VycmVudExlbmd0aCAqIGZhY3RvcjtcbiAgICAvLyB1bmNoYW5nZWQgbGVuZ3RoIGluIHB4XG4gICAgdmFyIHJhbmdlTGVuZ3RoID0gbGF5ZXIub3JpZ2luYWxYc2NhbGUucmFuZ2UoKVsxXSAtIGxheWVyLm9yaWdpbmFsWHNjYWxlLnJhbmdlKClbMF07XG5cbiAgICAvLyB6b29tXG4gICAgaWYgKGRlbHRhWSkge1xuICAgICAgdmFyIG9mZnNldE9yaWdpbiA9ICggKGFuY2hvciAtIHRhcmdldFN0YXJ0KSAvIGN1cnJlbnRMZW5ndGggKSAqIHJhbmdlTGVuZ3RoO1xuICAgICAgdmFyIG9mZnNldEZpbmFsID0gKCAoYW5jaG9yIC0gdGFyZ2V0U3RhcnQpIC8gdGFyZ2V0TGVuZ3RoICkgKiByYW5nZUxlbmd0aDtcbiAgICAgIHRhcmdldFN0YXJ0ICs9ICggKG9mZnNldEZpbmFsIC0gb2Zmc2V0T3JpZ2luKSAvIHJhbmdlTGVuZ3RoICkgKiB0YXJnZXRMZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gdHJhbnNsYXRlIHhcbiAgICBpZiAoZGVsdGFYKSB7XG4gICAgICB2YXIgdHJhbnNsYXRpb24gPSAoZGVsdGFYIC8gcmFuZ2VMZW5ndGgpICogdGFyZ2V0TGVuZ3RoO1xuICAgICAgdGFyZ2V0U3RhcnQgKz0gdHJhbnNsYXRpb247XG4gICAgfVxuICAgIC8vIHVwZGF0aW5nIHRoZSBzY2FsZVxuICAgIGxheWVyLnhTY2FsZS5kb21haW4oW3RhcmdldFN0YXJ0LCB0YXJnZXRTdGFydCArIHRhcmdldExlbmd0aF0pO1xuICB9XG5cbiAgLy8gQE5PVEUgLSB1c2VkID8gLSBpcyBjYWxsZWQgZnJvbSBtYWtlIGVkaXRhYmxlXG4gIHhab29tU2V0KCkge1xuICAgIC8vIHNhdmVzIG5ldyBzY2FsZSByZWZlcmVuY2VcbiAgICB0aGlzLm9yaWdpbmFsWHNjYWxlID0gdGhpcy54U2NhbGUuY29weSgpO1xuXG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMubGF5ZXJzKSB7XG4gICAgICB2YXIgbGF5ZXIgPSB0aGlzLmxheWVyc1trZXldO1xuICAgICAgaWYgKCd4U2NhbGUnIGluIGxheWVyKSB7IGxheWVyLm9yaWdpbmFsWHNjYWxlID0gbGF5ZXIueFNjYWxlLmNvcHkoKTsgfVxuICAgICAgaWYgKCd6b29tRW5kJyBpbiBsYXllcikgeyBsYXllci56b29tRW5kKCk7IH1cbiAgICB9XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyBtYWluIGludGVyZmFjZSBtZXRob2RzXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgZHJhdyhzZWwpIHtcbiAgICAvLyBkcmF3IHNob3VsZCBiZSBjYWxsZWQgb25seSBvbmNlXG4gICAgaWYgKHRoaXMuc3ZnKSB7IHJldHVybiB0aGlzLnVwZGF0ZSgpOyB9XG5cbiAgICAvLyBhc3N1bWUgYSB0aW1lbGluZSBpcyB1bmlxdWUgYW5kIGNhbiBiZSBib3VuZCBvbmx5IHRvIG9uZSBlbGVtZW50XG4gICAgdGhpcy5zZWxlY3Rpb24gPSBzZWwgfHwgdGhpcy5zZWxlY3Rpb247XG4gICAgbGV0IGVsID0gZDMuc2VsZWN0KHRoaXMuc2VsZWN0aW9uWzBdWzBdKTtcbiAgICAvLyBub3JtYWxpemUgZGltZW5zaW9ucyBiYXNlZCBvbiB0aGUgbWFyZ2luc1xuICAgIHRoaXMud2lkdGgodGhpcy53aWR0aCgpIC0gdGhpcy5tYXJnaW4oKS5sZWZ0IC0gdGhpcy5tYXJnaW4oKS5yaWdodCk7XG4gICAgdGhpcy5oZWlnaHQodGhpcy5oZWlnaHQoKSAtIHRoaXMubWFyZ2luKCkudG9wIC0gdGhpcy5tYXJnaW4oKS5ib3R0b20pO1xuXG4gICAgLy8gMS4gY3JlYXRlIHN2ZyBlbGVtZW50XG4gICAgLy8gQE5PVEUgdmlld2JveDogZG8gd2UgcmVhbGx5IHdhbnQgdGhpcyBiZWhhdmlvciA/XG4gICAgLy8gICAgICAgZG9lc24ndCB3b3JrIHdlbGwgd2l0aCBmb3JlaWdub2JqZWN0IGNhbnZhc1xuICAgIC8vIGNmLiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzMxMjA3MzkvcmVzaXppbmctc3ZnLWluLWh0bWxcbiAgICB2YXIgbWFyZ2luID0gdGhpcy5tYXJnaW4oKTtcbiAgICB2YXIgb3V0ZXJXaWR0aCAgPSB0aGlzLndpZHRoKCkgKyBtYXJnaW4ubGVmdCArIG1hcmdpbi5yaWdodDtcbiAgICB2YXIgb3V0ZXJIZWlnaHQgPSB0aGlzLmhlaWdodCgpICsgbWFyZ2luLnRvcCArIG1hcmdpbi5ib3R0b207XG4gICAgdmFyIHZpZXdCb3ggPSAnMCAwICcgKyBvdXRlcldpZHRoICsgJyAnICsgb3V0ZXJIZWlnaHQ7XG5cbiAgICB0aGlzLnN2ZyA9IGVsLmFwcGVuZCgnc3ZnJylcbiAgICAgIC5hdHRyKCd3aWR0aCcsIG91dGVyV2lkdGgpXG4gICAgICAuYXR0cignaGVpZ2h0Jywgb3V0ZXJIZWlnaHQpXG4gICAgICAvLyAuYXR0cignd2lkdGgnLCAnMTAwJScpXG4gICAgICAvLyAuYXR0cignaGVpZ2h0JywgJzEwMCUnKVxuICAgICAgLy8gLmF0dHIoJ3ZpZXdCb3gnLCB2aWV3Qm94KVxuICAgICAgLmF0dHIoJ2RhdGEtY25hbWUnLCB0aGlzLmNuYW1lKCkpXG4gICAgICAuYXR0cignZGF0YS1uYW1lJywgdGhpcy5uYW1lKCkpXG4gICAgICAuc3R5bGUoJ2Rpc3BsYXknLCAnYmxvY2snKTtcblxuICAgIC8vIDIuIGNyZWF0ZSBsYXlvdXQgZ3JvdXAgYW5kIGNsaXAgcGF0aFxuICAgIHZhciBjbGlwUGF0aElkID0gJ2JvdWRpbmctYm94LWNsaXAtJyArIHRoaXMuY25hbWUoKTtcblxuICAgIHRoaXMuc3ZnXG4gICAgICAuYXBwZW5kKCdkZWZzJylcbiAgICAgIC5hcHBlbmQoJ2NsaXBQYXRoJylcbiAgICAgIC5hdHRyKCdpZCcsIGNsaXBQYXRoSWQpXG4gICAgICAuYXBwZW5kKCdyZWN0JylcbiAgICAgICAgLmF0dHIoJ3gnLCAwKVxuICAgICAgICAuYXR0cigneScsIDApXG4gICAgICAgIC5hdHRyKCd3aWR0aCcsIG91dGVyV2lkdGgpXG4gICAgICAgIC5hdHRyKCdoZWlnaHQnLCBvdXRlckhlaWdodCk7XG5cbiAgICB0aGlzLmJvdW5kaW5nQm94ID0gdGhpcy5zdmcuYXBwZW5kKCdnJylcbiAgICAgIC5hdHRyKCdjbGFzcycsICdib3VuZGluZy1ib3gnKVxuICAgICAgLmF0dHIoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoJyArIG1hcmdpbi5sZWZ0ICsgJywnICsgbWFyZ2luLnRvcCArICcpJylcbiAgICAgIC5hdHRyKCdjbGlwLXBhdGgnLCAndXJsKCMnICsgY2xpcFBhdGhJZCArICcpJyk7XG5cblxuICAgIC8vIDMuIGRlbGVnYXRlIGV2ZW50c1xuICAgIHRoaXMuZGVsZWdhdGVFdmVudHMoKTtcblxuICAgIC8vIDQuIGNyZWF0ZSBsYXllcnMgZ3JvdXBzXG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMubGF5ZXJzKSB7XG4gICAgICB0aGlzLmxheWVyc1trZXldLmNyZWF0ZUdyb3VwKHRoaXMuYm91bmRpbmdCb3gpO1xuICAgIH1cblxuICAgIC8vIDUuIHVwZGF0ZSB2aWV3XG4gICAgdGhpcy51cGRhdGUoKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gdXBkYXRlIGxheWVyc1xuICAvLyBAcGFyYW0gbGF5ZXJJZHMgPHN0cmluZ3xvYmplY3R8YXJyYXk+IG9wdGlvbm5hbFxuICAvLyAgICAgIGxheWVycyB0byB1cGRhdGUgb3IgaW5zdGFuY2UocylcbiAgdXBkYXRlKC4uLmxheWVycykge1xuICAgIHZhciB0b1VwZGF0ZSA9IHt9O1xuXG4gICAgaWYgKGxheWVycy5sZW5ndGggPT09IDApIHtcbiAgICAgIHRvVXBkYXRlID0gdGhpcy5sYXllcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxheWVycy5mb3JFYWNoKChsYXllcikgPT4ge1xuICAgICAgICB0b1VwZGF0ZVtsYXllci5wYXJhbSgnY25hbWUnKV0gPSBsYXllcjtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSBzZWxlY3RlZCBsYXllcnNcbiAgICBmb3IgKGxldCBrZXkgaW4gdG9VcGRhdGUpIHsgdG9VcGRhdGVba2V5XS51cGRhdGUoKTsgfVxuICAgIGZvciAobGV0IGtleSBpbiB0b1VwZGF0ZSkgeyB0b1VwZGF0ZVtrZXldLmRyYXcoKTsgfVxuXG4gICAgdmFyIGhhc1F1ZXVlID0gdGhpcy51aUxvb3AuaGFzUmVnaXN0ZXJlZENhbGxiYWNrcygpO1xuICAgIC8vIHN0YXJ0IHJBRlxuICAgIHRoaXMudWlMb29wLnN0YXJ0KCk7XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgaWYgKGhhc1F1ZXVlICYmICF0aGlzLnVpTG9vcC5oYXNSZWdpc3RlcmVkQ2FsbGJhY2tzKCkpIHtcbiAgICAgICAgdmFyIGV2ZW50TmFtZSA9IHRoaXMuRE9NUmVhZHkgPyAnRE9NVXBkYXRlJyA6ICdET01SZWFkeSc7XG4gICAgICAgIHRoaXMuZW1pdChldmVudE5hbWUpO1xuICAgICAgICB0aGlzLkRPTVJlYWR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZvY3VzKGxheWVyKSB7XG4gICAgZm9yICh2YXIgbGlkIGluIHRoaXMubGF5ZXJzKSB7XG4gICAgICB0aGlzLmxheWVyc1tsaWRdLmZvY3VzID0gZmFsc2U7XG4gICAgICB0aGlzLmxheWVyc1tsaWRdLnVuZGVsZWdhdGVFdmVudHMoKVxuICAgICAgaWYgKHRoaXMubGF5ZXJzW2xpZF09PWxheWVyKSB7XG4gICAgICAgIHRoaXMubGF5ZXJzW2xpZF0uZm9jdXMgPSB0cnVlO1xuICAgICAgICB0aGlzLmxheWVyc1tsaWRdLmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0Rm9jdXNlZExheWVyKCkge1xuICAgIGZvciAodmFyIGxpZCBpbiB0aGlzLmxheWVycykge1xuICAgICAgaWYgKHRoaXMubGF5ZXJzW2xpZF0uZm9jdXMpXG4gICAgICAgIHJldHVybiB0aGlzLmxheWVyc1tsaWRdO1xuICAgIH1cbiAgfVxuXG4gIHJlc2V0Rm9jdXMoKSB7XG4gICAgZm9yICh2YXIgbGlkIGluIHRoaXMubGF5ZXJzKSBcbiAgICAgIHRoaXMubGF5ZXJzW2xpZF0uZGVsZWdhdGVFdmVudHMoKVxuICB9XG5cbiAgLy8gZGVzdHJveSB0aGUgdGltZWxpbmVcbiAgZGVzdHJveSgpIHtcbiAgICAvLyB0aGlzLmxheWVycy5mb3JFYWNoKChsYXllcikgPT4gdGhpcy5yZW1vdmUobGF5ZXIpKTtcbiAgICAvLyB0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcbiAgICAvLyB0aGlzLnN2Zy5yZW1vdmUoKTtcbiAgfVxufVxuXG4vLyBnZW5lcmljIGdldHRlcnMoc2V0dGVycykgYWNjZXNzb3JzIGFuZCBkZWZhdWx0c1xuLy8gYWNjZXNzb3JzLmdldEZ1bmN0aW9uKFRpbWVsaW5lLnByb3RvdHlwZSwgWyBdKTtcbmFjY2Vzc29ycy5nZXRWYWx1ZShUaW1lbGluZS5wcm90b3R5cGUsIFtcbiAgJ25hbWUnLCAnY25hbWUnLCAneERvbWFpbicsICd5RG9tYWluJywgJ2hlaWdodCcsICd3aWR0aCcsICdtYXJnaW4nXG5dKTtcblxuZnVuY3Rpb24gZmFjdG9yeShvcHRpb25zKSB7IHJldHVybiBuZXcgVGltZWxpbmUob3B0aW9ucyk7IH1cbmZhY3RvcnkuZDMgPSBkMzsgLy8gbWFrZSBkMyBhdmFpbGFibGUgdGhvdWdoIHRoZSBmYWN0b3J5XG5mYWN0b3J5LlRpbWVsaW5lID0gVGltZWxpbmU7XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiJdfQ==