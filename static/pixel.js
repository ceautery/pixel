const scale = 20
const size = 11
canvas.width = size
canvas.height = size
canvas.style.width = size * scale + 'px'
canvas.style.height = size * scale + 'px'
const pen = canvas.getContext('2d')

let frames = []
let frameIndex = 0
let stopDrawing = true
let name = ''

canvas.addEventListener('mousemove', addPoint)
canvas.addEventListener('mousedown', addPoint)
canvas.addEventListener('mouseleave', draw)
addEventListener('keydown', processKey)

function processKey(e) {
  if (['Delete', 'Backspace'].includes(e.key)) {
    deleteActiveFrame()
  }
}

const select = document.querySelector('select')

function getCookie(key) {
  const re = new RegExp(`\\b${key}=.+?(?=(;|$))`)
  if (re.test(document.cookie)) {
    return document.cookie.match(re)[0].replace(/.+=/, '')
  }
}

function showPage() {
  if (getCookie('pixel_id')) {
    document.querySelector('main').style.display = 'flex'
    fetch('list').then(resp => resp.json().then(populate))
  }
}

function onSignIn(googleUser) {
  const id_token = googleUser.getAuthResponse().id_token;

  fetch('set_user', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id_token})
  }).then(showPage)
}

function localSignIn() {
  const id_token = localName.value
  fetch('set_user', {
    method: 'post',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id_token})
  }).then(showPage)
}

showPage()

function newSprite() {
  let name = prompt('Sprite name')
  if (name == null) return

  frameIndex = 0
  currentFrame = new Image()
  frames = [currentFrame]
  updateFrames()
  addOption(name)
  select.selectedIndex = select.length - 1
  stopDrawing = false
}

function updateFrames() {
  const container = document.querySelector('#frameContainer')
  container.innerHTML = ''
  frames.forEach(frame => {
    frame.style.width = (canvas.width * 3) + 'px'
    frame.ondragend = reindex
    frame.onclick = selectFrame
    container.append(frame)
  })
}

async function selectFrame(e) {
  const selectedIndex = frames.findIndex(f => f === e.target)
  if (selectedIndex == frameIndex) return
  await setFrame()

  frameIndex = selectedIndex
  currentFrame = frames[frameIndex]
  pen.beginPath()
  draw()
}

function reindex(e) {
  const myIndex = frames.findIndex(f => f === e.target)
  frames.splice(myIndex, 1)
  const tops = frames.map(f => f.getBoundingClientRect().y)
  const nextLowest = frames.findIndex((f, i) => tops[i] > e.clientY)
  const newIndex = nextLowest == -1 ? frames.length : nextLowest
  frames.splice(newIndex, 0, e.target)
  updateFrames()
  frameIndex = frames.findIndex(f => f === currentFrame)
  draw()
}

function deleteActiveFrame() {
  if (frames.length <= 1) return

  frames.splice(frameIndex, 1)
  frameIndex = 0
  currentFrame = frames[0]
  updateFrames()
  draw()
}

async function newFrame() {
  await setFrame()
  frameIndex = frames.length
  currentFrame = new Image()
  frames.push(currentFrame)
  currentFrame.src = canvas.toDataURL()
  pen.beginPath()
  draw()
  updateFrames()
}

function populate(list) {
  document.querySelectorAll('option').forEach(o => o.remove())
  list.forEach(addOption)
}

function addOption(name) {
  const option = document.createElement('option')
  option.value = name
  option.append(name)
  select.append(option)
}

function draw() {
  if (stopDrawing) return

  frameCounter.innerText = `Frame ${frameIndex + 1} of ${frames.length}`
  pen.clearRect(0, 0, canvas.width, canvas.height)
  pen.drawImage(currentFrame, 0, 0)
  pen.fill()

  frames.forEach(f => f.className = f === currentFrame ? 'selected' : '')
}

function addPoint(e) {
  if (stopDrawing) return

  const x = toScale(e.offsetX)
  const y = toScale(e.offsetY)
  if (e.buttons) {
    pen.rect(x, y, 1, 1)
    draw()
  } else {
    draw()
    pen.fillRect(x, y, 1, 1)
  }
}

function toScale(num) {
  return Math.floor(num / scale)
}

const headers = { 'Content-Type': 'application/json; charset=utf-8' }
const method = 'POST'

function setColor(color) {
  setFrame()
  pen.beginPath()
  pen.fillStyle = color
}

function setFrame() {
  currentFrame = new Image()
  const promise = new Promise(resolve => {
    currentFrame.onload = _ => {
      updateFrames()
      resolve()
    }
  })
  frames[frameIndex] = currentFrame
  currentFrame.src = canvas.toDataURL()
  return promise
}

async function save() {
  await setFrame()

  const offscreen = document.createElement('canvas')
  offscreen.width = frames.length * size
  offscreen.height = size
  const ctx = offscreen.getContext('2d')

  frames.forEach( (image, index) => {
    ctx.drawImage(image, size * index, 0)
  })

  const image = offscreen.toDataURL()
  const name = select[select.selectedIndex].value
  const body = JSON.stringify({ image, name })

  fetch('save', { method, headers, body }).then(resp => resp.json().then(body => setError(body, 'Saved')))
}

function rename() {
  const index = document.querySelector('select').selectedIndex
  const selected = document.querySelectorAll('option')[index]
  const name = selected.value
  const newName = prompt("New name:", name)
  if (newName == null || newName == name || /^\s*$/.test(newName)) return

  const body = JSON.stringify({ name, newName })
  fetch('rename', { method, headers, body }).then(resp => resp.json().then(body => setError(body, 'Renamed')))
  selected.value = newName
  selected.innerText = newName
}

function setError(body, text) {
  error.innerText = body.success ? text : body.error
  setTimeout(_ => error.innerText = '', 2000)
}

function load() {
  stopDrawing = true
  const name = 'sprites/' + select[select.selectedIndex].value
  const image = new Image()
  image.onload = _ => {
    setImage(image)
    updateFrames()
  }
  image.src = name
}

function setImage(image) {
  const offscreen = document.createElement('canvas')
  offscreen.width = size
  offscreen.height = size
  ctx = offscreen.getContext('2d')

  frames = []
  frameIndex = 0
  let frameCount = image.width / size
  for (let i = 0; i < frameCount; i++) {
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(image, i * size, 0, size, size, 0, 0, size, size)
    const frame = new Image()
    if (i == 0) {
      currentFrame = frame
      frame.onload = _ => {
        stopDrawing = false
        draw()
      }
    }
    frame.src = offscreen.toDataURL()
    frames.push(frame)
  }
}
