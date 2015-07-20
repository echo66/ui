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

var _require3 = require("./lib/resampler");

var minMax = _require3.minMax;
var createSnapshot = _require3.createSnapshot;

var renderingStrategies = require("./lib/rendering-strategies");
// var fs        = require('fs'); // for workers

//   @NOTES/TODOS
//   use cached data in zoom in / define what to do on zoom out
//
// - webworker create a creepy flicking issue due to asynchrony
//   and is actually not usable - we must find a workaround for that problem
//   option removed for now

// var workerBlob = new Blob(
//   [fs.readFileSync(__dirname + '/lib/resampler-worker.js', 'utf-8')],
//   { type: 'text/javascript' }
// );

var Waveform = (function (_Layer) {
  function Waveform() {
    _classCallCheck(this, Waveform);

    _get(_core.Object.getPrototypeOf(Waveform.prototype), "constructor", this).call(this);

    var defaults = {
      type: "waveform",
      id: uniqueId(name),
      renderingStrategy: "svg",
      yDomain: [-1, 1], // default yDomain for audioBuffer
      triggerUpdateZoomDelta: 0.01,
      triggerUpdateDragDelta: 2 };

    this.params(defaults);
    this.color("#000000");
    this.sampleRate(44100);
    // init zoom factor to 1
    this.currentZoomFactor = 1;
    this.currentDragDeltaX = 0;
  }

  _inherits(Waveform, _Layer);

  _createClass(Waveform, {
    getSamplesPerPixel: {

      // get number of sample per timeline pixels - aka. windowSize
      // should not be dependant of timeline with,
      // should be able to create some kind of segment

      value: function getSamplesPerPixel() {
        var timelineDomain = this.base.xScale.domain();
        var timelineDuration = timelineDomain[1] - timelineDomain[0];
        var timelineWidth = this.base.width();
        var sampleRate = this.sampleRate();

        return timelineDuration * sampleRate() / timelineWidth;
      }
    },
    load: {
      value: function load(base, d3) {
        _get(_core.Object.getPrototypeOf(Waveform.prototype), "load", this).call(this, base, d3);

        var sampleRate = this.sampleRate()();
        var data = this.data();
        data = data instanceof ArrayBuffer ? new Float32Array(data) : data;
        var duration = data.length / sampleRate;
        // console.log("-------------------------------------------------------------");
        // console.info("Duration of the waveform: " + duration + " seconds.");
        // console.log("-------------------------------------------------------------");
        // bind rendering strategy
        var strategy = renderingStrategies[this.param("renderingStrategy")];
        this._update = strategy.update.bind(this);
        this._draw = strategy.draw.bind(this);
        // create partial xxScale
        this.xxScale = this.d3.scale.linear().range([0, duration]);

        // init worker
        // if (this.param('useWorker')) { this.initWorker(); }
      }
    },
    downSample: {

      // initWorker() {
      //   this.resampler = new Worker(window.URL.createObjectURL(workerBlob));
      //   var onResponse = this.resamplerResponse.bind(this);
      //   this.resampler.addEventListener('message', onResponse, false);
      //   // an index to prevent drawing to "come back" in time
      //   // try to fix async problem but do anything actually
      //   // this.__currentWorkerCallTime = 0;

      //   var message = {
      //     cmd: 'initialize',
      //     buffer: this.data(),
      //     minMax: minMax.toString()
      //   };

      //   this.resampler.postMessage(message, [message.buffer]);
      // }

      // call the resampler worker or online minMax
      // according to `this.param('useWorker')`

      value: function downSample() {
        var data = this.data();
        var buffer = data instanceof ArrayBuffer ? new Float32Array(data) : data;
        // console.log("------------------------------");
        // console.info("waveform::downSample");
        // console.info("from original size: "+buffer.length);

        var snapshotWindowSize = 256;
        if (!this.__snapshot256) {
          this.__snapshot256 = createSnapshot(buffer, snapshotWindowSize);
        }
        // console.info("to snapshot size: "+this.__snapshot256.length);

        // width should be computed this way
        // what about having multiple sounds on the same track ?
        var range = this.base.xScale.range();
        var width = range[1] - range[0];
        var extractAtTimes = [];

        // define all times where a minMax snapshot must be done
        for (var pixel = 0; pixel < width; pixel++) {
          var timelineTimeStart = this.base.xScale.invert(pixel);
          extractAtTimes.push(timelineTimeStart);
        }
        // console.info("extractAtTimes.length: "+extractAtTimes.length);

        // define center of the y domain for default values
        var yDomain = this.yScale.domain(); // not this
        var defaultValue = (yDomain[0] + yDomain[1]) / 2;
        var sampleRate = this.sampleRate()();
        var windowSize = this.getSamplesPerPixel();
        var downSampledAt;

        // if (this.param('useWorker')) {
        //   var message = {
        //     cmd: 'downSample',
        //     time: new Date().getTime(),
        //     extractAtTimes: extractAtTimes,
        //     sampleRate: sampleRate,
        //     windowSize: windowSize,
        //     defaultValue: defaultValue
        //   };

        //   this.resampler.postMessage(message);
        // } else {
        // var data = this.data();
        // var buffer = data instanceof ArrayBuffer ? new Float32Array(data) : data;
        if (windowSize > snapshotWindowSize * 2) {
          // use snapshot
          buffer = this.__snapshot256;
          downSampledAt = snapshotWindowSize;
        } else {
          buffer = buffer;
          downSampledAt = 1;
        }
        // console.log("------------------------------");
        var downSampledView = minMax(buffer, extractAtTimes, sampleRate, windowSize, defaultValue, downSampledAt);

        this.setDownSample(downSampledView);
        // }
      }
    },
    setDownSample: {

      // is called by the resampler worker when done
      // @NOTE is this method really needed
      // resamplerResponse(message) {
      //   var data = message.data;

      //   switch (data.cmd) {
      //     case 'downSample':
      //       this.setDownSample(data.downSampledView);
      //       break;
      //     default:
      //       throw new Error('Resampler unkown command: ' + data.msg);
      //       break;
      //   }
      // }

      // cache the down sampling result and create some scale

      value: function setDownSample(data) {
        // console.log("-------------------------------------------");
        // console.info("waveform::setDownSample");
        // // console.info(data);
        // console.info([0, data.length]);
        // console.info(this.base.xScale.domain());
        // console.log("-------------------------------------------");
        // update xxScale according to new base.xScale.domain and data.length
        this.xxScale.domain([0, data.length]).range(this.base.xScale.domain());
        // update cache
        this.cache(data);
        this.draw(data);
      }
    },
    xZoom: {
      value: function xZoom(e) {
        // @TODO
        // - different trigger updates according to zoom in or out
        var triggerUpdateZoomDelta = this.param("triggerUpdateZoomDelta");
        var triggerUpdateDragDelta = this.param("triggerUpdateDragDelta");
        var deltaZoom = Math.abs(this.currentZoomFactor - e.factor);
        var deltaDrag = Math.abs(this.currentDragDeltaX - e.delta.x);

        // if small zoom or drag delta, render cached data
        if (deltaZoom < triggerUpdateZoomDelta && deltaDrag < triggerUpdateDragDelta) {
          return this.draw(this.cache()());
        }

        this.currentZoomFactor = e.factor;
        this.currentDragDeltaX = e.delta.x;

        this.downSample();
      }
    },
    update: {

      // display methods

      value: function update() {
        this._update();
      }
    },
    draw: {
      value: function draw(data) {
        if (!data) {
          return this.downSample();
        }
        this._draw(data);
      }
    }
  });

  return Waveform;
})(Layer);

// data accessors
// @NOTE `start` and `end` could allow drag
accessors.getFunction(Waveform.prototype, ["color", "sampleRate", "cache"]);

// factory
function factory() {
  return new Waveform();
}
factory.Waveform = Waveform;

module.exports = factory;

// useWorker: false
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7ZUFFaUIsT0FBTyxDQUFDLGtCQUFrQixDQUFDOztJQUFuRCxRQUFRLFlBQVIsUUFBUTtJQUFFLFNBQVMsWUFBVCxTQUFTOztnQkFDVCxPQUFPLENBQUMsZUFBZSxDQUFDOztJQUFsQyxLQUFLLGFBQUwsS0FBSzs7Z0JBQ3NCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7SUFBckQsTUFBTSxhQUFOLE1BQU07SUFBRSxjQUFjLGFBQWQsY0FBYzs7QUFDNUIsSUFBSSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0lBZTFELFFBQVE7QUFDRCxXQURQLFFBQVEsR0FDRTswQkFEVixRQUFROztBQUVWLHFDQUZFLFFBQVEsNkNBRUY7O0FBRVIsUUFBSSxRQUFRLEdBQUc7QUFDYixVQUFJLEVBQUUsVUFBVTtBQUNoQixRQUFFLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQztBQUNsQix1QkFBaUIsRUFBRSxLQUFLO0FBQ3hCLGFBQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNoQiw0QkFBc0IsRUFBRSxJQUFJO0FBQzVCLDRCQUFzQixFQUFFLENBQUMsRUFFMUIsQ0FBQzs7QUFFRixRQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3RCLFFBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEIsUUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFdkIsUUFBSSxDQUFDLGlCQUFpQixHQUFHLENBQUMsQ0FBQztBQUMzQixRQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDO0dBQzVCOztZQXBCRyxRQUFROztlQUFSLFFBQVE7QUF5Qlosc0JBQWtCOzs7Ozs7YUFBQSw4QkFBRztBQUNuQixZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUMvQyxZQUFJLGdCQUFnQixHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN0QyxZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7O0FBRW5DLGVBQU8sQUFBQyxnQkFBZ0IsR0FBRyxVQUFVLEVBQUUsR0FBSSxhQUFhLENBQUM7T0FDMUQ7O0FBRUQsUUFBSTthQUFBLGNBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRTtBQUNiLHlDQW5DRSxRQUFRLHNDQW1DQyxJQUFJLEVBQUUsRUFBRSxFQUFFOztBQUVyQixZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQztBQUNyQyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkIsWUFBSSxHQUFHLElBQUksWUFBWSxXQUFXLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ25FLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFDOzs7OztBQUt4QyxZQUFJLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztBQUNwRSxZQUFJLENBQUMsT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFDLFlBQUksQ0FBQyxLQUFLLEdBQUssUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRXhDLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQ2xDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDOzs7O09BSXpCOztBQXFCRCxjQUFVOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2FBQUEsc0JBQUc7QUFDWCxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDdkIsWUFBSSxNQUFNLEdBQUcsSUFBSSxZQUFZLFdBQVcsR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7Ozs7O0FBS3pFLFlBQUksa0JBQWtCLEdBQUcsR0FBRyxDQUFDO0FBQzdCLFlBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3ZCLGNBQUksQ0FBQyxhQUFhLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pFOzs7OztBQUtELFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JDLFlBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEMsWUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDOzs7QUFHeEIsYUFBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRTtBQUMxQyxjQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2RCx3QkFBYyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1NBQ3hDOzs7O0FBSUQsWUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUNuQyxZQUFJLFlBQVksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUEsR0FBSSxDQUFDLENBQUM7QUFDakQsWUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUM7QUFDckMsWUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFDM0MsWUFBSSxhQUFhLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQmxCLFlBQUksVUFBVSxHQUFJLGtCQUFrQixHQUFHLENBQUMsQUFBQyxFQUFFOztBQUV6QyxnQkFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDNUIsdUJBQWEsR0FBRyxrQkFBa0IsQ0FBQztTQUNwQyxNQUFNO0FBQ0wsZ0JBQU0sR0FBRyxNQUFNLENBQUM7QUFDaEIsdUJBQWEsR0FBRyxDQUFDLENBQUM7U0FDbkI7O0FBRUQsWUFBSSxlQUFlLEdBQUcsTUFBTSxDQUMxQixNQUFNLEVBQ04sY0FBYyxFQUNkLFVBQVUsRUFDVixVQUFVLEVBQ1YsWUFBWSxFQUNaLGFBQWEsQ0FDZCxDQUFDOztBQUVGLFlBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUM7O09BRXJDOztBQWtCRCxpQkFBYTs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQUFBLHVCQUFDLElBQUksRUFBRTs7Ozs7Ozs7QUFRbEIsWUFBSSxDQUFDLE9BQU8sQ0FDVCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQ3hCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDOztBQUVwQyxZQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDakI7O0FBRUQsU0FBSzthQUFBLGVBQUMsQ0FBQyxFQUFFOzs7QUFHUCxZQUFJLHNCQUFzQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUNsRSxZQUFJLHNCQUFzQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUNsRSxZQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDNUQsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O0FBRzdELFlBQ0UsQUFBQyxTQUFTLEdBQUcsc0JBQXNCLElBQ2xDLFNBQVMsR0FBRyxzQkFBc0IsQUFBQyxFQUNwQztBQUNBLGlCQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNsQzs7QUFFRCxZQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztBQUNsQyxZQUFJLENBQUMsaUJBQWlCLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7O0FBRW5DLFlBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztPQUNuQjs7QUFHRCxVQUFNOzs7O2FBQUEsa0JBQUc7QUFDUCxZQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDaEI7O0FBRUQsUUFBSTthQUFBLGNBQUMsSUFBSSxFQUFFO0FBQ1QsWUFBSSxDQUFDLElBQUksRUFBRTtBQUFFLGlCQUFPLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztTQUFFO0FBQ3hDLFlBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDbEI7Ozs7U0E5TUcsUUFBUTtHQUFTLEtBQUs7Ozs7QUFvTjVCLFNBQVMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUN4QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FDL0IsQ0FBQyxDQUFDOzs7QUFHSCxTQUFTLE9BQU8sR0FBRztBQUFFLFNBQU8sSUFBSSxRQUFRLEVBQUUsQ0FBQztDQUFFO0FBQzdDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDOztBQUU1QixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyIsImZpbGUiOiJlczYvY29tcG9uZW50cy9zZWdtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgeyB1bmlxdWVJZCwgYWNjZXNzb3JzIH0gPSByZXF1aXJlKCcuLi9oZWxwZXJzL3V0aWxzJyk7XG52YXIgeyBMYXllciB9ID0gcmVxdWlyZSgnLi4vY29yZS9sYXllcicpO1xudmFyIHsgbWluTWF4LCBjcmVhdGVTbmFwc2hvdCB9ID0gcmVxdWlyZSgnLi9saWIvcmVzYW1wbGVyJyk7XG52YXIgcmVuZGVyaW5nU3RyYXRlZ2llcyA9IHJlcXVpcmUoJy4vbGliL3JlbmRlcmluZy1zdHJhdGVnaWVzJyk7XG4vLyB2YXIgZnMgICAgICAgID0gcmVxdWlyZSgnZnMnKTsgLy8gZm9yIHdvcmtlcnNcblxuLy8gICBATk9URVMvVE9ET1Ncbi8vICAgdXNlIGNhY2hlZCBkYXRhIGluIHpvb20gaW4gLyBkZWZpbmUgd2hhdCB0byBkbyBvbiB6b29tIG91dFxuLy9cbi8vIC0gd2Vid29ya2VyIGNyZWF0ZSBhIGNyZWVweSBmbGlja2luZyBpc3N1ZSBkdWUgdG8gYXN5bmNocm9ueVxuLy8gICBhbmQgaXMgYWN0dWFsbHkgbm90IHVzYWJsZSAtIHdlIG11c3QgZmluZCBhIHdvcmthcm91bmQgZm9yIHRoYXQgcHJvYmxlbVxuLy8gICBvcHRpb24gcmVtb3ZlZCBmb3Igbm93XG5cbi8vIHZhciB3b3JrZXJCbG9iID0gbmV3IEJsb2IoXG4vLyAgIFtmcy5yZWFkRmlsZVN5bmMoX19kaXJuYW1lICsgJy9saWIvcmVzYW1wbGVyLXdvcmtlci5qcycsICd1dGYtOCcpXSxcbi8vICAgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9XG4vLyApO1xuXG5jbGFzcyBXYXZlZm9ybSBleHRlbmRzIExheWVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgIHR5cGU6ICd3YXZlZm9ybScsXG4gICAgICBpZDogdW5pcXVlSWQobmFtZSksXG4gICAgICByZW5kZXJpbmdTdHJhdGVneTogJ3N2ZycsXG4gICAgICB5RG9tYWluOiBbLTEsIDFdLCAvLyBkZWZhdWx0IHlEb21haW4gZm9yIGF1ZGlvQnVmZmVyXG4gICAgICB0cmlnZ2VyVXBkYXRlWm9vbURlbHRhOiAwLjAxLFxuICAgICAgdHJpZ2dlclVwZGF0ZURyYWdEZWx0YTogMixcbiAgICAgIC8vIHVzZVdvcmtlcjogZmFsc2VcbiAgICB9O1xuXG4gICAgdGhpcy5wYXJhbXMoZGVmYXVsdHMpO1xuICAgIHRoaXMuY29sb3IoJyMwMDAwMDAnKTtcbiAgICB0aGlzLnNhbXBsZVJhdGUoNDQxMDApO1xuICAgIC8vIGluaXQgem9vbSBmYWN0b3IgdG8gMVxuICAgIHRoaXMuY3VycmVudFpvb21GYWN0b3IgPSAxO1xuICAgIHRoaXMuY3VycmVudERyYWdEZWx0YVggPSAwO1xuICB9XG5cbiAgLy8gZ2V0IG51bWJlciBvZiBzYW1wbGUgcGVyIHRpbWVsaW5lIHBpeGVscyAtIGFrYS4gd2luZG93U2l6ZVxuICAvLyBzaG91bGQgbm90IGJlIGRlcGVuZGFudCBvZiB0aW1lbGluZSB3aXRoLFxuICAvLyBzaG91bGQgYmUgYWJsZSB0byBjcmVhdGUgc29tZSBraW5kIG9mIHNlZ21lbnRcbiAgZ2V0U2FtcGxlc1BlclBpeGVsKCkge1xuICAgIHZhciB0aW1lbGluZURvbWFpbiA9IHRoaXMuYmFzZS54U2NhbGUuZG9tYWluKCk7XG4gICAgdmFyIHRpbWVsaW5lRHVyYXRpb24gPSB0aW1lbGluZURvbWFpblsxXSAtIHRpbWVsaW5lRG9tYWluWzBdO1xuICAgIHZhciB0aW1lbGluZVdpZHRoID0gdGhpcy5iYXNlLndpZHRoKCk7XG4gICAgdmFyIHNhbXBsZVJhdGUgPSB0aGlzLnNhbXBsZVJhdGUoKTtcblxuICAgIHJldHVybiAodGltZWxpbmVEdXJhdGlvbiAqIHNhbXBsZVJhdGUoKSkgLyB0aW1lbGluZVdpZHRoO1xuICB9XG5cbiAgbG9hZChiYXNlLCBkMykge1xuICAgIHN1cGVyLmxvYWQoYmFzZSwgZDMpO1xuXG4gICAgdmFyIHNhbXBsZVJhdGUgPSB0aGlzLnNhbXBsZVJhdGUoKSgpO1xuICAgIHZhciBkYXRhID0gdGhpcy5kYXRhKCk7XG4gICAgZGF0YSA9IGRhdGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciA/IG5ldyBGbG9hdDMyQXJyYXkoZGF0YSkgOiBkYXRhO1xuICAgIHZhciBkdXJhdGlvbiA9IGRhdGEubGVuZ3RoIC8gc2FtcGxlUmF0ZTtcbiAgICAvLyBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gICAgLy8gY29uc29sZS5pbmZvKFwiRHVyYXRpb24gb2YgdGhlIHdhdmVmb3JtOiBcIiArIGR1cmF0aW9uICsgXCIgc2Vjb25kcy5cIik7XG4gICAgLy8gY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xuICAgIC8vIGJpbmQgcmVuZGVyaW5nIHN0cmF0ZWd5XG4gICAgdmFyIHN0cmF0ZWd5ID0gcmVuZGVyaW5nU3RyYXRlZ2llc1t0aGlzLnBhcmFtKCdyZW5kZXJpbmdTdHJhdGVneScpXTtcbiAgICB0aGlzLl91cGRhdGUgPSBzdHJhdGVneS51cGRhdGUuYmluZCh0aGlzKTtcbiAgICB0aGlzLl9kcmF3ICAgPSBzdHJhdGVneS5kcmF3LmJpbmQodGhpcyk7XG4gICAgLy8gY3JlYXRlIHBhcnRpYWwgeHhTY2FsZVxuICAgIHRoaXMueHhTY2FsZSA9IHRoaXMuZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5yYW5nZShbMCwgZHVyYXRpb25dKTtcblxuICAgIC8vIGluaXQgd29ya2VyXG4gICAgLy8gaWYgKHRoaXMucGFyYW0oJ3VzZVdvcmtlcicpKSB7IHRoaXMuaW5pdFdvcmtlcigpOyB9XG4gIH1cblxuICAvLyBpbml0V29ya2VyKCkge1xuICAvLyAgIHRoaXMucmVzYW1wbGVyID0gbmV3IFdvcmtlcih3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTCh3b3JrZXJCbG9iKSk7XG4gIC8vICAgdmFyIG9uUmVzcG9uc2UgPSB0aGlzLnJlc2FtcGxlclJlc3BvbnNlLmJpbmQodGhpcyk7XG4gIC8vICAgdGhpcy5yZXNhbXBsZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uUmVzcG9uc2UsIGZhbHNlKTtcbiAgLy8gICAvLyBhbiBpbmRleCB0byBwcmV2ZW50IGRyYXdpbmcgdG8gXCJjb21lIGJhY2tcIiBpbiB0aW1lXG4gIC8vICAgLy8gdHJ5IHRvIGZpeCBhc3luYyBwcm9ibGVtIGJ1dCBkbyBhbnl0aGluZyBhY3R1YWxseVxuICAvLyAgIC8vIHRoaXMuX19jdXJyZW50V29ya2VyQ2FsbFRpbWUgPSAwO1xuXG4gIC8vICAgdmFyIG1lc3NhZ2UgPSB7XG4gIC8vICAgICBjbWQ6ICdpbml0aWFsaXplJyxcbiAgLy8gICAgIGJ1ZmZlcjogdGhpcy5kYXRhKCksXG4gIC8vICAgICBtaW5NYXg6IG1pbk1heC50b1N0cmluZygpXG4gIC8vICAgfTtcblxuICAvLyAgIHRoaXMucmVzYW1wbGVyLnBvc3RNZXNzYWdlKG1lc3NhZ2UsIFttZXNzYWdlLmJ1ZmZlcl0pO1xuICAvLyB9XG5cbiAgLy8gY2FsbCB0aGUgcmVzYW1wbGVyIHdvcmtlciBvciBvbmxpbmUgbWluTWF4XG4gIC8vIGFjY29yZGluZyB0byBgdGhpcy5wYXJhbSgndXNlV29ya2VyJylgXG4gIGRvd25TYW1wbGUoKSB7XG4gICAgdmFyIGRhdGEgPSB0aGlzLmRhdGEoKTtcbiAgICB2YXIgYnVmZmVyID0gZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyID8gbmV3IEZsb2F0MzJBcnJheShkYXRhKSA6IGRhdGE7XG4gICAgLy8gY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gICAgLy8gY29uc29sZS5pbmZvKFwid2F2ZWZvcm06OmRvd25TYW1wbGVcIik7XG4gICAgLy8gY29uc29sZS5pbmZvKFwiZnJvbSBvcmlnaW5hbCBzaXplOiBcIitidWZmZXIubGVuZ3RoKTtcblxuICAgIHZhciBzbmFwc2hvdFdpbmRvd1NpemUgPSAyNTY7XG4gICAgaWYgKCF0aGlzLl9fc25hcHNob3QyNTYpIHtcbiAgICAgIHRoaXMuX19zbmFwc2hvdDI1NiA9IGNyZWF0ZVNuYXBzaG90KGJ1ZmZlciwgc25hcHNob3RXaW5kb3dTaXplKTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5pbmZvKFwidG8gc25hcHNob3Qgc2l6ZTogXCIrdGhpcy5fX3NuYXBzaG90MjU2Lmxlbmd0aCk7XG5cbiAgICAvLyB3aWR0aCBzaG91bGQgYmUgY29tcHV0ZWQgdGhpcyB3YXlcbiAgICAvLyB3aGF0IGFib3V0IGhhdmluZyBtdWx0aXBsZSBzb3VuZHMgb24gdGhlIHNhbWUgdHJhY2sgP1xuICAgIHZhciByYW5nZSA9IHRoaXMuYmFzZS54U2NhbGUucmFuZ2UoKTtcbiAgICB2YXIgd2lkdGggPSByYW5nZVsxXSAtIHJhbmdlWzBdO1xuICAgIHZhciBleHRyYWN0QXRUaW1lcyA9IFtdO1xuXG4gICAgLy8gZGVmaW5lIGFsbCB0aW1lcyB3aGVyZSBhIG1pbk1heCBzbmFwc2hvdCBtdXN0IGJlIGRvbmVcbiAgICBmb3IgKGxldCBwaXhlbCA9IDA7IHBpeGVsIDwgd2lkdGg7IHBpeGVsKyspIHtcbiAgICAgIHZhciB0aW1lbGluZVRpbWVTdGFydCA9IHRoaXMuYmFzZS54U2NhbGUuaW52ZXJ0KHBpeGVsKTtcbiAgICAgIGV4dHJhY3RBdFRpbWVzLnB1c2godGltZWxpbmVUaW1lU3RhcnQpO1xuICAgIH1cbiAgICAvLyBjb25zb2xlLmluZm8oXCJleHRyYWN0QXRUaW1lcy5sZW5ndGg6IFwiK2V4dHJhY3RBdFRpbWVzLmxlbmd0aCk7XG5cbiAgICAvLyBkZWZpbmUgY2VudGVyIG9mIHRoZSB5IGRvbWFpbiBmb3IgZGVmYXVsdCB2YWx1ZXNcbiAgICB2YXIgeURvbWFpbiA9IHRoaXMueVNjYWxlLmRvbWFpbigpOyAvLyBub3QgdGhpc1xuICAgIHZhciBkZWZhdWx0VmFsdWUgPSAoeURvbWFpblswXSArIHlEb21haW5bMV0pIC8gMjtcbiAgICB2YXIgc2FtcGxlUmF0ZSA9IHRoaXMuc2FtcGxlUmF0ZSgpKCk7XG4gICAgdmFyIHdpbmRvd1NpemUgPSB0aGlzLmdldFNhbXBsZXNQZXJQaXhlbCgpO1xuICAgIHZhciBkb3duU2FtcGxlZEF0O1xuXG4gICAgLy8gaWYgKHRoaXMucGFyYW0oJ3VzZVdvcmtlcicpKSB7XG4gICAgLy8gICB2YXIgbWVzc2FnZSA9IHtcbiAgICAvLyAgICAgY21kOiAnZG93blNhbXBsZScsXG4gICAgLy8gICAgIHRpbWU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpLFxuICAgIC8vICAgICBleHRyYWN0QXRUaW1lczogZXh0cmFjdEF0VGltZXMsXG4gICAgLy8gICAgIHNhbXBsZVJhdGU6IHNhbXBsZVJhdGUsXG4gICAgLy8gICAgIHdpbmRvd1NpemU6IHdpbmRvd1NpemUsXG4gICAgLy8gICAgIGRlZmF1bHRWYWx1ZTogZGVmYXVsdFZhbHVlXG4gICAgLy8gICB9O1xuXG4gICAgLy8gICB0aGlzLnJlc2FtcGxlci5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAvLyB9IGVsc2Uge1xuICAgICAgLy8gdmFyIGRhdGEgPSB0aGlzLmRhdGEoKTtcbiAgICAgIC8vIHZhciBidWZmZXIgPSBkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgPyBuZXcgRmxvYXQzMkFycmF5KGRhdGEpIDogZGF0YTtcbiAgICBpZiAod2luZG93U2l6ZSA+IChzbmFwc2hvdFdpbmRvd1NpemUgKiAyKSkge1xuICAgICAgLy8gdXNlIHNuYXBzaG90XG4gICAgICBidWZmZXIgPSB0aGlzLl9fc25hcHNob3QyNTY7XG4gICAgICBkb3duU2FtcGxlZEF0ID0gc25hcHNob3RXaW5kb3dTaXplO1xuICAgIH0gZWxzZSB7XG4gICAgICBidWZmZXIgPSBidWZmZXI7XG4gICAgICBkb3duU2FtcGxlZEF0ID0gMTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gICAgdmFyIGRvd25TYW1wbGVkVmlldyA9IG1pbk1heChcbiAgICAgIGJ1ZmZlcixcbiAgICAgIGV4dHJhY3RBdFRpbWVzLFxuICAgICAgc2FtcGxlUmF0ZSxcbiAgICAgIHdpbmRvd1NpemUsXG4gICAgICBkZWZhdWx0VmFsdWUsXG4gICAgICBkb3duU2FtcGxlZEF0XG4gICAgKTtcblxuICAgIHRoaXMuc2V0RG93blNhbXBsZShkb3duU2FtcGxlZFZpZXcpO1xuICAgIC8vIH1cbiAgfVxuXG4gIC8vIGlzIGNhbGxlZCBieSB0aGUgcmVzYW1wbGVyIHdvcmtlciB3aGVuIGRvbmVcbiAgLy8gQE5PVEUgaXMgdGhpcyBtZXRob2QgcmVhbGx5IG5lZWRlZFxuICAvLyByZXNhbXBsZXJSZXNwb25zZShtZXNzYWdlKSB7XG4gIC8vICAgdmFyIGRhdGEgPSBtZXNzYWdlLmRhdGE7XG5cbiAgLy8gICBzd2l0Y2ggKGRhdGEuY21kKSB7XG4gIC8vICAgICBjYXNlICdkb3duU2FtcGxlJzpcbiAgLy8gICAgICAgdGhpcy5zZXREb3duU2FtcGxlKGRhdGEuZG93blNhbXBsZWRWaWV3KTtcbiAgLy8gICAgICAgYnJlYWs7XG4gIC8vICAgICBkZWZhdWx0OlxuICAvLyAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Jlc2FtcGxlciB1bmtvd24gY29tbWFuZDogJyArIGRhdGEubXNnKTtcbiAgLy8gICAgICAgYnJlYWs7XG4gIC8vICAgfVxuICAvLyB9XG5cbiAgLy8gY2FjaGUgdGhlIGRvd24gc2FtcGxpbmcgcmVzdWx0IGFuZCBjcmVhdGUgc29tZSBzY2FsZVxuICBzZXREb3duU2FtcGxlKGRhdGEpIHtcbiAgICAvLyBjb25zb2xlLmxvZyhcIi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cIik7XG4gICAgLy8gY29uc29sZS5pbmZvKFwid2F2ZWZvcm06OnNldERvd25TYW1wbGVcIik7XG4gICAgLy8gLy8gY29uc29sZS5pbmZvKGRhdGEpO1xuICAgIC8vIGNvbnNvbGUuaW5mbyhbMCwgZGF0YS5sZW5ndGhdKTtcbiAgICAvLyBjb25zb2xlLmluZm8odGhpcy5iYXNlLnhTY2FsZS5kb21haW4oKSk7XG4gICAgLy8gY29uc29sZS5sb2coXCItLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXCIpO1xuICAgIC8vIHVwZGF0ZSB4eFNjYWxlIGFjY29yZGluZyB0byBuZXcgYmFzZS54U2NhbGUuZG9tYWluIGFuZCBkYXRhLmxlbmd0aFxuICAgIHRoaXMueHhTY2FsZVxuICAgICAgLmRvbWFpbihbMCwgZGF0YS5sZW5ndGhdKVxuICAgICAgLnJhbmdlKHRoaXMuYmFzZS54U2NhbGUuZG9tYWluKCkpO1xuICAgIC8vIHVwZGF0ZSBjYWNoZVxuICAgIHRoaXMuY2FjaGUoZGF0YSk7XG4gICAgdGhpcy5kcmF3KGRhdGEpO1xuICB9XG5cbiAgeFpvb20oZSkge1xuICAgIC8vIEBUT0RPXG4gICAgLy8gLSBkaWZmZXJlbnQgdHJpZ2dlciB1cGRhdGVzIGFjY29yZGluZyB0byB6b29tIGluIG9yIG91dFxuICAgIHZhciB0cmlnZ2VyVXBkYXRlWm9vbURlbHRhID0gdGhpcy5wYXJhbSgndHJpZ2dlclVwZGF0ZVpvb21EZWx0YScpO1xuICAgIHZhciB0cmlnZ2VyVXBkYXRlRHJhZ0RlbHRhID0gdGhpcy5wYXJhbSgndHJpZ2dlclVwZGF0ZURyYWdEZWx0YScpO1xuICAgIHZhciBkZWx0YVpvb20gPSBNYXRoLmFicyh0aGlzLmN1cnJlbnRab29tRmFjdG9yIC0gZS5mYWN0b3IpO1xuICAgIHZhciBkZWx0YURyYWcgPSBNYXRoLmFicyh0aGlzLmN1cnJlbnREcmFnRGVsdGFYIC0gZS5kZWx0YS54KTtcblxuICAgIC8vIGlmIHNtYWxsIHpvb20gb3IgZHJhZyBkZWx0YSwgcmVuZGVyIGNhY2hlZCBkYXRhXG4gICAgaWYgKFxuICAgICAgKGRlbHRhWm9vbSA8IHRyaWdnZXJVcGRhdGVab29tRGVsdGEpICYmXG4gICAgICAoZGVsdGFEcmFnIDwgdHJpZ2dlclVwZGF0ZURyYWdEZWx0YSlcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLmRyYXcodGhpcy5jYWNoZSgpKCkpO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudFpvb21GYWN0b3IgPSBlLmZhY3RvcjtcbiAgICB0aGlzLmN1cnJlbnREcmFnRGVsdGFYID0gZS5kZWx0YS54O1xuXG4gICAgdGhpcy5kb3duU2FtcGxlKCk7XG4gIH1cblxuICAvLyBkaXNwbGF5IG1ldGhvZHNcbiAgdXBkYXRlKCkge1xuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgZHJhdyhkYXRhKSB7XG4gICAgaWYgKCFkYXRhKSB7IHJldHVybiB0aGlzLmRvd25TYW1wbGUoKTsgfVxuICAgIHRoaXMuX2RyYXcoZGF0YSk7XG4gIH1cblxufVxuXG4vLyBkYXRhIGFjY2Vzc29yc1xuLy8gQE5PVEUgYHN0YXJ0YCBhbmQgYGVuZGAgY291bGQgYWxsb3cgZHJhZ1xuYWNjZXNzb3JzLmdldEZ1bmN0aW9uKFdhdmVmb3JtLnByb3RvdHlwZSwgW1xuICAnY29sb3InLCAnc2FtcGxlUmF0ZScsICdjYWNoZSdcbl0pO1xuXG4vLyBmYWN0b3J5XG5mdW5jdGlvbiBmYWN0b3J5KCkgeyByZXR1cm4gbmV3IFdhdmVmb3JtKCk7IH1cbmZhY3RvcnkuV2F2ZWZvcm0gPSBXYXZlZm9ybTtcblxubW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5O1xuIl19