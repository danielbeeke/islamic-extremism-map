octopus.router = {
    parseHash: function(hash) {
        if (hash.indexOf('#') === 0) {
            hash = hash.substr(1);
        }
        var args = hash.split("/");

        if (args.length == 7) {
            var zoom = parseInt(args[0], 10),
                lat = parseFloat(args[1]),
                lon = parseFloat(args[2]),
                start = args[3],
                end = args[4],
                killed = args[5],
                injured = args[6];

            if (isNaN(zoom) || isNaN(lat) || isNaN(lon) || !Date.parse(start) || !Date.parse(end) || isNaN(killed) || isNaN(injured)) {
                return false;
            } else {
                return {
                    center: new L.LatLng(lat, lon),
                    zoom: zoom,
                    start: start,
                    end: end,
                    killed: killed,
                    injured: injured
                };
            }
        } else {
            return false;
        }
    },

    formatHash: function(map) {
        var center = map.getCenter(),
            zoom = map.getZoom(),
            precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2)),
            start, end;

        var extremes = octopus.graph._graph.xAxis[0].getExtremes();
        var startValue = extremes.userMin ? extremes.userMin : extremes.dataMin;
        var startDate = new Date(startValue);
        var endValue = extremes.userMax ? extremes.userMax : extremes.dataMax;
        var endDate = new Date(endValue);

        start = formatDate(startDate);
        end = formatDate(endDate);
        var killed = octopus.graph._graph.series[1].visible | 0;
        var injured = octopus.graph._graph.series[2].visible | 0;

        return "#" + [zoom,
                center.lat.toFixed(precision),
                center.lng.toFixed(precision),
                start,
                end,
                killed,
                injured
            ].join("/");
    },

    update: function() {
        var hash = location.hash;
        if (hash === this.lastHash) {
            return;
        }
        var parsed = this.parseHash(hash);
        if (parsed) {
            this.movingMap = true;

            this.map.setView(parsed.center, parsed.zoom);

            var startDate = new Date(parsed.start);
            var endDate = new Date(parsed.end);

            octopus.graph._graph.xAxis[0].setExtremes(
                Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
                Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
            );

            this.movingMap = false;
        } else {
            this.onMapMove(this.map);
        }
    },

    init: function () {
        octopus.map._hash = new L.Hash(octopus.map._map);
        octopus.map._hash.parseHash = octopus.router.parseHash;
        octopus.map._hash.formatHash = octopus.router.formatHash;
        octopus.map._hash.update = octopus.router.update;
    }
};
