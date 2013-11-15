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
 * Exports the function pystringformat to the global scope if run in a browser,
 * or the module pystringformat if run in node.js.
 *
 * Example usage:
 *
 *   var fmt = pystringformat;  // Bind function method
 *   // if node.js: var fmt = require("pystringformat").pystringformat;
 *
 *   fmt("Hello, {}", "world");
 *   fmt("{0:d} in decimal is {0:x} in hexadecimal. ", 32);
 *
 *   See README.md for more examples
 */

/*jshint strict: true */
/*global window*/
/*global exports*/
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
      str = (-f).toFixed(numFractionalDigits);
    } else {
      str = f.toFixed(numFractionalDigits);
    }
    
    // Catch 1e+31, Infinity, NaN and so on
    if (str.match(/[a-zA-Z]+/g)) {
      // Sorry, no can do
      return str;
    }
    
    ret = splitStrNumberByDot(str);
    intPart = ret[0];
    fractPart = ret[1];
    
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
    if (type === "boolean" || type === "object" || type === "string") {
      return "s";
    }
    if (type === "number") {
      if (isInteger(value)) {
        return "d";
      } else {
        return "f";
      }
    }

    // Default for all
    return "s";
  }

  function formatArgument(arg, spec) {
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
   
  function formatMatch(m, arg) {
    var spec;
    spec = strAfter(m, ":");
    if (spec) {
      return formatArgument(arg, spec);
    } else {
      return String(arg);
    }
  }
  
  function getArgTypeFromMatch(str) {
    var stripped = str.replace("{", "").replace("}", "").split(":")[0];
    if (stripped.length === 0) {
       return "simple";
    }
    if (strIsDigits(stripped)) {
        return "pos"; 
    }
    return "dict";
  }
  
  function getPos(str) {
    var beforeColon;
    if (str.indexOf(":") === -1) {
      beforeColon = str;
    } else {
      beforeColon = strBefore(str, ":");
    }
    if ((beforeColon || "").length === 0 || !strIsDigits(beforeColon)) {
        throw 'Expected positional arguments';
    }
    return parseInt(beforeColon, 10);
  }
  
  function getByPath(dict, path) {
    var  obj = dict, i, key, split, origPath = path;
    // Remove ending ] and dots
    path = path.replace(/\]$/, "").replace(/[\[\]]+/g, ".");
    split = path.split(".");
    for (i=0;i<split.length;i++) {
      key = split[i];
      if (!obj.hasOwnProperty(key)) {
        throw "Key/path '" + origPath + "' not in dict ";
      }
      obj = obj[key];
    }
    return obj;
  }
  
  function getValueFromDict(dict, match) {
    var key = getDictKey(match);
    return getByPath(dict, key);
  }
  
  function getDictKey(str) {
    if (str.indexOf(":") === -1) {
      return str;
    } else {
      return strBefore(str, ":");
    }
  }
  
  /**
   * Entry function
   */
  function fmt() {
    var str = arguments[0], dict = arguments[1], numArgs = arguments.length - 1, regexp = new RegExp("{[^}]*}", "g"),
      matches, token, split = str.split("{"), arr = [split[0]], m, res, i, argType;
      
    matches = str.match(regexp);
    
    if ((matches || []).length === 0 && arguments.length === 1) {
        return str;
    }
    
    argType = getArgTypeFromMatch(matches[0]);
    
    if (argType === "dict" && (arguments.length !== 2 || typeof dict !== "object")) {
      throw "Using keyword formatting, expected only one argument of type object";
    }
    
    if (argType === "simple" && (matches.length > numArgs || matches.length < numArgs)) {
      throw "More format codes than arguments -> codes {}, arguments {}".replace("{}", matches.length).replace("{}", numArgs);
    }
    
    for(i=1;i<split.length;i++) {
      token = split[i];
      m = strBefore(token, "}");
      if (argType === "dict") {
        res = formatMatch(m, getValueFromDict(dict, m));
      }
      if (argType === "pos") {
        res = formatMatch(m, arguments[getPos(m) + 1]);
      }
      if (argType === "simple") {
        res = formatMatch(m, arguments[i]);
      }
      arr.push(res);
      arr.push(strAfter(token, "}"));
    }
    return arr.join("");
  }
  
  // export module
  
  var out = typeof exports != 'undefined' && exports || window;
  out.pystringformat = fmt;
})();