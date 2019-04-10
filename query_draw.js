// create map
var map = L.map('map', {
    center: [13.396781354315781, 99.95325872867208],
    zoom: 11
});

// base layers
var OSM_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var roads = L.tileLayer('http://{s}.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

var hybrid = L.tileLayer('http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

var terrain = L.tileLayer('http://{s}.google.com/vt/lyrs=m,t&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
});

var baseLayers = {
    "OSM": OSM_Mapnik.addTo(map),
    "ถนน": roads,
    "ดาวเทียมและถนน": hybrid,
    "ภูมิประเทศ": terrain
};

var province = L.tileLayer.wms('http://www.cgi.uru.ac.th/geoserver/ows?', {
    layers: 'th:province_4326',
    format: 'image/png',
    transparent: true,
    zIndex: 5,
    CQL_FILTER: 'pro_code=75'
});

var amphoe = L.tileLayer.wms('http://www.cgi.uru.ac.th/geoserver/ows?', {
    layers: 'th:amphoe_4326',
    format: 'image/png',
    transparent: true,
    zIndex: 5,
    CQL_FILTER: 'pro_code=75'
});

var lyrGroup = L.layerGroup();
var drawnItems = L.featureGroup().addTo(map);

var overlay = {
    "ตำแหน่งครัวเรือน": lyrGroup.addTo(map),
    "ขอบเขตจังหวัด": province.addTo(map),
    "ขอบเขตอำเภอ": amphoe
};

L.control.layers(baseLayers, overlay).addTo(map);

// draw rectangle
// console.log('da')
map.addControl(new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
        poly: {
            allowIntersection: false
        }
    },
    draw: {
        polygon: {
            allowIntersection: false,
            showArea: true,
            metric: 'metric'
        },
        rectangle: true,
        polyline: false,
        circle: false,
        marker: false,
        circlemarker: false
    }
}));

// var geojsonFeature = [{
//     "type": "Feature",
//     "properties": {
//         "name": "Coors Field",
//         "show_on_map": true
//     },
//     "geometry": {
//         "type": "Point",
//         "coordinates": [-104.99404, 39.75621]
//     }
// }, {
//     "type": "Feature",
//     "properties": {
//         "name": "Busch Field",
//         "show_on_map": false
//     },
//     "geometry": {
//         "type": "Point",
//         "coordinates": [-104.98404, 39.74621]
//     }
// }];

$.getJSON('http://localhost:3000/api/hh', (res) => {
    const icon = L.icon({
        iconUrl: 'http://cgi.uru.ac.th/marker/house.png',
        iconSize: [32, 37],
        iconAnchor: [12, 37],
        popupAnchor: [5, -30]
    });

    let marker = L.geoJSON(res, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: icon
            });
        },
        onEachFeature: (feature, layer) => {
            if (feature.properties) {
                layer.bindPopup(
                    'ชื่อ: ' + feature.properties.firstname + '</br>'
                );
            }
        }
    });
    lyrGroup.addLayer(marker);
});


// var radius = 100;
// $("#buff-select").change(function () {
//     radius = $(this).val();
// });

// map.on('click', function (e) {
//     // console.log(e.latlng);

//     map.eachLayer((lyr) => {
//         if (lyr.options.buffName == 'buff') {
//             map.removeLayer(lyr);
//         }
//     });

//     var circle = L.circle([e.latlng.lat, e.latlng.lng], {
//         radius: radius,
//         color: 'blue',
//         fillColor: '#f03',
//         fillOpacity: 0.1,
//         buffName: 'buff'
//     });

//     selMarker(e.latlng.lat, e.latlng.lng, radius);

//     circle.addTo(map);
//     map.fitBounds(circle.getBounds());
// });

map.on(L.Draw.Event.CREATED, function (e) {
    let lyr = e.layer;
    lyr.draw = 'draw';
    drawnItems.addLayer(lyr);
    var geom = (JSON.stringify(lyr.toGeoJSON().geometry));
    selMarker(geom);
});

map.on("draw:drawstart", (e) => {
    map.eachLayer((lyr) => {
        if (lyr.draw) {
            map.removeLayer(lyr);
        }
    })
});

// function selMarker(lat, lon, buff) {
function selMarker(geom) {
    map.eachLayer((lyr) => {
        if (lyr.options.iconName == 'sel') {
            map.removeLayer(lyr);
        }
    });

    $.post("http://localhost:3000/api/hh_by_draw", {
        geom: geom,
    }, (res) => {
        // console.log(res)
        $('#tbody').empty();
        var fs = res.features;

        const icon = L.icon({
            iconUrl: 'http://cgi.uru.ac.th/marker/circus.png',
            iconSize: [32, 37],
            iconAnchor: [12, 37],
            popupAnchor: [5, -30]
        });

        let marker = L.geoJSON(res, {
            pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {
                    icon: icon,
                    iconName: 'sel'
                });
            },
            onEachFeature: (feature, layer) => {
                if (feature.properties) {
                    layer.bindPopup(
                        'ชื่อ: ' + feature.properties.firstname + '</br>'
                    );
                }
            }
        });
        marker.addTo(map);

        // console.log(fs);
        fs.forEach(e => {
            // console.log(e);
            var eachrow = "<tr>" +
                "<td onClick='showPopup(\"" + e.properties.firstname + "\"," + e.properties.lat + "," + e.properties.lon + ")'><a href='#'>" + e.properties.house_id + "</a></td>" +
                "<td>" + e.properties.firstname + "</td>" +
                "<td>" + e.properties.lastname + "</td>" +
                "<td>" + e.properties.t_name_t + "</td>" +
                "<td>" + e.properties.a_name_t + "</td>" +
                "</tr>";
            $('#tbody').append(eachrow);
        });
    });
}

function showPopup(dat, lat, lng) {
    L.popup({
        offset: {
            x: 5,
            y: -25,
        }
    }).setLatLng(L.latLng(lat, lng)).setContent('<h6>ชื่อ: ' + dat + '</h6>').openOn(map);
    map.setView(L.latLng(lat, lng), 16);
}