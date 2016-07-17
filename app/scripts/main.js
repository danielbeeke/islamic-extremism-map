var octopus = {
    workers: {},
    data: {},
    map: false,
    geoless: 0,
    cluster: L.markerClusterGroup({
        showCoverageOnHover: false,
        singleMarkerMode: true,
        spiderfyDistanceMultiplier: 2,
        iconCreateFunction: function(cluster) {
            var countInjured = 0;
            var countKilled = 0;
            var classes = [];

            cluster.getAllChildMarkers().forEach(function (child) {
                countInjured = countInjured + parseInt(child._data.injured);
                countKilled = countKilled + parseInt(child._data.killed);
            });

            var total = countInjured + countKilled;

            var markup = '<span class="number">' + total + '</span>';

            return new L.DivIcon({
                html: markup
            })
        }
    }),
    groups: {},
    years: [2011, 2012, 2013, 2014, 2015, 2016],
    mapLayer: 'http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u',

    init: function () {
        //octopus.initMap();
        //octopus.loadMarkers();

        var data = {
            size: 230,
            sectors: [
                {
                    percentage: 0.43,
                    label: 'Thing 1'
                },
                {
                    percentage: 0.22,
                    label: "Thing Two"
                },
                {
                    percentage: 0.18,
                    label: "Another Thing"
                },
                {
                    percentage: 0.17,
                    label: "Pineapple"
                }
            ]
        };

        octopus.createPie(data);
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
                    else {
                        octopus.geoless++;
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
            maxZoom: 8
        }).setView([51.505, -0.09], 3);
        L.tileLayer(octopus.mapLayer).addTo(octopus.map);
        octopus.cluster.addTo(octopus.map);
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
        var helpers = {
            calculateSectors: function (data) {
                var sectors = [];
                var colors = [
                    "#61C0BF", "#DA507A", "#BB3D49", "#DB4547"
                ];

                var l = data.size / 2;
                var a = 0; // Angle
                var aRad = 0; // Angle in Rad
                var z = 0; // Size z
                var x = 0; // Side x
                var y = 0; // Side y
                var X = 0; // SVG X coordinate
                var Y = 0; // SVG Y coordinate
                var R = 0; // Rotation

                var aCalc, arcSweep;

                data.sectors.map( function(item, key ) {
                    a = 360 * item.percentage;
                    aCalc = ( a > 180 ) ? 360 - a : a;
                    aRad = aCalc * Math.PI / 180;
                    z = Math.sqrt( 2*l*l - ( 2*l*l*Math.cos(aRad) ) );
                    if( aCalc <= 90 ) {
                        x = l*Math.sin(aRad);
                    }
                    else {
                        x = l*Math.sin((180 - aCalc) * Math.PI/180 );
                    }

                    y = Math.sqrt( z*z - x*x );
                    Y = y;

                    if( a <= 180 ) {
                        X = l + x;
                        arcSweep = 0;
                    }
                    else {
                        X = l - x;
                        arcSweep = 1;
                    }

                    sectors.push({
                        percentage: item.percentage,
                        label: item.label,
                        color: colors[key],
                        arcSweep: arcSweep,
                        L: l,
                        X: X,
                        Y: Y,
                        R: R
                    });

                    R = R + a;
                });

                return sectors
            },
            createSvg: function (data) {
                var sectors = helpers.calculateSectors(data);
                var newSVG = document.createElementNS( "http://www.w3.org/2000/svg","svg" );
                newSVG.setAttributeNS(null, 'style', "width: " + data.size + "px; height: " + data.size + "px");

                sectors.map( function(sector) {
                    var newSector = document.createElementNS( "http://www.w3.org/2000/svg","path" );
                    newSector.setAttributeNS(null, 'fill', sector.color);
                    newSector.setAttributeNS(null, 'd', 'M' + sector.L + ',' + sector.L + ' L' + sector.L + ',0 A' + sector.L + ',' + sector.L + ' 0 ' + sector.arcSweep + ',1 ' + sector.X + ', ' + sector.Y + ' z');
                    newSector.setAttributeNS(null, 'transform', 'rotate(' + sector.R + ', '+ sector.L+', '+ sector.L+')');

                    newSVG.appendChild(newSector);
                });

                var midCircle = document.createElementNS( "http://www.w3.org/2000/svg","circle" );
                midCircle.setAttributeNS(null, 'cx', data.size * 0.5 );
                midCircle.setAttributeNS(null, 'cy', data.size * 0.5);
                midCircle.setAttributeNS(null, 'r', data.size * 0.28 );
                midCircle.setAttributeNS(null, 'fill', '#42495B' );

                newSVG.appendChild(midCircle);

                return newSVG;
            }
        };

        var svg = helpers.createSvg(data);

        console.log(svg);
    }
};

octopus.init();
window.octopus = octopus;
