const size = 20
const offset = 5
const speed = 3
class Enemy {
  constructor(options) {
    const {type, x, y} = options
    this.type = type
    this.x = x * (size + offset)
    this.y = y * (size + offset)
  }

  draw(pen) {
    pen.moveTo(this.x + 10, this.y)
    pen.arc(this.x, this.y, 10, 0, Math.PI * 2)
  }

  move() {
    this.x += speed
  }
}

export default Enemy
