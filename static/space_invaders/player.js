const frames = []
const size = {x: 11, y: 11}

function loadTemplate(url, arr) {
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
  loadTemplate(`/pixel/sprites/${email}/space_invaders/player/player`, frames)
}

class Player {
  constructor() {
    this.x = 11
    this.y = 245
  }

  draw(pen) {
    if (frames.length) {
      pen.drawImage(frames[0], this.x - 5, this.y)
    }
    else {
      pen.moveTo(this.x + 10, this.y)
      pen.arc(this.x, this.y, 10, 0, Math.PI * 2)
    }
  }
}

export { Player, loadImages }
