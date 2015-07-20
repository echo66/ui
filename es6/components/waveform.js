'use strict';

var { uniqueId, accessors } = require('../helpers/utils');
var { Layer } = require('../core/layer');
var { minMax, createSnapshot } = require('./lib/resampler');
var renderingStrategies = require('./lib/rendering-strategies');
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

class Waveform extends Layer {
  constructor() {
    super();

    var defaults = {
      type: 'waveform',
      id: uniqueId(name),
      renderingStrategy: 'svg',
      yDomain: [-1, 1], // default yDomain for audioBuffer
      triggerUpdateZoomDelta: 0.01,
      triggerUpdateDragDelta: 2,
      // useWorker: false
    };

    this.params(defaults);
    this.color('#000000');
    this.sampleRate(44100);
    // init zoom factor to 1
    this.currentZoomFactor = 1;
    this.currentDragDeltaX = 0;
  }

  // get number of sample per timeline pixels - aka. windowSize
  // should not be dependant of timeline with,
  // should be able to create some kind of segment
  getSamplesPerPixel() {
    var timelineDomain = this.base.xScale.domain();
    var timelineDuration = timelineDomain[1] - timelineDomain[0];
    var timelineWidth = this.base.width();
    var sampleRate = this.sampleRate();

    return (timelineDuration * sampleRate()) / timelineWidth;
  }

  load(base, d3) {
    super.load(base, d3);

    var sampleRate = this.sampleRate()();
    var data = this.data();
    data = data instanceof ArrayBuffer ? new Float32Array(data) : data;
    var duration = data.length / sampleRate;
    // console.log("-------------------------------------------------------------");
    // console.info("Duration of the waveform: " + duration + " seconds.");
    // console.log("-------------------------------------------------------------");
    // bind rendering strategy
    var strategy = renderingStrategies[this.param('renderingStrategy')];
    this._update = strategy.update.bind(this);
    this._draw   = strategy.draw.bind(this);
    // create partial xxScale
    this.xxScale = this.d3.scale.linear()
      .range([0, duration]);

    // init worker
    // if (this.param('useWorker')) { this.initWorker(); }
  }

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
  downSample() {
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
    for (let pixel = 0; pixel < width; pixel++) {
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
    if (windowSize > (snapshotWindowSize * 2)) {
      // use snapshot
      buffer = this.__snapshot256;
      downSampledAt = snapshotWindowSize;
    } else {
      buffer = buffer;
      downSampledAt = 1;
    }
    // console.log("------------------------------");
    var downSampledView = minMax(
      buffer,
      extractAtTimes,
      sampleRate,
      windowSize,
      defaultValue,
      downSampledAt
    );

    this.setDownSample(downSampledView);
    // }
  }

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
  setDownSample(data) {
    // console.log("-------------------------------------------");
    // console.info("waveform::setDownSample");
    // // console.info(data);
    // console.info([0, data.length]);
    // console.info(this.base.xScale.domain());
    // console.log("-------------------------------------------");
    // update xxScale according to new base.xScale.domain and data.length
    this.xxScale
      .domain([0, data.length])
      .range(this.base.xScale.domain());
    // update cache
    this.cache(data);
    this.draw(data);
  }

  xZoom(e) {
    // @TODO
    // - different trigger updates according to zoom in or out
    var triggerUpdateZoomDelta = this.param('triggerUpdateZoomDelta');
    var triggerUpdateDragDelta = this.param('triggerUpdateDragDelta');
    var deltaZoom = Math.abs(this.currentZoomFactor - e.factor);
    var deltaDrag = Math.abs(this.currentDragDeltaX - e.delta.x);

    // if small zoom or drag delta, render cached data
    if (
      (deltaZoom < triggerUpdateZoomDelta) &&
      (deltaDrag < triggerUpdateDragDelta)
    ) {
      return this.draw(this.cache()());
    }

    this.currentZoomFactor = e.factor;
    this.currentDragDeltaX = e.delta.x;

    this.downSample();
  }

  // display methods
  update() {
    this._update();
  }

  draw(data) {
    if (!data) { return this.downSample(); }
    this._draw(data);
  }

}

// data accessors
// @NOTE `start` and `end` could allow drag
accessors.getFunction(Waveform.prototype, [
  'color', 'sampleRate', 'cache'
]);

// factory
function factory() { return new Waveform(); }
factory.Waveform = Waveform;

module.exports = factory;
