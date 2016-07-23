window.octopus = window.octopus ? window.octopus : {};

octopus.map = {
    _tiles: 'http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u',
    _mapSettings: {
        attributionControl: false,
        minZoom: 3,
        maxZoom: 8,
        zoomControl: false
    },
    _clusterSettings: {
        showCoverageOnHover: false,
        singleMarkerMode: true,
        spiderfyDistanceMultiplier: 2,
        maxClusterRadius: 95,
        iconCreateFunction: function (cluster) {
            return octopus.map._markerIconCallback(cluster);
        }
    },

    _markerIconCallback: function (cluster) {
        var countInjured = 0;
        var countKilled = 0;

        cluster.getAllChildMarkers().forEach(function (child) {
            countInjured = countInjured + parseInt(child._data.injured);
            countKilled = countKilled + parseInt(child._data.killed);
        });

        var total = countInjured + countKilled;

        var iconSize = 20;

        if (total < 11) {
            iconSize = 30;
        }
        else if (total > 10 && total < 101) {
            iconSize = 40;
        }
        else if (total > 100 && total < 1001) {
            iconSize = 50;
        }
        else if (total > 1000 && total < 10001) {
            iconSize = 60;
        }
        else if (total > 10000 && total < 100001) {
            iconSize = 70;
        }
        else {
            iconSize = 90;
        }

        var pieSVG = octopus.pie.create({
            size: iconSize,
            items: [countKilled, countInjured],
            colors: ['#ea7070', '#b80000']
        });

        var markup = pieSVG.outerHTML + '<span class="number">' + total + '</span>';

        return new L.DivIcon({
            html: markup,
            iconSize: L.point(iconSize, iconSize)
        });
    },

    _getItemMarkup: function (item) {
        var output = '';
        output += '<p>' + item.description + '</p>';
        if (item.injured > 0) {
            output += '<div class="injured">' + item.injured + ' injured</div>';
        }

        if (item.killed > 0) {
            output += '<div class="killed">' + item.killed + ' killed</div>';
        }

        output += '<div class="date">' + item.date + '</div>';

        return output;
    },

    init: function (callback) {
        octopus.map._map = L.map('map', octopus.map._mapSettings).setView([51.505, -0.09], 3);
        L.tileLayer(octopus.map._tiles).addTo(octopus.map._map);
        octopus.map._cluster = L.markerClusterGroup(octopus.map._clusterSettings);
        octopus.map._cluster.addTo(octopus.map._map);

        if (typeof callback == 'function') {
            callback();
        }
    },

    render: function (data, callback) {
        var continueRender = function () {
            var markers = [];

            data.forEach(function (item) {
                if (item.geo && item.geo.lat) {
                    item._marker = L.marker([item.geo.lat, item.geo.lng])
                        .bindPopup(octopus.map._getItemMarkup(item));
                    item._marker._data = item;
                    markers.push(item._marker);
                }
            });

            octopus.map._cluster.addLayers(markers);

            if (typeof callback == 'function') {
                callback();
            }
        };

        if (!octopus.map._map) {
            octopus.map.init(function () {
                continueRender();
            });
        }
        else {
            octopus.map._cluster.clearLayers();
            continueRender();
        }
    },

};

