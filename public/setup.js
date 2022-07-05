class HomeSetup{
    /* 
    Class performs home page's role in setting up game:
        -the first player creating a room OR;
        -second player joining an existing room
    */

    constructor(){
        //start screen elements
        this.create_game_btn = document.querySelector('.create-game-btn')
        this.game_input = document.querySelector('.game-input')
        this.join_game_btn = document.querySelector('.join-game-btn')
        this.choose_mode_btn = document.querySelectorAll('.mode_btn')
        this.choose_time_btn = document.querySelectorAll('.time_btn')

        this.first_container = document.querySelector('.first-container')
        this.second_container = document.querySelector('.second-container')
        this.third_container = document.querySelector('.third-container')

        //event listeners
        this.create_game_btn.addEventListener('click', this.show_modes.bind(this))
        this.join_game_btn.addEventListener('click', this.join_game_listener.bind(this))

        for (let btn of this.choose_mode_btn){
            btn.addEventListener('click', this.show_times.bind(this, btn))}

        for (let btn of this.choose_time_btn){
            btn.addEventListener('click', this.create_game_listener.bind(this, btn))}


        socket.on('start-game', (message) => {
            console.log(message)
        })

    }

    show_modes(){
        this.first_container.style.display = 'none'
        this.second_container.style.display = 'flex'
    }

    show_times(btn){
        let mode = btn.classList[3][5] 
        socket.emit('set-game-mode', mode)
        this.second_container.style.display = 'none'
        this.third_container.style.display = 'flex'
    }

    generate_code()
    {
        //Generatres unique 5 letter joining code
        let code = ''
        for (let i=0;i<5;i++){
        let index = Math.floor(Math.random()*26)
        let letter_code = 'A'.charCodeAt()+index
        let letter = String.fromCharCode(letter_code)
        code+=letter
        }
        return code
    }

    create_game_listener(btn)
    {
        let game_time = Number(btn.classList[2][4]+btn.classList[2][5])
        socket.emit('set-game-time', game_time)
        let room_code = this.generate_code()
        socket.emit('create-room', room_code)
 
    }

    join_game_listener()
    {
        const room_code = String(this.game_input.value).toUpperCase()
        if (room_code)
        {
            socket.emit('can-join-room', room_code)

            socket.on('can-join-room-resp', (resp) => {
                if (resp)
                    {
                        socket.emit('join-room', room_code)
                    }
                else 
                    {console.log('Room does not exist')}
            })
        }
        else 
            {console.log('Type in a room code')}
    }
}

class GameSetup
{
    /*
    Class performs game page's role in setting up the game:
    -
    -
    -
    */
   constructor(){
        //elements
        this.home_page = document.querySelector('.home-page')
        this.game_page = document.querySelector('.game-page')
        this.end_screen = document.querySelector('.end-screen')
        this.winner_text = document.querySelector('.winner')
        this.rematch_btn = document.querySelector('.rematch-btn')
        this.new_game_btn = document.querySelector('.new-game-btn')
        this.wait_screen = document.querySelector('.wait-screen')
        this.rematch_cont = document.querySelector('.rematch-container')
        this.rem_accept_btn = document.querySelector('.accept-button')
        this.rem_decline_btn = document.querySelector('.decline-button')
        this.close_screen_btn = document.querySelector('.close')
        this.response_cont = document.querySelector('.response-container')
        this.waiting_for = document.querySelector('.waiting-for')
        this.rematch_resp = document.querySelector('.rematch-response')

        //event listeners
        this.rematch_btn.addEventListener('click', this.rematch_req_send.bind(this))
        this.new_game_btn.addEventListener('click', this.new_game.bind(this))
        this.rem_accept_btn.addEventListener('click', this.rematch_resp_send.bind(this, true))
        this.rem_decline_btn.addEventListener('click', this.rematch_resp_send.bind(this, false))
        this.close_screen_btn.addEventListener('click', () => {this.end_screen.style.display = 'none'})

        //attributes to use
        this.room_code = null
        this.player_num = null
        this.colours = null
        this.game_turn = null
        this.winner = null
        this.castling_status = false
        this.rand_cols = null

        //server communication
        socket.on('set-room-code', (room_code) => {this.room_code = room_code})
        socket.on('set-player-num', (num) => {this.player_num = num})
        socket.on('set-player-colours', (col_arr) => {this.colours = col_arr})
        socket.on('set-mode', (mode) => this.mode = mode)
        socket.on('set-time', (time) => {this.time = time*60})
        socket.on('set-rand-col', (cols) => {this.rand_cols = cols})
        socket.on('set-castling-status', (flag) => {this.castling_status = flag})
        socket.on('load-game-first', this.load_game_first.bind(this))
        socket.on('load-game-second', this.load_game_second.bind(this))
        socket.on('load-game-full', this.load_game_full.bind(this))
        socket.on('rematch-req-receive', this.rematch_req_receive.bind(this))
        socket.on('rematch-resp-receive', (answer) => {this.rematch_resp_receive(answer, true)})
        socket.on('spectator-mode', this.spectator_mode.bind(this))

		socket.on('decrement-timer', (times) => {
			this.controller.decrement_time();
		})

        socket.on('move', (squares) => {
            this.controller.move(squares[0], squares[1])
            if (!this.castling_status)
                {this.controller.change_turn()}
        })

        socket.on('add-piece-client', (piece_name, new_pos, colour) => {
            let new_piece
            for (let piece of this.model.raw_pieces_list){
                if (piece.get_colour()!==colour){continue}
                if (piece.get_combined_name() === piece_name){
                    let classes = this.model.mode.back_pieces_raw
                    console.log(classes)
                    for (let piece_class of classes){
                        if (piece_class.prototype.isPrototypeOf(piece)){
                            new_piece = new piece_class(new_pos, colour)
                            break
                        }
                    }
                }
            }
            this.model.add_piece(new_piece)
            this.view.draw_piece_img(new_piece)
        })

        socket.on('remove-piece', (sq) => {
            this.model.remove_piece(sq)
            this.view.delete_piece_img(sq)
        })

        socket.on('display-message', (message) => {
            console.log(message)
        })

        socket.on('end', (winner, method) => {
            if (winner === 'w'){this.winner = 'white'}
            if (winner === 'b'){this.winner = 'black'}
            this.win_method = method
            this.controller.game = false
            setTimeout(this.end.bind(this), 1000)
        })

        //TEST ZONE

/*         this.model = new Model(0, 'w', 'b')
        this.view = new View(this.model) 
        this.board = document.querySelector('.board')
        this.view.form_board(this.model.get_bottom_colour())
        this.view.draw_all_pieces()

        document.querySelector('body').style.backgroundColor = getComputedStyle(this.board).getPropertyValue('background-color')
        this.controller = new Controller(this.model, this.view, 600)
        this.controller.game = true
        this.controller.init() */
    }

    load_game_first(){
        this.model = new Model(this.mode, this.colours[0], this.colours[1], this.rand_cols)
        this.view = new View(this.model) 
        this.view.form_board(this.model.get_bottom_colour())

        //fischer random contingency
        if (this.player_num === 1){socket.emit('set-rand-cols', this.model.random_col_nums)}
    
        this.home_page.style.display = 'none'
        this.game_page.style.display = 'block'

        this.board = document.querySelector('.board')
        document.querySelector('body').style.backgroundColor = getComputedStyle(this.board).getPropertyValue('background-color')

        this.wait_screen.style.display = 'flex'
        let room_code_el = document.querySelector('.room_code')
        room_code_el.textContent = `Room code: ${this.room_code}`

    }

    load_game_second(){
        this.wait_screen.style.display = 'none'
        this.view.draw_all_pieces()
        this.controller = new Controller(this.model, this.view, this.time)
        this.controller.game = true
        this.controller.init()
    }

    load_game_full(){
        this.load_game_first()
        this.load_game_second()
    }

    spectator_mode(){
        this.controller.game = false
        console.log('You are in spectator mode')
    }

    end(){
        let previous_yellow = document.querySelector(`.square-${this.view.yellow_square}`)
        if (previous_yellow){this.view.remove_previous_yellow(previous_yellow)}


        if (this.winner === this.controller.player_colour)
            {this.win_screen()}
        else
            {this.win_screen()}
    }

    win_screen(){
        this.end_screen.style.display = 'flex'
        this.winner_text.textContent = `${this.winner} WINS BY ${this.win_method}`
    }

    rematch_req_send(){
        this.response_cont.style.display = 'inline'
        socket.emit('rematch')
    }

    rematch_req_receive(){
        //show rematch container
        this.rematch_cont.style.display = 'flex'
    }

    rematch_resp_send(answer){
        this.rematch_resp_receive(answer, false)
        socket.emit('rematch-answer', answer)
    }

    rematch_resp_receive(answer, player){
        //'player' just tells you whether its the player who requested the rematch
        if (player){
            this.rematch_resp.style.display = 'flex'
            if (answer){
                //rematch function
                this.rematch_resp.textContent = 'Accepted'
                this.rematch_resp.style.color = 'green'
                setTimeout(this.rematch_exec.bind(this), 1500)
            }
            else{
                this.rematch_resp.textContent = 'Declined'
                this.rematch_resp.style.color = 'red'
                setTimeout(()=>{
                    this.rematch_resp.style.display = 'none'
                    this.response_cont.style.display = 'none'
                }, 1500)
            }
        }
        else{
            this.rematch_cont.style.display = 'none'
            if (answer){
                //rematch function
                setTimeout(this.rematch_exec.bind(this), 1500)
            }
        }
    }

    rematch_exec(){

        this.rematch_resp.style.display = 'none'
        this.response_cont.style.display = 'none'
        this.end_screen.style.display = 'none'


        this.model.reset_model()

        this.view.reset_view()
        this.view.form_board(this.model.get_bottom_colour())
        this.view.draw_all_pieces()

        this.controller.unshow_timers()
        this.controller.reset_controller()
    }

    new_game(){}
}

let home_page = new HomeSetup()
let game_page = new GameSetup()



/* 
TODO:
-fischer random piece arrangement
*/