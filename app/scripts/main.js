var octopus = {
    workers: {},
    data: {},
    map: false,

    init: function () {
        octopus.initMap();

        octopus.getYearViaWorker(2011, function (data) {
            data.forEach(function (item) {
                if (item.geo) {
                    var radius = parseInt(item.killed) + parseInt(item.injured) * 100;
                    item.marker = L
                    .circle([item.geo.lat, item.geo.lng], radius, {
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.5
                    })
                    .bindPopup(octopus.getItemMarkup(item))
                    .addTo(octopus.map);
                }
                else {
                    console.log(item)
                }
            });
        });
    },

    initMap: function () {
        octopus.map = L.map('map').setView([51.505, -0.09], 3);
        L.tileLayer('http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u').addTo(octopus.map);
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