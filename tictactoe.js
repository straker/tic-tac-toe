// canvas
var canvas       = document.getElementById('board');
var ctx          = canvas.getContext('2d');
var oneThird     = canvas.width / 3;

// scores
var win          = 0;
var loss         = 0;
var draw         = 0;

// game board
var theGameBoard = {};

/**
 * A single move of row, col
 */
function Move(r, c) {
  this.row = r || 0;
  this.col = c || 0;
}

/**
 * The Tic-Tac-Toe board
 */
function Board() {
  // players: -1 = player, 1 = computer
  this.playerTurn    = -1;  // current players turn to move
  this.winningPlayer = 0;   // the winning player resulting from a move
  this.gameBoard     = [];  // 2d array of integers representing state of square

  /*
    ownership arrays are used to determine the evaluation of the board for each move.
       Better moves are those that reduce the ownership of the board for the opponent.

    Ownership: the player with a row/col/diag that does not contain the other player
               -1 = player, 1 = computers, 0 = none

    Array index meanings:
        0   1   2
      +---+---+---+
    0 | 0 |   | 1 |
      +---+---+---+
    1 |   |0/1|   |
      +---+---+---+
    2 | 1 |   | 0 |
      +---+---+---+
  */
  this.rowOwners     = [];  // player ownership of each row [0-2]
  this.colOwners     = [];  // player ownership of each col [0-2]
  this.diagOwners    = [];  // player ownership of each diag [0-1]

  /*
    sum arrays are used to help the AI favor blocking moves. A total of 2 in any
       row/col/diag means the AI should block by moving in the empty square
  */
  this.rowSums       = [];  // the sum of player numbers for each row [0-2]
  this.colSums       = [];  // the sum of player numbers for each col [0-2]
  this.diagSums      = [];  // the sum of player numbers for each diag [0-1]

  // create the board and fill it with 0
  for (var i = 0; i < 3; i++) {
    this.gameBoard[i] = [];
    for (var j = 0; j < 3; j++) {
      this.gameBoard[i][j] = 0;  // -1 = player, 1 = computer, 0 = empty
    }
  }

  /**
   * Return all possible moves for the current board
   */
  this.getMoves = function () {
    var moves = [];
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        if (this.gameBoard[i][j] == 0) {
          moves.push(new Move(i, j));
        }
      }
    }

    return moves;
  };

  /**
   * Return a new board with the new move
   */
  this.makeMove = function(move) {
    var newBoard = new Board();
    newBoard.playerTurn = this.playerTurn;

    // copy the boards current moves
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        newBoard.gameBoard[i][j] = this.gameBoard[i][j];
      }
    }

    // make the new move and change turns
    newBoard.gameBoard[move.row][move.col] = this.playerTurn;
    newBoard.playerTurn = (this.playerTurn == -1 ? 1 : -1);

    return newBoard;
  };

  /**
   * Evaluate the board for each move for the current player
   * SCORES:
   *   win/loss: 100 * depth
   *   block:    90
   *   other:    0-4
   */
  this.evaluate = function(depth) {
    if (this.isGameOver()) {
      // player    winner    outcome
      //   -1        1        -100
      //   -1       -1         100
      //    1        1         100
      //    1       -1        -100
      return 100 * this.playerTurn * this.winningPlayer * (depth + 1); // Favor moves that win faster
    }

    var playerOwnership = 0;
    var computerOwnership = 0;

    // count board ownership for row and col
    for (var i = 0; i < 3; i++) {
      if (this.rowOwners[i] == 1) {
        playerOwnership++;
      }
      else if (this.rowOwners[i] == -1) {
        computerOwnership++;
      }

      if (this.colOwners[i] == 1) {
        playerOwnership++;
      }
      else if (this.colOwners[i] == -1) {
        computerOwnership++;
      }

      // favor blocking moves by making non-blocking moves bad
      if (this.rowSums[i] == 2 * this.playerTurn || this.colSums[i] == 2 * this.playerTurn) {
        return -90 * this.playerTurn;
      }
    }

    // count board ownership for diag
    for (var i = 0; i < 2; i++) {

      if (this.diagOwners[i] == 1) {
        playerOwnership++;
      }
      else if (this.diagOwners[i] == -1) {
        computerOwnership++;
      }

      // favor blocking moves by making non-blocking moves bad
      if (this.diagSums[i] == 2 * this.playerTurn) {
        return -90 * this.playerTurn;
      }
    }

    // how well the move reduced the players ownership of the board
    return (playerOwnership - computerOwnership) * this.playerTurn;
  };

  /**
   * Return if the current move ends the game. Also set board ownership and sum arrays
   */
  this.isGameOver = function () {
    var rowSum      = 0;
    var colSum      = 0;
    var diagLRSum   = 0;     // diagSums[0]
    var diagRLSum   = 0;     // diagSums[1]
    var isDraw      = true;  // true if the game is a draw

    // reset ownership and sum arrays
    this.rowOwners  = [];
    this.colOwners  = [];
    this.diagOwners = [];
    this.rowSums    = [];
    this.colSums    = [];
    this.diagSums   = [];

    // loop through each row
    for (var i = 0; i < 3; i++) {
      rowSum = 0;
      colSum = 0;

      diagLRSum += this.gameBoard[i][i];
      diagRLSum += this.gameBoard[i][2-i];

      // calculate diagLR owners
      if (this.gameBoard[i][i] !== 0) {
        if (typeof this.diagOwners[0] == 'undefined') {
          this.diagOwners[0] = this.gameBoard[i][i];
        }
        else if (this.gameBoard[i][i] != this.diagOwners[0]) {
          this.diagOwners[0] = 0;
        }
      }

      // calculate diagLR owners
      if (this.gameBoard[i][2-i] !== 0) {
        if (typeof this.diagOwners[1] == 'undefined') {
          this.diagOwners[1] = this.gameBoard[i][2-i];
        }
        else if (this.gameBoard[i][2-i] != this.diagOwners[1]) {
          this.diagOwners[1] = 0;
        }
      }

      // loop through each col
      for (var j = 0; j < 3; j++) {
        rowSum += this.gameBoard[i][j];
        colSum += this.gameBoard[j][i];

        // calculate row owners
        if (this.gameBoard[i][j] !== 0) {
          if (typeof this.rowOwners[i] == 'undefined') {
            this.rowOwners[i] = this.gameBoard[i][j];
          }
          else if (this.gameBoard[i][j] != this.rowOwners[i]) {
            this.rowOwners[i] = 0;
          }
        }

        // calculate col owners
        if (this.gameBoard[j][i] !== 0) {
          if (typeof this.colOwners[i] == 'undefined') {
            this.colOwners[i] = this.gameBoard[j][i];
          }
          else if (this.gameBoard[j][i] != this.colOwners[i]) {
            this.colOwners[i] = 0;
          }
        }

        // not a draw if there is an empty square
        if (this.gameBoard[i][j] == 0) {
          isDraw = false;
        }
      }

      this.rowSums[i] = rowSum;
      this.colSums[i] = colSum;

      // set owner to 0 if no player owns it
      if (typeof this.rowOwners[i] == 'undefined') {
        this.rowOwners[i] = 0;
      }
      if (typeof this.colOwners[i] == 'undefined') {
        this.colOwners[i] = 0;
      }

      // game over if total is 3
      if (Math.abs(rowSum) == 3) {
        this.winningPlayer = rowSum < 0 ? -1 : 1;
        return true;
      }
      if (Math.abs(colSum) == 3) {
        this.winningPlayer = colSum < 0 ? -1 : 1;
        return true;
      }

      rowSum = 0;
      colSum = 0;
    }

    this.diagSums[0] = diagLRSum;
    this.diagSums[1] = diagRLSum;

    // set owner to 0 if no player owns it
    if (typeof this.diagOwners[0] == 'undefined') {
      this.diagOwners[0] = 0;
    }
    if (typeof this.diagOwners[1] == 'undefined') {
      this.diagOwners[1] = 0;
    }

    // game over if total is 3
    if (Math.abs(diagLRSum) == 3) {
      this.winningPlayer = diagLRSum < 0 ? -1 : 1;
      return true;
    }
    if (Math.abs(diagRLSum) == 3) {
      this.winningPlayer = diagRLSum < 0 ? -1 : 1;
      return true;
    }

    // game over if it is a draw
    if (isDraw) {
      this.winningPlayer = 0;
      return true;
    }

    return false;
  };
};

/**
 * Draw the game board to the screen
 */
function drawBoard() {
  ctx.strokeStyle = 'black';
  ctx.lineWidth   = 2;
  ctx.fillStyle   = 'black';
  ctx.font        = "50pt Calibri";

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the lines
  ctx.beginPath();
  ctx.moveTo(oneThird, 0);
  ctx.lineTo(oneThird, canvas.height);
  ctx.moveTo(2 * oneThird, 0);
  ctx.lineTo(2 * oneThird, canvas.height);
  ctx.moveTo(0, oneThird);
  ctx.lineTo(canvas.width, oneThird);
  ctx.moveTo(0, 2 * oneThird);
  ctx.lineTo(canvas.width, 2 * oneThird);
  ctx.stroke();

  // Draw the players
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      if (theGameBoard.gameBoard[i][j] != 0) {
        if (theGameBoard.gameBoard[i][j] == -1) {
          ctx.fillText('X', j * oneThird + (oneThird / 2) - 20, i * oneThird + (oneThird / 2) + 20);
        }
        else {
          ctx.fillText('O', j * oneThird + (oneThird / 2) - 20, i * oneThird + (oneThird / 2) + 20);
        }
      }
    }
  }
}

/**
 * Handle player click
 */
canvas.onclick = function(e) {
  // only allow player to move on their turn
  if (theGameBoard.playerTurn == -1) {

    // get the row/col of the click
    var x   = e.offsetX || e.layerX;
    var y   = e.offsetY || e.layerY;
    var row = Math.floor(y / oneThird);
    var col = Math.floor(x / oneThird);

    // only move if the square is empty
    if (theGameBoard.gameBoard[row][col] == 0) {
      theGameBoard.gameBoard[row][col] = -1;
      drawBoard();

      // move ended the game
      if (theGameBoard.isGameOver()) {
        // player won
        if (theGameBoard.winningPlayer == -1) {
          win++;
          document.getElementById('win').innerHTML=win;
          if(confirm("You Win! Play again?")) {
            theGameBoard = new Board();
            drawBoard();
          }
        }
        // draw
        else if (theGameBoard.winningPlayer == 0) {
          draw++;
          document.getElementById('draw').innerHTML=draw;
          if(confirm("Cat's Game. Play again?")) {
            theGameBoard = new Board();
            drawBoard();
          }
        }
      }
      else {
        // AI's turn
        theGameBoard.playerTurn = 1;
        takeTurnAI();
      }
    }
  }
}

/**
 * Have the AI make a move by using the game tree
 */
function takeTurnAI() {
  var maxDepth = 8;  // how far to search the game tree
  var bestMove = abNegamax(theGameBoard, 0+maxDepth, -Infinity, Infinity);

  // make the move for the AI
  theGameBoard.gameBoard[bestMove.move.row][bestMove.move.col] = 1;
  drawBoard();

  // AI won
  if (theGameBoard.isGameOver()) {
    loss++
    document.getElementById('loss').innerHTML=loss;
    if(confirm("You Lose. Play again?")) {
      theGameBoard = new Board();
      drawBoard();
    }
  }
  else {
    // player's turn
    theGameBoard.playerTurn = -1;
  }
}

/**
 * AB Negamax Game Tree algorithm
 */
function abNegamax(board, currentDepth, alpha, beta) {
  // check if we're done recursing
  if (board.isGameOver() || currentDepth == 0) {
    return {'score': board.evaluate(currentDepth), 'move': null};
  }

  // otherwise bubble up values from below
  var bestMove = null;
  var bestScore = -Infinity;

  // go through each move
  var moves = board.getMoves();
  for (var i = 0; i < moves.length; i++) {
    var move     = moves[i];
    var newBoard = board.makeMove(move);

    // recurse
    var newBestMove  = abNegamax(newBoard, currentDepth-1, -beta, -Math.max(alpha, bestScore));
    var currentScore = -newBestMove.score;

    // update the best score
    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestMove = move;

      // if we're outside the bounds, then prune: exit immediately
      if (bestScore >= beta) {
        return {'score': bestScore, 'move': bestMove};
      }
    }
  }

  // return the score and the best move
  return {'score': bestScore, 'move': bestMove};
}

theGameBoard = new Board();
drawBoard();