const CLIENT_ID = '495982056560-ckkrv6pmrp5de7hhh9kk5hs22do83enu.apps.googleusercontent.com'
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const cookieParser = require('cookie-parser')

const baseSriteDir = path.join(__dirname, 'sprites')
const users = {
  curtis: {
    spriteDir: path.join(baseSriteDir, 'curtis'),
    activeGame: 'space_invaders'
  }
}

app.use(express.static('static'))
app.use(bodyParser.json())
app.use(cookieParser())

app.post('/save', (req, res) => {
  const dir = getSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
  }

  const filename = path.join(dir, req.body.name)
  const image = req.body.image.substr(22)
  fs.writeFile(filename, image, 'base64', error => res.json({success: !error}))
})

app.get('/list', (req, res) => {
  const dir = getSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
    return
  }

  const list = fs.readdirSync(dir)
  res.json(list)
})

app.post('/set_user', (req, res) => {
  const id_token = req.body.id_token
  // const spriteDir = path.join(baseSriteDir, id_token)
  // const activeGame = 'space_invaders'
  // const gameSpriteDir = path.join(spriteDir, activeGame)
  //
  // users[id_token] = {spriteDir, activeGame}
  // res.cookie('pixel_id', id_token)
  // res.json({ok: true})
  // if(!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir)
  // if(!fs.existsSync(gameSpriteDir)) fs.mkdirSync(gameSpriteDir)
  // return

  fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`)
    .then(resp => resp.json().then(json => {
      const {name, sub, aud, email} = json
      if (aud === CLIENT_ID) {
        const spriteDir = path.join(baseSriteDir, email)
        const activeGame = 'space_invaders'
        const gameSpriteDir = path.join(spriteDir, activeGame)

        const id = `${sub}.${+new Date()}`
        users[id] = {spriteDir, activeGame}
        res.cookie('pixel_id', id)
        res.json({ok: true})
        if(!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir)
        if(!fs.existsSync(gameSpriteDir)) fs.mkdirSync(gameSpriteDir)
      }
    }))
})

app.post('/set_game', (req, res) => {
  const user = getUser(req)
  if (user) user.activeGame = req.body.game
})

function getUser(req) {
  return users[req.cookies.pixel_id]
}

function getSpriteDir(req) {
  const user = getUser(req)
  if (user) {
    return path.join(user.spriteDir, user.activeGame)
  }
}

app.get('/sprites/*', (req, res) => {
  const dir = getSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
  }

  const file = req.url.replace(/.+\//, '')
  const stream = fs.createReadStream(path.join(dir, file))
  stream.on('error', function() {
    res.writeHead(404)
    res.end()
  })
  stream.pipe(res)
})

app.listen(3000, _ => console.log('running'))
