var octopus1 = {
    workers: {},
    data: {},
    filters: {
        date: {

        }
    },
    filterTimeout: false,
    map: false,
    cluster: L.markerClusterGroup({
        showCoverageOnHover: false,
        //chunkedLoading: true,
        //chunkProgress: updateProgressBar,
        singleMarkerMode: true,
        spiderfyDistanceMultiplier: 2,
        maxClusterRadius: 95,
        iconCreateFunction: function(cluster) {
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
    //years: [2010],
    mapLayer: 'http://tilemill.studiofonkel.nl/style/{z}/{x}/{y}.png?id=tmstyle:///home/administrator/styles/terror-map.tm2&iqp86m8u',

    init: function () {
        //octopus.initMap();
        //octopus.loadMarkers();
    },

    loadMarkers: function () {
        var functions = [];
        var markers = [];

        octopus.years.forEach(function (year) {
            functions.push(function (callback) {
                octopus.getYearViaWorker(year, function (data) {

                    data.forEach(function (item) {
                        if (item.geo) {
                            item.marker = L
                                .marker([item.geo.lat, item.geo.lng])
                                .bindPopup(octopus.getItemMarkup(item));

                            item.marker._data = item;
                            markers.push(item.marker);
                        }
                    });

                    callback(null);
                });
            })
        });

        async.parallel(functions,
            function(err, results) {
                octopus.cluster.addLayers(markers);
                octopus.renderChart();
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
            L.DomUtil.removeClass(document.body, 'has-tooltip-overlay');
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

        octopus.map.on('moveend', function () {
            octopus.renderChart();
        });
    },

    getGraphData: function () {
        var dataItemsObject = {};
        var dataItemsArray = [];
        var dataInjuredObject = {};
        var dataKilledObject = {};

        octopus.map.eachLayer(function (layer) {
            if (typeof layer.getLatLng == 'function' && octopus.map.getBounds().contains(layer.getLatLng())) {
                var doForItem = function (object) {
                    if (!dataItemsObject[Date.parse(object._data.date)]) {
                        dataItemsObject[Date.parse(object._data.date)] = 1;

                        dataInjuredObject[Date.parse(object._data.date)] = parseInt(object._data.injured);
                        dataKilledObject[Date.parse(object._data.date)] = parseInt(object._data.killed);

                        dataItemsArray.push(Date.parse(object._data.date));
                    }
                    else {
                        dataInjuredObject[Date.parse(object._data.date)] += parseInt(object._data.injured);
                        dataKilledObject[Date.parse(object._data.date)] += parseInt(object._data.killed);

                        dataItemsObject[Date.parse(object._data.date)]++;
                    }
                };

                if (typeof layer.getAllChildMarkers == 'function') {
                    layer.getAllChildMarkers().forEach(function (child) {
                        doForItem(child);
                    });
                }
                else {
                    doForItem(layer);
                }
            }
        });

        var attacksPerDay = [];
        var killedPerDay = [];
        var injuredPerDay = [];

        dataItemsArray.sort();

        dataItemsArray.forEach(function (epoch) {
            attacksPerDay.push([epoch, dataItemsObject[epoch]]);
            killedPerDay.push([epoch, dataKilledObject[epoch]]);
            injuredPerDay.push([epoch, dataInjuredObject[epoch]]);
        });

        octopus.graphData = [
            attacksPerDay,
            killedPerDay,
            injuredPerDay
        ];
    },

    filterData: function () {
        if (octopus.filterTimeout) {
            clearTimeout(octopus.filterTimeout);
        }

        octopus.filterTimeout = setTimeout(function () {
            var itemsToAdd = [];
            var itemsToRemove = [];
            var extremes = octopus.chart.xAxis[0].getExtremes();
            octopus.filters.date.start = new Date(extremes.min);
            octopus.filters.date.end = new Date(extremes.max);

            octopus.years.forEach(function (year) {
                octopus.data[year].forEach(function (item) {
                    if (item.date && item.marker) {
                        if (new Date(item.date) >= octopus.filters.date.start && new Date(item.date) <= octopus.filters.date.end) {
                            if (!octopus.cluster.hasLayer(item.marker)) {
                                itemsToAdd.push(item.marker);
                            }
                        }
                        else {
                            if (octopus.cluster.hasLayer(item.marker)) {
                                itemsToRemove.push(item.marker);
                            }
                        }
                    }
                });
            });

            octopus.cluster.addLayers(itemsToAdd);
            octopus.cluster.removeLayers(itemsToRemove);
            octopus.cluster.refreshClusters();
        }, 400);
    },

    renderChart: function () {
        octopus.getGraphData();

        if (octopus.graphData.length) {
            octopus.chart = new Highcharts.StockChart({
                credits: {
                    enabled: false
                },
                chart: {
                    zoomType: 'x',
                    renderTo : 'chart',
                    backgroundColor: 'null',
                    type: 'arearange',
                    events: {
                        redraw: function () {
                            octopus.filterData();
                        },
                        selection: function () {
                            octopus.filterData();
                        }
                    }
                },
                title: {
                    text: ''
                },
                rangeSelector : {
                    enabled: true,
                    buttons: [],
                    inputEnabled: false
                },
                navigator: {
                    margin: 20,

                },
                plotOptions: {
                    series: {
                        animation: false,
                        states: {
                            hover: {
                                enabled: false
                            }
                        }
                    },
                    column: {
                        stacking: 'normal'
                    }
                },
                legend: {
                    enabled: true,
                    useHTML: true,
                    align: 'right',
                    layout: 'horizontal',
                    verticalAlign: 'bottom',
                    y: 0,
                },
                xAxis: {
                    type: 'datetime',
                    useHTML: true,
                    labels: {
                        formatter: function() { // only output a label on the days of interest
                            if (this.isFirst || this.isLast) {
                                return Highcharts.dateFormat(this.dateTimeLabelFormat, this.value);
                            }
                        }
                    }
                },
                yAxis: [{
                    lineWidth: 1,
                    opposite: true,
                    visible: false,
                    maxPadding: 0.6
                },{
                    lineWidth: 1,
                    visible: false
                }],
                series: [{
                    type: 'spline',
                    name: 'Attacks',
                    showInLegend: false,
                    data: octopus.graphData[0],
                    yAxis: 0,
                    color: '#67b7ff',
                },{
                    type: 'column',
                    yAxis: 1,
                    name: 'Injured',
                    color: '#ea7070',
                    data: octopus.graphData[2]
                },{
                    type: 'column',
                    name: 'Killed',
                    yAxis: 1,
                    color: '#b80000',
                    data: octopus.graphData[1]
                }]
            });
        }
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

    getYearViaWorker: function(year, callback) {
        var url = '../json/' + year + '.json';
        octopus.workers[url] = new Worker('scripts/worker.data.get.js');
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