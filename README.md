pystringformat 
==============

Current version: 0.2.x

This library provides Python-like string formatting for javascript.

Exports the function pystringformat to the global scope if run in a browser,
or the module pystringformat if run in node.js.

Example usage:

    var fmt = pystringformat;  // Bind function method
    // if node.js: var fmt = require("pystringformat").pystringformat;
    
    fmt("Hello, {}", "world");  // "Hello, world"
    fmt("{0:d} in decimal is {0:x} in hexadecimal. ", 32);  // "32 in decimal is 20 in hexadecimal. "
    fmt("There are only {0:b} types of people...", 2);  // "There are only 10 types of people..."
    fmt("Numbers can be padded {:6d}", 123); // "Numbers can be padded    123"
    fmt("{0} plus {0} equals {1}", "two", "four");  // "two plus two equals four"
    fmt("{:.4f}", 1.232));  // "1.2320";
    fmt("{:10.4f}", 1.232);  // "    1.2320"    
    
    fmt("{a.x}", {a: {x: 2}});             // 2
    fmt("{a.b[1]}", {a: {b: [1, 2, 3]}})); // 2


Supports a subset of the String.format of python 2
See http://docs.python.org/2/library/string.html for documentation

Supported codes:
* s  - string
* c  - char from integer
* d  - decimal
* o  - octal
* x  - hex
* X  - uppercase hex
* b  - binary
* f  - fixed point
* F  - same as f
* %  - multiply by 100, and show with fixed 'f' format precision

If the argument after the format string is one Object it can be used as a dictionary.

## Known and deliberate differences from Python:
* Without width or format specifiers, all objects are coerced to string by default.
* Boolean can be formatted with 's' code, and is also by default.  In the Python implementation, it depends on the formatting string (not only the code)
* The 'f' code will at some point switch to exponential representation
* The 'n' code is left out, because the locale would have to be set explicitly
* The 'g' and 'G' codes are left out, since the semantics don't really make sense for javascript
* Bracket and dot notations are interchangeable (javascript only has one type of properties)

## Changelog

### Version 0.2
- A single object can be used as a dictionary
