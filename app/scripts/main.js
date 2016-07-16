var octopus = {
    workers: {},
    data: {},

    init: function () {
        octopus.initMap();

        octopus.getYearViaWorker(2011);
    },

    initMap: function () {
        var map = L.map('map').setView([51.505, -0.09], 13);
        L.tileLayer('http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u').addTo(map);
    },

    getData: function () {
        octopus.startWorker();
    },

    startWorker: function () {

    },

    getYearViaWorker: function(year) {
        var url = '/json/' + year + '.json';
        octopus.workers[url] = new Worker('scripts/worker.js');
        octopus.workers[url].postMessage(url);
        octopus.workers[url].onmessage = function(event) {
            octopus.data[year] = event.data;
            octopus.workers[url].terminate();
        };
    }
};

$(function() {
    octopus.init();
    console.log(octopus)
});