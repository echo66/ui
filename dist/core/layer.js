"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _inherits = require("babel-runtime/helpers/inherits")["default"];

var _get = require("babel-runtime/helpers/get")["default"];

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _core = require("babel-runtime/core-js")["default"];

var _require = require("underscore.string");

var slugify = _require.slugify;

var _require2 = require("../helpers/utils");

var accessors = _require2.accessors;
var uniqueId = _require2.uniqueId;
var addCssRule = _require2.addCssRule;
var toFront = _require2.toFront;

var EventEmitter = require("events").EventEmitter;

var Layer = (function (_EventEmitter) {
  function Layer() {
    _classCallCheck(this, Layer);

    _get(_core.Object.getPrototypeOf(Layer.prototype), "constructor", this).call(this);

    this.unitClass = null;
    // this.dname = null;
    this.xBaseDomain = null;
    this.yScale = null;
    this.base = null;
    this.g = null;
    this.__params = {};

    // general defaults
    this.params({
      type: "layer",
      nameAsIdAttribute: false,
      opacity: 1,
      height: 0,
      top: 0,
      yDomain: null,
      yRange: null,
      selectedClass: "selected",
      // define possible interactions: selectable, editable
      interactions: {}
    });
  }

  _inherits(Layer, _EventEmitter);

  _createClass(Layer, {
    param: {

      // this.__params getter/setter for a single param

      value: function param() {
        var name = arguments[0] === undefined ? null : arguments[0];
        var value = arguments[1] === undefined ? null : arguments[1];

        if (value === null) {
          return this.__params[name];
        }this.__params[name] = value;
        return this;
      }
    },
    params: {

      // this.__params getter/setter

      value: function params() {
        var _params = arguments[0] === undefined ? null : arguments[0];

        if (_params === null) {
          return this.__params;
        }for (var key in _params) {
          this.__params[key] = _params[key];
        }

        return this;
      }
    },
    data: {

      // this.__data getter/setter

      value: function data() {
        var _data = arguments[0] === undefined ? null : arguments[0];

        if (!_data) {
          return this.__data;
        }this.__data = _data;
        return this;
      }
    },
    load: {
      value: function load(base, d3) {
        // configure layer
        var name = this.param("name") || this.param("type");
        var cname = uniqueId(slugify(name));
        var unitClass = [this.param("type"), "item"].join("-");

        this.base = base;
        this.params({ name: name, cname: cname, unitClass: unitClass });

        if (!this.param("width")) {
          this.param("width", this.base.width());
        }

        if (!this.param("height")) {
          this.param("height", this.base.height());
        }

        // add d3 on the layer prototype
        var proto = _core.Object.getPrototypeOf(this);
        if (!proto.d3) {
          proto.d3 = d3;
        }

        // pass all update/draw methods inside UILoop
        var update = this.update;
        var draw = this.draw;
        var that = this;

        this.update = function () {
          base.uiLoop.register(update, arguments, this);
        };

        this.draw = function () {
          base.uiLoop.register(draw, arguments, this);
        };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onDrag = this.onDrag.bind(this);
      }
    },
    setScales: {
      value: function setScales() {
        var base = this.base;

        // @NOTE: is the really needed ?
        // if (layer.hasOwnProperty('xScale')) {
        //   var baseXscale = this.xScale.copy();
        //   // if (!!layer.param('xDomain')) { baseXscale.domain(layer.param('xDomain')); }
        //   if(!!layer.xDomain && !!layer.xDomain()) baseXscale.domain(layer.xDomain());
        //   // if (!!layer.param('xRange')) { baseXscale.domain(layer.param('xRange')); }
        //   if(!!layer.xRange && !!layer.xRange()) baseXscale.range(layer.xRange());
        //   layer.xScale = baseXscale;
        //   layer.originalXscale = baseXscale.copy();
        // }

        this.yScale = base.yScale.copy();

        if (!!this.param("yDomain")) {
          this.yScale.domain(this.param("yDomain"));
        }

        if (this.param("height") === null) {
          this.param("height", base.height());
        }

        var yRange = [this.param("height"), 0];
        this.yScale.range(yRange);
      }
    },
    createGroup: {
      value: function createGroup(boundingBox) {
        if (this.g) {
          return;
        }
        // create layer group
        this.g = boundingBox.append("g").classed("layer", true).classed(this.param("type"), true).attr("data-cname", this.param("cname")).attr("transform", "translate(0, " + (this.param("top") || 0) + ")");

        if (this.param("nameAsIdAttribute")) {
          this.g.attr("id", this.param("name"));
        }
      }
    },
    init: {

      // entry point to add specific logic to a layer

      value: function init() {}
    },
    delegateEvents: {
      value: function delegateEvents() {
        var interactions = this.param("interactions");

        if (interactions.editable) {
          this.base.on("drag", this.onDrag);
          // being editable implies being selectable
          interactions.selectable = true;
        }

        if (interactions.selectable) {
          this.base.on("mousedown", this.onMouseDown);
          this.base.on("mouseup", this.onMouseUp);
          // this.base.on('mouseenter', function(e) {
          //   console.log('mouseenter');
          //   console.log(e);
          // });
        }
      }
    },
    undelegateEvents: {
      value: function undelegateEvents() {
        this.base.removeListener("mousedown", this.onMouseDown);
        this.base.removeListener("mouseup", this.onMouseUp);
        this.base.removeListener("drag", this.onDrag);
      }
    },
    onMouseUp: {
      value: function onMouseUp(e) {
        if (e.originalEvent.button !== 0) {
          return;
        }
        // check if the clicked item belongs to the layer
        // should find something more reliable - closest `.item` group ?
        var item = e.target.parentNode;
        // clicked item doesn't belong to this layer
        if (this.items && this.items[0].indexOf(item) === -1) {
          item = null;
        }

        if (item) {
          if (item.dataset.lastEvent == "drag") {
            this.emit("drag-end", item, e);
          } else if (item.dataset.lastEvent == "mousedown") {
            this.emit("mouseup", item, e);
          }
          item.dataset.lastEvent = undefined;
        } else {
          this.emit("mouseup", item, e);
        }
      }
    },
    onMouseDown: {
      value: function onMouseDown(e) {
        if (e.originalEvent.button !== 0) {
          return;
        }
        // check if the clicked item belongs to the layer
        // should find something more reliable - closest `.item` group ?
        var item = e.target.parentNode;
        // clicked item doesn't belong to this layer
        if (this.items && this.items[0].indexOf(item) === -1) {
          item = null;
        }

        if (item) item.dataset.lastEvent = "mousedown";

        this.handleSelection(item, e);
        // var datum = this.d3.select(item).datum();
        this.emit("mousedown", item, e);
      }
    },
    onDrag: {
      value: function onDrag(e) {
        // if (this.base.brushing()) { return; }
        var item = e.currentTarget;

        if (this.items && this.items[0].indexOf(item) === -1) {
          item = null;
        }

        this.handleDrag(item, e);
        // var datum = this.d3.select(item).datum();

        if (item) {
          if (item.dataset.lastEvent == "mousedown") this.emit("drag-start", item, e);else if (item.dataset.lastEvent == "drag") this.emit("drag", item, e);
          item.dataset.lastEvent = "drag";
        }
      }
    },
    handleSelection: {

      // @TODO: `handleSelection` and `handleDrag` could be getters/setters
      // to allow easy override

      // default selection handling - can be shared by all layers ?
      // can be overriden to change behavior - shiftKey, etc.

      value: function handleSelection(item, e) {
        if (item === null) {
          return this.unselect();
        }

        var selected = item.classList.contains(this.param("selectedClass"));
        this.unselect();

        if (!selected || this.param("interactions").editable) {
          this.select(item);
        }
      }
    },
    handleDrag: {
      value: function handleDrag(item, e) {
        throw new Error("must be implemented");
      }
    },
    select: {
      value: function select() {
        for (var _len = arguments.length, els = Array(_len), _key = 0; _key < _len; _key++) {
          els[_key] = arguments[_key];
        }

        var that = this;

        els = els.length === 0 ? this.items : this.d3.selectAll(els);

        els.classed(this.param("selectedClass"), true);

        els.each(function () {
          that.emit("select", this);
          toFront(this);
        });
      }
    },
    unselect: {
      value: function unselect() {
        for (var _len = arguments.length, els = Array(_len), _key = 0; _key < _len; _key++) {
          els[_key] = arguments[_key];
        }

        var that = this;

        els = els.length === 0 ? this.items : this.d3.selectAll(els);

        if (els == undefined) {
          return;
        }els.classed(this.param("selectedClass"), false);

        els.each(function () {
          that.emit("unselect", this);
        });
      }
    },
    style: {
      value: function style(selector, rules) {
        // @TODO recheck the DOM
        var selectors = [];
        selectors.push("svg[data-cname=" + this.base.cname() + "]");
        selectors.push("g[data-cname=" + this.param("cname") + "]");
        selectors.push(selector);

        addCssRule(selectors.join(" "), rules);
      }
    },
    update: {
      value: function update(data) {
        this.data(data || this.data() || this.base.data());
        // this.untouchedXscale = this.base.xScale.copy();
        // this.untouchedYscale = this.base.yScale.copy();
        // this.zoomFactor = this.base.zoomFactor;

        // implement the update enter delete logic here
        // call draw
      }
    },
    draw: {

      // interface - implement in childs
      // @TODO check Proxies to share common behavior like
      // if (!!this.each()) { el.each(this.each()); } // in `draw`

      value: function draw() {}
    },
    xZoom: {
      value: function xZoom() {}
    }
  });

  return Layer;
})(EventEmitter);

accessors.identity(Layer.prototype, "each");

accessors.getFunction(Layer.prototype, ["dataKey"]);

// factory
function factory() {
  return new Layer();
}
factory.Layer = Layer;

module.exports = factory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7ZUFFSyxPQUFPLENBQUMsbUJBQW1CLENBQUM7O0lBQXhDLE9BQU8sWUFBUCxPQUFPOztnQkFDc0MsT0FBTyxDQUFDLGtCQUFrQixDQUFDOztJQUF4RSxTQUFTLGFBQVQsU0FBUztJQUFFLFFBQVEsYUFBUixRQUFRO0lBQUUsVUFBVSxhQUFWLFVBQVU7SUFBRSxPQUFPLGFBQVAsT0FBTzs7QUFDOUMsSUFBSSxZQUFZLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFlBQVksQ0FBQzs7SUFFNUMsS0FBSztBQUVFLFdBRlAsS0FBSyxHQUVLOzBCQUZWLEtBQUs7O0FBR1AscUNBSEUsS0FBSyw2Q0FHQzs7QUFFUixRQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQzs7QUFFdEIsUUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDeEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDakIsUUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDZCxRQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQzs7O0FBR25CLFFBQUksQ0FBQyxNQUFNLENBQUM7QUFDVixVQUFJLEVBQUUsT0FBTztBQUNiLHVCQUFpQixFQUFFLEtBQUs7QUFDeEIsYUFBTyxFQUFFLENBQUM7QUFDVixZQUFNLEVBQUUsQ0FBQztBQUNULFNBQUcsRUFBRSxDQUFDO0FBQ04sYUFBTyxFQUFFLElBQUk7QUFDYixZQUFNLEVBQUUsSUFBSTtBQUNaLG1CQUFhLEVBQUUsVUFBVTs7QUFFekIsa0JBQVksRUFBRSxFQUFFO0tBQ2pCLENBQUMsQ0FBQztHQUNKOztZQTFCRyxLQUFLOztlQUFMLEtBQUs7QUE2QlQsU0FBSzs7OzthQUFBLGlCQUE0QjtZQUEzQixJQUFJLGdD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SSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDOzs7Ozs7O09BT3BEOztBQUtELFFBQUk7Ozs7OzthQUFBLGdCQUFHLEVBQUU7O0FBRVQsU0FBSzthQUFBLGlCQUFHLEVBQUU7Ozs7U0EvU04sS0FBSztHQUFTLFlBQVk7O0FBa1RoQyxTQUFTLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRTVDLFNBQVMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7OztBQUdwRCxTQUFTLE9BQU8sR0FBRztBQUFFLFNBQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztDQUFFO0FBQzFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDOztBQUV0QixNQUFNLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyIsImZpbGUiOiJlczYvY29tcG9uZW50cy9zZWdtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG52YXIgeyBzbHVnaWZ5IH0gPSByZXF1aXJlKCd1bmRlcnNjb3JlLnN0cmluZycpO1xudmFyIHsgYWNjZXNzb3JzLCB1bmlxdWVJZCwgYWRkQ3NzUnVsZSwgdG9Gcm9udCB9ID0gcmVxdWlyZSgnLi4vaGVscGVycy91dGlscycpO1xudmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuY2xhc3MgTGF5ZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXIge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLnVuaXRDbGFzcyA9IG51bGw7XG4gICAgLy8gdGhpcy5kbmFtZSA9IG51bGw7XG4gICAgdGhpcy54QmFzZURvbWFpbiA9IG51bGw7XG4gICAgdGhpcy55U2NhbGUgPSBudWxsO1xuICAgIHRoaXMuYmFzZSA9IG51bGw7XG4gICAgdGhpcy5nID0gbnVsbDtcbiAgICB0aGlzLl9fcGFyYW1zID0ge307XG5cbiAgICAvLyBnZW5lcmFsIGRlZmF1bHRzXG4gICAgdGhpcy5wYXJhbXMoe1xuICAgICAgdHlwZTogJ2xheWVyJyxcbiAgICAgIG5hbWVBc0lkQXR0cmlidXRlOiBmYWxzZSxcbiAgICAgIG9wYWNpdHk6IDEsXG4gICAgICBoZWlnaHQ6IDAsXG4gICAgICB0b3A6IDAsXG4gICAgICB5RG9tYWluOiBudWxsLFxuICAgICAgeVJhbmdlOiBudWxsLFxuICAgICAgc2VsZWN0ZWRDbGFzczogJ3NlbGVjdGVkJyxcbiAgICAgIC8vIGRlZmluZSBwb3NzaWJsZSBpbnRlcmFjdGlvbnM6IHNlbGVjdGFibGUsIGVkaXRhYmxlXG4gICAgICBpbnRlcmFjdGlvbnM6IHt9XG4gICAgfSk7XG4gIH1cblxuICAvLyB0aGlzLl9fcGFyYW1zIGdldHRlci9zZXR0ZXIgZm9yIGEgc2luZ2xlIHBhcmFtXG4gIHBhcmFtKG5hbWUgPSBudWxsLCB2YWx1ZSA9IG51bGwpIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHJldHVybiB0aGlzLl9fcGFyYW1zW25hbWVdO1xuICAgIHRoaXMuX19wYXJhbXNbbmFtZV0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHRoaXMuX19wYXJhbXMgZ2V0dGVyL3NldHRlclxuICBwYXJhbXMoX3BhcmFtcyA9IG51bGwpIHtcbiAgICBpZiAoX3BhcmFtcyA9PT0gbnVsbCkgcmV0dXJuIHRoaXMuX19wYXJhbXM7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gX3BhcmFtcykge1xuICAgICAgdGhpcy5fX3BhcmFtc1trZXldID0gX3BhcmFtc1trZXldO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gdGhpcy5fX2RhdGEgZ2V0dGVyL3NldHRlclxuICBkYXRhKF9kYXRhID0gbnVsbCkge1xuICAgIGlmICghX2RhdGEpIHJldHVybiB0aGlzLl9fZGF0YTtcbiAgICB0aGlzLl9fZGF0YSA9IF9kYXRhO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbG9hZChiYXNlLCBkMykge1xuICAgIC8vIGNvbmZpZ3VyZSBsYXllclxuICAgIHZhciBuYW1lICA9IHRoaXMucGFyYW0oJ25hbWUnKSB8fMKgdGhpcy5wYXJhbSgndHlwZScpO1xuICAgIHZhciBjbmFtZSA9IHVuaXF1ZUlkKHNsdWdpZnkobmFtZSkpO1xuICAgIHZhciB1bml0Q2xhc3MgPSBbdGhpcy5wYXJhbSgndHlwZScpLCAnaXRlbSddLmpvaW4oJy0nKTtcblxuICAgIHRoaXMuYmFzZSA9IGJhc2U7XG4gICAgdGhpcy5wYXJhbXMoeyBuYW1lLCBjbmFtZSwgdW5pdENsYXNzIH0pO1xuXG4gICAgaWYgKCF0aGlzLnBhcmFtKCd3aWR0aCcpKSB7XG4gICAgICB0aGlzLnBhcmFtKCd3aWR0aCcsIHRoaXMuYmFzZS53aWR0aCgpKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucGFyYW0oJ2hlaWdodCcpKSB7XG4gICAgICB0aGlzLnBhcmFtKCdoZWlnaHQnLCB0aGlzLmJhc2UuaGVpZ2h0KCkpO1xuICAgIH1cblxuICAgIC8vIGFkZCBkMyBvbiB0aGUgbGF5ZXIgcHJvdG90eXBlXG4gICAgdmFyIHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpO1xuICAgIGlmICghcHJvdG8uZDMpIHsgcHJvdG8uZDMgPSBkMzsgfVxuXG4gICAgLy8gcGFzcyBhbGwgdXBkYXRlL2RyYXcgbWV0aG9kcyBpbnNpZGUgVUlMb29wXG4gICAgdmFyIHVwZGF0ZSA9IHRoaXMudXBkYXRlO1xuICAgIHZhciBkcmF3ID0gdGhpcy5kcmF3O1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIHRoaXMudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICBiYXNlLnVpTG9vcC5yZWdpc3Rlcih1cGRhdGUsIGFyZ3VtZW50cywgdGhpcyk7XG4gICAgfTtcblxuICAgIHRoaXMuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgICAgYmFzZS51aUxvb3AucmVnaXN0ZXIoZHJhdywgYXJndW1lbnRzLCB0aGlzKTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbk1vdXNlRG93biA9IHRoaXMub25Nb3VzZURvd24uYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uTW91c2VVcCA9IHRoaXMub25Nb3VzZVVwLmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkRyYWcgPSB0aGlzLm9uRHJhZy5iaW5kKHRoaXMpO1xuICB9XG5cbiAgc2V0U2NhbGVzKCkge1xuICAgIHZhciBiYXNlID0gdGhpcy5iYXNlO1xuXG4gICAgLy8gQE5PVEU6IGlzIHRoZSByZWFsbHkgbmVlZGVkID9cbiAgICAvLyBpZiAobGF5ZXIuaGFzT3duUHJvcGVydHkoJ3hTY2FsZScpKSB7XG4gICAgLy8gICB2YXIgYmFzZVhzY2FsZSA9IHRoaXMueFNjYWxlLmNvcHkoKTtcbiAgICAvLyAgIC8vIGlmICghIWxheWVyLnBhcmFtKCd4RG9tYWluJykpIHsgYmFzZVhzY2FsZS5kb21haW4obGF5ZXIucGFyYW0oJ3hEb21haW4nKSk7IH1cbiAgICAvLyAgIGlmKCEhbGF5ZXIueERvbWFpbiAmJiAhIWxheWVyLnhEb21haW4oKSkgYmFzZVhzY2FsZS5kb21haW4obGF5ZXIueERvbWFpbigpKTtcbiAgICAvLyAgIC8vIGlmICghIWxheWVyLnBhcmFtKCd4UmFuZ2UnKSkgeyBiYXNlWHNjYWxlLmRvbWFpbihsYXllci5wYXJhbSgneFJhbmdlJykpOyB9XG4gICAgLy8gICBpZighIWxheWVyLnhSYW5nZSAmJiAhIWxheWVyLnhSYW5nZSgpKSBiYXNlWHNjYWxlLnJhbmdlKGxheWVyLnhSYW5nZSgpKTtcbiAgICAvLyAgIGxheWVyLnhTY2FsZSA9IGJhc2VYc2NhbGU7XG4gICAgLy8gICBsYXllci5vcmlnaW5hbFhzY2FsZSA9IGJhc2VYc2NhbGUuY29weSgpO1xuICAgIC8vIH1cblxuICAgIHRoaXMueVNjYWxlID0gYmFzZS55U2NhbGUuY29weSgpO1xuXG4gICAgaWYgKCEhdGhpcy5wYXJhbSgneURvbWFpbicpKSB7XG4gICAgICB0aGlzLnlTY2FsZS5kb21haW4odGhpcy5wYXJhbSgneURvbWFpbicpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5wYXJhbSgnaGVpZ2h0JykgPT09IG51bGwpIHtcbiAgICAgIHRoaXMucGFyYW0oJ2hlaWdodCcsIGJhc2UuaGVpZ2h0KCkpO1xuICAgIH1cblxuICAgIHZhciB5UmFuZ2UgPSBbdGhpcy5wYXJhbSgnaGVpZ2h0JyksIDBdO1xuICAgIHRoaXMueVNjYWxlLnJhbmdlKHlSYW5nZSk7XG4gIH1cblxuICBjcmVhdGVHcm91cChib3VuZGluZ0JveCkge1xuICAgIGlmICh0aGlzLmcpIHsgcmV0dXJuOyB9XG4gICAgLy8gY3JlYXRlIGxheWVyIGdyb3VwXG4gICAgdGhpcy5nID0gYm91bmRpbmdCb3guYXBwZW5kKCdnJylcbiAgICAgIC5jbGFzc2VkKCdsYXllcicsIHRydWUpXG4gICAgICAuY2xhc3NlZCh0aGlzLnBhcmFtKCd0eXBlJyksIHRydWUpXG4gICAgICAuYXR0cignZGF0YS1jbmFtZScsIHRoaXMucGFyYW0oJ2NuYW1lJykpXG4gICAgICAuYXR0cigndHJhbnNmb3JtJywgJ3RyYW5zbGF0ZSgwLCAnICsgKHRoaXMucGFyYW0oJ3RvcCcpIHx8IDApICsgJyknKTtcblxuICAgIGlmICh0aGlzLnBhcmFtKCduYW1lQXNJZEF0dHJpYnV0ZScpKSB7XG4gICAgICB0aGlzLmcuYXR0cignaWQnLCB0aGlzLnBhcmFtKCduYW1lJykpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGVudHJ5IHBvaW50IHRvIGFkZCBzcGVjaWZpYyBsb2dpYyB0byBhIGxheWVyXG4gIGluaXQoKSB7fVxuXG4gIGRlbGVnYXRlRXZlbnRzKCkge1xuICAgIHZhciBpbnRlcmFjdGlvbnMgPSB0aGlzLnBhcmFtKCdpbnRlcmFjdGlvbnMnKTtcblxuICAgIGlmIChpbnRlcmFjdGlvbnMuZWRpdGFibGUpIHtcbiAgICAgIHRoaXMuYmFzZS5vbignZHJhZycsIHRoaXMub25EcmFnKTtcbiAgICAgIC8vIGJlaW5nIGVkaXRhYmxlIGltcGxpZXMgYmVpbmcgc2VsZWN0YWJsZVxuICAgICAgaW50ZXJhY3Rpb25zLnNlbGVjdGFibGUgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChpbnRlcmFjdGlvbnMuc2VsZWN0YWJsZSkge1xuICAgICAgdGhpcy5iYXNlLm9uKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duKTtcbiAgICAgIHRoaXMuYmFzZS5vbignbW91c2V1cCcsIHRoaXMub25Nb3VzZVVwKTtcbiAgICAgIC8vIHRoaXMuYmFzZS5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uKGUpIHsgXG4gICAgICAvLyAgIGNvbnNvbGUubG9nKCdtb3VzZWVudGVyJyk7IFxuICAgICAgLy8gICBjb25zb2xlLmxvZyhlKTtcbiAgICAgIC8vIH0pO1xuICAgIH1cbiAgfVxuXG4gIHVuZGVsZWdhdGVFdmVudHMoKSB7XG4gICAgdGhpcy5iYXNlLnJlbW92ZUxpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duKTtcbiAgICB0aGlzLmJhc2UucmVtb3ZlTGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcCk7XG4gICAgdGhpcy5iYXNlLnJlbW92ZUxpc3RlbmVyKCdkcmFnJywgdGhpcy5vbkRyYWcpO1xuICB9XG5cbiAgb25Nb3VzZVVwKGUpIHtcbiAgICBpZiAoZS5vcmlnaW5hbEV2ZW50LmJ1dHRvbiAhPT0gMCkgeyByZXR1cm47IH1cbiAgICAvLyBjaGVjayBpZiB0aGUgY2xpY2tlZCBpdGVtIGJlbG9uZ3MgdG8gdGhlIGxheWVyXG4gICAgLy8gc2hvdWxkIGZpbmQgc29tZXRoaW5nIG1vcmUgcmVsaWFibGUgLSBjbG9zZXN0IGAuaXRlbWAgZ3JvdXAgP1xuICAgIHZhciBpdGVtID0gZS50YXJnZXQucGFyZW50Tm9kZTtcbiAgICAvLyBjbGlja2VkIGl0ZW0gZG9lc24ndCBiZWxvbmcgdG8gdGhpcyBsYXllclxuICAgIGlmICh0aGlzLml0ZW1zICYmIHRoaXMuaXRlbXNbMF0uaW5kZXhPZihpdGVtKSA9PT0gLTEpIHtcbiAgICAgIGl0ZW0gPSBudWxsO1xuICAgIH1cblxuICAgIGlmIChpdGVtKSB7XG4gICAgICBpZiAoaXRlbS5kYXRhc2V0Lmxhc3RFdmVudD09J2RyYWcnKSB7XG4gICAgICAgIHRoaXMuZW1pdCgnZHJhZy1lbmQnLCBpdGVtLCBlKTtcbiAgICAgIH0gZWxzZSBpZiAoaXRlbS5kYXRhc2V0Lmxhc3RFdmVudD09J21vdXNlZG93bicpIHtcbiAgICAgICAgdGhpcy5lbWl0KCdtb3VzZXVwJywgaXRlbSwgZSk7XG4gICAgICB9XG4gICAgICBpdGVtLmRhdGFzZXQubGFzdEV2ZW50ID0gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVtaXQoJ21vdXNldXAnLCBpdGVtLCBlKTtcbiAgICB9XG4gICAgXG4gIH1cblxuICBvbk1vdXNlRG93bihlKSB7XG4gICAgaWYgKGUub3JpZ2luYWxFdmVudC5idXR0b24gIT09IDApIHsgcmV0dXJuOyB9XG4gICAgLy8gY2hlY2sgaWYgdGhlIGNsaWNrZWQgaXRlbSBiZWxvbmdzIHRvIHRoZSBsYXllclxuICAgIC8vIHNob3VsZCBmaW5kIHNvbWV0aGluZyBtb3JlIHJlbGlhYmxlIC0gY2xvc2VzdCBgLml0ZW1gIGdyb3VwID9cbiAgICB2YXIgaXRlbSA9IGUudGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgLy8gY2xpY2tlZCBpdGVtIGRvZXNuJ3QgYmVsb25nIHRvIHRoaXMgbGF5ZXJcbiAgICBpZiAodGhpcy5pdGVtcyAmJiB0aGlzLml0ZW1zWzBdLmluZGV4T2YoaXRlbSkgPT09IC0xKSB7XG4gICAgICBpdGVtID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoaXRlbSlcbiAgICAgIGl0ZW0uZGF0YXNldC5sYXN0RXZlbnQgPSAnbW91c2Vkb3duJztcblxuICAgIHRoaXMuaGFuZGxlU2VsZWN0aW9uKGl0ZW0sIGUpO1xuICAgIC8vIHZhciBkYXR1bSA9IHRoaXMuZDMuc2VsZWN0KGl0ZW0pLmRhdHVtKCk7XG4gICAgdGhpcy5lbWl0KCdtb3VzZWRvd24nLCBpdGVtLCBlKTtcbiAgfVxuXG4gIG9uRHJhZyhlKSB7XG4gICAgLy8gaWYgKHRoaXMuYmFzZS5icnVzaGluZygpKSB7IHJldHVybjsgfVxuICAgIHZhciBpdGVtID0gZS5jdXJyZW50VGFyZ2V0O1xuXG4gICAgaWYgKHRoaXMuaXRlbXMgJiYgdGhpcy5pdGVtc1swXS5pbmRleE9mKGl0ZW0pID09PSAtMSkge1xuICAgICAgaXRlbSA9IG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5oYW5kbGVEcmFnKGl0ZW0sIGUpO1xuICAgIC8vIHZhciBkYXR1bSA9IHRoaXMuZDMuc2VsZWN0KGl0ZW0pLmRhdHVtKCk7XG4gICAgXG4gICAgaWYgKGl0ZW0pIHtcbiAgICAgIGlmIChpdGVtLmRhdGFzZXQubGFzdEV2ZW50ID09ICdtb3VzZWRvd24nKVxuICAgICAgICB0aGlzLmVtaXQoJ2RyYWctc3RhcnQnLCBpdGVtLCBlKTtcbiAgICAgIGVsc2UgaWYgKGl0ZW0uZGF0YXNldC5sYXN0RXZlbnQgPT0gJ2RyYWcnKVxuICAgICAgICB0aGlzLmVtaXQoJ2RyYWcnLCBpdGVtLCBlKTtcbiAgICAgIGl0ZW0uZGF0YXNldC5sYXN0RXZlbnQgPSAnZHJhZyc7XG4gICAgfVxuXG4gIH1cblxuICAvLyBAVE9ETzogYGhhbmRsZVNlbGVjdGlvbmAgYW5kIGBoYW5kbGVEcmFnYCBjb3VsZCBiZSBnZXR0ZXJzL3NldHRlcnNcbiAgLy8gdG8gYWxsb3cgZWFzeSBvdmVycmlkZVxuXG4gIC8vIGRlZmF1bHQgc2VsZWN0aW9uIGhhbmRsaW5nIC0gY2FuIGJlIHNoYXJlZCBieSBhbGwgbGF5ZXJzID9cbiAgLy8gY2FuIGJlIG92ZXJyaWRlbiB0byBjaGFuZ2UgYmVoYXZpb3IgLSBzaGlmdEtleSwgZXRjLlxuICBoYW5kbGVTZWxlY3Rpb24oaXRlbSwgZSkge1xuICAgIGlmIChpdGVtID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy51bnNlbGVjdCgpO1xuICAgIH1cblxuICAgIHZhciBzZWxlY3RlZCA9IGl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKHRoaXMucGFyYW0oJ3NlbGVjdGVkQ2xhc3MnKSk7XG4gICAgdGhpcy51bnNlbGVjdCgpO1xuXG4gICAgaWYgKCFzZWxlY3RlZCB8fCB0aGlzLnBhcmFtKCdpbnRlcmFjdGlvbnMnKS5lZGl0YWJsZSkge1xuICAgICAgdGhpcy5zZWxlY3QoaXRlbSk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRHJhZyhpdGVtLCBlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdtdXN0IGJlIGltcGxlbWVudGVkJyk7XG4gIH1cblxuICBzZWxlY3QoLi4uZWxzKSB7XG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZWxzID0gKGVscy5sZW5ndGggPT09IDApID9cbiAgICAgIHRoaXMuaXRlbXMgOlxuICAgICAgdGhpcy5kMy5zZWxlY3RBbGwoZWxzKTsgXG5cbiAgICBlbHMuY2xhc3NlZCh0aGlzLnBhcmFtKCdzZWxlY3RlZENsYXNzJyksIHRydWUpO1xuXG4gICAgZWxzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB0aGF0LmVtaXQoJ3NlbGVjdCcsIHRoaXMpO1xuICAgICAgdG9Gcm9udCh0aGlzKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuc2VsZWN0KC4uLmVscykge1xuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGVscyA9IChlbHMubGVuZ3RoID09PSAwKSA/XG4gICAgICB0aGlzLml0ZW1zIDpcbiAgICAgIHRoaXMuZDMuc2VsZWN0QWxsKGVscyk7XG5cbiAgICBpZiAoZWxzPT11bmRlZmluZWQpXG4gICAgICByZXR1cm47XG5cbiAgICBlbHMuY2xhc3NlZCh0aGlzLnBhcmFtKCdzZWxlY3RlZENsYXNzJyksIGZhbHNlKTtcblxuICAgIGVscy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdGhhdC5lbWl0KCd1bnNlbGVjdCcsIHRoaXMpO1xuICAgIH0pO1xuICB9XG5cbiAgc3R5bGUoc2VsZWN0b3IsIHJ1bGVzKSB7XG4gICAgLy8gQFRPRE8gcmVjaGVjayB0aGUgRE9NXG4gICAgdmFyIHNlbGVjdG9ycyA9IFtdO1xuICAgIHNlbGVjdG9ycy5wdXNoKCdzdmdbZGF0YS1jbmFtZT0nICsgdGhpcy5iYXNlLmNuYW1lKCkgKyAnXScpO1xuICAgIHNlbGVjdG9ycy5wdXNoKCdnW2RhdGEtY25hbWU9JyArIHRoaXMucGFyYW0oJ2NuYW1lJykgKyAnXScpO1xuICAgIHNlbGVjdG9ycy5wdXNoKHNlbGVjdG9yKTtcblxuICAgIGFkZENzc1J1bGUoc2VsZWN0b3JzLmpvaW4oJyAnKSwgcnVsZXMpO1xuICB9XG5cbiAgdXBkYXRlKGRhdGEpIHtcbiAgICB0aGlzLmRhdGEoZGF0YSB8fCB0aGlzLmRhdGEoKSB8fCB0aGlzLmJhc2UuZGF0YSgpKTtcbiAgICAvLyB0aGlzLnVudG91Y2hlZFhzY2FsZSA9IHRoaXMuYmFzZS54U2NhbGUuY29weSgpO1xuICAgIC8vIHRoaXMudW50b3VjaGVkWXNjYWxlID0gdGhpcy5iYXNlLnlTY2FsZS5jb3B5KCk7XG4gICAgLy8gdGhpcy56b29tRmFjdG9yID0gdGhpcy5iYXNlLnpvb21GYWN0b3I7XG5cbiAgICAvLyBpbXBsZW1lbnQgdGhlIHVwZGF0ZSBlbnRlciBkZWxldGUgbG9naWMgaGVyZVxuICAgIC8vIGNhbGwgZHJhd1xuICB9XG5cbiAgLy8gaW50ZXJmYWNlIC0gaW1wbGVtZW50IGluIGNoaWxkc1xuICAvLyBAVE9ETyBjaGVjayBQcm94aWVzIHRvIHNoYXJlIGNvbW1vbiBiZWhhdmlvciBsaWtlXG4gIC8vIGlmICghIXRoaXMuZWFjaCgpKSB7IGVsLmVhY2godGhpcy5lYWNoKCkpOyB9IC8vIGluIGBkcmF3YFxuICBkcmF3KCkge31cblxuICB4Wm9vbSgpIHt9XG59XG5cbmFjY2Vzc29ycy5pZGVudGl0eShMYXllci5wcm90b3R5cGUsICdlYWNoJyk7XG5cbmFjY2Vzc29ycy5nZXRGdW5jdGlvbihMYXllci5wcm90b3R5cGUsIFsnZGF0YUtleSddKTtcblxuLy8gZmFjdG9yeVxuZnVuY3Rpb24gZmFjdG9yeSgpIHsgcmV0dXJuIG5ldyBMYXllcigpOyB9XG5mYWN0b3J5LkxheWVyID0gTGF5ZXI7XG5cbm1vZHVsZS5leHBvcnRzID0gZmFjdG9yeTtcbiJdfQ==