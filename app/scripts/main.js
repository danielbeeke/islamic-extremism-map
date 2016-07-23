window.octopus = window.octopus ? window.octopus : {};

octopus.years = [2011, 2012, 2013, 2014, 2015, 2016];

octopus.init = function () {
    var hashFilters = octopus.router.parseHash(window.location.hash);

    console.log(hashFilters)

    var filters = {
        //minDate: Date.parse('2011-01-01'),
        //maxDate: Date.parse('2011-08-01'),
        //types: ['killed', 'injured'],
        //bounds: bounds
    };

    async.series([
        function (callback) {
            octopus.data.getFiltered(function (filteredData) {
                octopus.graph.render(filteredData, function () {
                    callback(null);
                });
            }, filters);
        }, function (callback) {
            var mapFilters = JSON.parse(JSON.stringify(filters));
            if (mapFilters.bounds) {
                delete mapFilters.bounds;
            }

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