const socket = io()
const chatMessages = document.getElementById('messages')
const chatForm = document.getElementById('form')
const input = document.getElementById('input')
const roomName = document.getElementById('roomLbl')
const userList = document.getElementById('users')
let marker, circle, zoomed, layerGroup;
let markersArray = []

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

// Join chatroom
socket.emit('joinRoom', { username, room })

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room)
    outputUsers(users)
})

// Message from server
socket.on('message', (message) => {
    console.log('client received message', message)
    outputMessage(message)
    chatMessages.scrollTop = chatMessages.scrollHeight
})



// Location from server
socket.on('location message', function (message) {
    console.log(`client received location message: `, message)
    let user = message.username
    console.log(`${user} made call...`)

    outputLocationMessage(message)

    outputLocationMarker(message)

    chatMessages.scrollTop = chatMessages.scrollHeight
})



chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const input = e.target.elements.input.value
    socket.emit('chatMessage', input)

    // clear input
    e.target.elements.input.value = ''
    e.target.elements.input.focus()
})





// Output to DOM
function outputMessage(message) {
    const div = document.createElement('div')
    div.classList.add('message')
    div.innerHTML = `
    <p class="meta"><b>${message.username}</b><span> ${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>
    `
    chatMessages.appendChild(div)
}

function outputLocationMessage(message) {
    const div = document.createElement('div')
    div.classList.add('message')
    div.innerHTML = `
    <p class="meta"><b>${message.username}</b><span> ${message.time}</span></p>
    <p class="text">
        ${message.text.lat}, ${message.text.lng}
    </p>
    `
    chatMessages.appendChild(div)

    // document.getElementById('latLbl').innerText = message.text.lat
    // document.getElementById('lngLbl').innerText = message.text.lng
    // map.panTo(new L.LatLng(message.text.lat, message.text.lng))
}

function outputLocationMarker(message) {
    let user = message.username

    marker = L.marker([message.text.lat, message.text.lng], { icon: myLocationIcon, title: user })
    markersArray.push(marker)
    // console.log(marker);

    if (layerGroup) {
        let leafletId, indexOfObject
        for (let key in layerGroup._layers) {
            let obj = layerGroup._layers[key]
            // console.log(obj)

            if (obj._leaflet_id !== undefined && user === obj.options.title) {
                leafletId = obj._leaflet_id
            }

            indexOfObject = markersArray.findIndex(x => user === x.options.title);

        }

        // console.log('remove layer leafletId: ', leafletId, 'indexOfObject', indexOfObject);
        if (leafletId !== undefined) {
            markersArray = markersArray.filter(v => { return v._leaflet_id !== leafletId })
            // console.log(markersArray);
            layerGroup.removeLayer(leafletId)
        } else if (leafletId === undefined) {
            console.log('no layer to remove')
        }

    }

    layerGroup = L.layerGroup(markersArray)
    layerGroup.addTo(map)
    // map.panTo(new L.LatLng(message.text.lat, message.text.lng))
}

// Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
    `
}














// // Creating markers
// var aMarker = new L.Marker([-27.510707451811587, 24.974670410156254])
// var bMarker = new L.Marker([-27.37664535363958, 25.106506347656254])
// var cMarker = new L.Marker([-27.75160768754937, 25.323486328125004])

// // Creating latlng object
// var latlngs = [
//     [-27.510707451811587, 24.974670410156254],
//     [-27.37664535363958, 25.106506347656254],
//     [-27.75160768754937, 25.323486328125004]
// ]

// // Creating a polygon
// var polygon = L.polygon(latlngs, { color: 'red' })

// // Creating layer group
// var layerGroup = L.layerGroup([aMarker, bMarker, cMarker, polygon])
// layerGroup.addTo(map)

// console.log(`id: ${L.stamp(aMarker)}`)
// var layerGroup = L.layerGroup().addTo(map)
// var x = L.marker(coordinates).addTo(layerGroup);
// var x_id = L.stamp(x); // Retrieve the x layer ID
// layerGroup.removeLayer(x_id);