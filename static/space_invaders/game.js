import Player from './player.js'

const [W, H] = [224, 256] // Game resolution

function fitToScreen() {
  canvas.width = Math.min(innerWidth, (innerHeight * W / H) | 0) - 50
  canvas.height = (canvas.width * H / W) | 0
}

class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.pen = canvas.getContext('2d')
    this.initialized = false

    this.objects = [new Player()]

    // bindings for setInterval/requesteAnimationFrame calls
    this.step = this.step.bind(this)
    this.draw = this.draw.bind(this)
  }

  init() {
    if (this.initialized) return
    this.initialized = true

    addEventListener('resize', fitToScreen)
    fitToScreen()
    this.draw()
    setInterval(this.step)
  }

  step() { this.objects.forEach(o => o.x++) }

  draw() {
    const {pen, canvas} = this
    requestAnimationFrame(this.draw)
    pen.clearRect(0, 0, canvas.width, canvas.height)
    pen.beginPath()
    this.objects.forEach(o => o.draw(pen))
    pen.stroke()
  }
}

export default Game
