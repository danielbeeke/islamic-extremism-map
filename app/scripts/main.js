octopus.years = [2011, 2012, 2013, 2014, 2015, 2016];
//octopus.years = [2010];

var southWest = L.latLng(27.653226, 73.3831843),
    northEast = L.latLng(41.653226, -81.3831843),
    bounds = L.latLngBounds(southWest, northEast);

octopus.data.getFiltered(function (filteredData) {
    console.log(filteredData)
},
    Date.parse('2011-01-01'),
    Date.parse('2011-08-01'),
    ['killed', 'injured'],
    bounds
);
