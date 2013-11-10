stringformat 
============

This library provides Python-like string formatting for javascript.

It puts the factory $getStringFormatter in the global scope.

Example usage:

    var fmt = $getStringFormatter(); // Get instance
    
    fmt("Hello, {}", "world");  // "Hello, world"
    fmt("{0:d} in decimal is {0:x} in hexadecimal. ", 32);  // "32 in decimal is 20 in hexadecimal. "
    fmt("There are only {0:b} types of people...", 2);  // "There are only 10 types of people..."
    fmt("Numbers can be padded {:6d}", 123); // "Numbers can be padded    123"
    fmt("{0} plus {0} equals {1}", "two", "four");  // "two plus two equals four"
    fmt("{:.4f}", 1.232));  // "1.2320";
    fmt("{:10.4f}", 1.232);  // "    1.2320"    

Supports a subset of the String.format of python 2
See http://docs.python.org/2/library/string.html for documentation

Supported codes:
* s - string
* c - char from integer
* d - decimal
* o - octal
* x - hex
* X - uppercase hex
* b - binary
* f - fixed point
* F - same as f
* % - multiply by 100, and show with fixed 'f' format precision



## Know and deliberate differences from Python:
* Without width or format specifiers, all objects are coerced to string by default.
* Boolean can be formatted with 's' code, and is also by default.  In the Python implementation, it depends on the formatting string (not only the code)
* The 'f' code will at some point switch to exponential representation
* The 'n' code is left out, because the locale would have to be set explicitly
* The 'g' and 'G' codes are left out, since the semantics don't really make sense for javascript
* Dictionaries instead of arguments are not supported yet 
