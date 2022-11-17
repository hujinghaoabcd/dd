/**
 * Created by yalong on 6/24/15.
 */
var DATA_URL = "./data/flow/";
var GEO_DATA_URL = "./data/GeoData/";
var projectocDict = {
    us: function () {
        return d3.geo.albersUsa();
    },
    uk: function () {
        return d3.geo.albers()
            .rotate([0, 0])
            .center([-3.276, 54.702]);
    },
    switzerland: function () {
        return d3.geo.albers()
            .rotate([0, 0])
            .center([8.3, 46.8]);
    },
    au: function () {
        return d3.geo.mercator()
            .center([133.775, -25.274]);
    },
    china: function () {
        return d3.geo.mercator()
            .center([104.195, 35.861]);
    },
    nz: function () {
        return d3.geo.mercator()
            .center([174.885, -40.900]);
    },
    ireland: function () {
        return d3.geo.mercator()
            .center([-8.243, 53.412]);
    },
    eu: function () {
        return d3.geo.mercator()
            .center([10.264, 60.202]);
    },
    world: function () {
        return d3.geo.mercator()
            .center([10.264, 30.202]);
    },
    ca: function () {
        return d3.geo.albers()
            .center([-10.34, 60.130]);
    },
    de: function () {
        return d3.geo.albers()
            .center([14, 51.7])
            .rotate([3, 0])
            .parallels([20, 50]);
    }
};
//# sourceMappingURL=commonData.js.map