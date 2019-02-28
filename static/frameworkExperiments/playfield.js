const canvas = document.createElement('canvas')
const pen = canvas.getContext('2d')
let initialized = false

function fitToScreen() {
  canvas.width = innerWidth
  canvas.height = innerHeight
}

class Player {
  constructor() {
    this.x = 100
    this.y = 100
  }

  draw() {
    pen.moveTo(this.x + 50, this.y)
    pen.arc(this.x, this.y, 50, 0, Math.PI * 2)
  }
}

class Playfield {
  constructor() {
    this.objects = [new Player()]

    // bindings for setInterval/requesteAnimationFrame calls
    this.step = this.step.bind(this)
    this.draw = this.draw.bind(this)
  }

  init() {
    if (initialized) return

    document.body.append(canvas)
    addEventListener('resize', fitToScreen)
    fitToScreen()
    this.draw()
    setInterval(this.step)
  }

  step() { this.objects.forEach(o => o.x++) }

  draw() {
    requestAnimationFrame(this.draw)
    pen.clearRect(0, 0, canvas.width, canvas.height)
    pen.beginPath()
    this.objects.forEach(o => o.draw())
    pen.stroke()
  }
}

export default Playfield
