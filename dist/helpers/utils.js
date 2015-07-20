"use strict";

var _core = require("babel-runtime/core-js")["default"];

var utils = {};

utils.isFunction = function (func) {
  return Object.prototype.toString.call(func) === "[object Function]";
};

// @TODO - remove in favor of `Object.assign`
// @NOTE done in ui components
// utils.extend = function extend() {
//   // this can probably improved in es6
//   var args = Array.prototype.slice.call(arguments);
//   var host = args.shift();
//   var copy = args.shift();

//   for (var i in copy) { host[i] = copy[i]; }
//   args.unshift(host);

//   if (args.length > 1) { return extend.apply(null, args); }
//   return host;
// };

var explode = function explode(items, cb) {
  if (!Array.isArray(items)) {
    items = [items];
  }

  items.forEach(cb);
};

// @TODO - remove when all occurence removed in dependencies
// @NOTE done in ui components
// combined accessors
// utils.getSet = function getSet(obj, props = null, valueMode = false){
//   if (!props) throw new Error('Property name is mandatory.');

//   var add = (p = null) => {
//     var _prop = `_${p}`;
//     if (!obj.hasOwnProperty(_prop)) obj[_prop] = null;

//     obj[p] = function(value = null) {
//       if (value === null) return this[_prop];

//       if (!utils.isFunction(value) && !valueMode) {
//         this[_prop] = function() { return value; };
//       } else {
//         this[_prop] = value;
//       }

//       return this;
//     };
//   };

//   explode(props, (p) => add(p));
// };

// combined accessors
utils.accessors = {

  identity: function identity(obj) {
    var props = arguments[1] === undefined ? null : arguments[1];

    if (!props) throw new Error("Property name is mandatory.");

    var add = function () {
      var p = arguments[0] === undefined ? null : arguments[0];

      var _prop = "_" + p;
      if (!obj.hasOwnProperty(_prop)) obj[_prop] = null;

      obj[p] = function () {
        var value = arguments[0] === undefined ? null : arguments[0];

        if (value === null) return this[_prop];
        this[_prop] = value;
        return this;
      };
    };

    explode(props, function (p) {
      return add(p);
    });
  },

  getFunction: function getFunction(obj) {
    var props = arguments[1] === undefined ? null : arguments[1];

    if (!props) throw new Error("Property name is mandatory.");

    var add = function () {
      var p = arguments[0] === undefined ? null : arguments[0];

      var _prop = "_" + p;
      if (!obj.hasOwnProperty(_prop)) obj[_prop] = null;

      obj[p] = function () {
        var value = arguments[0] === undefined ? null : arguments[0];

        if (value === null) return this[_prop];

        if (!utils.isFunction(value)) {
          this[_prop] = function () {
            return value;
          };
        } else {
          this[_prop] = value;
        }
        return this;
      };
    };

    explode(props, function (p) {
      return add(p);
    });
  },

  getValue: function getValue(obj) {
    var props = arguments[1] === undefined ? null : arguments[1];

    if (!props) throw new Error("Property name is mandatory.");

    var add = function () {
      var p = arguments[0] === undefined ? null : arguments[0];

      var _prop = "_" + p;
      if (!obj.hasOwnProperty(_prop)) obj[_prop] = null;

      obj[p] = function () {
        var value = arguments[0] === undefined ? null : arguments[0];

        if (value === null) {
          if (!utils.isFunction(this[_prop])) {
            return this[_prop];
          }

          return this[_prop]();
        }

        this[_prop] = value;
        return this;
      };
    };

    explode(props, function (p) {
      return add(p);
    });
  }
};

// return a unique identifier with an optionnal prefix
var _counters = { "": 0 };

utils.uniqueId = function () {
  var prefix = arguments[0] === undefined ? "" : arguments[0];

  if (prefix && !_counters[prefix]) {
    _counters[prefix] = 0;
  }

  var id = _counters[prefix];
  if (prefix) {
    id = [prefix, id].join("-");
  }
  _counters[prefix] += 1;

  return id;
};

// style injection
var _sheet;

var createStyleSheet = function createStyleSheet() {
  var el = document.createElement("style");
  // webkit hack: cf. http://davidwalsh.name/add-rules-stylesheets
  el.appendChild(document.createTextNode(""));
  document.body.appendChild(el);
  _sheet = el.sheet;
};

utils.addCssRule = function (selector, rules) {
  var position = arguments[2] === undefined ? 0 : arguments[2];

  if (!_sheet) {
    createStyleSheet();
  }

  var rule = _core.Object.keys(rules).map(function (key) {
    return key + ":" + rules[key];
  }).join(";");

  rule = selector + "{" + rule + "}";
  _sheet.insertRule(rule, position);
};

// from underscore 1.7.0
utils.throttle = function (func, wait, options) {
  var context, args, result;
  var timeout = null;
  var previous = 0;
  if (!options) options = {};
  var later = function later() {
    previous = options.leading === false ? 0 : new Date().getTime();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  return function () {
    var now = new Date().getTime();
    if (!previous && options.leading === false) previous = now;
    var remaining = wait - (now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      clearTimeout(timeout);
      timeout = null;
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
};

//
utils.toFront = function (item) {
  item.parentNode.appendChild(item);
};

utils.UILoop = require("./lib/ui-loop");
utils.observe = require("./lib/observe");

// create a default data accessor for each given attrs

// var defaultDataMap = function defaultDataMap(obj, attrs) {
//   attrs.forEach((attr) => {
//     obj[attr]((d, v = null) => {
//       if (v === null) return d.y;
//       d[attr] = +v;
//       return obj;
//     })
//   });
// };

module.exports = utils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDOzs7O0FBRWIsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDOztBQUVmLEtBQUssQ0FBQyxVQUFVLEdBQUcsVUFBUyxJQUFJLEVBQUU7QUFDaEMsU0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssbUJBQW1CLENBQUM7Q0FDckUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkYsSUFBSSxPQUFPLEdBQUcsaUJBQVMsS0FBSyxFQUFFLEVBQUUsRUFBRTtBQUNoQyxNQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN6QixTQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUNqQjs7QUFFRCxPQUFLLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0NBQ25CLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBNkJGLEtBQUssQ0FBQyxTQUFTLEdBQUc7O0FBRWhCLFVBQVEsRUFBRSxrQkFBUyxHQUFHLEVBQWdCO1FBQWQsS0FBSyxnQ0FBRyxJQUFJOztBQUNsQyxRQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsNkJBQTZCLENBQUMsQ0FBQzs7QUFFM0QsUUFBSSxHQUFHLEdBQUcsWUFBYztVQUFiLENBQUMsZ0NBQUcsSUFBSTs7QUFDakIsVUFBSSxLQUFLLFNBQU8sQ0FBQyxBQUFFLENBQUM7QUFDcEIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFbEQsU0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQXVCO1lBQWQsS0FBSyxnQ0FBRyxJQUFJOztBQUM1QixZQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsT0FB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LENBQUM7QUFDZixZQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkMsVUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztLQUNyQyxNQUFNLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUU7QUFDakQsYUFBTyxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDeEM7QUFDRCxXQUFPLE1BQU0sQ0FBQztHQUNmLENBQUM7Q0FDSCxDQUFDOzs7QUFHRixLQUFLLENBQUMsT0FBTyxHQUFHLFVBQVMsSUFBSSxFQUFFO0FBQzdCLE1BQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ25DLENBQUM7O0FBRUYsS0FBSyxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDeEMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBZXpDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDIiwiZmlsZSI6ImVzNi9jb21wb25lbnRzL3NlZ21lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciB1dGlscyA9IHt9O1xuXG51dGlscy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24oZnVuYykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGZ1bmMpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxuLy8gQFRPRE8gLSByZW1vdmUgaW4gZmF2b3Igb2YgYE9iamVjdC5hc3NpZ25gXG4vLyBATk9URSBkb25lIGluIHVpIGNvbXBvbmVudHNcbi8vIHV0aWxzLmV4dGVuZCA9IGZ1bmN0aW9uIGV4dGVuZCgpIHtcbi8vICAgLy8gdGhpcyBjYW4gcHJvYmFibHkgaW1wcm92ZWQgaW4gZXM2XG4vLyAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbi8vICAgdmFyIGhvc3QgPSBhcmdzLnNoaWZ0KCk7XG4vLyAgIHZhciBjb3B5ID0gYXJncy5zaGlmdCgpO1xuXG4vLyAgIGZvciAodmFyIGkgaW4gY29weSkgeyBob3N0W2ldID0gY29weVtpXTsgfVxuLy8gICBhcmdzLnVuc2hpZnQoaG9zdCk7XG5cbi8vICAgaWYgKGFyZ3MubGVuZ3RoID4gMSkgeyByZXR1cm4gZXh0ZW5kLmFwcGx5KG51bGwsIGFyZ3MpOyB9XG4vLyAgIHJldHVybiBob3N0O1xuLy8gfTtcblxudmFyIGV4cGxvZGUgPSBmdW5jdGlvbihpdGVtcywgY2IpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGl0ZW1zKSkge1xuICAgIGl0ZW1zID0gW2l0ZW1zXTtcbiAgfVxuXG4gIGl0ZW1zLmZvckVhY2goY2IpO1xufTtcblxuLy8gQFRPRE8gLSByZW1vdmUgd2hlbiBhbGwgb2NjdXJlbmNlIHJlbW92ZWQgaW4gZGVwZW5kZW5jaWVzXG4vLyBATk9URSBkb25lIGluIHVpIGNvbXBvbmVudHNcbi8vIGNvbWJpbmVkIGFjY2Vzc29yc1xuLy8gdXRpbHMuZ2V0U2V0ID0gZnVuY3Rpb24gZ2V0U2V0KG9iaiwgcHJvcHMgPSBudWxsLCB2YWx1ZU1vZGUgPSBmYWxzZSl7XG4vLyAgIGlmICghcHJvcHMpIHRocm93IG5ldyBFcnJvcignUHJvcGVydHkgbmFtZSBpcyBtYW5kYXRvcnkuJyk7XG5cbi8vICAgdmFyIGFkZCA9IChwID0gbnVsbCkgPT4ge1xuLy8gICAgIHZhciBfcHJvcCA9IGBfJHtwfWA7XG4vLyAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoX3Byb3ApKSBvYmpbX3Byb3BdID0gbnVsbDtcblxuLy8gICAgIG9ialtwXSA9IGZ1bmN0aW9uKHZhbHVlID0gbnVsbCkge1xuLy8gICAgICAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gdGhpc1tfcHJvcF07XG5cbi8vICAgICAgIGlmICghdXRpbHMuaXNGdW5jdGlvbih2YWx1ZSkgJiYgIXZhbHVlTW9kZSkge1xuLy8gICAgICAgICB0aGlzW19wcm9wXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdmFsdWU7IH07XG4vLyAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICB0aGlzW19wcm9wXSA9IHZhbHVlO1xuLy8gICAgICAgfVxuXG4vLyAgICAgICByZXR1cm4gdGhpcztcbi8vICAgICB9O1xuLy8gICB9O1xuXG4vLyAgIGV4cGxvZGUocHJvcHMsIChwKSA9PiBhZGQocCkpO1xuLy8gfTtcblxuLy8gY29tYmluZWQgYWNjZXNzb3JzXG51dGlscy5hY2Nlc3NvcnMgPSB7XG5cbiAgaWRlbnRpdHk6IGZ1bmN0aW9uKG9iaiwgcHJvcHMgPSBudWxsKSB7XG4gICAgaWYgKCFwcm9wcykgdGhyb3cgbmV3IEVycm9yKCdQcm9wZXJ0eSBuYW1lIGlzIG1hbmRhdG9yeS4nKTtcblxuICAgIHZhciBhZGQgPSAocCA9IG51bGwpID0+IHtcbiAgICAgIHZhciBfcHJvcCA9IGBfJHtwfWA7XG4gICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShfcHJvcCkpIG9ialtfcHJvcF0gPSBudWxsO1xuXG4gICAgICBvYmpbcF0gPSBmdW5jdGlvbih2YWx1ZSA9IG51bGwpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gdGhpc1tfcHJvcF07XG4gICAgICAgIHRoaXNbX3Byb3BdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgZXhwbG9kZShwcm9wcywgKHApID0+IGFkZChwKSk7XG4gIH0sXG5cbiAgZ2V0RnVuY3Rpb246IGZ1bmN0aW9uKG9iaiwgcHJvcHMgPSBudWxsKSB7XG4gICAgaWYgKCFwcm9wcykgdGhyb3cgbmV3IEVycm9yKCdQcm9wZXJ0eSBuYW1lIGlzIG1hbmRhdG9yeS4nKTtcblxuICAgIHZhciBhZGQgPSAocCA9IG51bGwpID0+IHtcbiAgICAgIHZhciBfcHJvcCA9IGBfJHtwfWA7XG4gICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShfcHJvcCkpIG9ialtfcHJvcF0gPSBudWxsO1xuXG4gICAgICBvYmpbcF0gPSBmdW5jdGlvbih2YWx1ZSA9IG51bGwpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSBudWxsKSByZXR1cm4gdGhpc1tfcHJvcF07XG5cbiAgICAgICAgaWYgKCF1dGlscy5pc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgIHRoaXNbX3Byb3BdID0gZnVuY3Rpb24oKSB7IHJldHVybiB2YWx1ZTsgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzW19wcm9wXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfTtcbiAgICB9O1xuXG4gICAgZXhwbG9kZShwcm9wcywgKHApID0+IGFkZChwKSk7XG5cbiAgfSxcblxuICBnZXRWYWx1ZTogZnVuY3Rpb24ob2JqLCBwcm9wcyA9IG51bGwpIHtcbiAgICBpZiAoIXByb3BzKSB0aHJvdyBuZXcgRXJyb3IoJ1Byb3BlcnR5IG5hbWUgaXMgbWFuZGF0b3J5LicpO1xuXG4gICAgdmFyIGFkZCA9IChwID0gbnVsbCkgPT4ge1xuICAgICAgdmFyIF9wcm9wID0gYF8ke3B9YDtcbiAgICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KF9wcm9wKSkgb2JqW19wcm9wXSA9IG51bGw7XG5cbiAgICAgIG9ialtwXSA9IGZ1bmN0aW9uKHZhbHVlID0gbnVsbCkge1xuICAgICAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgICBpZiAoIXV0aWxzLmlzRnVuY3Rpb24odGhpc1tfcHJvcF0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tfcHJvcF07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIHRoaXNbX3Byb3BdKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzW19wcm9wXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH07XG4gICAgfTtcblxuICAgIGV4cGxvZGUocHJvcHMsIChwKSA9PiBhZGQocCkpO1xuICB9XG59O1xuXG5cbi8vIHJldHVybiBhIHVuaXF1ZSBpZGVudGlmaWVyIHdpdGggYW4gb3B0aW9ubmFsIHByZWZpeFxudmFyIF9jb3VudGVycyA9IHsgJyc6IDAgfTtcblxudXRpbHMudW5pcXVlSWQgPSBmdW5jdGlvbihwcmVmaXggPSAnJykge1xuICBpZiAocHJlZml4ICYmICFfY291bnRlcnNbcHJlZml4XSkge1xuICAgIF9jb3VudGVyc1twcmVmaXhdID0gMDtcbiAgfVxuXG4gIHZhciBpZCA9IF9jb3VudGVyc1twcmVmaXhdO1xuICBpZiAocHJlZml4KSB7IGlkID0gW3ByZWZpeCwgaWRdLmpvaW4oJy0nKTsgfVxuICBfY291bnRlcnNbcHJlZml4XSArPSAxO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbi8vIHN0eWxlIGluamVjdGlvblxudmFyIF9zaGVldDtcblxudmFyIGNyZWF0ZVN0eWxlU2hlZXQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgLy8gd2Via2l0IGhhY2s6IGNmLiBodHRwOi8vZGF2aWR3YWxzaC5uYW1lL2FkZC1ydWxlcy1zdHlsZXNoZWV0c1xuICBlbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJykpO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGVsKTtcbiAgX3NoZWV0ID0gZWwuc2hlZXQ7XG59O1xuXG51dGlscy5hZGRDc3NSdWxlID0gZnVuY3Rpb24oc2VsZWN0b3IsIHJ1bGVzLCBwb3NpdGlvbiA9IDApIHtcbiAgaWYgKCFfc2hlZXQpIHsgY3JlYXRlU3R5bGVTaGVldCgpOyB9XG5cbiAgdmFyIHJ1bGUgPSBPYmplY3Qua2V5cyhydWxlcykubWFwKChrZXkpID0+IHtcbiAgICByZXR1cm4ga2V5ICsgJzonICsgcnVsZXNba2V5XTtcbiAgfSkuam9pbignOycpO1xuXG4gIHJ1bGUgPSBzZWxlY3RvciArICd7JyArIHJ1bGUgKyAnfSc7XG4gIF9zaGVldC5pbnNlcnRSdWxlKHJ1bGUsIHBvc2l0aW9uKTtcbn07XG5cbi8vIGZyb20gdW5kZXJzY29yZSAxLjcuMFxudXRpbHMudGhyb3R0bGUgPSBmdW5jdGlvbihmdW5jLCB3YWl0LCBvcHRpb25zKSB7XG4gIHZhciBjb250ZXh0LCBhcmdzLCByZXN1bHQ7XG4gIHZhciB0aW1lb3V0ID0gbnVsbDtcbiAgdmFyIHByZXZpb3VzID0gMDtcbiAgaWYgKCFvcHRpb25zKSBvcHRpb25zID0ge307XG4gIHZhciBsYXRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHByZXZpb3VzID0gb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSA/IDAgOiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICB9O1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGlmICghcHJldmlvdXMgJiYgb3B0aW9ucy5sZWFkaW5nID09PSBmYWxzZSkgcHJldmlvdXMgPSBub3c7XG4gICAgdmFyIHJlbWFpbmluZyA9IHdhaXQgLSAobm93IC0gcHJldmlvdXMpO1xuICAgIGNvbnRleHQgPSB0aGlzO1xuICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgaWYgKHJlbWFpbmluZyA8PSAwIHx8IHJlbWFpbmluZyA+IHdhaXQpIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgcHJldmlvdXMgPSBub3c7XG4gICAgICByZXN1bHQgPSBmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgfSBlbHNlIGlmICghdGltZW91dCAmJiBvcHRpb25zLnRyYWlsaW5nICE9PSBmYWxzZSkge1xuICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQobGF0ZXIsIHJlbWFpbmluZyk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59O1xuXG4vL1xudXRpbHMudG9Gcm9udCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgaXRlbS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGl0ZW0pO1xufTtcblxudXRpbHMuVUlMb29wID0gcmVxdWlyZSgnLi9saWIvdWktbG9vcCcpO1xudXRpbHMub2JzZXJ2ZSA9IHJlcXVpcmUoJy4vbGliL29ic2VydmUnKTtcblxuLy8gY3JlYXRlIGEgZGVmYXVsdCBkYXRhIGFjY2Vzc29yIGZvciBlYWNoIGdpdmVuIGF0dHJzXG5cbi8vIHZhciBkZWZhdWx0RGF0YU1hcCA9IGZ1bmN0aW9uIGRlZmF1bHREYXRhTWFwKG9iaiwgYXR0cnMpIHtcbi8vICAgYXR0cnMuZm9yRWFjaCgoYXR0cikgPT4ge1xuLy8gICAgIG9ialthdHRyXSgoZCwgdiA9IG51bGwpID0+IHtcbi8vICAgICAgIGlmICh2ID09PSBudWxsKSByZXR1cm4gZC55O1xuLy8gICAgICAgZFthdHRyXSA9ICt2O1xuLy8gICAgICAgcmV0dXJuIG9iajtcbi8vICAgICB9KVxuLy8gICB9KTtcbi8vIH07XG5cblxubW9kdWxlLmV4cG9ydHMgPSB1dGlscztcbiJdfQ==