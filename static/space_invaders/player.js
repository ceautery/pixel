class Player {
  constructor() {
    this.x = 100
    this.y = 100
  }

  draw(pen) {
    pen.moveTo(this.x + 50, this.y)
    pen.arc(this.x, this.y, 50, 0, Math.PI * 2)
  }
}

export default Player
