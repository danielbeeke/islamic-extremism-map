window.octopus = window.octopus ? window.octopus : {};

octopus.pie = {
    create: function (data) {
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