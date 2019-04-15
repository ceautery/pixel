player = {};
let tailImage

game = {
    cellSize: 25,
    fillSize: 22,
    width: 40,
    height: 30,
    score: 0
}

fruit = {
    color:'red',
     x: 10,
     y: 10
}

cnv.width = game.width * game.cellSize;
cnv.height = game.height * game.cellSize;
ctx = cnv.getContext('2d');

tail = [];
snakeLength = 3;

function draw() {
    let direction = player.directionQueue.shift();
    if (direction == 'ArrowDown' && player.yDir != -1) {
        player.yDir = 1;
        player.xDir = 0;
    } else if (direction == 'ArrowUp'  && player.yDir != 1) {
        player.xDir = 0;
        player.yDir = -1;
    } else if (direction == "ArrowLeft" && player.xDir != 1) {
        player.xDir = -1;
        player.yDir = 0;
    } else if (direction == "ArrowRight" && player.xDir != -1) {
        player.xDir = 1;
        player.yDir = 0;
    }

    tail.push({x: player.x, y: player.y, color: 'green', image: tailImage, xDir: player.xDir, yDir: player.yDir});
    tail = tail.slice(-snakeLength);

    player.x = player.x + player.xDir;
    player.y = player.y + player.yDir;

    if (
        player.y < 0 
        || player.y >= game.height
        || player.x < 0 
        || player.x >= game.width
        || touchingTail()
    ) {
        gameOver()
    } else {
        if (player.x == fruit.x && player.y == fruit.y) {
            makeFruit();
        }

        ctx.clearRect(0,0,cnv.width,cnv.height);
        drawObject(player);
        tail.forEach(drawObject);
        drawObject(fruit);
    }
}

function touchingTail() {
    touching = tail.filter(function(piece) { return piece.x == player.x && piece.y == player.y });
    return touching.length > 0;
}

function makeFruit() {
    snakeLength += 3;
    fruit.x = getRandom(game.width);
    fruit.y = getRandom(game.height);
    game.score++;
    drawScore();
}

function getRandom(max) {
    return Math.floor(Math.random() * max);
}

function gameOver() {
    clearInterval(interval);
}

function keyHandler(e) {
    player.directionQueue.push(e.key)
}

function getRotation(obj) {
  if (obj.yDir == 1) return Math.PI / 2
  if (obj.yDir == -1) return -(Math.PI / 2)
  if (obj.xDir == -1) return Math.PI
  return 0
}

function drawObject(obj) {
  const x = obj.x * game.cellSize
  const y = obj.y * game.cellSize

  if (obj.image) {
    if (obj != fruit) {
      const half = game.cellSize / 2
      ctx.save()
      ctx.translate (x + half, y + half)
      ctx.rotate(getRotation(obj))
      ctx.drawImage(obj.image, -half, -half)
      ctx.restore()
    } else {
      ctx.drawImage(obj.image, x, y)
    }
  } else {
    ctx.fillStyle = obj.color;
    ctx.fillRect(x, y, game.fillSize, game.fillSize)
  }
}

onkeydown = keyHandler;

function drawScore() {
    score.innerText = "Score: " + game.score;
}

function gameStart() {
    interval = setInterval(draw, 100);
    tail = [];
    snakeLength = 3;
    game.score = 0;
    player = {
        color:"green",
        x: 20,
        y: 20,
        xDir: 1,
        yDir: 0,
        directionQueue: []
    }
    drawScore();
  const playerImage = new Image()
  playerImage.onload = () => player.image = firstFrame(playerImage)
  playerImage.src = "/pixel/sprites/head/head"

  const fruitImage = new Image()
  fruitImage.onload = () => fruit.image = firstFrame(fruitImage)
  fruitImage.src = "/pixel/sprites/fruit/fruit"

  const tailImageLoader = new Image()
  tailImageLoader.onload = () => tailImage = firstFrame(tailImageLoader)
  tailImageLoader.src = "/pixel/sprites/tail/tail"
}

function firstFrame(image) {
  const canvas = document.createElement('canvas')
  canvas.width = game.fillSize
  canvas.height = game.fillSize

  const pen = canvas.getContext('2d')
  pen.drawImage(image, 0, 0)
  const frame = new Image()
  frame.src = canvas.toDataURL()
  return frame
}
