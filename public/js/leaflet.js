// let marker, circle, zoomed;
const map = L.map('map').setView([-26.2044, 28.0456], 13)
const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map)

const cityPoints = L.geoJSON(cities).addTo(map)
pointIndex = leafletKnn(cityPoints)



// FUNCTIONS
function onMapClick(e) {
    console.log(`lat: ${e.latlng.lat}, lon: ${e.latlng.lng}`)
    let nearestResult = pointIndex.nearest(e.latlng, 1)[0]
    let cityName = nearestResult.layer.feature.properties.name
    let coOrds = nearestResult.layer.feature.geometry.coordinates

    setTimeout(() => {
        let popup = L.popup()
            .setLatLng([e.latlng.lat, e.latlng.lng])
            .setContent(`Lat: ${e.latlng.lat}, <br>Lon: ${e.latlng.lng}<br><b>${cityName}</b> is the nearest!`)
            .openOn(map);
    }, 250)
}

function geoLocateSuccess(pos) {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    if (marker) {
        map.removeLayer(marker);
        map.removeLayer(circle);
    }

    marker = L.marker([lat, lng], { icon: myLocationIcon }).addTo(map);
    circle = L.circle([lat, lng], { radius: accuracy }).addTo(map);

    if (!zoomed) {
        zoomed = map.fitBounds(circle.getBounds());
    }

    socket.emit('location message', { lat, lng });


    // map.setView([lat, lng]);
    // Set map focus to current user position

    // document.getElementById('latLbl').innerText = lat.toFixed(4)
    // document.getElementById('lngLbl').innerText = lng.toFixed(4)



}

function geoLocateError(err) {
    if (err.code === 1) {
        alert("Please allow geolocation access");
    } else {
        alert("Cannot get current location");
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
    .Button = L.Control.extend({
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
            navigator.geolocation.getCurrentPosition(geoLocateGetPosition)
        }
    })

L.control
    .button = function (opts) {
        return new L.Control.Button(opts)
    }

L.control
    .button({ position: 'topleft' }).addTo(map)