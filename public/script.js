'use strict'
const socket = io()

socket.on('msg-client', (message) => {console.log(message)})


// ---- START PIECE OBJECTS ---- //

/*
PIECES OBJECT:
-stores colour
-stores position
-updates position in model
-draws piece to board
*/

class Pieces {
    /*
    Abstract class for all piece objects

    Parameters:
        piece_name: str ('K')
        position: Array[x,y]
        colour: str ('w' or 'b')
    */
    constructor (position, colour){
        this.position = position
        this.initial_position = this.position
        this.x = Number(this.position[0])
        this.y = Number(this.position[2])
        this.colour = colour
        this.combined_name = this.get_name()+this.get_colour()
        this.image_path = `actual_pieces/${this.combined_name}.png`
        this.can_castle = true
    }
    get_position(){
        return this.position
    }

    get_initial_position(){
        return this.initial_position
    }

    get_x(){return this.x}

    get_y(){return this.y}

    get_colour(){
        return this.colour
    }

    get_combined_name(){
        return this.combined_name
    }

    get_name(){
        return this.constructor.name[0]
    }

    //name stored in pieces object//
    get_piece_obj_name(){
        return this.get_name()+this.get_colour()
    }

    change_position(position)
        {
            this.position = position
            this.x = Number(this.position[0])
            this.y = Number(this.position[2])
            //rook/king castle thing
        }
    
    piece_on_path(x_to, y_to, model)
        {return false}

    can_move(square_to, model, piece_object)
    {
        let x_to = Number(square_to[0])
        let y_to = Number(square_to[2])
        return (!this.piece_on_path(x_to, y_to, model, piece_object) 
                && this.legal_move(x_to, y_to))
    }
}


class Rook extends Pieces 
{
    legal_move(x_to, y_to) 
    {  
        //base legal behaviour
        return x_to === this.x || y_to === this.y
    }

    piece_on_path(x_to, y_to, model)
    {
        //piece_on_path
        let x = this.x
        let y = this.y
        let dx = 0
        let dy = 0
        if (x === x_to)
            {
                 dx = 0
                 dy = (y_to-y)/Math.abs(y_to-y)
            }
        else if (y === y_to)
            {
                dx = (x_to-x)/Math.abs(x_to-x)
                dy = 0
            }
        else 
            {return false}

        while (y !== y_to || x !== x_to)
            {
                x+=dx
                y+=dy
                let current_pos = `${x}-${y}`
                let square_to = `${x_to}-${y_to}`
                let piece = model.get_piece(current_pos)

                if (piece && current_pos !== square_to)
                    {
                        //piece on path
                        return true
                    }
            }
        //path clear
        return false
    }
}


class Bishop extends Pieces 
{
    legal_move(x_to, y_to)
        {   
            return Math.abs(x_to - this.x) === Math.abs(y_to - this.y)
        }

    piece_on_path(x_to, y_to, model)
    {
        let x = this.x
        let y = this.y
        let dx = (x_to-x)/Math.abs(x_to-x)
        let dy = (y_to-y)/Math.abs(y_to-y)

        while (y !== y_to && x !== x_to)
            {
                x+=dx
                y+=dy
                let current_pos = `${x}-${y}`
                let square_to = `${x_to}-${y_to}`
                let piece = model.get_piece(current_pos)

                if (piece && current_pos !== square_to)
                    {
 
                        //piece on path
                        return true
                    }
            }
        //path clear
        return false
    }
}


class King extends Pieces 
{
    legal_move(x_to, y_to)
        {
            return ((Math.abs(x_to - this.x) === 0 || Math.abs(x_to - this.x) === 1))&&
                (((Math.abs(y_to - this.y) === 0 || Math.abs(y_to - this.y) === 1)))
        }   
}


class Queen extends Pieces 
{
    legal_move(x_to, y_to)
    {
        //diagonal direction
        if ((x_to === this.x) || (y_to === this.y))
            {return true}
        //straight directions
        if (Math.abs(x_to - this.x) === Math.abs(y_to - this.y))
            {return true}
        
        //invalid move
       return false
    }

    piece_on_path(x_to, y_to, model, piece_object)
    {   
        /* Have created new bishop and rook objects so can use their
        piece_on_path methods */
        let position = piece_object.get_position()
        let colour = piece_object.get_colour()

        let bishop = new Bishop(position, colour)
        let rook = new Rook(position, colour)

        return bishop.piece_on_path(x_to, y_to, model) || rook.piece_on_path(x_to, y_to, model)
    }
}


class Knight extends Pieces 
{
    get_name()
        {return 'N'}

    legal_move(x_to, y_to)
    {
        if (Math.abs(x_to - this.x) === 2 && Math.abs(y_to - this.y) === 1)
            {return true}
        if (Math.abs(x_to - this.x) === 1 && Math.abs(y_to - this.y) === 2)
            {return true}
        
        //invalid move
        return false
    }
}

class Pawn extends Pieces
{
    can_move(square_to, model, piece_object)
    /* Combined legal_move and piece_on_path for pawns and therefore
    overrode the abstrct can_move method*/
    {
        let x_to = Number(square_to[0])
        let y_to = Number(square_to[2])
        //forwards
        if (this.x === x_to)
        {
            if (Math.abs(this.y-y_to) === 1)
            {   
                if (!model.get_piece((`${x_to}-${y_to}`)))
                    {return true}
            }
            if (Math.abs(this.y-y_to) === 2)
            {
                if (!model.get_piece((`${x_to}-${y_to}`)))
                {
                    if (this.get_position() === this.get_initial_position())
                        {return true}
                }
            }
        }
        //diagonal
        if (Math.abs(this.y - y_to) === 1 && Math.abs(this.x - x_to) === 1)
        {
            if (model.get_piece(`${x_to}-${y_to}`))
                {return true}
        }
        //invalid move
        return false
    }
}

// ---- END PIECE OBJECTS ---- //


// ---- START MODE/VARIATION CLASSES //


class StartingPieces 
{
    /* StartingPieces and its children form the initial board state
    for a given chess variation. Children are the certain variations ie: 
    regular, fischer random etc. */

    constructor()
    {
        this.back_pieces_raw = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]
        //variations (Regular, Fischer etc.)
        this.pieces_obj = {"name": `${this.constructor.name}`, "pieces": []}
    }

    init(rand_cols){
        this.pieces_init(7, 6, 'w', rand_cols)
        this.pieces_init(0, 1, 'b', rand_cols)
    }

    get_pieces_array()
    {
        return this.pieces_obj["pieces"]
    }  

    pieces_init(back_row, pawn_row, colour, rand_cols = null)
    {
        /* Initialises pieces on one side of the board */
        for (let i=0; i<this.back_pieces_raw.length;i++)
        {   
            //back pieces
            let back = new this.back_pieces_raw[i](`${i}-${back_row}`, colour)
            this.pieces_obj["pieces"].push(back)

            //pawns
            let pawn = new Pawn(`${i}-${pawn_row}`, colour)
            this.pieces_obj["pieces"].push(pawn)
        }
    }
}


class Regular extends StartingPieces 
{
    constructor()
    {
        super()
    }
}

class FischerRandom extends StartingPieces {
    constructor()
    {
        super()
        this.col_nums = [0,1,2,3,4,5,6,7]
        this.random_col_nums = []
        this.rand_init()
    }

    rand_init()
    {
        for (let i=0; i<this.back_pieces_raw.length; i++)
        {
            //get random index
            let index = Math.floor((Math.random()*(this.col_nums.length)))
            //get row_number and add it to random array
            let col_number = this.col_nums[index]
            this.random_col_nums.push(col_number)
            //remove that number from the array to avoid duplicates
            this.col_nums.splice(index, 1)
        }
    }

    pieces_init(back_row, pawn_row, colour, rand_cols = null)
    {
        if (rand_cols){this.random_col_nums = rand_cols}
            for (let i=0; i<this.back_pieces_raw.length; i++)
            {
                let col_num = this.random_col_nums[i]
                //add pieces
                let back = new this.back_pieces_raw[i](`${col_num}-${back_row}`, colour)
                this.pieces_obj["pieces"].push(back)

                let pawn = new Pawn(`${col_num}-${pawn_row}`, colour)
                this.pieces_obj["pieces"].push(pawn)
            }
    }
}


class King_Queens extends StartingPieces {
    constructor()
    {
        super()
        this.back_pieces_raw = []
        for (let i=0;i<8;i++){this.back_pieces_raw.push(Queen)}
        this.back_pieces_raw[3] = King
    }
}

class King_Queens_Knights extends StartingPieces {
    constructor()
    {
        super()
        this.back_pieces_raw = [Queen, Knight, Queen, King, Queen, Queen, Knight, Queen]


    }
}

/* class Promotion extends StartingPieces {
    constructor()
    {
        super()
        this.pieces_obj["pieces"] = [new Pawn(`1-1`, 'w'), new Pawn('0-0', 'b'), new Pawn('0-1', 'b')]

    }
} */

/* class Castling extends StartingPieces {
    constructor(){
        super()
        this.pieces_obj["pieces"] = [new King(`4-7`, 'w'), new Rook(`7-7`, 'w')]
    }
} */

let MODES = [Regular, FischerRandom, King_Queens, King_Queens_Knights]

/* ---- START OF ACTUAL MVC ---- */

class Model {
    /* 
    -Class to represent board state
    -stores pieces_map: a map of form {position: piece}
    -position is a str (eg: "0,0")
    -no knowledge of game rules (turns, what moves are allowed etc.)
    -updates pieces_map when told to (its the lil bitch of this entire operation)
    */
    constructor(mode_index, bottom_colour, top_colour, rand_cols = null){
        this.mode_index = mode_index
        this.bottom_colour = bottom_colour
        this.top_colour = top_colour
        this.mode = new MODES[mode_index]
        //for fischer random
        this.random_col_nums = rand_cols || this.mode.random_col_nums
        this.mode.init(this.random_col_nums)
        this.raw_pieces_list = this.mode.get_pieces_array()
        this.pieces_map = new Map()
        this.initialise_pieces_map()
    }
    initialise_pieces_map(){
        for (let piece_obj of this.raw_pieces_list)
            {this.add_piece(piece_obj)}
    }

    get_pieces_map(){
        return this.pieces_map
    }

    get_mode(){
        return this.mode 
    }

    get_bottom_colour(){
        return this.bottom_colour
    }

    get_top_colour(){
        return this.top_colour
    }

    get_raw_pieces_list(){
        return this.raw_pieces_list
    }

    get_piece(position){
        return this.pieces_map.get(position)
    }

    add_piece(piece_object){
        /*
        Adds piece to pieces_map

        Note: Take piece_obj as argument because it stores its own
        position. Therefore, whenever a piece is moved, need to update
        the position in the object itself before adding it to the model 
        */

        let map_key = piece_object.get_position()
        let map_val = piece_object
        this.pieces_map.set(map_key, map_val)
    }
    
    remove_piece(square){
        delete this.get_pieces_map().delete(square)

    }

    move_piece(sq_from, sq_to)
    /* Just moves piece in model */
    {
        let piece = this.get_piece(sq_from)
        piece.change_position(sq_to)
        this.add_piece(piece)
        this.remove_piece(sq_from)
    }

    reset_model(){
        //put pieces in original positions
        this.pieces_map = new Map()
        for (let piece of this.raw_pieces_list){
            piece.change_position(piece.get_initial_position())
            this.add_piece(piece)
        }
        //switch player colours
        let bot_col = this.bottom_colour
        this.bottom_colour = this.top_colour
        this.top_colour = bot_col
    }
}

/*
View class:
-initialises squares 
-initialises pieces in their original positions
*/

class View {
    constructor(model){
        this.board = document.querySelector('.board')
        this.model = model
        this.raw_pieces_list = this.model.get_raw_pieces_list()
        this.yellow_square = null
        this.col_alternator = null
        this.horse_status = false

        //channging square colour stuff
        this.change_colour_btns = document.querySelectorAll('.color-btn')
        this.horse = document.querySelector('.horse-btn')
        this.style = `chess-dot-com`
        this.bind_colour_listener()
        this.bind_horses()
    }

    get_model(){
        return this.model
    }

    bind_colour_listener(){
        for (let btn of this.change_colour_btns){
            btn.addEventListener('click', this.change_sq_colors.bind(this, btn))
        }
    }

    bind_horses(){
            this.horse.addEventListener('click', this.horse_it.bind(this))
    }

    colour_helper(square, number, letter, color)
    {
        square.classList.add(`${color}`)
        let style_tag = `${this.style}-${color.toUpperCase()}`
        square.classList.add(style_tag)
        if (number){
            number.classList.add(`${color}`)
            number.classList.add(style_tag)
        }
        if (letter){
            letter.classList.add(`${color}`)
            letter.classList.add(style_tag)
        }
    }

    letter_number_helper(text, square, status){
        let let_num = document.createElement('label')
        let_num.classList.add('number-letter')
        let_num.classList.add(status)
        let_num.style.backgroundColor = 'transparent'
        let_num.textContent = text
        square.append(let_num)
        return let_num
    }

    draw_sq_helper(col_num, row_num, row){
        let position = `${col_num}-${row_num}`
        let square = document.createElement('div')
        square.classList.add('square')
        square.classList.add('square-'+position)
        row.appendChild(square)
        return square
    }

    form_row_helper(row_num, col_num, row, bot_col){
        //draw square itself
        let position = `${col_num}-${row_num}`
        let square = document.createElement('div')
        square.classList.add('square')
        square.classList.add('square-'+position)
        row.appendChild(square) 
        let number = null
        let letter = null

        if (bot_col === 'w'){
            if (col_num === 0){
                let text = 8-row_num
                number = this.letter_number_helper(text, square, 'number')}
            
            if (row_num === 7){
                let text = String.fromCharCode('a'.charCodeAt()+col_num)
                letter = this.letter_number_helper(text, square, 'letter')
            }
        }

        if (bot_col === 'b'){
            if (col_num === 7){
                let text = 8-row_num
                number = this.letter_number_helper(text, square, 'number')}
            
            if (row_num === 0){
                let text = String.fromCharCode('a'.charCodeAt()+col_num)
                letter = this.letter_number_helper(text, square, 'letter')
            }
        }

        //sort out colours
        if (this.col_alternator) 
        {
            this.colour_helper(square, number, letter, 'white')
            this.col_alternator = false
        }
        else 
        {
            this.colour_helper(square, number, letter, 'black')
            this.col_alternator = true
        }
    }


    form_row(row_num, bot_col)
    {    
        let row = document.createElement('div')
        this.board.appendChild(row)
        row.classList.add(`row`)
        row.classList.add(`row-${row_num}`)
        if (bot_col === 'w'){
            for (let col_num = 0; col_num < 8; col_num++){
                this.form_row_helper(row_num, col_num, row, bot_col)
            }
        }

        if (bot_col === 'b'){
            for (let col_num = 7; col_num > -1; col_num--){
                this.form_row_helper(row_num, col_num, row, bot_col)
            }
        }
    }

    form_board_helper(row_num, bot_col){
        let alternator_start
        if (bot_col === 'w'){
            if (row_num%2 === 0){alternator_start = true}
            else {alternator_start = false}
        }
        if (bot_col === 'b'){
            if (row_num%2 === 0){alternator_start = false}
            else {alternator_start = true}
        }

        this.col_alternator = alternator_start
        this.form_row(row_num, bot_col)
    }

    form_board(bot_col){
        if (bot_col === 'w'){
            for (let row_num=0; row_num<8; row_num++){
                this.form_board_helper(row_num, bot_col)
            }
        }
        if (bot_col === 'b'){
            for (let row_num=7; row_num>-1; row_num--){
                this.form_board_helper(row_num, bot_col)
            }
        } 
    }


    change_sq_colors_helper(color, btn, style)
    {
        let els = document.querySelectorAll(`.${color}`)
        for (let i=0; i<els.length;i++){
            els[i].classList.remove(`${style}-${color.toUpperCase()}`)
            els[i].classList.add(`${btn.classList[1]}-${color.toUpperCase()}`)
        }
    }

    change_sq_colors(btn)
    {
        this.change_sq_colors_helper(`white`, btn, this.style)
        this.change_sq_colors_helper(`black`, btn, this.style)
        this.style = `${btn.classList[1]}`
    }

    draw_piece_img(piece_obj){
        let square = document.querySelector(`.square-${piece_obj.get_position()}`)
        let piece = document.createElement('img')

        piece.src = `${piece_obj.image_path}`

        //horse-case
        if (this.horse_status && piece_obj.get_name() === 'N')
            {piece.src = `actual_pieces/H${piece_obj.get_colour()}.png`}
        
        piece.classList.add("piece")
        piece.classList.add(piece_obj.get_combined_name())
        square.appendChild(piece) 
    }

    delete_piece_img(sq) {
        let square = document.querySelector(`.square-${sq}`)
        square.removeChild(square.lastChild)
    }

    horse_helper(add){
        let horses_white = document.querySelectorAll(`.Nw`)
        let horses_black = document.querySelectorAll(`.Nb`) 

        for (let horse of horses_white){
            horse.src = `actual_pieces/${add}w.png`

        }
        for (let horse of horses_black){
            horse.src = `actual_pieces/${add}b.png`
        }
    }

    horse_it(){
        //unhorse
        if (this.horse_status){
            this.horse.textContent = 'horse'
            this.horse_status = false
            this.horse_helper('N')}
        //horse
        else{
            this.horse.textContent = 'unhorse'
            this.horse_status = true
            this.horse_helper('H')
        }

        

    }

    unhorse_it(){
        this.horse_status = false
        this.horse_helper('N')
    }

    move_piece(sq_from, piece_object)
    /* Deletes sq_from image and redraws at new position */
    {   
        this.draw_piece_img(piece_object)
        this.delete_piece_img(sq_from)

    }
    draw_all_pieces()
    {
        for (let piece_obj of this.model.get_raw_pieces_list())
        {
            this.draw_piece_img(piece_obj)
        }
    }

    yellow_fill(position, turn){
        let piece = this.model.get_piece(position)
        let new_square = document.querySelector(`.square-${position}`)
        this.yellow_square = position

        if (piece && piece.get_colour() === turn)
        {
            new_square.classList.add('yellow')
        }
    }

    remove_previous_yellow(previous_square)
    {
        previous_square.classList.remove('yellow')
    }

    reset_view(){

        //remove existing board
        let rows = document.querySelectorAll('.row')
        for (let row of rows){
            row.remove()
        }
        //remove existing piece images
        let pieces = document.querySelectorAll('.piece')
        for (let piece of pieces){
            piece.remove()
        }
/*         this.draw_all_pieces() */
    }
}
class Controller {
    constructor(model, view, time){
        this.model = model
        this.view = view
        this.king_offsets = [[1,1], [1,0], [1,-1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0,1]]
        this.game = false
        this.checking_piece = null
        //game turn
        this.turn = 'w'
        //client colour
        this.player_colour = this.model.get_bottom_colour()
        this.other_player_colour = this.model.get_top_colour()

        //times
        this.time_original = time
        this.time = time
        this.other_time = time
        
        //whether or not a castle event is currently taking place
        this.castling_status = false

        //promotion stuff
        this.promotion_square = null
        this.promotion_piece = null
        this.promotion_options = [Queen, Knight, Rook, Bishop]
        this.promotion_objects = []

        //Each turn, stores to square and from square (eg: [])
        this.clicks = []

        this.bot_timer = document.querySelector('.bottom-timer')
        this.top_timer = document.querySelector('.top-timer')
    }
	
    init(){
        this.add_click_listener()
        this.set_timers()
        this.show_timers()
        this.start_timer()
        if (this.turn === this.player_colour){
            this.bot_timer.style.backgroundColor = 'white'
        }
        else{
            this.top_timer.style.backgroundColor = 'white'
        }
        
    }
    get_turn()
        {return this.turn}

    get_sq_from()
        {return this.clicks[0]}

    get_sq_to()
        {return this.clicks[1]}

    get_promoting_sq()
        {return this.clicks[2]}

    get_abs_time(player)
        {
            if (player === 'player'){return this.time}
            if (player === 'other'){return this.other_time}
        }
    get_time_string(player)
        {
            let mins = Math.floor(this.get_abs_time(player)/60)
            let secs = this.get_abs_time(player)%60
/*             if (mins < 10){mins = `0${mins}`} */
            if (secs < 10){secs = `0${secs}`}
            return `${mins}:${secs}`
        }
    
    unshow_timers(){
        this.top_timer.style.display = 'none'
        this.bot_timer.style.display = 'none'
    }
    
    show_timers(){
        this.top_timer.style.display = 'block'
        this.bot_timer.style.display = 'block'
    }

    set_timers(){
        this.top_timer.textContent = this.get_time_string('other')
        this.bot_timer.textContent = this.get_time_string('player')
    }

    start_timer(){
        this.timer = setInterval(this.decrement_time.bind(this), 1000)
    }

    decrement_time(){
        if (this.turn === this.player_colour){this.time--}
        else {this.other_time--}
        this.set_timers()
        if (this.time === 0)
            {
                this.stop_timer()
                this.win_method = 'timeout'
                this.end_game(this.other_player_colour)
            }
        if (this.other_time === 0)
            {
                this.stop_timer()
                this.win_method = 'timeout'
                this.end_game(this.player_colour)
            }        
    }

    stop_timer(){
        clearInterval(this.timer)
    }

    clear_clicks()
        {this.clicks = []}
    
    change_turn()
    {
        if (this.turn === 'w'){this.turn = 'b'}
        else {this.turn = 'w'}
        this.clicks = []

        //timer colour stuff
        if (this.turn === this.player_colour){
            this.top_timer.style.backgroundColor = 'gray'
            this.bot_timer.style.backgroundColor = 'white'
        }
        else {
            this.bot_timer.style.backgroundColor = 'gray'
            this.top_timer.style.backgroundColor = 'white'
        }
    }

    can_move(sq_from, sq_to)
    {
        let piece = this.model.get_piece(sq_from)
        let other_piece = this.model.get_piece(sq_to)

        //game on?
        if (!this.game)
            {return false}

        //moving onto occupied square
        if (other_piece && other_piece.get_colour() === this.turn)   
            {return false}     

        //whether move puts in check
        if (this.will_be_in_check(sq_from, sq_to))
        { 
            return false
        }

        //whether next move takes out of check
        if (this.is_in_check(this.model))
            {
                if (this.will_be_in_check(sq_from, sq_to))
                    {
                        return false
                    }

            }
        return piece.can_move(sq_to, this.model, piece)
    }

    move(sq_from, sq_to)
    {   
        //delete piece being taken
        if (this.model.get_piece(sq_to))
        {
            this.view.delete_piece_img(sq_to)
            this.model.remove_piece(sq_to)
        }
        //move current piece
        this.model.move_piece(sq_from, sq_to)
        this.view.move_piece(sq_from, this.model.get_piece(sq_to))
        let squares = [sq_from, sq_to]
        if (this.turn === this.player_colour)
        {
            socket.emit('set-castling', this.castling_status)
            socket.emit('broadcast-move', squares)
        }

    }

    get_king_square(model)
    {
        let board = model.get_pieces_map()
        let king_pos = null
        for (let [pos, piece] of board.entries())
        {
            if (piece.get_piece_obj_name() === 'K'+this.turn)
                {
                    king_pos = pos
                    return king_pos
                }
        }
    }

    is_in_check(model)
    {
        let board = model.get_pieces_map()
        let king_pos = this.get_king_square(model)
        if (king_pos)
        {
            for (let [pos, piece] of board.entries())
            {
                if (piece.get_colour() !== this.turn)
                {
                    if (piece.can_move(king_pos, model, piece))
                        {
                            this.checking_piece = piece
                            return true
                        }
                }
            }
        }
       return false  
    }
    will_be_in_check(sq_from, sq_to)
    {
        let map_copy = new Map(this.model.get_pieces_map())
        let new_model = new Model(0, this.player_colour, this.other_player_colour)
        new_model.pieces_map = map_copy

        if (new_model.get_piece(sq_to))
            {new_model.remove_piece(sq_to)}
        new_model.move_piece(sq_from, sq_to)
        

        let result = this.is_in_check(new_model)

        new_model.get_piece(sq_to).change_position(sq_from)
        return result        
    }

    checkmate()
    {
        if (this.is_in_check(this.model))
        {
            let board = this.model.get_pieces_map()
            let king_pos = this.get_king_square(this.model)

            //can king move
            for (let [dx, dy] of this.king_offsets)
            {
                let x_to = Number(king_pos[0]) + dx
                let y_to = Number(king_pos[2]) + dy
                if (x_to < 0 || y_to < 0)
                    {continue}
                if (x_to > 7 || y_to > 7)
                    {continue}
                let square_to = `${x_to}-${y_to}`
                
                if (this.can_move(king_pos, square_to))
                    {return false}
            }


            for (let [pos, piece] of board.entries())
            {

                if (piece.get_colour() !== this.get_turn())
                    {continue}

                //if checking_piece can be taken
                if (this.can_move(pos, this.checking_piece.get_position()))
                    {return false}
                
                for (let row=0;row<8;row++)
                {
                    for (let col=0;col<8;col++)
                    {
                        let block_square = `${col}-${row}`
                        if (this.can_move(pos, block_square))
                        {
                            if (!this.will_be_in_check(square, block_square))
                                {return false}
                        }
                    }
                }
            }
            this.win_method = 'checkmate'
            return true
        }
    }

    castling()
    {
        /* NOTE: Castling hard coded for regular fischer random*/
        let k_pos = this.get_sq_from()
        let k = this.model.get_piece(k_pos)
        let k_x = k.get_x()
        let k_y = k.get_y()

        let r_pos = this.get_sq_to()
        let r = this.model.get_piece(r_pos)
        let r_x = r.get_x()
        let r_y = r.get_y()

        let dx = k_x - r_x

        function can_castle()
        {
            let mode = this.model.get_mode()

            {if (!this.is_in_check(this.model))
                {if (k.can_castle && r.can_castle)
                    if (k.get_name()==='K' && r.get_name()==='R')
                    {
                        if (k_pos===k.get_initial_position() && r_pos===r.get_initial_position())
                        {
                            //Queen side
                            if (dx > 0)
                                {
                                    for (let i=3; i>1; i--){
                                        let pos = `${i}-${k_y}`
                                        if (this.will_be_in_check(k_pos, pos))
                                            {return false}
                                    }
                                    if (!r.piece_on_path(3, r_y, this.model))
                                    {
                                        this.castling_status = true    
                                        return true
                                    }
                                }
                            //King side
                            if (dx < 0)
                                {
                                    for (let i=5; i<7; i++){
                                        let pos = `${i}-${k_y}`
                                        if (this.will_be_in_check(k_pos, pos))
                                            {return false}
                                        }
                                    if (!r.piece_on_path(5, r_y, this.model))
                                    {
                                        this.castling_status = true
                                        return true
                                    }
                                }
                        }
                    }
                }
            }
            return false
        }

        function castle_move()
        {
            //Queen side
            if (dx > 0)
            {
                let k_new = `${2}-${k_y}`
                let r_new = `${3}-${k_y}`
                this.move(r_pos, r_new)
                this.castling_status = false
                this.move(k_pos, k_new)

            }  
            
            //King side
            if (dx < 0)
            {
                let k_new = `${6}-${k_y}`
                let r_new = `${5}-${k_y}`
                this.move(r_pos, r_new)
                this.castling_status = false
                this.move(k_pos, k_new)
            }

/*         this.castling_status = false */

        let previous_yellow = document.querySelector(`.square-${this.view.yellow_square}`)
        this.view.remove_previous_yellow(previous_yellow)
        this.change_turn()
        return true
        }

        if (can_castle.bind(this)())
            {return castle_move.bind(this)()}
        else
            {return false}        
    }

    is_promoting()
    {
        let sq_to = this.get_sq_to()
        let piece = this.model.get_piece(sq_to)

        if (piece.get_name() === 'P')
        {
            let y_to = piece.get_y()
            if (y_to==0 || y_to==7)
            {
                console.log('promoting')
                this.promotion_piece = piece
                return true
            }
        }
        return false
    }

    promotion()
    {
        let sq_to = this.get_sq_to()
        let piece = this.promotion_piece
        let row = null
        this.promotion_square = sq_to

        for (let i = 0; i < 4; i++)
        {
            //make squares white
            piece.get_y() === 0 ? row = i : row = 7-i

            let square = `${piece.get_x()}-${row}`
            let square_el = document.querySelector(`.square-${square}`)
            square_el.classList.add('promotion')

            //hide existing pieces on board
            let image_el = square_el.firstChild
            if (image_el)
                {image_el.style.display = 'none'}
                    
            //draw piece options
            let piece_option = new this.promotion_options[i](square, this.promotion_piece.get_colour())
            this.promotion_objects.push(piece_option)
            this.view.draw_piece_img(piece_option)
        }
    }

    execute_promotion()
    {
        //select piece
        let choice_square = this.get_promoting_sq()
        let choice_piece = null
        for (let piece of this.promotion_objects)
        {
            if (choice_square == piece.get_position())
                {choice_piece = piece}
            this.view.delete_piece_img(piece.get_position())

            //housekeeping (remove white square, unhide covered pieces)
            let square_el = document.querySelector(`.square-${piece.get_position()}`)
            square_el.classList.remove('promotion')
            if (square_el.lastChild)
                {square_el.lastChild.style.display = 'block'}
        }

        //add chosen piece
        choice_piece.change_position(this.promotion_square)
        this.model.add_piece(choice_piece)
        this.view.draw_piece_img(choice_piece)
        socket.emit('add-piece', choice_piece.get_combined_name(), choice_piece.get_position(), choice_piece.get_colour())
        //housekeeping
        this.promotion_objects = []
        this.change_turn()
    }

    sound_effect_handler(piece){
        let src = `sound_effects/${piece.get_name()}${Math.round(Math.random())+1}.mp3`
        let audio = document.createElement('audio')
        audio.src = src
        audio.play()
    }

    
    add_click_listener(){
        let squares = document.getElementsByClassName('square')
        for (let i=0; i < squares.length; i++){
            squares[i].addEventListener('click', this.click_listener.bind(this, squares[i].classList[1]))
        }
    }

    end_game(winner){
        this.game = false
        socket.emit('end-game-other', winner, this.win_method)
        socket.emit('end-game-self', winner, this.win_method)
    }

    click_listener (pos_str) {
        /* 
        -event listener:
            -adds sq_from and sq_to for each turn
            -adds yellow square when click own piece
        */
        if (!this.game){return}
        let position_string = pos_str
        let x = Number(position_string[7])
        let y = Number(position_string[9])
        let position = `${x}-${y}`
        //undefined on second click (obviously)
        let piece = this.model.get_piece(position)
        //can click that piece
        if (piece && piece.get_colour() !== this.player_colour && this.clicks.length === 0){return}

        //clicked square turns yellow
        if (this.view.yellow_square)
        {
            let previous_yellow = document.querySelector(`.square-${this.view.yellow_square}`)
            this.view.remove_previous_yellow(previous_yellow)
        }
        this.view.yellow_fill(position, this.turn)


        //execute promotion
        if (this.clicks.length == 2)
        {
            this.clicks.push(position)
            this.execute_promotion()
        }

        //sq_from
        if (this.clicks.length === 0)
        {
            if (piece && piece.get_colour() === this.turn)
                {return this.clicks.push(position)}  
        }


        //sq_to
        if (this.clicks.length === 1)
        {
            this.clicks.push(position)
            if (piece && piece.get_colour() === this.turn)
                {
                    if (this.castling())
                        {return}
                    else
                        {
                            this.clear_clicks()
                            return this.clicks.push(position)
                        }
                }
            if (this.can_move(this.get_sq_from(), this.get_sq_to()))
            {
                this.move(this.get_sq_from(), this.get_sq_to())
                let piece = this.model.get_piece(this.get_sq_to())
                if (piece.get_name() === 'K' || piece.get_name() === 'R'){
                    piece.can_castle = false
                }
                if (this.view.horse_status && piece.get_name() === 'N'){
                    this.sound_effect_handler(piece)
                }


                if (this.is_promoting())
                {
                    //remove promoting piece
                    this.model.remove_piece(this.get_sq_to())
                    this.view.delete_piece_img(this.get_sq_to())
                    socket.emit('remove-piece', this.get_sq_to())
                    //promotion
                    return this.promotion()
                }
                this.change_turn()
            }
            else
            {
                return this.clear_clicks()
            }
        }

        if (this.checkmate())
        {
            this.end_game(this.player_colour)
        }
    }

    reset_controller(){
        //restores controller for a rematch
        this.game = true
        this.checking_piece = null
        this.turn = 'w'
        this.time = this.time_original
        this.other_time = this.time_original
        this.player_colour = this.model.get_bottom_colour()
        this.other_player_colour = this.model.get_top_colour()
        this.castling_status = false
        this.promotion_square = null
        this.promotion_piece = null
        this.promotion_options = [Queen, Knight, Rook, Bishop]
        this.promotion_objects = []
        this.clicks = []
        this.add_click_listener()
        this.show_timers()
        this.set_timers()
        setTimeout(()=>{
            this.start_timer()
        }, 1000)
    }
}

/*
TODO:

-randomly assign either player black or white to start
-normal moves appear on other player's screen 
-castling and promotion shown on other player's screen


*/























//--- CLIENT-SERVER INTERACTION LOGIC ---//


/* let start_btn = document.querySelector('.start-game-btn')
let actual_start_btn = document.querySelector('.actual-game-btn')
start_btn.addEventListener('click', function(){
    console.log('start-game')
    socket.emit('start-game-server')
    actual_start_btn.style.display = "inline-block"
    this.style.display = "none"
})



socket.on('start-game-client', () => {
    let model = new Model(0)
    let view = new View(model) 
    let controller = new Controller(model, view)
    let game = new Setup()
    actual_start_btn.addEventListener('click', function(){
        view.draw_all_pieces()
        controller.game = true
        this.style.display = "none"
    })
}) */





let colours = null
Math.round(Math.random()) ? colours = ['w', 'b'] : colours = ['b', 'w']

























