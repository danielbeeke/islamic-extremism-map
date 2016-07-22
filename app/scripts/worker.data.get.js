var worker = {
    get: function (url) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                var json = JSON.parse(xhttp.responseText);
                postMessage(json);
                close();
            }
        };
        xhttp.open('GET', url, true);
        xhttp.send();
    }
};

onmessage = function(e) {
    var url = e.data;
    worker.get(url);
};