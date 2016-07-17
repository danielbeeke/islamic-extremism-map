var octopus = {
    workers: {},
    data: {},
    map: false,
    cluster: L.markerClusterGroup({
        showCoverageOnHover: false
    }),
    years: [2011, 2012, 2013],
    mapLayer: 'http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u',

    init: function () {
        octopus.initMap();

        octopus.years.forEach(function (year) {
            octopus.getYearViaWorker(year, function (data) {
                data.forEach(function (item) {
                    if (item.geo) {
                        var radius = parseInt(item.killed) + parseInt(item.injured) * 500;
                        item.marker = L
                            .circle([item.geo.lat, item.geo.lng], radius, {
                                color: 'red',
                                fillColor: '#f03',
                                fillOpacity: 0.5
                            })
                            .bindPopup(octopus.getItemMarkup(item))
                            .addTo(octopus.cluster);
                    }

                    octopus.cluster.addTo(octopus.map);
                });
            });
        });
    },

    initMap: function () {
        octopus.map = L.map('map').setView([51.505, -0.09], 3);
        L.tileLayer(octopus.mapLayer).addTo(octopus.map);
    },

    getData: function () {
        octopus.startWorker();
    },

    startWorker: function () {

    },

    getItemMarkup: function (item) {
        var output = '';

        output += '<div class="row"><label class="label">Killed:</label> <span class="value">' + item.killed + '</span></div>';
        output += '<div class="row"><label class="label">Injured:</label> <span class="value">' + item.injured + '</span></div>';
        output += '<div class="row"><label class="label">Location:</label> <span class="value">' + item.city + ', ' + item.country + '</span></div>';
        output += '<div class="row"><label class="label">Description:</label> <span class="value">' + item.description + '</span></div>';

        return output;
    },

    getYearViaWorker: function(year, callback) {
        var url = '/json/' + year + '.json';
        octopus.workers[url] = new Worker('scripts/worker.js');
        octopus.workers[url].postMessage(url);
        octopus.workers[url].onmessage = function(event) {
            octopus.data[year] = event.data;
            octopus.workers[url].terminate();

            if (typeof callback == 'function') {
                callback(octopus.data[year]);
            }
        };
    }
};

$(function() {
    octopus.init();
});