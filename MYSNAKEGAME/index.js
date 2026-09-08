document.addEventListener('DOMContentLoaded',function(){
    const gameArena = document.getElementById('game-arena');
    const areaSize=600;
    const cellSize =20;
    let score =0; //score of the game 

    let gameStarted =false; //game status
    let food ={x:300,y:200} // //{x: 15*20 , y : 10*20} // --> cell coordinate -->pixel // top left pixels for food

    let snake  =[{x:160 , y:200}, {x:140, y:200}, {x:120, y:200}]; // [head , body ,body ,tail]
    
    let dx = cellSize; // +20 // DISPLACEMENT ON X AXIS
    let dy = 0; // DISPLACEMENT ON Y AXIS
    let intervalId;
    let gameSpeed =200;
    

    function moveFood(){
        let newX, newY;
        do{
            newX= Math.floor(Math.random() *30 ) * cellSize;
            newY= Math.floor(Math.random() *30 ) * cellSize;
        }while(snake.some(snakeCell => snakeCell.x === newX && snakeCell.y === newY));

        food = { x: newX, y: newY};
    }


    function updateSnake(){
        console.log("Update snake called");

        // calculate the new coordinate the snake head will go 
        const newHead = { x:snake[0]. x + dx, y: snake[0].y + dy};
        snake.unshift(newHead); // Add new Head to the snake 
        
        //check collision with food
        if(newHead.x == food.x && newHead.y == food.y){
            //collision

            console.log("Collided");
            score +=10;
            moveFood();

            if(gameSpeed >50){
                clearInterval(intervalId);
                gameSpeed -=10;
                gameLoop();
            }
            // DO NOT POP THE TAIL
            moveFood();
            // MOVE THE FOOD
        }
        else{
            snake.pop(); //remove LAST CELL
        }
    }
    
    function changeDirection(e){
       console.log("Key Pressed" ,e);
       const isGoingDown = dy === cellSize;
       const isGoingup  = dy === -cellSize;
       const isGoingRight = dx === cellSize;
       const isGoingLeft =dx === -cellSize;
       if(e.key === 'ArrowUp' &&  !isGoingDown){
        dx = 0;
        dy =-cellSize;

       }
       else if(e.key === 'ArrowDown' && !isGoingup){
        dx=0;
        dy =cellSize;
       }
       else if(e.key === 'ArrowLeft' && !isGoingRight){
          dx= -cellSize;
          dy = 0;
       }
       else if(e.key === 'ArrowRight' && !isGoingLeft){
        dx =cellSize;
        dy=0;
       }
    }


    function drawDiv(x, y, className){
        const divElement = document.createElement('div');
        divElement.classList.add(className);
        divElement.style.top =`${y}px`;
        divElement.style.left =`${x}px`;
        return divElement;

    }

    function drawFoodAndSnake(){
        gameArena.innerHTML =' '; //clear the game Arena 
        // wipe out everytime and redraw with new positions
        
        snake.forEach((snakeCell) =>{
            const snakeElement =drawDiv(snakeCell.x, snakeCell.y, 'snake');
            gameArena.appendChild(snakeElement);
        })
        const foodElement = drawDiv(food.x, food.y, 'food');
        gameArena.appendChild(foodElement);
    }
     function isGameOver(){
        // snake collision checks BODY
         
        for(let i= 1; i<snake.length;i++){
            if(snake[0].x === snake[i].x && snake[0].y ===snake[i].y){
                return true; // GAME OVER
            }
        }
         //wall collision checks
        const hitLeftWall =snake[0].x < 0; // snake[0] ->head
        const hitRightWall = snake[0].x > areaSize - cellSize;
        const hitTopWall = snake[0].y < 0;
        const hitBottomWall = snake[0].y >areaSize - cellSize;

        return hitLeftWall || hitBottomWall || hitRightWall || hitTopWall; // GAME OVER

     }
    function gameLoop(){
        intervalId=setInterval(() =>{

            // CHECK FOR GAME OVER
            if(isGameOver()){
                clearInterval(intervalId);
                gameStarted = false; 
                alert('Game Over' + '\n' + 'Your Score: ' + score);
                return;

            }
            updateSnake();
            drawFoodAndSnake();
            drawScoreBoard();
        }, gameSpeed);
    }

    function runGame(){
        if(!gameStarted){
            gameStarted =true;
            document.addEventListener('keydown', changeDirection);
        
            gameLoop();// TODO: Implement game loop
        }
    }

    function drawScoreBoard(){
     const scoreBoard =document.getElementById('score-board');
     scoreBoard.textContent =`score: ${score}`;

    }

    function initiateGame(){
        const scoreBoard =document.createElement('div');
        scoreBoard.id ='score-board';

        document.body.insertBefore(scoreBoard,gameArena); //insert score board before the game Arena
        
        const startButton =document.createElement('button');
        startButton.textContent='Start Game';
        startButton.classList.add('start-button');

        startButton.addEventListener('click', function startGame(){
            startButton.style.display= 'none'; // hide start button 

            runGame();
        });

        document.body.appendChild(startButton); //Append start button to the body 


    }
    initiateGame();  // THIS IS THE FIRST FUNCTION TO BE EXECUTED SO THAT WE PREPARE THE UI
});