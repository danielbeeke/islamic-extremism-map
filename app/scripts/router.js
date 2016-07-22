octopus.router = {
    init: function () {
        octopus.map._hash.formatHash = function(map) {

            var center = map.getCenter(),
                zoom = map.getZoom(),
                precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2)),
                start, end;

            if (octopus.graph._graph) {
                var extremes = octopus.graph._graph.xAxis[0].getExtremes();
                var startDate = new Date(extremes.userMin);
                var endDate = new Date(extremes.userMax);

                start = formatDate(startDate);
                end = formatDate(endDate);
            }
            else {
                start = '2011-01-01';
                end = formatDate(new Date());
            }

            return "#" + [zoom,
                    center.lat.toFixed(precision),
                    center.lng.toFixed(precision),
                    start,
                    end
                ].join("/");
        };

        octopus.map._hash.parseHash = function(hash) {
            if(hash.indexOf('#') === 0) {
                hash = hash.substr(1);
            }
            var args = hash.split("/");
            if (args.length == 5) {
                var zoom = parseInt(args[0], 10),
                    lat = parseFloat(args[1]),
                    lon = parseFloat(args[2]),
                    start = args[3],
                    end = args[4];

                console.log(start, end)

                if (isNaN(zoom) || isNaN(lat) || isNaN(lon) || isNaN(start) || isNaN(end)) {
                    return false;
                } else {
                    return {
                        center: new L.LatLng(lat, lon),
                        zoom: zoom,
                        start: start,
                        end: end
                    };
                }
            } else {
                return false;
            }
        };

        octopus.map._hash.update = function() {
            var hash = location.hash;
            if (hash === this.lastHash) {
                return;
            }
            var parsed = this.parseHash(hash);
            if (parsed) {
                this.movingMap = true;

                this.map.setView(parsed.center, parsed.zoom);

                if (octopus.graph._graph) {
                    octopus.graph._graph.xAxis[0].setExtremes(parsed.start, parsed.end);
                }

                this.movingMap = false;
            } else {
                this.onMapMove(this.map);
            }
        };
    }
};
