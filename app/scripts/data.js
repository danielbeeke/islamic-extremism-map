window.octopus = window.octopus ? window.octopus : {};

octopus.data = {
    get: function (filters, callback) {
        var query;

        if (filters.zoom > 10) {
            query = 'SELECT *, ' +
                'ST_X(the_geom) as lng, ' +
                'ST_Y(the_geom) as lat ' +
                'FROM islamic_extremism ';
        }
        else {
            query = 'SELECT count(cartodb_id), ' +
                'SUM(killed) as killed, ' +
                'SUM(injured) as injured, ' +
                'ST_X(st_centroid(ST_GeomFromGeoHash(substr(ST_GeoHash(the_geom), 0, ' + filters.zoom + ')))) as lng, ' +
                'ST_Y(st_centroid(ST_GeomFromGeoHash(substr(ST_GeoHash(the_geom), 0, ' + filters.zoom + ')))) as lat ' +
                'FROM islamic_extremism ';
        }

        if (filters.bounds) {
            var viewport = filters.bounds.toBBoxString();
            query += 'WHERE ST_Contains(ST_MakeEnvelope(' + viewport + ', 4326), the_geom)';
        }


        if (filters.zoom > 10) {

        }
        else {
            query += 'GROUP BY substr(ST_GeoHash(the_geom), 0, ' + filters.zoom + ') ';
        }

        var url = 'http://danielbeeke.carto.com/api/v2/sql?q=' + query;

        ajax(url, function (data) {
            if (typeof callback == 'function') {
                callback(data);
            }
        })
    },

    filters: function () {
        return {
            zoom: octopus.map._map.getZoom(),
            bounds: octopus.map._map.getBounds()
        }
    }

};