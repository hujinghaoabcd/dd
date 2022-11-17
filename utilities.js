/**
 * Created by yalong on 15/12/2015.
 */
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};
var addToArray = function (data, base) {
    for (var i = 0; i < data.length; i++) {
        var tempData = data[i];
        if (base.indexOf(tempData) == -1) {
            base.push(tempData);
        }
    }
};
var addToArrayRemoveIfExist = function (data, base) {
    var exist = [];
    for (var i = 0; i < data.length; i++) {
        var tempData = data[i];
        var p = base.indexOf(tempData);
        if (p == -1) {
            base.push(tempData);
        }
        else {
            exist.push(tempData);
            base.splice(p, 1);
        }
    }
    return exist;
};
var removeFromArray = function (data, base) {
    for (var i = 0; i < data.length; i++) {
        var tempData = data[i];
        var p = base.indexOf(tempData);
        if (p != -1) {
            base.splice(p, 1);
        }
    }
};
// & operator for css selector
var multiClassString = function (classes) {
    var tempString = "";
    for (var i = 0; i < classes.length; i++) {
        tempString += ".";
        tempString += classes[i];
    }
    return tempString;
};
var filterClassString = function (classes) {
    var tempString = "*";
    for (var i = 0; i < classes.length; i++) {
        tempString += (":not(." + classes[i] + ")");
    }
    return tempString;
};
var changeClasses = function (svgContainer, selectorString, trueClasses, falseClasses) {
    var selects = svgContainer.selectAll(selectorString);
    for (var i = 0; i < trueClasses.length; i++) {
        selects.classed(trueClasses[i], true);
    }
    for (var i = 0; i < falseClasses.length; i++) {
        selects.classed(falseClasses[i], false);
    }
};
function arrayUnique(array) {
    var a = array.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
}
function calcDistance(x1, y1, x2, y2) {
    var temp1 = x1 - x2;
    var temp2 = y1 - y2;
    return Math.sqrt(temp1 * temp1 + temp2 * temp2);
}
function shortenLine(x1, y1, x2, y2, start, end) {
    var length = calcDistance(x1, y1, x2, y2);
    if (length <= (start + end)) {
        return [x1, y1, x2, y2];
    }
    var sinV = (x2 - x1) / length;
    var cosV = (y2 - y1) / length;
    x1 += (start * sinV);
    y1 += (start * cosV);
    x2 -= (end * sinV);
    y2 -= (end * cosV);
    return [x1, y1, x2, y2];
}
//# sourceMappingURL=utilities.js.map