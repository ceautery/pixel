let log = []
let user
let games = []
let game
let template
let action
let frames

const example=`
  init 64 64
  dot 20,20 21,20
  color #663399
  dot 20,40 21,40 21,41 20,41
  color blue
  dot 30,40 31,40 31,41 30,41
  color red
  dot 20,30 21,30 21,31 20,31
  `

const scale = 10
const offscreen = document.createElement('canvas')
const pen = offscreen.getContext('2d')
const ctx = canvas.getContext('2d')
// let ws

const sprite = {
  w: 64,
  h: 64,
  layers: [],
  selection: null,
  color: '#000000ff'
}

function getCookie(key) {
  const re = new RegExp(`\\b${key}=.+?(?=(;|$))`)
  if (re.test(document.cookie)) {
    return document.cookie.match(re)[0].replace(/.+=/, '')
  }
}

// function send(obj) { ws.send(JSON.stringify(obj)) }
function capitalCase(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())
}

async function changeGame(g, t) {
  changer.style.display = 'none'
  gameList.style.display = 'none'
  if (game == g) return

  game = g
  gameContainer.innerText = game.friendlyName
  await fetch('set_game', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({game: game.name})
  })

  templateList.innerHTML = ''
  game.templates.forEach(t => {
    const div = document.createElement('div')
    div.append(new Text(t.name))
    div.onclick = () => changeTemplate(t)
    templateList.append(div)
  })
  changeTemplate(t || game.templates[0])

  // spriteList.style.display = 'none';
  // actionList.style.display = 'none';
}

async function changeTemplate(t) {
  changer.style.display = 'none'
  templateList.style.display = 'none'
  if (template == t) return
  template = t

  templateContainer.innerText = template.name
  await fetch('set_template', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({template: template.name})
  })

  resp = await fetch('list')
  const sprites = await resp.json()
  spriteList.innerHTML = `<div onclick="changeSprite('new')">new</div>`
  sprites.forEach(s => {
    const div = document.createElement('div')
    div.append(new Text(s))
    div.onclick = () => changeSprite(s)
    spriteList.append(div)
  })
  changeSprite(sprites.length ? sprites[0] : 'new')
}

function changeSprite(sprite) {
  changer.style.display = 'none'
  spriteList.style.display = 'none'
  if (sprite == 'new') { alert('new') }
  else {
  }
}

function changeAction(action) {
}

function showGames() {
  changer.style.display = 'block'
  gameList.style.display = 'block'
}

function showTemplates() {
  changer.style.display = 'block'
  templateList.style.display = 'block'
}

function showSprites() {
  changer.style.display = 'block'
  spriteList.style.display = 'block'
}

async function showPage(resp) {
  const pixel_id = getCookie('pixel_id')
  if (pixel_id) {
    if (resp && resp.user) {
      user = resp.user
    } else {
      let resp = await fetch('get_user')
      let json = await resp.json()
      user = json.user
    }

    resp = await fetch('games')
    games = await resp.json()
    gameList.innerHTML = ''
    games.forEach(g => {
      const div = document.createElement('div')
      g.friendlyName = capitalCase(g.name)
      div.append(new Text(g.friendlyName))
      div.onclick = () => changeGame(g)
      gameList.append(div)
    })

    const game = games.find(g => g.name == user.activeGame)
    const template = game.templates.find(t => t.name == user.activeTemplate)
    changeGame(game, template)

    // if (ws) ws.close()
    // ws = new WebSocket(`ws://${location.hostname}:8080`)
    // ws.onopen = () => {
    //   send({set_user: pixel_id})
    // }
    page.style.display = 'block'
  }
}

function populate(resp) {
  console.log(resp)
}

function onSignIn(googleUser) {
  const id_token = googleUser.getAuthResponse().id_token;

  fetch('set_user', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id_token})
  }).then(r => r.json().then(showPage))
}

function localSignIn() {
  const id_token = localName.value
  fetch('set_user', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id_token})
  }).then(r => r.json().then(showPage))
}

showPage()

const commands = { init, dot, color, select }

function init(w, h) {
  sprite.w = w
  sprite.h = h
  sprite.layers.length = 0
  sprite.layers.push(pen.createImageData(w, h))
  sprite.selection = null

  canvas.width = w * scale
  canvas.height = h * scale
  ctx.imageSmoothingEnabled = false
  ctx.scale(scale, scale)

  offscreen.width = w
  offscreen.height = h
  color('#000000ff')
}

function dot(x, y) {
  pen.fillRect(x, y, 1, 1)
}

function color(color) {
  pen.fillStyle = color
  palette.style.color = color
}

function select(fields) {
}

function error(msg) {
  console.log(msg)
}

function step(command, fields) {
  command(...fields)
}

async function drawFromLog(line) {
  const fields = line.split(/\s+/)
  const command = commands[fields.shift()]
  if (!command) {
    error(`No command ${command}`)
    return
  }

  if (command == dot) {
    while (fields.length) {
      const coords = fields.shift().split(',')
      step(dot, coords)
    }
  } else {
    step(command, fields)
  }
  updateCanvas()
}

function updateCanvas() {
  const {w, h} = sprite
  const i = new Image()
  ctx.clearRect(0, 0, w, h)
  i.onload = _ => ctx.drawImage(i, 0, 0)
  i.src = offscreen.toDataURL()
}

function addOption(line) {
  const option = document.createElement('option')
  option.append(new Text(line))
  timeTravel.append(option)
}

function travel(index) {
  index = index | 0
  log.slice(0, index + 1).forEach(drawFromLog)
}

function drawExample() {
  log = example.match(/\S.+/g).map(line => line.trim())
  const index = log.length - 1
  stepNumber.max = index
  travel(index)
}

drawExample()

