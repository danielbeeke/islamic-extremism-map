window.octopus = window.octopus ? window.octopus : {};

octopus.years = [2011, 2012, 2013, 2014, 2015, 2016];
//octopus.years = [2010];

octopus.getFilters = function () {
    var hashFilters = octopus.router.parseHash(window.location.hash);

    var types = [];
    if (hashFilters.killed) { types.push('killed'); }
    if (hashFilters.injured) { types.push('injured'); }

    var bounds;
    if (hashFilters.center && hashFilters.zoom) {
        bounds = octopus.map.calculateBoundsByCenterAndZoom(hashFilters.center, hashFilters.zoom);
    }

    var start, end;
    if (octopus.graph._graph) {
        var extremes = octopus.graph._graph.xAxis[0].getExtremes();
        var startValue = extremes.userMin ? extremes.userMin : extremes.dataMin;
        start = new Date(startValue);
        var endValue = extremes.userMax ? extremes.userMax : extremes.dataMax;
        end = new Date(endValue);
    }
    else {
        start = hashFilters.start ? Date.parse(hashFilters.start) : null;
        end = hashFilters.end ? Date.parse(hashFilters.end) : null;

    }

    octopus.filters = {
        minDate: start,
        maxDate: end,
        types: types,
        bounds: bounds ? bounds : null,
        center: hashFilters.center ? hashFilters.center : null,
        zoom: hashFilters.zoom ? hashFilters.zoom : null
    };

    return octopus.filters;
};

octopus.init = function () {
    var filters = octopus.getFilters();
    async.series([
        function (callback) {
            octopus.renderGraph(filters, callback);
        },

        function (callback) {
            octopus.renderMap(filters, callback);
        }
    ], function () {
        octopus.router.init();

        var zoom = filters.zoom ? filters.zoom : 6;

        var query = 'SELECT count(cartodb_id), ' +
            'SUM(killed) as killed, ' +
            'SUM(injured) as injured, ' +
            'ST_X(st_centroid(ST_GeomFromGeoHash(substr(ST_GeoHash(the_geom), 0, ' + zoom + ')))) as lon, ' +
            'ST_Y(st_centroid(ST_GeomFromGeoHash(substr(ST_GeoHash(the_geom), 0, ' + zoom + ')))) as lat ' +
            'FROM islamic_extremism ' +
            'GROUP BY substr(ST_GeoHash(the_geom), 0, ' + zoom + ') ';

        if (filters.bounds) {
            var viewport = filters.bounds.toBBoxString();
            query += 'WHERE ST_Contains(ST_MakeEnvelope(' + viewport + ', 4326), the_geom)';
        }

        var url = 'http://danielbeeke.carto.com/api/v2/sql?q=' + query;

        console.log(url)
    });
};

octopus.renderGraph = function (filters, callback) {
    var graphFilters = extend(filters);
    if (graphFilters.minDate) { delete graphFilters.minDate; }
    if (graphFilters.maxDate) { delete graphFilters.maxDate; }

    octopus.data.getFiltered(function (filteredData) {
        octopus.graph.render(filteredData, function () {
            if (typeof callback == 'function') {
                callback(null);
            }
        }, filters);
    }, graphFilters);
};

octopus.renderMap = function (filters, callback) {
    var mapFilters = extend(filters);
    if (mapFilters.bounds) { delete mapFilters.bounds; }

    octopus.data.getFiltered(function (filteredData) {
        octopus.map.render(filteredData, function () {
            if (typeof callback == 'function') {
                callback(null);
            }
        });
    }, mapFilters);
};

octopus.init();
