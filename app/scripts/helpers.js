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
    var month = ("0" + (date.getMonth()+1)).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);
    return year + "-" + month + "-" + day;
}