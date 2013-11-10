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
 * Puts the factory $getStringFormatter in the global scope.
 *
 * Example usage:
 *
 *   var fmt = $getStringFormatter();  // Get instance
 *
 *   fmt("Hello, {}", "world");
 *   fmt("{0:d} in decimal is {0:x} in hexadecimal. ", 32);
 *   fmt("There are only {0:b} types of people.", 2);
 *   fmt("Numbers can be padded {:6d}", 123);
 *   fmt("{0} plus {0} equals {1}", "two", "four");
 *
 *   For more examples, see the README.me file
 *
 *  Supports a subset of the String.format of python 2
 *  See http://docs.python.org/2/library/string.html for documentation
 *
 * Supported codes:
 *   s - string
 *   c - char from integer
 *   d - decimal
 *   o - octal
 *   x - hex
 *   X - uppercase hex
 *   b - binary
 *   f - fixed point
 *   F - same f
 *   % - multiply by 100, and show with fixed 'f' format precision
 *
 * Dicts are not supported yet
 *
 * Know and deliberate differences from python:
 *   Without width or format specifiers, all objects are coerced to string by default.
 *   Boolean can be formatted with 's' code, and is also by default.
 *   In the python implementation, it depends on the formatting string (not only the code)
 *   
 *   The 'f' code will at some point switch to exponential representation
 *
 *   The 'n' code is left out, because the locale would have to be set explicitly
 *   The 'g' and 'G' codes are left out, since the semantics don't really make sense for javascript
 *
 */

/*jshint strict: true */
(function() {
  "use strict";
  var DEFAULT_FIXEDPOINT_DIGITS = 6,
    FORMATTERS;
  
  // Helper functions
  
  function assert(condition, message) {
    if (!condition) {
      throw "Assertion failed " + (message || "assert failed");
    }
  }
  
  function isInteger(n) {
    return Math.round(n) === n;
  }
  
  function strBefore(str, delim) {
    var i = str.indexOf(delim);
    if (i === -1) {
      return null;
    }
    return str.substr(0, i);
  }

  function strAfter(str, delim) {
    var i = str.indexOf(delim);
    if (i === -1) {
      return null;
    }
    return str.substr(i+delim.length);
  }
  
  function assertIsInteger(n, code) {
    if (Math.round(n) !== n) {
        throw "Got '" + n + "' of type '" + typeof n + "' but expected an integer" + (code ? " for code '" + code + "'" : "");
    }
  }
  
  function isPaddingOK(str) {
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
   * Helper function for formatting integers of different base
   * 
   * @param x {Number|Boolean}
   * @param padding {String}
   * @param base {Integer} - ex 16 for hexadecimal
   * @param code {String} - for error reporting
   */
  function _integerFormatter(x, padding, base, code) {
    var paddingChar = "", firstPaddingChar = "", neg = x < 0, str, len;
    if (typeof x === "boolean") {
      if (x) {
        x = 1;
      } else {
        x = 0;
      }
    }
    
    if (!isPaddingOK(padding)) {
      throw "Invalid specification '" + padding + (code ? "' for '" + code + "' format code" : "");
    }

    assertIsInteger(x, code);
    
    if (neg) {
      str = (-x).toString(base);
    } else {
      str = x.toString(base);
    }
    if (padding.length > 1) {
      firstPaddingChar = padding.substr(0, 1);
    }
    if (firstPaddingChar === "0") {
      paddingChar = "0";
    }
    if (firstPaddingChar === "+") {
      str = "+" + str;
      paddingChar = " ";
    }
    len = parseInt(padding, 10);
    if (neg) {
      if (firstPaddingChar === "+") {
        throw "Invalid specification '" + padding + "' for negative number";
      }
      if (paddingChar === "0") {
        return "-" + padLeft(str, len - 1, paddingChar);
      } else {
        return padLeft("-" + str, len, paddingChar);
      }
    } else {
      return padLeft(str, len, paddingChar);
    }
  }
  
  /**
   * Split a string by the dot and returns
   * the integer and fractional part
   *
   * @param strNum {String}
   *
   * @return {Array}<String> - [integerPart, fractionalPart]
   */
  function splitStrNumberByDot(strNum) {
    if (strNum.indexOf(".") > -1) {
      return [strBefore(strNum, "."),  strAfter(strNum, ".")];
    } else {
      return [strNum, ""];
    }
  }
  
  function _getFixedpointPadding(padding) {
    var strInt, strFract, intPart, fractPart, ret;
    
    ret = splitStrNumberByDot(padding);
    strInt = ret[0];
    strFract = ret[1];
    
    if (!isPaddingOK(strInt)) {
      throw "Invalid specification '" + padding + "'";
    }
 
    if (strInt && strInt.length > 0) {
      intPart = parseInt(strInt, 10);
    } else {
      intPart = 0;
    }
    
    if (strFract && strFract.length > 0) {
      fractPart = parseInt(strFract, 10);
    } else {
      fractPart = DEFAULT_FIXEDPOINT_DIGITS; // Default value
    }
    
    return [intPart, fractPart];
  }
  
  function fixedpointFormatter(f, padding, ispercentage) {
    var neg = f < 0,
      paddingChar = null,
      firstPaddingChar = "",
      ret, str, intPart, fractPart, strRet, totalLen, numFractionalDigits;

    ret = _getFixedpointPadding(padding);
    totalLen = ret[0];
    numFractionalDigits = ret[1];
    
    if (neg) {
      str = (-f).toString(10);
    } else {
      str = f.toString(10);
    }
    
    // Catch 1e+31, Infinity, NaN and so on
    if (str.match(/[a-zA-Z]+/g)) {
      // Sorry, no can do
      return str;
    }
    
    ret = splitStrNumberByDot(str);
    intPart = ret[0];
    fractPart = ret[1];
    
    if (fractPart.length > numFractionalDigits) {
      fractPart = fractPart.substr(0, numFractionalDigits);
    } else {
      fractPart = padRight(fractPart, numFractionalDigits, "0");
    }
    
    if (fractPart) {
      strRet = intPart + "." + fractPart;
    } else {
      strRet = intPart;
    }
    
    if (numFractionalDigits > 0 && padding.length > 0) {
      firstPaddingChar = padding.substr(0, 1);
    }

    if (firstPaddingChar === "0") {
      paddingChar = "0";
    }
    if (firstPaddingChar === "+") {
      strRet = "+" + strRet;
      paddingChar = " ";
    }
    if (firstPaddingChar === " ") {
      strRet = " " + strRet;
      paddingChar = " ";
    }
    if (ispercentage) {
      totalLen = totalLen - 1;
    }
    if (neg) {
      if (firstPaddingChar === "+") {
        throw "Invalid specification '" + padding + "' for negative number";
      }
      if (paddingChar === "0") {
        return "-" + padLeft(strRet, totalLen - 1, paddingChar);
      } else {
        return padLeft("-" + strRet, totalLen, paddingChar);
      }
    } else {
      return padLeft(strRet, totalLen, paddingChar);
    }    
  }
  
  function stringFormatter(s, padding) {
    if (!isPaddingOK(padding)) {
      throw "Invalid specification '" + padding + "' for 's' format code";
    }
    return padRight(String(s), parseInt(padding, 10));
  }
  
  function charFormatter(c, padding) {
    assertIsInteger(c, 'x');
    return padLeft(String.fromCharCode(c), parseInt(padding, 10));
  }

  function percentageFormatter(p, padding) {
    if (typeof p !== "number") {
      throw "Can only format numbers with '%' code, got '" + p + "' of type '" + typeof p + "'";
    }
    return fixedpointFormatter(p * 100, padding, true) + "%"; 
  }
  
  FORMATTERS = {
    s: stringFormatter,
    x: function(x, padding) { return _integerFormatter(x, padding, 16, 'x'); },
    X: function(x, padding) { return _integerFormatter(x, padding, 16, 'X').toUpperCase(); },
    d: function(d, padding) { return _integerFormatter(d, padding, 10, 'd'); },
    o: function(o, padding) { return _integerFormatter(o, padding, 8, 'o'); },
    b: function(b, padding) { return _integerFormatter(b, padding, 2, 'b'); },
    c: charFormatter,
    f: fixedpointFormatter,
    F: fixedpointFormatter,
    '%': percentageFormatter
  };
  
  function strIsDigits(str) {
    return Boolean(str.match(/^[0-9]+$/));
  }
  
  function getDefaultFormatterForValue(value) {
    var type = typeof value;
    if (type  === "string") {
      return "s";
    }
    if (type === "number") {
      if (isInteger(value)) {
        return "d";
      } else {
        return "f";
      }
    }
    if (type === "boolean") {
      return "s";
    }
    if (type === "object") {
      return "s";
    }
    
    // Default for all
    return "s";
  }

  function formatArgument(arg, spec) {
    assert(spec !== undefined, "spec is undefined");
    var code = spec.substr(spec.length-1), padding, formatter;
    
    if (spec === "" || strIsDigits(code)) {
      padding = spec;
      code = getDefaultFormatterForValue(arg);
    } else {
      padding = spec.substr(0, spec.length-1);
    }
     
    formatter = FORMATTERS[code];
    if (!formatter) {
      throw "Unknown format specification '" + spec + "'";
    }
    return formatter(arg, padding);
  }
   
  function formatMatch(m, str, arg) {
    var spec, substFormatted;
    spec = strAfter(m.replace("{", " ").replace("}", ""), ":");
    if (spec) {
      substFormatted = formatArgument(arg, spec);
    } else {
      substFormatted = arg;
    }
    return str.replace(m, String(substFormatted));// substFormatted);
  }
  
  function getPos(str) {
    var stripped = str.replace("{", "").replace("}", ""), beforeColon;
    if (stripped.length === 0) {
       return null;
    }
    if (stripped.indexOf(":") === -1) {
      return parseInt(stripped, 10);
    }
    beforeColon = strBefore(stripped, ":");
    if (beforeColon === null || beforeColon.length === 0) {
      return null;
    }
    return parseInt(beforeColon, 10); 
  }
  
  /**
   * Entry function
   */
  function fmt() {
    var str = arguments[0], origStr = str, regexp = new RegExp("{[^}]*}", "g"),
      havePositional = false, haveSimple = false, matches, pos, i, m;
    
    matches = str.match(regexp);

    for (i=0;i<matches.length;i++) {
      m = matches[i];
      pos = getPos(m);
      if (pos === null) {
        haveSimple = true;
        pos = i;
      } else {
        havePositional = true;
      }
      if (haveSimple && havePositional) {
        throw 'Cannot mix positional and non-positional arguments for string "' + str + '" (that is, either "{} {}" or "{0} {1}"  but not "{} {1}"';
      }
      assert(String(pos) !== "NaN", "pos is NaN, m is '" + m + "'");
      if (pos >= arguments.length - 1) {
        throw "Too few arguments for position " + pos + ", '" + m + "', full string '" + origStr + "'";
      }
      str = formatMatch(m, str, arguments[pos+1]);
    }
    
    if (haveSimple && (arguments.length - 1) > matches.length) {
        throw "More arguments (" + (arguments.length - 1) + ") than positions (" + matches.length + "), string is '" + origStr + "'";
    }
    
    return str;
  }
  
  // export module
  var out = typeof exports != 'undefined' && exports || window;
  out.stringformat = fmt;
})();
