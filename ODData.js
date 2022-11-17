/**
 * Created by yalong on 5/25/15.
 */
var ODData = (function () {
    function ODData(jsonData) {
        this.data = {};
        this.originQuantity = {};
        this.destinationQuantity = {};
        for (var i = 0; i < jsonData.length; i++) {
            var row = jsonData[i];
            var destination = row["Destinations"];
            delete row["Destinations"];
            var origins = Object.keys(row);
            for (var j = 0; j < origins.length; j++) {
                var origin = origins[j];
                var quantity = parseInt(row[origin]);
                if (quantity) {
                    //quantity = Math.sqrt(quantity);
                    //quantity = Math.log(quantity) / Math.log(2);
                    this.addEntry(origin, destination, quantity);
                }
            }
        }
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
        var oris = Object.keys(this.originQuantity);
        var deses = Object.keys(this.destinationQuantity);
        this.origins = arrayUnique(oris.concat(deses));
        this.destinations = this.origins.slice();
        var oris1 = this.origins;
        for (var i = 0; i < oris1.length; i++) {
            var ori = oris1[i];
            this.updateMinMax("Origin", this.originQuantity[ori]);
            this.updateMinMax("All", this.originQuantity[ori]);
        }
        var deses1 = this.destinations;
        for (var i = 0; i < deses1.length; i++) {
            var des = deses1[i];
            this.updateMinMax("Des", this.destinationQuantity[des]);
            this.updateMinMax("All", this.destinationQuantity[des]);
        }
    }
    ODData.prototype.updateMinMax = function (name, value) {
        if (!value) {
            value = 0;
        }
        var minPropertyName = "min" + name;
        var maxPropertyName = "max" + name;
        if (!this[minPropertyName]) {
            this[minPropertyName] = value;
        }
        else if (value < this[minPropertyName]) {
            this[minPropertyName] = value;
        }
        if (!this[maxPropertyName]) {
            this[maxPropertyName] = value;
        }
        else if (value > this[maxPropertyName]) {
            this[maxPropertyName] = value;
        }
    };
    ODData.prototype.addEntry = function (origin, destination, quantity) {
        // update the minimum & maximum value for flows
        this.updateMinMax("Flow", quantity);
        // update sum quantity for each origin
        var originTemp;
        if (origin in this.originQuantity) {
            originTemp = this.originQuantity[origin] + quantity;
        }
        else {
            originTemp = quantity;
        }
        this.originQuantity[origin] = originTemp;
        var desTemp;
        if (destination in this.destinationQuantity) {
            desTemp = this.destinationQuantity[destination] + quantity;
        }
        else {
            desTemp = quantity;
        }
        this.destinationQuantity[destination] = desTemp;
        if (!(origin in this.data)) {
            this.data[origin] = {};
        }
        this.data[origin][destination] = quantity;
    };
    ODData.prototype.query = function (origin, destination) {
        var data = this.data[origin];
        if (destination in data) {
            return data[destination];
        }
        else {
            return 0;
        }
    };
    ODData.prototype.filterTotal = function (map, tempNames, from, to) {
        var result = [];
        tempNames.forEach(function (ele, index, array) {
            var thisValue = map[ele];
            if (thisValue >= from && thisValue <= to) {
                result.push(ele);
            }
        });
        return result;
    };
    ODData.prototype.filterTotalOut = function (tempNames, from, to) {
        return this.filterTotal(this.originQuantity, tempNames, from, to);
    };
    ODData.prototype.filterTotalIn = function (tempNames, from, to) {
        return this.filterTotal(this.destinationQuantity, tempNames, from, to);
    };
    ODData.prototype.filterSingleFlow = function (tempOrigins, tempDestinations, from, to) {
        var result = [[], []];
        var filteredOrigins = result[0];
        var filteredDestinations = result[1];
        for (var i = 0; i < tempOrigins.length; i++) {
            var thisOrigin = tempOrigins[i];
            for (var j = 0; j < tempDestinations.length; j++) {
                var thisDes = tempDestinations[j];
                var thisValue = this.query(thisOrigin, thisDes);
                if (thisValue >= from && thisValue <= to) {
                    if (filteredDestinations.indexOf(thisDes) == -1) {
                        filteredDestinations.push(thisDes);
                    }
                    if (filteredOrigins.indexOf(thisOrigin) == -1) {
                        filteredOrigins.push(thisOrigin);
                    }
                }
            }
        }
        return result;
    };
    ODData.prototype.queryRegion2region = function (ors, des) {
        var amount = 0;
        for (var i = 0; i < ors.length; i++) {
            var or = ors[i];
            for (var j = 0; j < des.length; j++) {
                var de = des[j];
                amount += this.query(or, de);
            }
        }
        return amount;
    };
    return ODData;
}());
//var test = new ODData("./data/0910StatesMigration.csv", function(data: ODData){
//
//}); 
//# sourceMappingURL=ODData.js.map