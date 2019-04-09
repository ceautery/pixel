// A loving homage to http://www.lessmilk.com/game/dark-blue/

var definitions = {
  x: Wall,
  o: Coin,
  '@': Player,
  '!': Lava,
  '=': LavaHorizontal,
  '|': LavaVertical,
  'v': LavaRepeating
},

levels = [`
                      
                      
  x              = x  
  x         o o    x  
  x @      xxxxx   x  
 xxxxxx            x  
      x!!!!!!!!!!!!x  
      xxxxxxxxxxxxxx  
                      
`,`
       x!!!x                 
       xx!xx                 
        xvx              o o 
                             
                        xxxxx
                             
                             
 @     xxxxx                 
xxxxxxxx   xxxx     xxxxxxxxx
              x     x        
              x!!!!!x        
              x!!!!!x        
              xxxxxxx        
`,`
                   v 
x=                  x
x|                  x
x     o o o o o o o x
x      o o o o o o  x
x     o o o o o o o x
x                   x
x @                 x
xxxxxxxxxxxxxxxxxxxxx
`,`
                   v 
x=                  x
x|                  x
x       o o o o   o x
x      o o   o o o  x
x       o o o o o o x
x                   x
x   @  @  @   @     x
xxxxxxxxxxxxxxxxxxxxx
`,`
         v   v     v 
x=  v   v   v     v x
x|                  x
x             o   o x
x      o o   o   o  x
x           o o o o x
x                   x
x             @     x
xxxxxxxxxxxxxxxxxxxxx
`],
step = 5/300,
scale = 50,
ctx,
wobbleSpeed = 8, wobbleDist = 0.07,
playerXSpeed = 7,
gravity = .5,
jumpSpeed = 17,
pressed = {},
keys = {37: "left", 38: "up", 39: "right"},
level;

const frames = {
  lava: [],
  coin: [],
  player: { move: [], jump: [], stand: [] },
  lava2: []
}

const sizes = {
  coin: {x: 15, y: 15},
  lava: {x: 15, y: 15},
  player: {x: 15, y: 15}
}

function loadTemplates() {
  const canvas = document.createElement('canvas')
  const pen = canvas.getContext('2d')

  const coin = new Image()
  coin.onload = () => {
    const size = sizes.coin
    canvas.width = size.x
    canvas.height = size.y
    const frameCount = coin.width / size.x
    for (let i = 0; i < frameCount; i++) {
      pen.clearRect(0, 0, canvas.width, canvas.height)
      pen.drawImage(coin, -i * size.x, 0)
      const image = new Image()
      image.src = canvas.toDataURL()
      frames.coin.push(image)
    }
  }
  coin.src = "/pixel/sprites/coin"

  const lava = new Image()
  lava.onload = () => {
    const size = sizes.lava
    canvas.width = size.x
    canvas.height = size.y
    const frameCount = lava.width / size.x
    for (let i = 0; i < frameCount; i++) {
      pen.clearRect(0, 0, canvas.width, canvas.height)
      pen.drawImage(lava, -i * size.x, 0)
      const image = new Image()
      image.src = canvas.toDataURL()
      frames.lava.push(image)
    }
    frames.lava2 = frames.lava.slice()
    const lava2 = new Image()
    lava2.onload = () => {
      const size = sizes.lava
      canvas.width = size.x
      canvas.height = size.y
      const frameCount = lava.width / size.x
      for (let i = 0; i < frameCount; i++) {
        pen.clearRect(0, 0, canvas.width, canvas.height)
        pen.drawImage(lava2, -i * size.x, 0)
        const image = new Image()
        image.src = canvas.toDataURL()
        frames.lava2.push(image)
      }
    }
    lava2.src = "/pixel/sprites/lava2"
  }
  lava.src = "/pixel/sprites/lava"

  const player = new Image()
  player.onload = () => {
    const size = sizes.player
    canvas.width = size.x
    canvas.height = size.y
    const frameCount = player.width / size.x
    Object.values(frames.player).forEach((action, y) => {
      for (let x = 0; x < frameCount; x++) {
        pen.clearRect(0, 0, canvas.width, canvas.height)
        pen.drawImage(player, -x * size.x, -y * size.y)
        const imageData = pen.getImageData(0, 0, canvas.width, canvas.height)
        if (x == 0 || hasData(imageData)) {
          const image = new Image()
          image.src = canvas.toDataURL()
          action.push(image)
        }
      }
    })
  }
  player.src = "/pixel/sprites/player"
}

loadTemplates()

function hasData(imageData) {
  const view = new Uint32Array(imageData.data.buffer)
  return view.map(e => (e >> 24) & 255).some(e => e)
}

function GameObject(name, pos, size) {
  this.name = name;
  this.size = size;
  this.pos = pos;
  this.vector = new Vector(0, 0);
  this.obstacle = true;
  this.moves = false;
  this.affectsPlayer = false;
};
GameObject.prototype.draw = function(pen) {
  pen.fillStyle = 'white';
  pen.fillRect(0, 0, this.size.x, this.size.y);
};

GameObject.prototype.getCollisions = function() {
  var r1 = {x: this.pos.x, y: this.pos.y, w: this.size.x, h: this.size.y};
  var collisions = level.gameObjects.filter(o => {
    if (o == this) return false;
    var r2 = {x: o.pos.x, y: o.pos.y, w: o.size.x, h: o.size.y};
    return overlaps(r1, r2)
  });

  if (r1.x < 0 || (r1.x + r1.w) > level.width ||
      r1.y < 0 || (r1.y + r1.h) > level.height)
    collisions.push(level.border);
  return collisions;
}

function Wall(pos) {
  GameObject.call(this, 'wall', pos, new Vector(1, 1));
}
Wall.prototype = new GameObject;

function Coin(pos) {
  GameObject.call(this, 'coin', pos, new Vector(.6, .6));
  this.obstacle = false;
  this.affectsPlayer = true;
  this.moves = true;
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.wobble = Math.random() * Math.PI * 2;
  this.frameNum = 0
  this.step = 0
}

Coin.prototype.draw = function(pen) {
  if (frames.coin.length) {
    pen.save()
    pen.scale(1/25, 1/25)
    pen.drawImage(frames.coin[this.frameNum], 0, 0)
    pen.restore()
  } else {
    pen.fillStyle = 'rgb(241, 229, 89)';
    pen.fillRect(0, 0, this.size.x, this.size.y);
  }
};

Coin.prototype.act = function() {
  this.step++
  if (this.step == 10) {
    this.step = 0
    this.frameNum++
    if (this.frameNum >= frames.coin.length) this.frameNum = 0
  }

  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos))
}

function Lava(pos) {
  GameObject.call(this, 'lava', pos, new Vector(1, 1));
  this.affectsPlayer = true;
  this.frameNum = 0
  this.step = 0
  this.moves = true
}
Lava.prototype = new GameObject;

Lava.prototype.draw = function(pen) {
  if (frames.lava.length) {
    pen.save()
    pen.scale(1/15, 1/15)
    pen.drawImage(frames.lava[this.frameNum], 0, 0)
    pen.restore()
  } else {
    pen.fillStyle = 'rgb(255, 100, 100)';
    pen.fillRect(0, 0, this.size.x, this.size.y);
  }
}

Lava.prototype.act = function() {
  this.step++
  if (this.step == 20) {
    this.step = 0
    this.frameNum++
    if (this.frameNum >= frames.lava.length) this.frameNum = 0
  }

  var oldPos = this.pos;
  this.pos = this.pos.plus(this.vector.times(step));
  if (this.getCollisions().filter(o => o.obstacle).length) {
    if (this.repeatPos) {
      this.pos = this.repeatPos
    } else {
      this.pos = oldPos;
      this.vector = this.vector.times(-1);
    }
  }
}

function LavaHorizontal(pos) {
  Lava.call(this, pos);
  this.obstacle = false;
  this.moves = true;
  this.vector = new Vector(2, 0);
}
LavaHorizontal.prototype = new Lava;

function LavaVertical(pos) {
  LavaHorizontal.call(this, pos);
  this.vector = new Vector(0, 2);
}
LavaVertical.prototype = new LavaHorizontal;

function LavaRepeating(pos) {
  LavaHorizontal.call(this, pos);
  this.vector = new Vector(0, 3);
  this.repeatPos = pos;
}
LavaRepeating.prototype = new LavaHorizontal;

function Player(pos) {
  pos = pos.plus(new Vector(0, -0.5));
  GameObject.call(this, 'player', pos, new Vector(1, 1));
  this.moves = true;
  this.obstacle = false;
  this.action = 'stand'
  this.reversed = false
  this.frameNum = 0
  this.step = 0
}

Player.prototype = new GameObject;

Player.prototype.draw = function(pen) {
  if (frames.player.move.length) {

    const oldAction = this.action
    if (pressed.up) {
      this.action = 'jump'
    } else if (pressed.left) {
      this.action = 'move'
      this.reversed = true
    } else if (pressed.right) {
      this.action = 'move'
      this.reversed = false
    } else {
      this.action = 'stand'
    }
    if (this.action != oldAction) this.frameNum = 0

    pen.save()
    if (this.reversed) {
      pen.translate(this.size.x, 0)
      pen.scale(-1, 1)
    }
    pen.scale(1/15, 1/15)
    pen.drawImage(frames.player[this.action][this.frameNum], 0, 0)
    pen.restore()
  } else {
    pen.fillStyle = 'black';
    pen.fillRect(0, 0, this.size.x, this.size.y);
  }
};

Player.prototype.act = function() {
  this.step++
  if (this.step == 20) {
    this.step = 0
    this.frameNum++
    if (this.frameNum >= frames.player[this.action].length) this.frameNum = 0
  }

  var collisions = moveX(this).concat(moveY(this));
  collisions.filter(o => o.affectsPlayer).forEach(a => playerTouched(a.name, a));

  if (level.status == "lost") {
    this.pos.y += step;
    this.size.y -= step
  }

  function moveX(player) {
    player.vector.x = 0;
    if (pressed.left) player.vector.x -= playerXSpeed;
    if (pressed.right) player.vector.x += playerXSpeed;
    if (player.vector.x == 0) return [];

    var oldPos = player.pos;
    var motion = new Vector(player.vector.x * step, 0);
    player.pos = player.pos.plus(motion);
    var collisions = player.getCollisions();
    if (collisions.filter(o => o.obstacle).length) player.pos = oldPos;
    return collisions;
  }

  function moveY(player) {
    player.vector.y += gravity;
    var oldPos = player.pos;
    var motion = new Vector(0, player.vector.y * step);
    player.pos = player.pos.plus(motion);
    var collisions = player.getCollisions();
    if (collisions.filter(o => o.obstacle).length) {
      player.pos = oldPos;
      if (pressed.up && player.vector.y > 0)
        player.vector.y = -jumpSpeed;
      else
        player.vector.y = 0
    }
    return collisions;
  }

}

function handler(event) {
  var keyName = keys[event.keyCode] || '_'; 
  pressed[keyName] = event.type == "keydown"
}

addEventListener("keydown", handler);
addEventListener("keyup", handler);

function Vector(x, y) {
  this.x = x;
  this.y = y
}

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y)
}

Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor)
}

function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.border = new Wall(new Vector(-1, -1));

  this.gameObjects = [];

  for (var y = 0; y < this.height; y++) {
    var line = plan[y];
    for (var x = 0; x < this.width; x++) {
      var def = definitions[line[x]];
      if (def) {
        var pos = new Vector(x, y);
        var obj = new def(pos);
        this.gameObjects.push(obj);
      }
    }
  }

  this.player = this.gameObjects.filter(o => o.name == 'player')[0];
}

function overlaps(r1, r2) {
  return (r1.x < r2.x + r2.w) && (r1.y < r2.y + r2.h) &&
         (r2.x < r1.x + r1.w) && (r2.y < r1.y + r1.h);
}

function playerTouched(type, actor) {
  if (type == 'lava' && level.status == null) {
    finish('lost')
  } else if (type == 'coin') {
    level.gameObjects = level.gameObjects.filter(o => o != actor);
    if (!level.gameObjects.some(a => a.name == 'coin')) finish('won')
  }
}

function drawFrame() {
  ctx.imageSmoothingEnabled = false
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgb(52, 166, 251)';
  ctx.fillRect(0, 0, cnv.width, cnv.height);
  ctx.scale(scale, scale);

  level.gameObjects.forEach(o => {
    ctx.save();
    ctx.translate(o.pos.x, o.pos.y);
    o.draw(ctx);
    ctx.restore();
  });
}

function finish(status) {
  level.status = status;
  if (level.finishing) return;
  level.finishing = true;
  setTimeout( _ => level.finished = true, 1000)
}

let currentLevel = 0
function runLevel() {
  var parsed = levels[currentLevel].split('\n').filter(e => e);
  level = new Level(parsed);
  cnv.width = level.width * scale;
  cnv.height = level.height * scale;

  function frame() {
    if (editing) return

    level.gameObjects.filter(o => o.moves).forEach(a => a.act());
    drawFrame();
    if (!level.finished) {
      requestAnimationFrame(frame);
      return
    }

    if (level.status == "lost") runLevel();
    else if (currentLevel < levels.length - 1) {
      currentLevel++
      runLevel()
    } else {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'white';
      ctx.fillRect(100, 75, 115, 30);
      ctx.fillStyle = 'black';
      ctx.font = '30px sans-serif';
      ctx.fillText('You win!', 100, 100)
    }
  }
  frame()
}

function init() {
  ctx = cnv.getContext('2d');
  runLevel()
}

let editing = false
function editLevel() {
  textarea.value = levels[currentLevel]
  editor.style.display = 'block'
  cnv.style.display = 'none'
  editing = true
}

function play() {
  cnv.style.display = 'inline'
  editor.style.display = 'none'
  levels[currentLevel] = textarea.value
  editing = false
  runLevel()
}
