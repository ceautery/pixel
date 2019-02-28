import Player from './player.js'

const [W, H] = [224, 256] // Game resolution
const playerSpeed = 3
const keys = {}
const gameKeys = ['ArrowLeft', 'ArrowRight', ' ']

class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.pen = canvas.getContext('2d')
    this.initialized = false
    this.player = new Player()
    this.scale = 1

    this.objects = [this.player]

    // bindings for setInterval/requesteAnimationFrame calls
    this.step = this.step.bind(this)
    this.draw = this.draw.bind(this)
  }

  fitToScreen() {
    const {pen} = this
    canvas.width = Math.min(innerWidth, (innerHeight * W / H) | 0) - 50
    canvas.height = (canvas.width * H / W) | 0

    let scale = canvas.width / W
    pen.resetTransform()
    pen.scale(scale, scale)
  }

  setKey(key, val) {
    if (!gameKeys.includes(key)) return
    keys[key] = val
  }

  init() {
    if (this.initialized) return
    this.initialized = true

    addEventListener('resize', this.fitToScreen)
    addEventListener('keydown', e => this.setKey(e.key, true))
    addEventListener('keyup', e => this.setKey(e.key, false))

    this.fitToScreen()
    this.draw()
  }

  step() {
    const {player} = this
    // this.objects.forEach(o => o.x++)
    if (keys.ArrowRight) player.x += playerSpeed
    if (keys.ArrowLeft) player.x -= playerSpeed
  }

  draw() {
    const {pen, canvas} = this
    requestAnimationFrame(this.draw)
    this.step()
    pen.clearRect(0, 0, canvas.width, canvas.height)
    pen.beginPath()
    this.objects.forEach(o => o.draw(pen))
    pen.stroke()
  }
}

export default Game
