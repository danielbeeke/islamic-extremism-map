window.octopus = window.octopus ? window.octopus : {};

octopus.map = {
    _oldZoom: 0,
    _tiles: 'http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u',
    _mapSettings: {
        attributionControl: false,
        minZoom: 3,
        maxZoom: 16,
        zoomControl: false,
        worldCopyJump: true
    },
    _clusterSettings: {
        showCoverageOnHover: false,
        singleMarkerMode: true,
        spiderfyDistanceMultiplier: 2,
        maxClusterRadius: 95,
        animate: false,
        iconCreateFunction: function (cluster) {
            return octopus.map._markerIconCallback(cluster);
        }
    },

    calculateBoundsByCenterAndZoom: function (center, zoom) {
        var tempMap = L.map('tempmap', {
            worldCopyJump: true // http://stackoverflow.com/questions/18063278/leaflet-getbounds-returning-longitudes-greater-than-180
        });

        tempMap.setView(center, zoom, { animate: false });

        tempMap.getSize = function () {
            return new L.Point(window.innerWidth, window.innerHeight - 300);
        };

        var bounds = tempMap.getBounds();

        tempMap.remove();

        return bounds;
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
        output += '<div class="city-country">' + item.city + ', ' + item.country + '</div>';

        return output;
    },

    init: function (callback) {
        octopus.map._map = L.map('map', octopus.map._mapSettings).setView([51.505, -0.09], 13);
        octopus.map._hash = new L.Hash(octopus.map._map);
        L.tileLayer(octopus.map._tiles).addTo(octopus.map._map);

        octopus.map._cluster = L.markerClusterGroup(octopus.map._clusterSettings);
        octopus.map._cluster.addTo(octopus.map._map);

        octopus.map._map.on('moveend', debounce(function () {
            octopus.map._getId++;

            var filters = octopus.data.filters();
            octopus.data.get(filters, function (data) {
                octopus.map.render(data, false, octopus.map._getId);
            });
        }, 100));

        octopus.map._map.on('loaded', function () {
            if (typeof callback == 'function') {
                callback();
            }
        });
    },

    _getId: 1,
    render: function (data, callback, getId) {
        var markers = [];

        data.rows.forEach(function (item) {
            if (item.lat) {
                item._marker = L.marker([item.lat, item.lng])
                    .bindPopup(octopus.map._getItemMarkup(item));
                item._marker._data = item;
                markers.push(item._marker);
            }
        });

        if (getId == octopus.map._getId) {
            octopus.map._cluster.clearLayers();
            octopus.map._cluster.addLayers(markers);

            if (typeof callback == 'function') {
                callback();
            }
        }
    }
};

