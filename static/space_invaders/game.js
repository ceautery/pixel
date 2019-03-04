import Player from './player.js'
import {Enemy} from './enemy.js'

const [W, H] = [224, 256] // Game resolution
const playerSpeed = 3
const keys = {}
const gameKeys = ['ArrowLeft', 'ArrowRight', ' ']
const enemyTicks = [45, 30]
const enemyCounts = [55, 54]

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

  step = () => {
    const {player, enemies, enemyTick} = this

    this.tick++
    if (this.tick >= this.enemyTick) {
      this.tick = 0
      enemies.forEach(e => e.move())
    }

    if (keys.ArrowRight) player.x += playerSpeed
    if (keys.ArrowLeft) player.x -= playerSpeed
  }

  draw = () => {
    requestAnimationFrame(this.draw)
    const {pen, canvas, player, enemies, step} = this

    step()
    pen.clearRect(0, 0, W, H)
    pen.beginPath()
    enemies.forEach(e => e.draw(pen))
    player.draw(pen)
    pen.stroke()
  }
}

export default Game
