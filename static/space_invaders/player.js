class Player {
  constructor() {
    this.x = 11
    this.y = 245
  }

  draw(pen) {
    pen.moveTo(this.x + 10, this.y)
    pen.arc(this.x, this.y, 10, 0, Math.PI * 2)
  }
}

export default Player
