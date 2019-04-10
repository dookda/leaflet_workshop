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
}

// overlay 
function onEachFeature(feature, layer) {
    let name_t = feature.properties.name_t;
    let desc_t = feature.properties.desc_t;
    let type_g = feature.properties.type_g;

    // let popupContent = `name: ${name_t}<br>
    //                     desc: ${desc_t}<br>
    //                     type: ${type_g}`;

    var popupContent = `<form role="form" id="form" class="form-horizontal" enctype="multipart/form-data">
        name: <input type="text" class="form-control" id="name_t" name="name_t" value = "${name_t}" disabled ><br>
        desc: <input type="text" class="form-control" id="desc_t" name="desc_t" value = "${desc_t}"><br>
        type: <input type="text" class="form-control" id="type_g"  name="type_g" value = "${type_g}" disabled><br>
        <button type="button" class="btn btn-success" onclick="updateValue()">Submit</button>
        </form>`;

    layer.bindPopup(popupContent, {
        minWidth: 300
    });
};

function updateValue() {
    var name_t = $("#name_t").val();
    var desc_t = $("#desc_t").val();
    $.post("http://localhost:3000/api/updatevalue", {
        name_t: name_t,
        desc_t: desc_t
    }, () => {
        drawnItems.refresh();
    });
}

var drawnItems = new L.GeoJSON.AJAX("http://localhost:3000/api/getfeature", {
    onEachFeature: onEachFeature
});

// var drawnItems = L.featureGroup();
// $.getJSON('http://localhost:3000/api/getfeature', (res) => {
//     let feature = L.geoJSON(res);
//     drawnItems.addLayer(feature);
// });

var province = L.tileLayer.wms('http://www.cgi.uru.ac.th/geoserver/ows?', {
    layers: 'th:province_4326',
    format: 'image/png',
    transparent: true,
    zIndex: 5,
    CQL_FILTER: 'pro_code=75'
});

var overlay = {
    'drawlayer': drawnItems.addTo(map),
    'ขอบเขตจังหวัด': province.addTo(map)
}

// control
L.control.layers(baseLayers, overlay).addTo(map);

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
        polyline: true,
        circle: false,
        marker: true,
        circlemarker: false
    }
}));

map.on(L.Draw.Event.CREATED, function (e) {
    let lyr = e.layer;
    drawnItems.addLayer(lyr);
    console.log(lyr.toGeoJSON().geometry);
    var currentdate = new Date();
    var datetime = "ID" + currentdate.getDate() + "-" +
        (currentdate.getMonth() + 1) + "-" +
        currentdate.getFullYear() + "-" +
        currentdate.getHours() + "-" +
        currentdate.getMinutes() + "-" +
        currentdate.getSeconds();
    var geom = (JSON.stringify(lyr.toGeoJSON().geometry));

    $.post("http://localhost:3000/api/insertfeature", {
        name_t: datetime,
        geom: geom,
        type: e.layerType
    }, () => {
        drawnItems.refresh();
    });
});

map.on('draw:edited', function (e) {
    let layers = e.layers;
    layers.eachLayer((l) => {
        var name_t = l.toGeoJSON().properties.name_t;
        var geom = (JSON.stringify(l.toGeoJSON().geometry));
        $.post("http://localhost:3000/api/updatefeature", {
            name_t: name_t,
            geom: geom
        }, () => {
            drawnItems.refresh();
        })
    })
});

map.on('draw:deleted', function (e) {
    let layers = e.layers;
    layers.eachLayer((l) => {
        var name_t = l.toGeoJSON().properties.name_t;
        $.post("http://localhost:3000/api/deletefeature", {
            name_t: name_t
        }, () => {
            drawnItems.refresh()
        })
    })
});