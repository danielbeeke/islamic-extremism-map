window.octopus = window.octopus ? window.octopus : {};

// TODO fix the labels in the popup to include date till date.

octopus.graph = {
    render: function (data, callback, orginalFilters) {
        var seriesObject = octopus.graph._prepare(data);

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
                enabled: false,
                buttons: [],
                inputEnabled: false
            },
            navigator: {
                margin: 20,
                series: seriesObject['days']
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
                    enabled: false,
                    formatter: function() {
                        if (this.isFirst || this.isLast) {
                            return Highcharts.dateFormat(this.dateTimeLabelFormat, this.value);
                        }
                    }
                },
                events: {
                    setExtremes: debounce(function () {
                        octopus.map._hash.onMapMove();
                        var filters = octopus.getFilters();
                        octopus.renderMap(filters);
                    }, 200)
                },
                min: Date.parse('2011-01-01'),
                max: Date.parse('2017-01-01')
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
                data: seriesObject['days']
            },{
                type: 'column',
                name: 'Killed',
                yAxis: 1,
                color: '#b80000',
                data: seriesObject['killed'],
                weight: 1
            }, {
                type: 'column',
                yAxis: 1,
                name: 'Injured',
                color: '#ea7070',
                data: seriesObject['injured'],
                weight: 0
            }]
        });

        if (orginalFilters.minDate && orginalFilters.maxDate) {
            var startDate = new Date(orginalFilters.minDate);
            var endDate = new Date(orginalFilters.maxDate);

            octopus.graph._graph.xAxis[0].setExtremes(
                Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
                Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()),
                true,
                false
            );
        }

        if (typeof callback == 'function') {
            callback();
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
    }
};