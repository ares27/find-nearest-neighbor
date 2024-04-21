let watchMarker, circle, zoomed, panned
const apiKey = "AAPK38d5964a655b48dbb8fb30fe5bc1098co28bAFzHHonjZPlh5QIp2DRruOGyamDWbvQJegvAQlvfxlKs94COtvB-ad44WdjI";
const map = L.map('map').setView([-26.2044, 28.0456], 13)
const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)
const Stadia_AlidadeSatellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'jpg'
})
let cityPointsMarker = {
    radius: 5,
    fillColor: "#0000FF",
    color: "#0000",
    weight: 5,
    opacity: 1,
    fillOpacity: .8
}
const cityPoints = L.geoJSON(cities, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, cityPointsMarker)
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(feature.properties.name)
    }
}).addTo(map)
pointIndex = leafletKnn(cityPoints)

let basemaps = {
    'Open Street Map': osm,
    'Satellite Map': Stadia_AlidadeSatellite,
}

let overlayMaps = {
    'SA Cities': cityPoints
}

L.control.layers(basemaps, overlayMaps).addTo(map)

// FUNCTIONS
function onMapClick(e) {
    console.log(`lat: ${e.latlng.lat}, lon: ${e.latlng.lng}`)
    let nearestResult = pointIndex.nearest(e.latlng, 1)[0]
    let cityName = nearestResult.layer.feature.properties.name
    let coOrds = nearestResult.layer.feature.geometry.coordinates

    setTimeout(() => {
        let popup = L.popup()
            .setLatLng([e.latlng.lat, e.latlng.lng])
            .setContent(`
                Lat: ${e.latlng.lat}<br>
                Lon: ${e.latlng.lng}<br>
                <b>${cityName}</b> is the nearest!
            `)
            .openOn(map)
    }, 250)
}

function geoLocateSuccess(pos) {
    const lat = pos.coords.latitude
    const lng = pos.coords.longitude
    const accuracy = pos.coords.accuracy

    // if (watchMarker) {
    //     map.removeLayer(watchMarker)
    //     map.removeLayer(circle)
    // }

    // watchMarker = L.marker([lat, lng], { icon: myLocationIcon }).addTo(map);
    // circle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

    // if (!zoomed) {
    //     zoomed = map.fitBounds(circle.getBounds());
    // }

    // document.getElementById('latLbl').innerText = lat
    // document.getElementById('lngLbl').innerText = lng
    map.panTo(new L.LatLng(lat, lng))
    socket.emit('watch location message', { lat, lng, accuracy, message: 'watching you!' })

}

function geoLocateError(err) {
    if (err.code === 1) {
        alert("Please allow geolocation access");
    } else {
        // alert("Cannot get current location");
        console.log(err);
    }
}

function geoLocateGetPosition(position) {
    let lat = position.coords.latitude
    let lng = position.coords.longitude
    let accuracy = position.coords.accuracy
    // console.log(`getCurrentPosition(): latitude: ${lat}, longitude: ${lng}, accuracy: ${accuracy}`)

    document.getElementById('latLbl').innerText = lat
    document.getElementById('lngLbl').innerText = lng
    map.panTo(new L.LatLng(lat, lng))
    socket.emit('location message', { lat, lng, accuracy })

}



// EVENTS
map.on('click', (e) => {
    onMapClick(e)
})












// ICONS
const UserLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const myLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})



// LAYER BUTTONS
L.Control
    .FindUserLocationButton = L.Control.extend({
        onAdd: function (map) {
            let container = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control')
            this.locationLink = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container)
            this.locationLink.title = 'Show me where I am'
            this.locationLink.href = '#'
            this.locationLink.role = 'button'
            let group = L.DomUtil.create('span', 'leaflet-control-locate-location-arrow', this.locationLink)
            this.locationLink.onclick = this.submit
            return container
        },
        onRemove: function (map) {
            // Nothing to do here
        },
        submit: function (e) {
            L.DomEvent.stop(e)
            // navigator.geolocation.getCurrentPosition(geoLocateGetPosition)
            alert('Try Again Later!')
        }
    })

L.Control
    .WatchMeButton = L.Control.extend({
        onAdd: function (map) {
            let container = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control')
            this.locationLink = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container)
            this.locationLink.title = 'Watch Me'
            this.locationLink.href = '#'
            this.locationLink.role = 'button'
            let group = L.DomUtil.create('i', 'fa fa-binoculars', this.locationLink)
            this.locationLink.onclick = this.submit
            return container
        },
        onRemove: function (map) {
            // Nothing to do here
        },
        submit: function (e) {
            L.DomEvent.stop(e)
            navigator.geolocation.watchPosition(geoLocateSuccess, geoLocateError)
        }
    })


L.control
    .findUserLocationButton = function (opts) {
        return new L.Control.FindUserLocationButton(opts)
    }
L.control.watchMeButton = function (opts) {
    return new L.Control.WatchMeButton(opts)
}

L.control
    .findUserLocationButton({ position: 'topleft' }).addTo(map)
L.control
    .watchMeButton({ position: 'topleft' }).addTo(map)
