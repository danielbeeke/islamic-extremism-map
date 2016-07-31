Array.prototype.clone = function() {
    return this.slice(0);
};

function debounce(callback, time) {
    var timeout;

    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(callback, time);
    };
}

function formatDate (date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth()+1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return year + '-' + month + '-' + day;
}

function extend(from, to) {
    if (from == null || typeof from != 'object') return from;
    if (from.constructor != Object && from.constructor != Array) return from;
    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
        return new from.constructor(from);

    to = to || new from.constructor();

    for (var name in from)
    {
        to[name] = typeof to[name] == 'undefined' ? extend(from[name], null) : to[name];
    }

    return to;
}

Highcharts.setOptions({
    plotOptions: {
        area: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        arearange: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        areaspline: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        areasplinerange: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        bar: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        boxplot: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        bubble: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        column: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        columnrange: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        errorbar: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        funnel: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        gauge: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        heatmap: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        line: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        pie: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        polygon: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        pyramid: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        scatter: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        series: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        solidgauge: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        spline: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        treemap: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
        waterfall: { animation: false, stickyTracking: true, shadow: false, dataLabels: { style: { textShadow: false } } },
    },
    chart: {
        reflow: false,
        animation: false
    },
    tooltip: {
        animation: false
    },
    exporting: {
        enabled:false
    },
    credits: {
        enabled: false
    }
});

function ajax (url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            var json = JSON.parse(xhttp.responseText);
            callback(json);
        }
    };
    xhttp.open('GET', url, true);
    xhttp.send();
}