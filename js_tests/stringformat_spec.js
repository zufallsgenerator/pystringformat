describe("stringformat", function() {
  var fmt = $getStringFormatter({numberseparator: ","});

  beforeEach(function() {
  });

  it("should format simple arguments correctly", function() {
    expect(fmt("Hello, {}!", "world")).toEqual("Hello, world!");
    expect(fmt("Hello, {} {} {}!", "to", "the", "world")).toEqual("Hello, to the world!");
  });
  
  it("should format all basic objects without format specifier", function() {
    expect(fmt("{}", null)).toBe("null");
    expect(fmt("{}", {})).toBe("[object Object]");
    expect(fmt("{}", [])).toBe("");
    expect(fmt("{}", [1, 2, 3])).toBe("1,2,3");
    expect(fmt("{}", true)).toBe("true");
    expect(fmt("{}", undefined)).toBe("undefined");
    expect(fmt("{}", 0)).toBe("0");
    expect(fmt("{}", -42)).toBe("-42");
    expect(fmt("{}", function(){})).toMatch("function");
  });
  
  it("should format numbered arguments correctly", function() {
    expect(fmt("Hello, {0}!", "world")).toEqual("Hello, world!");
    expect(fmt("Sommartider, {0}, {0}, sommartider!", "hej")).toEqual("Sommartider, hej, hej, sommartider!");
    expect(fmt("Sommartider, {1}, {0}, sommartider!", "da", "hej")).toEqual("Sommartider, hej, da, sommartider!");
  });
  
  it("should format complex arguments correctly", function() {
    expect(fmt("Hello, {0:}!", "world")).toEqual("Hello, world!");
    expect(fmt("Hello, {0:} {0:s}!", "hej")).toEqual("Hello, hej hej!");
    expect(fmt("Hello, {:}!", "world")).toEqual("Hello, world!");
    expect(fmt("Hello, {:s}!", "world")).toEqual("Hello, world!");
    // Wideness
    expect(fmt("'{0:6s}'", "hej")).toEqual("'hej   '");
    expect(fmt("'{0:2s}'", "hej")).toEqual("'hej'");
    // Numbers to string, with wideness
    expect(fmt("'{:6s}'", "123")).toEqual("'123   '");
    expect(fmt("'{0:6s}'", "123")).toEqual("'123   '");
    expect(fmt("'{0:6s}','{0:4s}'", "123")).toEqual("'123   ','123 '");
  });

  it("should throw and error when mixing positional and non-positional arguments", function() {
    var errorThrown = false, result = "";
    try {
      result = fmt("{1}, {}", "hej", "hello");      
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true, 'result is: "' + result + '"');
  });
  
  it("should throw and error when exhausting format codes", function() {
    var errorThrown = false, result = "";
    try {
      result = fmt("{}{}{}", "hej");      
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true, 'result is: "' + result + '"');
  });

  it("should throw and error when there are too few format codes", function() {
    var errorThrown = false, res = "";
    try {
      res = fmt("{}", "a", "b", "c");
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true, "Result is: " + res);
  });

  it("should throw and error when there are too few arguments", function() {
    var errorThrown = false, res = "";
    try {
      res = fmt("{} {}", "a");
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true, "Result is: " + res);
  });
  
  
  
  it("should convert to hex correctly", function() {
    expect(fmt("{:x}", 16)).toEqual("10");
    expect(fmt("{:x}", 10)).toEqual("a");
    expect(fmt("{:X}", 10)).toEqual("A");
    expect(fmt("{:4X}", 255)).toEqual("  FF");
    expect(fmt("{:04X}", 255)).toEqual("00FF");
    expect(fmt("{: 5X}", 255)).toEqual("   FF");
    expect(fmt("{:+5x}", 254)).toEqual("  +fe");
    expect(fmt("{:5x}", -254)).toEqual("  -fe");
    expect(fmt("{:+2x}", 65535)).toEqual("+ffff");
  });  



  it("should throw an error when trying to put + in front of a negative number", function() {
    var errorThrown = false;
    try {
      fmt("{:+5x}", -254);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });

  it("should throw when the hex format code is wrong", function() {
    var errorThrown = false;
    try {
      fmt("{:x5x}", 4);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });
  
  it("should throw when the hex format code is decimal", function() {
    var errorThrown = false;
    try {
      fmt("{:x}", 15.2);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });

  it("should format to integer properly", function() {
    expect(fmt("{:d}", 16)).toEqual("16");
    expect(fmt("{:4d}", 255)).toEqual(" 255");
    expect(fmt("{:04d}", 3)).toEqual("0003");
    expect(fmt("{: 5d}", 255)).toEqual("  255");
    expect(fmt("{:05d}", 12)).toEqual("00012");
    expect(fmt("{:+5d}", 254)).toEqual(" +254");
    expect(fmt("{:+2d}", 65535)).toEqual("+65535");
  });
  
  it("should throw when the integer format code is decimal", function() {
    var errorThrown = false;
    try {
      fmt("{:n}", 15.2);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });
  
  it("should format to octal properly", function() {
    expect(fmt("{:o}", 16)).toEqual("20");
    expect(fmt("{:4o}", 255)).toEqual(" 377");
    expect(fmt("{:04o}", 3)).toEqual("0003");
  });
  
  it("should format to binary properly", function() {
    expect(fmt("{:b}", 2)).toEqual("10");
    expect(fmt("{:b}", 255)).toEqual("11111111");
    expect(fmt("{:08b}", 3)).toEqual("00000011");
  });
  
  it("should format chars properly", function() {
    expect(fmt("{:c}", 33)).toEqual("!");
    expect(fmt("{:4c}", 33)).toEqual("   !");
  });
  
  it("should pick correct default formatters", function() {
    expect(fmt("{:5d}", 11)).toEqual("   11");
    expect(fmt("{:4}", 33)).toEqual("  33");
    expect(fmt("{:4}", "33")).toEqual("33  ");
    expect(fmt("{:5}", true)).toEqual("true ");
    expect(fmt("{:5}", false)).toEqual("false");
    expect(fmt("{:5d}", false)).toEqual("    0");
    expect(fmt("{:5d}", true)).toEqual("    1");
    expect(fmt("{:5}", 1.23)).toEqual("1.230000");
  });  

  it("should throw an error when formatting floating numbers as decimal", function() {
    var errorThrown = false;
    try {
      fmt("{:d}", 15.2);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });

  it("should format fixed point correctly", function() {
    expect(fmt("{:.2f}", 1.232)).toEqual("1.23");
    expect(fmt("{:.4f}", 1.232)).toEqual("1.2320");
    expect(fmt("{:10.4f}", 1.232)).toEqual("    1.2320");
    expect(fmt("{:+10.4f}", 1.232)).toEqual("   +1.2320");
    expect(fmt("{:10.4f}", -1.232)).toEqual("   -1.2320");
    expect(fmt("{:2.4f}", -1.232)).toEqual("-1.2320");
    expect(fmt("{:2.2f}", -1.232)).toEqual("-1.23");
    expect(fmt("{:2.2f}", 1000000000000000000000000000000)).toEqual("1e+30");
    expect(fmt("{: 1.4f}", 1.232)).toEqual(" 1.2320");
    expect(fmt("{: 1.4f}", Infinity)).toEqual("Infinity");
    expect(fmt("{: 1.4f}", NaN)).toEqual("NaN");
    expect(fmt("{: 1.4f}", 10000000000000000000000000)).toEqual("1e+25");
  });
  
  it("should catch infinity", function() {
    expect(fmt("{:d}", Infinity)).toEqual("Infinity");
    expect(fmt("{:10b}", Infinity)).toEqual("  Infinity");
  });
  
  it("should format percentage properly", function() {
    expect(fmt("{:8.1%}", 12)).toEqual(" 1200.0%");
    expect(fmt("{:%}", 0.45)).toEqual("45.000000%");
  });    
  
});
