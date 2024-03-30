const PORT = process.env.PORT || 3999
const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')
const botName = 'YaBOT'
app.use(express.static(path.join(__dirname, 'public')))




io.on('connection', (socket) => {
    console.log('a user connected')


    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)
        socket.join(user.room)

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to iChatCord'))

        // Broadcast when a user connects
        socket.broadcast
            .to(user.room)
            .emit('message', formatMessage(botName, `${user.username} has joined the chat`))

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })




    // Listen for chatMessage from client
    socket.on('chatMessage', (msg) => {
        console.log(msg)
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    })


    // Send location to client
    socket.on('location message', (msg) => {
        const user = getCurrentUser(socket.id)
        console.log('location message', { user, msg })
        io.emit('location message', formatMessage(user.username, msg))
    })

    socket.on('markerMessage', (msg) => {
        console.log('server marker message', msg)
        io.emit('markerMessage', msg)
        // console.log('marker message');
    })

    socket.on('disconnect', () => {
        console.log('user disconnected')
        const user = userLeave(socket.id)

        if (user) {
            io
                .to(user.room)
                .emit('message', formatMessage(botName, `${user.username} has left the chat`))

            // Send users and room info
            io
                .to(user.room)
                .emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                })
        }
    })
});


server.listen(PORT, () => {
    console.log(`listening on PORT: ${PORT}`)
});