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
 *   fmt("Hello, {}", "world");
 *   fmt("{0:d} in decimal is {0:x} in hexadecimal. ", 32);
 *   fmt("There are only {0:b} types of people.", 2);
 *   fmt("Numbers can be padded {:6d}", 123);
 *   fmt("{0} plus {0} equals {1}", "two", "four");
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
 *   Boolean can be formatted with 's' code, and is also by default.
 *   In the python implementation, it depends on the formatting string (not only the code)
 *   
 *   The 'f' code will at some point switch to exponential representation
 *
 *   The 'n' code is left out, because the locale would have to be set explicitly
 *   The 'g' and 'G' codes are left out, since the semantics don't really make sense for javascript
 *
 */

window.$getStringFormatter = (function() {
  var FORMATTERS;
  
  function assert(condition, message) {
    if (!condition) {
      throw "Assertion failed " + (message || "assert failed");
    }
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
  
  function isInteger(n) {
    return Math.round(n) === n;
  }
  
  function assertIsInteger(n, code) {
    if (Math.round(n) !== n) {
        throw "Got '" + n + "' of type '" + typeof n + "' but expected an integer" + (code ? " for code '" + code + "'" : "");
    }
  }
  
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
   * Format 'c'
   */
  
  function charFormatter(c, padding) {
    assertIsInteger(c, 'x');
    return padLeft(String.fromCharCode(c), parseInt(padding, 10));
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
    var char = "", firstPaddingChar = "", neg = x < 0, hex, len;
    if (typeof x === "boolean") {
      if (x) {
        x = 1;
      } else {
        x = 0;
      }
    }
    
    if (!paddingIsOK(padding)) {
      throw "Invalid specification '" + padding + "'";
    }

    assertIsInteger(x, code);
    
    if (neg) {
      hex = (-x).toString(base);
    } else {
      hex = x.toString(base);
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
    return _integerFormatter(x, padding, 16, 'x');
  }  
  
  
  /**
   * Format 'X'
   */
  function hexFormatterToUpper(x, padding) {
    return _integerFormatter(x, padding, 16, 'X').toUpperCase();
  }
  
  /**
   * Format 'd'
   */
  function decimalFormatter(d, padding) {
    return _integerFormatter(d, padding, 10, 'd');
  }
  
  /**
   * Format 'o'
   */
  function octalFormatter(o, padding) {
    return _integerFormatter(o, padding, 8, 'o');
  }
  
  /**
   * Format 'b'
   */
  function binaryFormatter(b, padding) {
    return _integerFormatter(b, padding, 2, 'b');
  }  

  function _getFixedpointPadding(padding) {
    var strPaddingBefore, strPaddingAfter, paddingBefore, paddingAfter;
    
    if (padding.indexOf(".") > -1) {
      strPaddingBefore = strBefore(padding, ".");
      strPaddingAfter = strAfter(padding, ".");
    } else {
      strPaddingAfter = null;
      strPaddingBefore = padding;
    }
    
    if (!paddingIsOK(strPaddingBefore)) {
      throw "Invalid specification '" + padding + "' for 'f' format code";
    }
 
    if (strPaddingBefore && strPaddingBefore.length > 0) {
      paddingBefore = parseInt(strPaddingBefore, 10);
    } else {
      paddingBefore = 0;
    }
    
    if (strPaddingAfter && strPaddingAfter.length > 0) {
      paddingAfter = parseInt(strPaddingAfter, 10);
    } else {
      paddingAfter = 6; // Default value
    }
    
    return [paddingBefore, paddingAfter];
  }
  
  /**
   * Format 'b'
   */
  function fixedpointFormatter(f, padding, ispercentage) {
    var neg = f < 0, paddingChar = null, str, fBefore, fAfter, fTotal, ret;

    ret = _getFixedpointPadding(padding);
    len = ret[0];
    paddingAfter = ret[1];
    
    if (neg) {
      str = (-f).toString(10);
    } else {
      str = f.toString(10);
    }
    
    if (str.indexOf("e") > -1) {
      // Sorry, no can do
      return f;
    }
    
    if (str.indexOf(".") > -1) {
      fBefore = strBefore(str,".");
      fAfter = strAfter(str,".");
    } else {
      fBefore = str;
      fAfter = "";
    }
    
    if (fAfter.length > paddingAfter) {
      fAfter = fAfter.substr(0, paddingAfter);
    } else {
      fAfter = padRight(fAfter, paddingAfter, "0");
    }
    
    if (fAfter) {
      fTotal = fBefore + "." + fAfter;
    } else {
      fTotal = fBefore;
    }
    
    if (paddingAfter > 0 && padding.length > 0) {
      firstPaddingChar = padding.substr(0, 1);
    }

    if (firstPaddingChar === "0") {
      paddingChar = "0";
    }
    if (firstPaddingChar === "+") {
      fTotal = "+" + fTotal;
      paddingChar = " ";
    }
    if (firstPaddingChar === " ") {
      fTotal = " " + fTotal;
      paddingChar = " ";
    }
    if (ispercentage) {
      len = len - 1;
    }
    if (neg) {
      if (firstPaddingChar === "+") {
        throw "Invalid specification '" + padding + "' for negative number";
      }
      if (paddingChar === "0") {
        return "-" + padLeft(fTotal, len - 1, paddingChar);
      } else {
        return padLeft("-" + fTotal, len, paddingChar);
      }
    } else {
      return padLeft(fTotal, len, paddingChar);
    }    
  }
  
  function percentFormatter(p, padding) {
    if (typeof p !== "number") {
      throw "Can only format numbers with '%' code, got '" + p + "' of type '" + typeof p + "'";
    }
    return fixedpointFormatter(p * 100, padding, true) + "%"; 
  }
  
  FORMATTERS = {
      s: stringFormatter,
      x: hexFormatter,
      X: hexFormatterToUpper,
      d: decimalFormatter,
      o: octalFormatter,
      b: binaryFormatter,
      c: charFormatter,
      f: fixedpointFormatter,
      F: fixedpointFormatter,
      '%': percentFormatter
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
        assert(false, "TODO: implement float default formatter");
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
    assert(arg !== undefined, "arg is undefined, match is '" + m + "'");
    spec = strAfter(m.replace("{", " ").replace("}", ""), ":");
    if (spec) {
      substFormatted = formatArgument(arg, spec);
    } else {
      substFormatted = arg;
    }
    return str.replace(m, substFormatted);// substFormatted);
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
  
  return fmt;
});
