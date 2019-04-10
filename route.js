var map = L.map('map').fitWorld();

var roads = L.tileLayer('http://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

roads.addTo(map);

var startPoint = L.latLng(14.083809, 100.578433);
var endPoint = L.latLng(13.4147527, 99.9631748);
var r = L.Routing.control({
    // waypoints: [
    //     startPoint,
    //     endPoint
    // ],
    routeWhileDragging: true,
    show: true
});

r.addTo(map);

$('#local').click(() => {
    navigator.geolocation.getCurrentPosition(loc => {
        startPoint = new L.LatLng(loc.coords.latitude, loc.coords.longitude);
        var marker = L.marker(startPoint).addTo(map);
        map.setView(startPoint, 14)
    })
})

const url = 'http://localhost:3000/api/getpoi';
// Populate dropdown with list of provinces
$.getJSON(url, function (data) {
    $.each(data, function (key, val) {
        $('#pro').append('<option value=' + val.lat + ',' + val.lon + ',' + val.name + '>' + val.name + '</option>');
    });

    $('#pro').change((e) => {
        const str = e.target.value;
        var res = str.split(",");
        console.log(res)
        getRoute(Number(res[0]), Number(res[1]));
    })
});

function getRoute(lat, lng) {
    endPoint = L.latLng(lat, lng);
    console.log(startPoint);

    r.setWaypoints([
        startPoint,
        endPoint
    ]);
}