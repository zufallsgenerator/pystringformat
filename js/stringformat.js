/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Christer Bystrom
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *
 * Python-like string formatting for javascript.
 *
 * By default, puts the function _fmt in the global scope.
 *
 * Example usage:
 *
 *   _fmt("Hello, {}", "world");
 *   _fmt("{0:d} in decimal is {0:x} in hexadecimal. ", 32);
 *   _fmt("There are only {0:b} types of people.", 2);
 *   _fmt("Numbers can be padded {:6d}", 123);
 *   _fmt("{0} plus {0} equals {1}", "two", "four");
 *
 *  Supports a subset of the String.format of python 2
 *  See http://docs.python.org/2/library/string.html for documentation
 *
 * Supported codes:
 *   s - string
 *   d - decimal
 *   o - octal
 *   x - hex
 *   X - uppercase hex
 *
 * Dicts are not supported yet
 */

(function(scope) {
  var VERBOSE = true;
  
  function paddingIsOK(str) {
    var firstChar;
    if (str === "") {
      return true;
    }
    
    if (str.length > 1) {
      firstChar = str.substr(0, 1);
      if (firstChar === "0" ||
          firstChar === " " ||
          firstChar === "+") {
        str = str.substr(1);
      }
    }
    return !str.match(/[^0-9]/);
  }
  
  function padRight(str, length, char) {
    char = char || " ";
    while (str.length < length) {
      str = str + char;
    }
    return str;
  }
  
  function padLeft(str, length, char) {
    char = char || " ";
    while (str.length < length) {
      str = char + str;
    }
    return str;
  }
  
  /**
   * Format 's'
   */
  function stringFormatter(s, padding) {
    if (!paddingIsOK(padding)) {
      throw "Invalid specification '" + padding + "' for 's' format code";
    }
    return padRight(String(s), parseInt(padding, 10));
  }
  
  /**
   * Helper function for formatting
   * 
   * @param x {Number}
   * @param padding {String}
   * @param fn {Function} - converter function
   */
  function _numberFormatter(x, padding, fn) {
    var char = "", firstPaddingChar = "", neg = x < 0, hex, len;
    if (typeof x !== "number") {
      throw "Need a number to show hex, got '" + x + "' of type " + typeof x;
    }
    if (!paddingIsOK(padding)) {
      throw "Invalid specification '" + padding + "' for 'x' format code";
    }
    
    if (neg) {
      hex = fn(-x);
    } else {
      hex = fn(x);
    }
    if (padding.length > 1) {
      firstPaddingChar = padding.substr(0, 1);
    }
    if (firstPaddingChar === "0") {
      char = "0";
    }
    if (firstPaddingChar === "+") {
      hex = "+" + hex;
      char = " ";
    }
    len = parseInt(padding, 10);
    if (neg) {
      if (firstPaddingChar === "+") {
        throw "Invalid specification '" + padding + "' for negative number";
      }
      if (char === "0") {
        return "-" + padLeft(hex, len - 1, char);
      } else {
        return padLeft("-" + hex, len, char);
      }
    } else {
      return padLeft(hex, len, char);
    }
  }
  
  /**
   * Format 'x'
   */
  function hexFormatter(x, padding) {
    return _numberFormatter(x, padding, function(x) {
      if (Math.round(x) !== x) {
        throw "Can only format integer numbers with 'x' code";
      }
      return x.toString(16);
    });
  }  
  
  
  /**
   * Format 'X'
   */
  function hexFormatterToUpper(x, padding) {
    return hexFormatter(x, padding).toUpperCase();
  }
  
  /**
   * Format 'n'
   */
  function decimalFormatter(n, padding) {
    return _numberFormatter(n, padding, function(i) {
      if (Math.round(n) !== n) {
        throw "Can only format integer numbers with 'd' code";
      }
      return n.toString(10);
    });
  }
  
  /**
   * Format 'o'
   */
  function octalFormatter(o, padding) {
    return _numberFormatter(o, padding, function(i) {
      if (Math.round(o) !== o) {
        throw "Can only format integer numbers with 'o' code";
      }
      return o.toString(8);
    });
  }
  
  /**
   * Format 'b'
   */
  function binaryFormatter(b, padding) {
    return _numberFormatter(b, padding, function(i) {
      if (Math.round(b) !== b) {
        throw "Can only format integer numbers with 'b' code";
      }
      return b.toString(2);
    });
  }  
  
  
  var FORMATTERS = {
      s: stringFormatter,
      x: hexFormatter,
      X: hexFormatterToUpper,
      d: decimalFormatter,
      o: octalFormatter,
      b: binaryFormatter
  };
  /**
   * "b" | "c" | "d" | "e" | "E" | "f" | "F" | "g" | "G" | "n" | "o" | "s" | "x" | "X" | "%"
   * 
   * @returns
   */
  function simpleFormatter() {
    var str = arguments[0], origStr = str, i, r, lastStr;
    for (i = 1; i < arguments.length; i++) {
      r = new RegExp("\\{" + (i - 1 ) + "\\}", "g");
      lastStr = str;
      if (r.test(str)) {
        r.lastIndex = 0; // Reset regexp
        str = str.replace(r, String(arguments[i]));
      } else {
        str = str.replace("{}", String(arguments[i]));
      }
      if (VERBOSE && lastStr === str) {
        throw "Too many arguments, too few formatting codes: '" + origStr + "', argument count: " + arguments.length;
      }
    }
    if (VERBOSE && str.replace("{}", "") !== str) {
      throw "Too few arguments, too many formatting codes: '" + origStr + "', argument count: " + arguments.length;
    }
    return str;
  }
  
  function regexpIndex(idx) {
    return new RegExp("\\{(" + idx + "){1}(:{0,1}[^\\}]+)\\}", "g");
  }
  
  function regexpSimple() {
    return new RegExp("\\{(:{0,1}[^\\}]+)\\}", "g");
  }
  
  function formatSubstitute(subst, spec) {
    var letter = spec.substr(spec.length-1),
      padding = spec.substr(0, spec.length-1),
      formatter = FORMATTERS[letter];
    if (spec === "") {
      formatter = FORMATTERS.s;
    }
    if (!formatter) {
      throw "Unknown format code '" + spec + "'";
    }
    return formatter(subst, padding);
  }
   
  function formatMatch(matches, str, subst) {
    var m, spec, i, substFormatted;
    for (i=0;i<matches.length;i++) {
      m = matches[i];
      spec = m.replace("{", "").replace("}", "").split(":")[1];
      substFormatted = formatSubstitute(subst, spec);
      str = str.replace(m, substFormatted);
    }
    
    return str;
  }
  
  function fmt() {
    var str = arguments[0], i, rIndex, rSimple = regexpSimple(), m;
    if (str.indexOf(":") === -1) {
      return simpleFormatter.apply(simpleFormatter, arguments);
    }
    for (i = 1; i < arguments.length; i++) {
      rIndex = regexpIndex(i - 1);
      m = str.match(rIndex);
      if (m) {
        str = formatMatch(m, str, arguments[i]);
      } else {
        rSimple.lastindex = 0;
        m = str.match(rSimple);
        str = formatMatch([m[0]], str, arguments[i]);
      }
    }

    return str;
  }
  
  scope._fmt = fmt;
})(window);
