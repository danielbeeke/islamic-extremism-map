window.octopus = window.octopus ? window.octopus : {};

octopus.years = [2011, 2012, 2013, 2014, 2015, 2016];
//octopus.years = [2010];

octopus.init = function () {
    var hashFilters = octopus.router.parseHash(window.location.hash);

    var types = [];
    if (hashFilters.killed) { types.push('killed'); }
    if (hashFilters.injured) { types.push('injured'); }

    var bounds;
    if (hashFilters.center && hashFilters.zoom) {
        bounds = octopus.map.calculateBoundsByCenterAndZoom(hashFilters.center, hashFilters.zoom);
    }

    var filters = {
        minDate: hashFilters.start ? Date.parse(hashFilters.start) : null,
        maxDate: hashFilters.end ? Date.parse(hashFilters.end) : null,
        types: types,
        bounds: bounds ? bounds : null
    };

    async.series([
        function (callback) {
            var graphFilters = extend(filters);
            if (graphFilters.minDate) { delete graphFilters.minDate; }
            if (graphFilters.maxDate) { delete graphFilters.maxDate; }

            console.log(graphFilters)

            octopus.data.getFiltered(function (filteredData) {
                octopus.graph.render(filteredData, function () {
                    callback(null);
                });
            }, graphFilters);
        }, function (callback) {
            var mapFilters = extend(filters);
            if (mapFilters.bounds) { delete mapFilters.bounds; }

            octopus.data.getFiltered(function (filteredData) {
                octopus.map.render(filteredData, function () {
                    callback(null);
                });
            }, mapFilters);
        }
    ], function () {
        octopus.router.init();
    });
};

octopus.update = function () {
};

octopus.init();