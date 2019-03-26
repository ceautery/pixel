let spriteLog = []
let user
let games = []
let game
let template
let sprites = []
let sprite
let action
let frames = []
let frame

const scale = 20
const offscreen = document.createElement('canvas')
const pen = offscreen.getContext('2d')
const ctx = canvas.getContext('2d')
// let ws

canvas.addEventListener('mousemove', addPoint)
canvas.addEventListener('mousedown', addPoint)
canvas.addEventListener('mouseout', draw)
let stopDrawing = true

function draw() {
  if (stopDrawing) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(frame, 0, 0)
  ctx.fill()
}

function addPoint(e) {
  if (stopDrawing) return

  const x = toScale(e.offsetX)
  const y = toScale(e.offsetY)
  if (e.buttons) {
    dot(x, y)
    draw()
  } else {
    draw()
    ctx.fillRect(x, y, 1, 1)
  }
}

function toScale(num) {
  return Math.floor(num / scale)
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
  stopDrawing = true
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
}

async function changeTemplate(t) {
  stopDrawing = true
  changer.style.display = 'none'
  templateList.style.display = 'none'
  if (template == t) return
  template = t
  if (!template.actions) template.actions = ['default']

  templateContainer.innerText = template.name
  await fetch('set_template', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({template: template.name})
  })

  resp = await fetch('list')
  sprites = await resp.json()
  spriteList.innerHTML = `<div onclick="addSprite()" class="newSprite">new</div>`
  sprites.forEach(addSpriteNameToList)
  sprite = { name: null }
  changeSprite(sprites.length ? sprites[0] : 'new')
}

function addSpriteNameToList(name) {
  const div = document.createElement('div')
  div.append(new Text(name))
  div.onclick = () => changeSprite(name)
  spriteList.append(div)
}

function addSprite() {
  stopDrawing = true
  changer.style.display = 'none'
  spriteList.style.display = 'none'

  let name = prompt("Name for new sprite:")
  if (!name) return
  name = name.toLowerCase().trim()
  if (sprites.includes(name)) {
    alert("Name in use")
    return
  }

  sprite = {
    name,
    image: new Image(),
    actions: [],
    action: 0,
    frame: 0
  }

  for (let y = 0; y < template.actions.length; y++) {
    const action = { frames: [] }
    sprite.actions.push(action)
    const id = ctx.createImageData(template.w, template.h)

    offscreen.width = template.w
    offscreen.height = template.h
    pen.putImageData(id, 0, 0)
    const img = new Image()
    action.frames.push(img)
    spriteContainer.innerText = name
    if (y == 0) {
      img.onload = () => changeAction(template.actions[0])
    }
    img.src = offscreen.toDataURL()
  }
  addSpriteNameToList(name)
}

async function changeSprite(name) {
  changer.style.display = 'none'
  spriteList.style.display = 'none'
  if (name == sprite.name) {
    console.log('Same sprite chosen')
    return
  }
  if (name == sprite.name) {
    console.log('Same sprite chosen')
    return
  }

  stopDrawing = true

  canvas.width = scale * template.w
  canvas.height = scale * template.h
  spriteContainer.innerText = name
  framesContainer.innerHTML = ''

  if (name == 'new') return

  sprite = {
    name,
    image: new Image(),
    actions: [],
    action: 0,
    frame: 0
  }

  sprite.image.onload = () => {
    const w = sprite.image.width / template.w
    canvas.width = sprite.image.width
    canvas.height = sprite.image.height
    ctx.drawImage(sprite.image, 0, 0)

    for (let y = 0; y < template.actions.length; y++) {
      const action = { frames: [] }
      sprite.actions.push(action)
      offscreen.width = template.w
      offscreen.height = template.h

      for (let x = 0; x < w; x++) {
        const id = ctx.getImageData(x * template.w, y * template.h, template.w, template.h)
        const view = new Uint32Array(id.data.buffer)
        if (view.map(e => (e >> 24) & 255).some(e => e)) {
          pen.putImageData(id, 0, 0)
          const img = new Image()
          if (x == 0 && y == 0) img.onload = () => changeAction(template.actions[0])
          img.src = offscreen.toDataURL()
          action.frames.push(img)
        }
      }
    }
  }

  await loadLog(name)
  sprite.image.src = `sprites/${name}.png`
}

async function loadLog(name) {
  // const resp = await fetch(`sprites/${name}.log`)
}

function setFrameProps(img, index) {
  framesContainer.append(img)
  img.onclick = () => changeFrame(index)
  img.ondragstart = img.onclick
  img.ondragend = e => reindex(e, index)
  img.style.width = (template.w * 4) + 'px'
}

function changeAction(name) {
  stopDrawing = true
  log(`changeAction ${name}`)
  const index = template.actions.findIndex(a => a == name)
  action = sprite.actions[index]
  framesContainer.innerHTML = ''
  action.frames.forEach(setFrameProps)

  canvas.width = template.w * scale
  canvas.height = template.h * scale
  ctx.imageSmoothingEnabled = false
  ctx.scale(scale, scale)
  setColor('red')
  changeFrame(0)
}

function reindex(e, index) {
  const { frames } = action
  frames.splice(index, 1)
  const tops = frames.map(f => f.getBoundingClientRect().y)
  const nextLowest = frames.findIndex((f, i) => tops[i] > e.clientY)
  const newIndex = nextLowest == -1 ? frames.length : nextLowest
  frames.splice(newIndex, 0, e.target)
  if (index == newIndex) return

  framesContainer.innerHTML = ''
  frames.forEach(setFrameProps)
  changeFrame(newIndex)
  log(`frameMove ${index} ${newIndex}`)
}

async function changeFrame(index) {
  if (frame) await save

  stopDrawing = true
  frame = action.frames[index]
  ctx.clearRect(0, 0, frame.width, frame.height)
  ctx.drawImage(frame, 0, 0)
  ctx.beginPath()
  framePicker.innerText = `Frame ${index + 1} of ${action.frames.length}`
  action.frames.forEach(f => f.className = f === frame ? 'selected' : '')
  stopDrawing = false
}

async function save() {
  return
  await setFrame()

  const offscreen = document.createElement('canvas')
  offscreen.width = frames.length * size
  offscreen.height = size
  const ctx = offscreen.getContext('2d')

  frames.forEach( (image, index) => {
    ctx.drawImage(image, size * index, 0)
  })

  const id = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
  for (let i = 0; i < id.data.length; i += 4) {
    if (id.data[i] == 255 && id.data[i + 1] == 255 && id.data[i + 2] == 255) {
      id.data[i + 3] = 0
    }
  }
  ctx.putImageData(id, 0, 0)

  const image = offscreen.toDataURL()
  const name = select[select.selectedIndex].value
  const body = JSON.stringify({ image, name })

  fetch('save', { method, headers, body }).then(resp => resp.json().then(body => setError(body, 'Saved')))
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
  if (spriteContainer.innerText == 'new') {
    addSprite()
  } else {
    changer.style.display = 'block'
    spriteList.style.display = 'block'
  }
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

const commands = { init, dot, setColor, select }

function init() {
  const {w, h, color} = frame

  canvas.width = w * scale
  canvas.height = h * scale
  ctx.imageSmoothingEnabled = false
  ctx.scale(scale, scale)

  offscreen.width = w
  offscreen.height = h
  setColor(color)
}

function dot(x, y) {
  log(`dot ${x} ${y}`)
  ctx.rect(x, y, 1, 1)
}

function setColor(color) {
  log(`setColor ${color}`)
  ctx.fillStyle = color
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

function log(message) {
  console.log(message)
}

async function newFrame() {
  const frameIndex = action.frames.length
  frame = new Image()
  action.frames.push(frame)
  setFrameProps(frame, frameIndex)
  frame.src = offscreen.toDataURL()
  changeFrame(frameIndex)
  log('newFrame')
}

// const example=`
//   init 64 64
//   dot 20,20 21,20
//   color #663399
//   dot 20,40 21,40 21,41 20,41
//   color blue
//   dot 30,40 31,40 31,41 30,41
//   color red
//   dot 20,30 21,30 21,31 20,31
//   `

// async function drawFromLog(line) {
//   const fields = line.split(/\s+/)
//   const command = commands[fields.shift()]
//   if (!command) {
//     error(`No command ${command}`)
//     return
//   }
//
//   if (command == dot) {
//     while (fields.length) {
//       const coords = fields.shift().split(',')
//       step(dot, coords)
//     }
//   } else {
//     step(command, fields)
//   }
//   updateCanvas()
// }

// function addOption(line) {
//   const option = document.createElement('option')
//   option.append(new Text(line))
//   timeTravel.append(option)
// }

// function travel(index) {
//   index = index | 0
//   log.slice(0, index + 1).forEach(drawFromLog)
// }
//
// function drawExample() {
//   log = example.match(/\S.+/g).map(line => line.trim())
//   const index = log.length - 1
//   stepNumber.max = index
//   travel(index)
// }
//
// drawExample()

