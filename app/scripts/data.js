window.octopus = window.octopus ? window.octopus : {};

octopus.data = {
    _data: [],
    download: function (callback) {
        var functions = [];

        octopus.years.forEach(function (year) {
            functions.push(function (callback) {
                var url = '../json/' + year + '.json';
                var worker = new Worker('scripts/worker.data.get.js');

                worker.postMessage(url);
                worker.onmessage = function(event) {
                    worker.terminate();
                    octopus.data._data = octopus.data._data.concat(event.data);
                    callback(null);
                };
            })
        });

        async.parallel(functions,
        function(err, results) {
            if (!err && typeof callback == 'function') {
                callback();
            }

            if (err) {
                console.error('Something happened while downloading the data.');
            }
        });
    },

    get: function (callback) {
        if (!octopus.data._data.length) {
            octopus.data.download(function () {
                if (typeof callback == 'function') {
                    callback(octopus.data._data);
                }
            });
        }
        else if (typeof callback == 'function') {
            callback(octopus.data._data);
        }
    },

    getFiltered: function (callback, minDate, maxDate, types, bounds) {
        var filteredData = [];

        octopus.data.get(function (data) {
            data.forEach(function (item) {
                var itemShouldBeIncluded = true;
                if ((minDate || maxDate) && !octopus.data._survivedFilterByDates(item, minDate, maxDate)) {
                    itemShouldBeIncluded = false;
                }

                if (types && types.constructor === Array && types.length && !octopus.data._survivedFilterByTypes(item, types)) {
                    itemShouldBeIncluded = false;
                }

                if (bounds && !octopus.data._survivedFilterByBounds(item, bounds)) {
                    itemShouldBeIncluded = false;
                }

                if (itemShouldBeIncluded) {
                    filteredData.push(item);
                }
            });

            if (typeof callback == 'function') {
                callback(filteredData);
            }
        });
    },

    _survivedFilterByBounds: function (item, bounds) {
        if (item.geo.lat && item.geo.lng) {
            return bounds.contains(L.latLng(item.geo.lat, item.geo.lng));
        }
    },

    _survivedFilterByTypes: function (item, types) {
        var hasOneOfTheTypes = false;
        types.forEach(function (type) {
            if (item[type]) {
                hasOneOfTheTypes = true;
            }
        });

        return hasOneOfTheTypes;
    },

    _survivedFilterByDates: function (item, minDate, maxDate) {
        var isValid = true;

        if (minDate > Date.parse(item.date)) {
            isValid = false;
        }

        if (maxDate < Date.parse(item.date)) {
            isValid = false;
        }

        return isValid;
    }
};