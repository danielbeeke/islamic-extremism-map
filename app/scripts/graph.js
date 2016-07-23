window.octopus = window.octopus ? window.octopus : {};

// TODO fix the labels in the popup to include date till date.

octopus.graph = {
    render: function (data, callback) {
        var continueRender = function () {
            var seriesObject = octopus.graph._prepare(data);

            octopus.graph._graph.series[0].setData(seriesObject['days'], true);
            octopus.graph._graph.series[1].setData(seriesObject['injured'], true);
            octopus.graph._graph.series[2].setData(seriesObject['killed'], true);

            if (typeof callback == 'function') {
                callback();
            }
        };

        if (!octopus.graph._graph) {
            octopus.graph.init(function () {
                continueRender();
            });
        }
        else {
            while (octopus.graph._graph.series.length > 0) octopus.graph._graph.series[0].remove(true);
            continueRender();
        }
    },

    _prepare: function (data) {
        var dataItemsObject = {};
        var dataItemsArray = [];
        var dataInjuredObject = {};
        var dataKilledObject = {};

        data.forEach(function (item) {
            if (!dataItemsObject[Date.parse(item.date)]) {
                dataItemsObject[Date.parse(item.date)] = 1;

                dataInjuredObject[Date.parse(item.date)] = parseInt(item.injured);
                dataKilledObject[Date.parse(item.date)] = parseInt(item.killed);

                dataItemsArray.push(Date.parse(item.date));
            }
            else {
                dataInjuredObject[Date.parse(item.date)] += parseInt(item.injured);
                dataKilledObject[Date.parse(item.date)] += parseInt(item.killed);

                dataItemsObject[Date.parse(item.date)]++;
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

        return {
            days: attacksPerDay,
            killed: killedPerDay,
            injured: injuredPerDay
        }
    },

    init: function (callback) {
        octopus.graph._graph = new Highcharts.StockChart({
            credits: {
                enabled: false
            },
            chart: {
                zoomType: 'x',
                renderTo : 'chart',
                backgroundColor: 'null',
                type: 'arearange'
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
                margin: 20
            },
            plotOptions: {
                series: {
                    animation: false,
                    states: {
                        hover: {
                            enabled: false
                        }
                    },
                    events: {
                        legendItemClick: debounce(function () {
                            octopus.map._hash.onMapMove();
                        }, 100)
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
                y: 0
            },
            xAxis: {
                type: 'datetime',
                useHTML: true,
                labels: {
                    formatter: function() {
                        if (this.isFirst || this.isLast) {
                            return Highcharts.dateFormat(this.dateTimeLabelFormat, this.value);
                        }
                    }
                },
                events: {
                    setExtremes: debounce(function () {
                        octopus.map._hash.onMapMove();
                    }, 100)
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
                yAxis: 0,
                color: '#67b7ff',
                data: []
            },{
                type: 'column',
                name: 'Killed',
                yAxis: 1,
                color: '#b80000',
                data: [],
                weight: 1
            }, {
                type: 'column',
                yAxis: 1,
                name: 'Injured',
                color: '#ea7070',
                data: [],
                weight: 0
            }]
        });

        if (typeof callback == 'function') {
            callback();
        }
    }
};