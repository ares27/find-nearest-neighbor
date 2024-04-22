const socket = io()
const chatMessages = document.querySelector('.msger-chat')
// const chatMessages = document.getElementById('messages')
// const chatForm = document.getElementById('form')
const chatForm = document.getElementById('chat-form')
const input = document.getElementById('input')
const roomName = document.getElementById('roomLbl')
const roomUserName = document.getElementById('userLbl')
const userList = document.getElementById('users')
let marker, layerGroup
let markersArray = []

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

// Join chatroom
socket.emit('joinRoom', { username, room })

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
    roomUserName.textContent = username
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
    // console.log(`client received location message: `, message)
    let user = message.username
    console.log(`${user} made call...`)

    outputLocationMessage(message)

    outputLocationMarker(message)

    chatMessages.scrollTop = chatMessages.scrollHeight
})

socket.on('watch location message', (message) => {
    // console.log('watch location message', message);
    // console.log(message);
    outputLocationMarker(message)
})


// User leaves room
socket.on('leaveRoom', ({ room, username }) => {
    removeLocationMarker(username)
})


chatForm.addEventListener('submit', (e) => {
    e.preventDefault()
    const input = e.target.elements.chatInput

    if (input.value === '') {
        return false
    }

    socket.emit('chatMessage', input.value)
    input.value = ''
    input.focus()
})







// Output to DOM
function outputMessage(message) {
    // console.log('message: ', message);
    const div = document.createElement('div')
    div.classList.add('msg', 'right-msg')
    div.innerHTML = `
            <div class="msg-img" style="background-image: url(./assets/usera.png)">
                    </div>

                    <div class="msg-bubble">
                        <div class="msg-info">
                            <div class="msg-info-name">${message.username}</div>
                            <div class="msg-info-time">${message.time}</div>
                        </div>

                        <div class="msg-text">
                            ${message.text}
                        </div>
                    </div>
            `
    chatMessages.appendChild(div)
    chatMessages.scrollTop = chatMessages.scrollHeight
}

function outputLocationMessage(message) {
    const div = document.createElement('div')
    div.classList.add('msg', 'right-msg')
    div.innerHTML = `
    <div class="msg-img" style="background-image: url(./assets/user.png)">
    </div>
    <div class="msg-bubble">
        <div class="msg-info">
            <div class="msg-info-name">${message.username}</div>
            <div class="msg-info-time">${message.time}</div>
        </div>

        <div class="msg-text">
        ${message.text.lat}, ${message.text.lng}
        </div>
    </div>
    `
    chatMessages.appendChild(div)

}

async function outputLocationMarker(message) {
    let user = message.username
    let latlng = {
        lat: message.text.lat,
        lng: message.text.lng
    }

    const { address } = await reverseGeolocate(latlng)

    marker = L.marker([message.text.lat, message.text.lng], { icon: myLocationIcon, title: user })
        .bindPopup(`
        <table class="table table-sm" id="user-location-table">
        <tr>
            <td>User:</td>
            <td>${user}</td>
        </tr>
        <tr>
            <td>Latitude:</td>
            <td>${message.text.lat.toFixed(8)}</td>
        </tr>
        <tr>
            <td>Longitude:</td>
            <td>${message.text.lng.toFixed(8)}</td>
        </tr>
        <tr>
            <td>Address:</td>
            <td>${address.Address}</td>
        </tr>        
        </table>
        <button type="button" class="btn btn-outline-dark btn-sm" id="go-to-user-location-btn" onclick="goToUserLocation(${message.text.lat.toFixed(5)},${message.text.lng.toFixed(5)})">Go To</button>  
        `)
    markersArray.push(marker)

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
}

function removeLocationMarker(username) {
    console.log('removing marker for: ', username)
    let user = username

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
}

function goToUserLocation(lat, lng) {
    map.flyTo([lat, lng], 16)
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




function reverseGeolocate(latlng) {
    return new Promise((resolve, reject) => {
        const rGeoCode = L.esri.Geocoding
            .reverseGeocode({
                apikey: apiKey
            })
            .latlng(latlng)
            .run(function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    // console.log(result);
                    // const address = result.address.Address;
                    resolve(result);
                }
            });
    });
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