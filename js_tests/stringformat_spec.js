describe("_fmt", function() {

  beforeEach(function() {
  });

  it("should format simple arguments correctly", function() {
    expect(_fmt("Hello, {}!", "world")).toEqual("Hello, world!");
    expect(_fmt("Hello, {} {} {}!", "to", "the", "world")).toEqual("Hello, to the world!");
  });
  
  it("should format numbered arguments correctly", function() {
    expect(_fmt("Hello, {0}!", "world")).toEqual("Hello, world!");
    expect(_fmt("Sommartider, {0}, {0}, sommartider!", "hej")).toEqual("Sommartider, hej, hej, sommartider!");
    expect(_fmt("Sommartider, {1}, {0}, sommartider!", "da", "hej")).toEqual("Sommartider, hej, da, sommartider!");
  });

  
  it("should format complex arguments correctly", function() {
    expect(_fmt("Hello, {0:}!", "world")).toEqual("Hello, world!");
    expect(_fmt("Hello, {0:} {0:s}!", "hej")).toEqual("Hello, hej hej!");
    expect(_fmt("Hello, {:}!", "world")).toEqual("Hello, world!");
    expect(_fmt("Hello, {:s}!", "world")).toEqual("Hello, world!");
    // Wideness
    expect(_fmt("'{0:6s}'", "hej")).toEqual("'hej   '");
    expect(_fmt("'{0:2s}'", "hej")).toEqual("'hej'");
    // Numbers to string, with wideness
    expect(_fmt("'{:6s}'", "123")).toEqual("'123   '");
    expect(_fmt("'{0:6s}'", "123")).toEqual("'123   '");
    expect(_fmt("'{0:6s}','{0:4s}'", "123")).toEqual("'123   ','123 '");
  });

  it("should throw and error when exhausting format codes", function() {
    var errorThrown = false, result = "";
    try {
      result = _fmt("{}{}{}", "hej");      
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true, 'result is: "' + result + '"');
  });

  it("should throw and error when there are too few format codes", function() {
    var errorThrown = false;
    try {
      _fmt("{}", "a", "b", "c");
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });
  
  it("should convert to hex correctly", function() {
    expect(_fmt("{:x}", 16)).toEqual("10");
    expect(_fmt("{:x}", 10)).toEqual("a");
    expect(_fmt("{:X}", 10)).toEqual("A");
    expect(_fmt("{:4X}", 255)).toEqual("  FF");
    expect(_fmt("{:04X}", 255)).toEqual("00FF");
    expect(_fmt("{: 5X}", 255)).toEqual("   FF");
    expect(_fmt("{:+5x}", 254)).toEqual("  +fe");
    expect(_fmt("{:5x}", -254)).toEqual("  -fe");
    expect(_fmt("{:+2x}", 65535)).toEqual("+ffff");
  });  



  it("should throw an error when trying to put + in front of a negative number", function() {
    var errorThrown = false;
    try {
      _fmt("{:+5x}", -254);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });

  it("should throw when the hex format code is wrong", function() {
    var errorThrown = false;
    try {
      _fmt("{:x5x}", 4);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });
  
  it("should throw when the hex format code is decimal", function() {
    var errorThrown = false;
    try {
      _fmt("{:x}", 15.2);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });

  it("should format to integer properly", function() {
    expect(_fmt("{:d}", 16)).toEqual("16");
    expect(_fmt("{:4d}", 255)).toEqual(" 255");
    expect(_fmt("{:04d}", 3)).toEqual("0003");
    expect(_fmt("{: 5d}", 255)).toEqual("  255");
    expect(_fmt("{:+5d}", 254)).toEqual(" +254");
    expect(_fmt("{:+2d}", 65535)).toEqual("+65535");
  });
  
  it("should throw when the integer format code is decimal", function() {
    var errorThrown = false;
    try {
      _fmt("{:n}", 15.2);
    } catch(e) {
      errorThrown = true;
    }
    expect(errorThrown).toBe(true);
  });
  
  it("should format to octal properly", function() {
    expect(_fmt("{:o}", 16)).toEqual("20");
    expect(_fmt("{:4o}", 255)).toEqual(" 377");
    expect(_fmt("{:04o}", 3)).toEqual("0003");
  });
  
  it("should format to binary properly", function() {
    expect(_fmt("{:b}", 2)).toEqual("10");
    expect(_fmt("{:b}", 255)).toEqual("11111111");
    expect(_fmt("{:08b}", 3)).toEqual("00000011");
  });
  
  
});
