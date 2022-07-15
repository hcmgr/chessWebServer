const path = require('path')
const http = require('http')
const express = require('express')
const socket = require('socket.io')
const app = express()
require('dotenv').config()

//create http server that runs our express app
const server = http.createServer(app)
//adds sockets to said server
const io = socket(server)

const port = process.env.PORT || 80

server.listen(port, () => {
    console.log(`server running on port ${port}...`)
})

app.use(express.static(path.join(__dirname, 'public')))


class Room{
    constructor(room_code){
        this.room_code = room_code
        //array of user ID's
        this.users = []
        this.set_colours()
        this.game_mode = null
        this.game_time = null
    }

    set_colours(){
        let rand = Math.round(Math.random())
        if (rand){
            this.p1_colours = ['w', 'b']
            this.p2_colours = ['b', 'w']
        }
        else {
            this.p1_colours = ['b', 'w']
            this.p2_colours = ['w', 'b']
        }
    }

    get_room_code()
        {return this.room_code}

    get_users()
        {return this.users}

    get_num_users()
        {return this.users.length}

    add_user(user_id)
        {this.users.push(user_id)}
}

let game_mode
let game_time
let rand_cols
let times = []
let timer
//store times of white and black (in that order)


//room_code --> room_object
let rooms = new Map()

io.on('connection', (socket) => {
    io.emit('msg-client', 'Connected to server...')

    socket.on('start-game-server', () => { 
        socket.emit('start-game-client')
    })

	let turn = 'w'
	function decrementTimes(turn, room_code){
		turn === 'w' ? times[0]-- : times[1]--
		io.in(room_code).emit('decrement-timer', times)
	}

    socket.on('can-join-room', (room_code) => {
        io.emit('can-join-room-resp', rooms.get(room_code))
    }) 
    
    socket.on('set-game-mode', (mode) => {game_mode = mode})
    socket.on('set-game-time', (time) => {game_time = time; times = [game_time*60, game_time*60]})
    socket.on('set-rand-cols', (cols) => {rand_cols = cols})

    socket.on('create-room', (room_code) => {
        rooms.set(room_code, new Room(room_code, socket.id))
        let room = rooms.get(room_code)
        room.add_user(socket.id)
        socket.join(room_code)
        socket.emit('set-room-code', (room_code))
        socket.emit('set-player-num', 1)
        socket.emit('set-player-colours', room.p1_colours)
        socket.emit('set-mode', game_mode)
        socket.emit('set-time', game_time)
        socket.emit('set-rand-col', rand_cols)
        socket.emit('load-game-first')
        socket.on('set-castling', (flag) => {
            socket.to(room_code).emit('set-castling-status', flag)
        })
        socket.on('broadcast-move', (squares) => {
            socket.to(room_code).emit('move', squares)
        })
        socket.on('add-piece', (piece_name, pos, colour) =>{
            socket.to(room_code).emit('add-piece-client', piece_name, pos, colour)
        })
        socket.on('remove-piece', (sq) => {
            socket.to(room_code).emit('remove-piece', sq)
        })
		socket.on('change-turn', (changedTurn) => {
			turn = changedTurn
		})
		socket.on('stop-timer', () => {
			clearInterval(timer)
		})
        socket.on('end-game-self', (winner, method) => {
            socket.emit('end', winner, method)
        })
        socket.on('end-game-other', (winner, method) => {
            socket.to(room_code).emit('end', winner, method)
        })
        socket.on('rematch', () => {
            socket.to(room_code).emit('rematch-req-receive')
        })
        socket.on('rematch-answer', (answer) => {
            socket.to(room_code).emit('rematch-resp-receive', answer)
        })
    })


    socket.on('join-room', (room_code) => {
        let room = rooms.get(room_code)
        if (room){
            //second player
            if (room.get_num_users() === 1)
                {
                    room.add_user(socket.id)
                    socket.join(room_code)
                    socket.to(room_code).emit('load-game-second')
                    socket.emit('set-player-num', 2)
                    socket.emit('set-player-colours', room.p2_colours)
                    socket.emit('set-mode', game_mode)
                    socket.emit('set-time', game_time)
                    socket.emit('set-rand-col', rand_cols)
                    socket.emit('load-game-full')
                    socket.on('set-castling', (flag) => {
                        socket.to(room_code).emit('set-castling-status', flag)
                    })
                    socket.on('broadcast-move', (squares) => {
                        socket.to(room_code).emit('move', squares)
                    })
                    socket.on('add-piece', (piece_name, pos, colour) =>{
                        socket.to(room_code).emit('add-piece-client', piece_name, pos, colour)
                    })
                    socket.on('remove-piece', (sq) => {
                        socket.to(room_code).emit('remove-piece', sq)
                    })

					socket.on('change-turn', (changedTurn) => {
						turn = changedTurn
					}
					)
					function decrementTimesCaller(){
						decrementTimes(turn, room_code)
					}

					socket.on('start-game', () => {
						timer = setInterval(decrementTimesCaller, 1000)
					})
                    socket.on('end-game-self', (winner, method) => {
                        socket.emit('end', winner, method)
                    })
                    socket.on('end-game-other', (winner, method) => {
                        socket.to(room_code).emit('end', winner, method)
                    })
                    socket.on('rematch', () => {
                        socket.to(room_code).emit('rematch-req-receive')
                    })
                    socket.on('rematch-answer', (answer) => {
                        socket.to(room_code).emit('rematch-resp-receive', answer)
                    })
                }
            
            if (room.get_num_users() > 1 && !room.get_users().includes(socket.id))
            {
                socket.emit('display-message', 'Game full')
            }
        }
    })
})



