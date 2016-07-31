window.octopus = window.octopus ? window.octopus : {};

octopus.init = function () {
    octopus.map.init(function () {
        var filters = octopus.data.filters();
        octopus.data.get(filters, function (data) {
            octopus.map.render(data);
        });
    });
};

octopus.init();
