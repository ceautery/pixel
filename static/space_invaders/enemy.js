const padding = 5
const margin = 2
const speed = 3
const [W, H] = [224, 256] // Game resolution

const size = {x: 11, y: 11}
const actions = ['move']

const frames = [[], [], []]

function loadTemplate(url, arr) {
  arr.length = 0
  const canvas = document.createElement('canvas')
  const pen = canvas.getContext('2d')
  const img = new Image()
  img.onload = () => {
    canvas.width = size.x
    canvas.height = size.y
    const frameCount = img.width / size.x
    for (let i = 0; i < frameCount; i++) {
      pen.clearRect(0, 0, canvas.width, canvas.height)
      pen.drawImage(img, -i * size.x, 0)
      const image = new Image()
      image.src = canvas.toDataURL()
      arr.push(image)
    }
  }
  img.src = url
}

function loadImages(email) {
  loadTemplate(`/pixel/sprites/${email}/space_invaders/enemy/enemy`, frames[0])
  loadTemplate(`/pixel/sprites/${email}/space_invaders/enemy2/enemy2`, frames[1])
  loadTemplate(`/pixel/sprites/${email}/space_invaders/enemy3/enemy3`, frames[2])
}

class Enemy {
  constructor(options) {
    const {type, x, y} = options
    this.type = type
    this.x = x * (size.x + padding) + margin
    this.y = y * (size.y + padding) + margin
    this.frame = 0
    this.direction = 1
    this.onWall = false
    this.onGround = false
  }

  draw(pen) {
    if (frames[this.type].length) {
      pen.drawImage(frames[this.type][this.frame], this.x, this.y)
    }
    else pen.fillRect(this.x, this.y, size.x, size.y)
  }

  move() {
    this.frame++
    if (this.frame >= frames[this.type].length) this.frame = 0

    if (this.movedDown) {
      this.movedDown = false
      this.onWall = false
      return
    }

    this.x += this.direction * speed
    if (this.direction > 0) this.onWall = this.x + size.x + speed >= W
    else this.onWall = this.x - speed <= 0
  }

  moveDown() {
    this.y += size.y
    this.movedDown = true
  }
}

export { Enemy, loadImages }
