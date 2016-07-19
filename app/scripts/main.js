var min = 100;
var max = 0;

var octopus = {
    workers: {},
    data: {},
    map: false,
    cluster: L.markerClusterGroup({
        showCoverageOnHover: false,
        singleMarkerMode: true,
        spiderfyDistanceMultiplier: 2,
        iconCreateFunction: function(cluster) {
            var countInjured = 0;
            var countKilled = 0;

            cluster.getAllChildMarkers().forEach(function (child) {
                countInjured = countInjured + parseInt(child._data.injured);
                countKilled = countKilled + parseInt(child._data.killed);
            });

            var total = countInjured + countKilled;

            var iconSize = 40;

            var pieSVG = octopus.createPie({
                size: iconSize,
                items: [countKilled, countInjured],
                colors: ['#ea7070', '#b80000']
            });

            var markup = pieSVG.outerHTML + '<span class="number">' + total + '</span>';

            return new L.DivIcon({
                html: markup,
                iconSize: L.point(iconSize, iconSize)
            });
        }
    }),
    groups: {},
    years: [2011, 2012, 2013, 2014, 2015, 2016],
    mapLayer: 'http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u',

    init: function () {
        octopus.initMap();
        octopus.loadMarkers();
    },

    loadMarkers: function () {
        octopus.years.forEach(function (year) {
            octopus.getYearViaWorker(year, function (data) {
                var markers = [];

                data.forEach(function (item) {
                    if (item.geo) {
                        item.marker = L
                            .marker([item.geo.lat, item.geo.lng])
                            .bindPopup(octopus.getItemMarkup(item));

                        item.marker._data = item;
                        markers.push(item.marker);
                    }
                });

                octopus.groups[year] = L.featureGroup.subGroup(octopus.cluster, markers);

                octopus.groups[year].addTo(octopus.map);
            });
        });
    },

    initMap: function () {
        octopus.map = L.map('map', {
            attributionControl: false,
            minZoom: 3,
            maxZoom: 8,
            zoomControl: false,
        }).setView([51.505, -0.09], 3);
        L.tileLayer(octopus.mapLayer).addTo(octopus.map);
        octopus.cluster.addTo(octopus.map);

        octopus.cluster.on('spiderfied', function () {
            L.DomUtil.addClass(document.body, 'has-spider-overlay');
        });

        octopus.cluster.on('unspiderfied', function () {
            L.DomUtil.removeClass(document.body, 'has-spider-overlay');
        });

        octopus.cluster.on('click', function (e) {
            e.layer._icon.style.zIndex = 10000;
            L.DomUtil.addClass(document.body, 'has-tooltip-overlay');
        });

        octopus.cluster.on('popupclose', function (e) {
            if (!L.DomUtil.hasClass(document.body, 'has-spider-overlay')) {
                e.layer._icon.style.zIndex = 0;
            }
            L.DomUtil.removeClass(document.body, 'has-tooltip-overlay');
        });
    },

    toggleYear: function (year) {
        if (octopus.groups[year]._map) {
            octopus.map.removeLayer(octopus.groups[year]);
        }
        else {
            octopus.map.addLayer(octopus.groups[year]);
        }
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
        var url = '../json/' + year + '.json';
        octopus.workers[url] = new Worker('scripts/worker.js');
        octopus.workers[url].postMessage(url);
        octopus.workers[url].onmessage = function(event) {
            octopus.data[year] = event.data;
            octopus.workers[url].terminate();

            if (typeof callback == 'function') {
                callback(octopus.data[year]);
            }
        };
    },

    createPie: function (data) {
        var total = 0;

        data.items.forEach(function (item) {
            total = total + item;
        });

        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('height', data.size);
        svg.setAttribute('width', data.size);
        svg.setAttribute('class', 'pie-chart');
        svg.style.background = data.colors[0];

        var slice = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

        var r = data.size / 3;
        var c = data.size / 2;

        slice.setAttribute('r', r);
        slice.setAttribute('cx', c);
        slice.setAttribute('cy', c);
        slice.setAttribute('class', 'pie-slice');
        slice.style.fill = data.colors[0];
        slice.style.stroke = data.colors[1];
        slice.style.strokeWidth = data.size * 21.5 * Math.PI / 100;

        var percentage = 2 * Math.PI * r / 100 * (100 / total * data.items[0]);

        slice.style.strokeDasharray = percentage + ', ' + 2 * Math.PI * r;

        svg.appendChild(slice);

        return svg;
    }
};

octopus.init();
window.octopus = octopus;

L.Map.include({
    closePopup: function (popup) {
        var that = this;
        if (!popup || popup === this._popup) {
            popup = this._popup;
            this._popup = null;
        }
        if (popup) {
            L.DomUtil.addClass(popup._container, 'is-closing');
            var transitionend = function () {
                that.removeLayer(popup);
                popup._isOpen = false;
                L.DomUtil.removeClass(popup._container, 'is-closing');
                popup._container.removeEventListener('transitionend', transitionend);
            };

            popup._container.addEventListener('transitionend', transitionend);
        }
    }
});