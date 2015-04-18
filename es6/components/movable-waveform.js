'use strict';

var { uniqueId, accessors } = require('../helpers/utils');
var { Layer } = require('../core/layer');

class MovableWaveform extends Layer {

  constructor() {
    super();
    // set layer defaults
    this.params({
      type: 'movable-waveform',
      opacity: 1,
      edits: ['x', 'y', 'width', 'height'],
      handlerWidth: 2,
      handlerOpacity: 0
    });

    this.__minWidth = 1;

    // initialize data accessors
    this.y(function(d, v = null) {
      if (v === null) return +d.y || 0;
      d.y = (+v);
    });

    this.height(function(d, v = null) {
      if (v === null) return +d.height || 1;
      d.height = (+v);
    });

    this.duration(function(d, v = null) {
      if (v === null) return +d.duration || 1;
      d.duration = (+v);
    });

    this.start(function(d, v = null) {
      if (v === null) return +d.start || 0;
      d.start = (+v);
    });

    this.color(function(d, v = null) {
      if (v === null) return d.color ? d.color + '' : '#000000';
      d.color = v + '';
    });

    this.opacity(function(d, v = null) {
      if (v === null) return d.opacity;
      d.opacity = v + '';
    });

    this.waveform(function(d, v = null) {
      if (v === null) return d.waveform;
      d.waveform = v;
    });
  }

  // @NOTE add some caching system ?
  getAccessors() {
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

    var _color    = this.color();
    var _opacity  = this.opacity();

    // define accesors
    var x = (d) => { return xScale(_x(d)); };
    var w = (d) => {
      var width = xScale(minDomain + _w(d));
      return width < 0 ? 0 : width;
    };
    var h = (d) => { 
      return yScale(_h(d)); 
    };
    var y = (d) => { 
      return height - h(d) - yScale(_y(d)); 
    };

    var color = (d) => { 
      return _color(d); 
    };
    var opacity = (d) => {
     return (_opacity(d) || this.param('opacity')); 
    };

    var _handlerWidth = parseInt(this.param('handlerWidth'), 10);
    var _halfHandler = _handlerWidth * 0.5;

    // handler position
    var rhx = (d) => {
      let width = w(d);

      return (width < (_handlerWidth * 2)) ?
        _handlerWidth + this.__minWidth : width - _halfHandler;
    };

    var waveform = (d) => {
      return d.waveform;
    }

    return { w, h, x, y, color, opacity, xScale, yScale, rhx, waveform };
  }

  setWaveform() {

    var mydata;
    var range;
    var domain;

    var area = d3.svg.area()
      .defined((d, i) => { 
        return true; 
      })
      .x((d, i) => { 

        var S = d3.scale.linear()
                    .domain(domain)
                    .range(range);

        return S(d.x); 
      })
      .y0((d, i) => { 
        return i % 2 === 0 ? (mydata[i].y) : (mydata[i - 1].y); 
      })
      .y1((d, i) => { 
        return i % 2 === 0 ? (mydata[i + 1].y) : (mydata[i].y); 
      });


    // console.log(this.g.selectAll('.' + this.param('unitClass')));

    var accessors = this.getAccessors();

    this.g.selectAll('.' + this.param('unitClass')).selectAll('path')
      .style('fill', 'red')
      .style('stroke', 'red')
      // .style('shape-rendering', 'crispEdges')
      .attr('x', 0)
      .attr('y', 0)
      .attr('d', (d) => {
        range = [0, accessors.w(d)];
        domain = [0, d.waveform.length-1];
        mydata = d.waveform;
        var pathStr = area(d.waveform);
        mydata = null;
        return pathStr;
      });
  }

  update(data) {

    console.info("MovableWaveform::update");

    super.update(data);

    this.items = this.g.selectAll('.' + this.param('unitClass'))
      .data(this.data());

    var sel = this.items.enter()
      .append('g')
      .classed('item', true)
      .classed(this.param('unitClass'), true);

    sel.append('rect');

    sel.append('path');

    if (this.param('interactions').editable) {
      sel.append('line')
        .attr('class', 'handle left')
        .attr('stroke-width', this.param('handlerWidth'))
        .attr('stroke-opacity', this.param('handlerOpacity'));

      sel.append('line')
        .attr('class', 'handle right')
        .attr('stroke-width', this.param('handlerWidth'))
        .attr('stroke-opacity', this.param('handlerOpacity'));
    }

    this.items.exit().remove();

    this.setWaveform();
  }

  draw(el = null) {
    console.info("MovableWaveform::draw");

    el = el || this.items;

    var accessors = this.getAccessors();

    el.attr('transform', (d) => {
      return 'translate(' + accessors.x(d) + ', ' + accessors.y(d) + ')';
    });


    // var dddd = [];
    // for (var I=0; I<20; I++) {
    //   dddd[I] = {
    //     x: I, 
    //     y: 50 * Math.random()
    //   };
    // }
    // // console.log(dddd);


    el.selectAll('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', accessors.w)
      .attr('height', accessors.h)
      .attr('fill', accessors.color)
      .attr('fill-opacity', accessors.opacity);

    if (!!this.each()) { el.each(this.each()); }

    if (this.param('interactions').editable) {

      var _handlerWidth = parseInt(this.param('handlerWidth'), 10);
      var _halfHandler = _handlerWidth * 0.5;

      el.selectAll('.handle.left')
        .attr('x1', _halfHandler)
        .attr('x2', _halfHandler)
        .attr('y1', 0)
        .attr('y2', accessors.h)
        .style('stroke', accessors.color);

      el.selectAll('.handle.right')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', accessors.h)
        .attr('transform', (d) => {
          return 'translate(' + accessors.rhx(d) + ', 0)';
        })
        .style('stroke', accessors.color);
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

  xZoom(val) {
    this.draw();
  }

  // logic performed to select an item from the brush
  handleBrush(extent, e) {
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
  }

  handleDrag(item, e) {
    if (item === null) { return; }

    var classList = e.target.classList;
    var mode = 'move';
    // if the target is an handler
    if (classList.contains('left')) { mode = 'resizeLeft'; }
    if (classList.contains('right')) { mode = 'resizeRight'; }

    this[mode](item, e.originalEvent.dx, e.originalEvent.dy);
  }

  move(item, dx, dy) {
    item = this.d3.select(item);
    var datum = item.datum();

    // console.info("MovableWaveform::move");
    // // console.info(item);
    // // console.info(datum);

    // define constrains
    var constrains = this.param('edits');
    var canX = !!~constrains.indexOf('x');
    var canY = !!~constrains.indexOf('y');
    // early return if cannot edit x and y
    if (!canX && !canY) { return; }
    // else lock the corresponding axis
    if (!canX) { dx = 0; }
    if (!canY) { dy = 0; }

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
    if (targetX >= xRange[0] && (targetX + w) <= xRange[1]) {
      x = targetX;
    } else if (targetX < xRange[0]) {
      x = xRange[0];
    } else if ((targetX + w) > xRange[1]) {
      x = xRange[1] - w;
    }

    // handle y position - lock to boundaries
    // var targetY = y + dy;
    var targetY = 0;
    var yDisplayed = yRange[1] - h - targetY;

    if (yDisplayed >= yRange[0] && (yDisplayed + h) <= yRange[1]) {
      y = targetY;
    } else if (yDisplayed < yRange[0]) {
      y = yRange[1] - h;
    } else if ((yDisplayed + h) > yRange[1]) {
      y = yRange[0];
    }

    var xValue = xScale.invert(x);
    var yValue = yScale.invert(y);

    this.start()(datum, xValue);
    this.y()(datum, yValue);

    this.draw(item);
  }

  resizeLeft(item, dx, dy) {
    item = this.d3.select(item);
    var datum = item.datum();

    var constrains = this.param('edits');
    var canW = !!~constrains.indexOf('width');
    // early return if cannot edit
    if (!canW) { return; }

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

  resizeRight(item, dx, dy) {
    item = this.d3.select(item);
    var datum = item.datum();

    var constrains = this.param('edits');
    var canW = !!~constrains.indexOf('width');
    // early return if cannot edit
    if (!canW) { return; }

    var accessors = this.getAccessors();
    var xRange = accessors.xScale.range();

    var x = accessors.x(datum);
    var w = accessors.w(datum);

    var targetW = w + dx;

    if (targetW >= this.__minWidth && (x + targetW) <= xRange[1]) {
      w = targetW;
    }

    var minDomain = accessors.xScale.domain()[0];
    var wValue = accessors.xScale.invert(w) - minDomain;
    this.duration()(datum, wValue);

    this.draw(item);
  }

}

// add and initialize our accessors
accessors.getFunction(MovableWaveform.prototype, [
  'y', 'width', 'color', 'height', 'duration', 'start', 'sortIndex', 'opacity', 'waveform'
]);

function factory() { return new MovableWaveform(); }
factory.MovableWaveform = MovableWaveform;

module.exports = factory;
