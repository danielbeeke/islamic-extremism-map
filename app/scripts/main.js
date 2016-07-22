octopus.years = [2011, 2012, 2013, 2014, 2015, 2016];
//octopus.years = [2010];

var bounds = L.latLngBounds([[[-41.1328125,-5.090944175],[-41.1328125,60.326947743],[107.75390625,60.326947743],[107.75390625,-5.090944175],[-41.1328125,-5.090944175]]]);

octopus.map.init();

var filters = {
    minDate: Date.parse('2011-01-01'),
    maxDate: Date.parse('2015-08-01'),
    types: ['killed', 'injured'],
    bounds: bounds
};

octopus.data.getFiltered(function (filteredData) {
    octopus.map.render(filteredData);
    octopus.graph.render(filteredData);
}, filters);
