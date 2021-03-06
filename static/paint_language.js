let spriteLog = []
let user
let games = []
let game
let template
let sprites = []
let sprite
let action
let frame
let frameIndex
let lastLogMsg

const selection = {x: 0, y: 0, w: 0, h: 0, selecting: false}
const scale = 20
const offscreen = document.createElement('canvas')
const pen = offscreen.getContext('2d')
const ctx = canvas.getContext('2d')
// let ws

const classes = {
  draw: 'fa-pen',
  select: 'fa-mouse-pointer',
  copy: 'fa-copy',
  paste: 'fa-paste',
  palette: 'fa-palette',
  dropper: 'fa-eye-dropper'
}

let clipboard

let mode = 'draw';
['mousemove', 'mousedown', 'mouseup'].forEach(action => canvas.addEventListener(action, handleMouse))
canvas.addEventListener('mouseout', save)
addEventListener('keydown', processKey)

function setMode(m) {
  if (mode == m) return
  mode = m
  const activeTool = document.querySelector('#toolbar .active')
  const newTool = document.querySelector(`#toolbar .${classes[mode]}`)
  activeTool.classList.remove('active')
  newTool.classList.add('active')

  if (mode == 'select') selection.selecting = false
}

function copySelection() {
  clipboard = pen.getImageData(selection.x, selection.y, selection.w, selection.h)
  resetSelection()
  flashTool('copy')
}

function pasteSelection() {
  pen.putImageData(clipboard, 0, 0)
  setFrame()
  save()
  flashTool('paste')
}

function flashTool(m) {
  const oldMode = mode
  setMode(m)
  setTimeout(() => setMode(oldMode), 200)
}

function processKey(e) {
  if (['Delete', 'Backspace'].includes(e.key)) {
    deleteActiveFrame()
  }
}

let stopDrawing = true

const headers = { 'Content-Type': 'application/json; charset=utf-8' }
const method = 'POST'

function draw() {
  if (stopDrawing) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(frame, 0, 0)
  ctx.fill()
  pen.fill()
}

function handleMouse(e) {
  if (mode == 'draw') addPoint(e)
  else if (mode == 'select') setSelection(e)
  else if (mode == 'dropper') getColor(e)
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

function setSelection(e) {
  const x = toScale(e.offsetX)
  const y = toScale(e.offsetY)
  if (e.type == 'mousedown') {
    selection.x = x
    selection.y = y
    selection.w = 0
    selection.h = 0
    selection.selecting = true
  } else if (e.type == 'mouseup') {
    selection.selecting = false
  } else if (selection.selecting) {
    selection.w = x - selection.x
    selection.h = y - selection.y
  }

  draw()
  drawSelection()
}

function getColor(e) {
  if (!e.buttons) return

  const x = e.offsetX
  const y = e.offsetY
  const id = ctx.getImageData(x, y, 1, 1)
  const color = '#' + Array.from(id.data).map(n => ('00' + n.toString(16)).slice(-2)).join('')
  setColor(/00$/.test(color) ? "#ffffffff" : color)
  setMode('draw')
}

function drawSelection() {
  if (selection.w >= template.w && selection.h >= template.h) return

  ctx.save()
  ctx.fillStyle = '#cccccc66'
  ctx.fillRect(selection.x, selection.y, selection.w, selection.h)
  ctx.restore()
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
  template = null
  changeTemplate(t || game.templates[0])
  play.href = game.name
}

function showPalette() {
  levelPalette.style.display = 'block'
}

function hidePalette() {
  levelPalette.style.display = 'none'
}

async function changeTemplate(t) {
  stopDrawing = true
  changer.style.display = 'none'
  templateList.style.display = 'none'
  if (template == t) return
  template = t
  if (!template.actions) template.actions = ['default']

  if (template.name == 'levels') showPalette();
  else hidePalette();

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

  if (template.actions.length > 1) {
    actionContainer.style.display = 'block'
    actionList.innerHTML = ''
    template.actions.forEach(name => {
      const div = document.createElement('div')
      div.append(new Text(name))
      div.onclick = () => changeAction(name)
      actionList.append(div)
    })
  } else {
    actionContainer.style.display = 'none'
  }
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
  name = name.toLowerCase().trim().replace(/\W/g, '_')
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
  lastLogMsg = null
  changer.style.display = 'none'
  spriteList.style.display = 'none'
  if (name == sprite.name) {
    console.log('Same sprite chosen')
    return
  }

  stopDrawing = true

  spriteContainer.innerText = name
  framesContainer.innerHTML = ''

  if (name == 'new') return

  resetSelection()
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

    const promises = []
    for (let y = 0; y < template.actions.length; y++) {
      const action = { frames: [] }
      sprite.actions.push(action)
      offscreen.width = template.w
      offscreen.height = template.h

      for (let x = 0; x < w; x++) {
        const id = ctx.getImageData(x * template.w, y * template.h, template.w, template.h)
        const view = new Uint32Array(id.data.buffer)
        if (x == 0 || view.map(e => (e >> 24) & 255).some(e => e)) {
          pen.putImageData(id, 0, 0)
          const img = new Image()
          promises.push(new Promise(resolve => { img.onload = resolve }))
          action.frames.push(img)
          img.src = offscreen.toDataURL()
        }
      }
    }

    Promise.all(promises).then( () => {
      changeAction(template.actions[0])
    })
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

function drawFrames(index) {
  framesContainer.innerHTML = ''
  action.frames.forEach(setFrameProps)
  changeFrame(index)
}

function deleteActiveFrame() {
  if (action.frames.length <= 1) return
  log(`deleteFrame ${frameIndex}`)

  action.frames.splice(frameIndex, 1)
  drawFrames(0)
  save()
}

function changeAction(name) {
  changer.style.display = 'none'
  actionList.style.display = 'none'
  actionContainer.innerText = name
  stopDrawing = true
  log(`action ${name}`)
  const index = template.actions.findIndex(a => a == name)
  action = sprite.actions[index]

  canvas.width = template.w * scale
  canvas.height = template.h * scale
  ctx.imageSmoothingEnabled = false
  ctx.scale(scale, scale)
  drawFrames(0)
  setColor('red')
}

function reindex(e, index) {
  const { frames } = action
  frames.splice(index, 1)
  const tops = frames.map(f => f.getBoundingClientRect().y)
  const nextLowest = frames.findIndex((f, i) => tops[i] > e.clientY)
  const newIndex = nextLowest == -1 ? frames.length : nextLowest
  frames.splice(newIndex, 0, e.target)
  if (index == newIndex) return

  log(`frameMove ${index} ${newIndex}`)
  drawFrames(newIndex)
}

function resetSelection() {
  selection.x = 0
  selection.y = 0
  selection.w = template.w
  selection.h = template.h
  selection.selecting = false
}

async function changeFrame(index) {
  stopDrawing = true
  frame = action.frames[index]
  framePicker.innerText = `Frame ${index + 1} of ${action.frames.length}`
  action.frames.forEach(f => f.className = f === frame ? 'selected' : '')
  stopDrawing = false
  ctx.beginPath()
  offscreen.width = template.w
  offscreen.height = template.h
  if (index != frameIndex) resetSelection()
  pen.beginPath()
  pen.drawImage(frame, 0, 0)
  draw()
  frameIndex = index
  log(`frame ${index}`)
  drawSelection()
}

function setFrame() {
  const img = new Image()
  const promise = new Promise(resolve => {
    img.onload = _ => {
      drawFrames(frameIndex)
      resolve()
    }
  })
  action.frames[frameIndex] = img
  img.src = offscreen.toDataURL()
  return promise
}

async function save() {
  draw()
  if (!action || !sprite || !sprite.actions) return

  await setFrame()

  const w = sprite.actions.reduce((a, b) => Math.max(a, b.frames.length), 0)
  const h = sprite.actions.length
  offscreen.width = w * template.w
  offscreen.height = h * template.h

  for (let y = 0; y < h; y++) {
    const action = sprite.actions[y]
    if (!action.frames) continue

    for (let x = 0; x < w; x++) {
      if (action.frames[x]) {
        pen.drawImage(action.frames[x], template.w * x, template.h * y)
      }
    }
  }

  const id = pen.getImageData(0, 0, offscreen.width, offscreen.height)
  for (let i = 0; i < id.data.length; i += 4) {
    if (id.data[i] == 255 && id.data[i + 1] == 255 && id.data[i + 2] == 255) {
      id.data[i + 3] = 0
    }
  }
  pen.putImageData(id, 0, 0)

  const image = offscreen.toDataURL()
  const name = sprite.name.replace(/\W/g, '_')
  const body = JSON.stringify({ image, name })

  fetch('save', { method, headers, body }).then(resp => resp.json().then())
  changeFrame(frameIndex)
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

function showActions() {
  if (!sprite.name) return
  changer.style.display = 'block'
  actionList.style.display = 'block'
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

const commands = { init, dot, setColor, select }

function init() {
  // const {w, h, color} = frame
  //
  // canvas.width = w * scale
  // canvas.height = h * scale
  // ctx.imageSmoothingEnabled = false
  // ctx.scale(scale, scale)
  //
  // offscreen.width = w
  // offscreen.height = h
  // setColor(color)
}

function dot(x, y) {
  log(`dot ${x} ${y}`)
  ctx.rect(x, y, 1, 1)
  pen.fillStyle = ctx.fillStyle
  pen.rect(x, y, 1, 1)
}

function setColor(color) {
  log(`color ${color}`)
  ctx.fillStyle = color
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

function log(message) {
  if (message == lastLogMsg) return
  lastLogMsg = message
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

function openColorPicker() {
  flashTool('palette')
  const input = document.querySelector('input[type=color]')
  input.focus()
  input.click()
}

function getRGB(h, s, v) {
  const max = Math.round(v * 255);
  if( s == 0 ) return ([max, max, max]); // Greys

  // Quadrant is between 0 and 5, where 0, 2, and 4 are red, green, and blue
  const sixth = h / 60;
  const quadrant = Math.floor(sixth);

  // fraction is distance away from quadrant representing hue's primary color
  const fraction = (quadrant % 2 == 0) ? (1 - sixth % 1) : sixth % 1;

  // min and mid are the smaller two RGB colors in the final return array
  // We don't know what primary colors they represent...
  const min = Math.round(max * ( 1 - s ));
  const mid = Math.round(max * ( 1 - s * fraction ));

  // ...until we check what quadrant we're in
  switch (quadrant) {
      // reds
    case 5: return [max, min, mid];
    case 0: return [max, mid, min];
      // greens
    case 1: return [mid, max, min];
    case 2: return [min, max, mid];
      // blues
    case 3: return [min, mid, max];
    case 4: return [mid, min, max];
  }
}

document.querySelectorAll('.picker').forEach(picker => {
  const color = picker.getAttribute('color')
  picker.style.background = color
  picker.onclick = () => setColor(color)
})

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

