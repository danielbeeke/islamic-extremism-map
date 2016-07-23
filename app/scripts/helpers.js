Array.prototype.clone = function() {
    return this.slice(0);
};

L.Map.include({
    closePopup: function (popup) {
        var that = this;
        if (!popup || popup === this._popup) {
            popup = this._popup;
            this._popup = null;
        }
        if (popup) {
            L.DomUtil.addClass(popup._container, 'is-closing');
            var transitionend = function () {
                that.removeLayer(popup);
                popup._isOpen = false;
                L.DomUtil.removeClass(popup._container, 'is-closing');
                popup._container.removeEventListener('transitionend', transitionend);
            };

            popup._container.addEventListener('transitionend', transitionend);
        }

        return that;
    }
});

function debounce(callback, time) {
    var timeout;

    return function() {
        clearTimeout(timeout);
        timeout = setTimeout(callback, time);
    };
};

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