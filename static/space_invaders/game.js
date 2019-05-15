import { Player, loadImages as loadPlayerImages } from './player.js'
import { Enemy, loadImages as loadEnemyImages } from './enemy.js'

const [W, H] = [224, 256] // Game resolution
const playerSpeed = 3
const shotSpeed = 5
const keys = {}
const gameKeys = ['ArrowLeft', 'ArrowRight', ' ']
const enemyTicks  = [30, 20, 10, 5, 3]
const enemyCounts = [55, 50, 40, 2, 0]

class Game {
  constructor(canvas) {
    this.canvas = canvas
    this.pen = canvas.getContext('2d')
    this.initialized = false
    this.player = new Player()
    this.enemies = []
    this.scale = 1

    this.tick = 0
    this.enemyTick = enemyTicks[0]
    this.gameOver = false
    this.fitToScreen = this.fitToScreen.bind(this)
    this.step = this.step.bind(this)
    this.draw = this.draw.bind(this)
  }

  loadImages(email) {
    loadEnemyImages(email)
    loadPlayerImages(email)
  }

  fitToScreen() {
    const {pen} = this
    canvas.width = Math.min(innerWidth, (innerHeight * W / H) | 0) - 50
    canvas.height = (canvas.width * H / W) | 0

    let scale = canvas.width / W
    pen.resetTransform()
    pen.scale(scale, scale)
    pen.imageSmoothingEnabled = false
  }

  setKey(key, val) {
    if (!gameKeys.includes(key)) return
    keys[key] = val
  }

  init() {
    if (this.initialized) return
    this.initialized = true

    const {enemies} = this

    addEventListener('resize', this.fitToScreen)
    addEventListener('keydown', e => this.setKey(e.key, true))
    addEventListener('keyup', e => this.setKey(e.key, false))

    for (let x = 0; x < 11; x++) enemies.push(new Enemy({type: 0, x, y: 0}))
    for (let y = 1; y < 3; y++) {
      for (let x = 0; x < 11; x++) enemies.push(new Enemy({type: 1, x, y}))
    }
    for (let y = 3; y < 5; y++) {
      for (let x = 0; x < 11; x++) enemies.push(new Enemy({type: 2, x, y}))
    }

    this.fitToScreen()
    this.draw()
  }

  step() {
    const {player, enemies, enemyTick} = this

    this.tick++
    if (this.tick >= this.enemyTick) {
      this.tick = 0

    if (enemies.some(e => e.onWall)) {
      enemies.forEach(e => {
        e.direction *= -1
        e.moveDown()
      })
    }
      enemies.forEach(e => e.move())
      if (enemies.some(e => e.y + 11 > H)) this.gameOver = true
    }

    if (keys.ArrowRight && player.x < W - 5) player.x += playerSpeed
    if (keys.ArrowLeft && player.x > 5) player.x -= playerSpeed
    if (keys[' '] && !this.shooting) this.shoot()

    if (this.shooting) {
      this.shot.y -= shotSpeed
      if (this.shot.y <= 0) this.shooting = false
      this.checkHit()
    }
  }

  checkHit() {
    const {shot, enemies} = this
    const {x, y} = shot
    const enemyNum = enemies.findIndex(e => {
      return e.x <= x && 11 + e.x >= x && e.y <= y && 11 + e.y >= y
    })
    if (enemyNum > -1) {
      enemies.splice(enemyNum, 1)
      if (enemies.length == 0) {
        this.gameOver = true
        return
      }
      this.shooting = false
      const tickIndex = enemyCounts.findIndex(c => c <= enemies.length)
      this.enemyTick = enemyTicks[tickIndex]
    }
  }

  shoot() {
    this.shooting = true
    const {x, y} = this.player
    this.shot = {x, y}
  }

  draw() {
    if (this.gameOver) return

    requestAnimationFrame(this.draw)
    const {pen, canvas, player, enemies, step} = this

    step()
    pen.clearRect(0, 0, W, H)
    pen.beginPath()
    enemies.forEach(e => e.draw(pen))
    player.draw(pen)
    pen.stroke()

    if (this.shooting) {
      const {x, y} = this.shot
      pen.fillRect(x - 1, y, 2, 5)
    }
  }
}

export default Game
