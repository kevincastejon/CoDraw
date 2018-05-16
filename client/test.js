var hexColor = "#000000";
var decColor = hexToDecimalColor(hexColor);
var reHexColor = decimalToHexColor(decColor);
console.log(hexColor,decColor,reHexColor);
function hexToDecimalColor(string){
  return(parseInt(string.substring(1),16));
}
function   decimalToHexColor(number) {
    var intnumber = number - 0;
    var red, green, blue;
    var template = "#000000";
    red = (intnumber & 0x0000ff) << 16;
    green = intnumber & 0x00ff00;
    blue = (intnumber & 0xff0000) >>> 16;
    var HTMLcolor = intnumber.toString(16);
    HTMLcolor = template.substring(0, 7 - HTMLcolor.length) + HTMLcolor;
    return HTMLcolor;
  }
