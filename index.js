const CLIENT_ID = '495982056560-ckkrv6pmrp5de7hhh9kk5hs22do83enu.apps.googleusercontent.com'
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const cookieParser = require('cookie-parser')
const serveIndex = require('serve-index')

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })

const baseSriteDir = path.join(__dirname, 'sprites')
const users = {}

const loginHack = false
const games = [
  {
    name: 'space_invaders',
    templates: [
      { name: 'player', w: 11, h: 11 },
      { name: 'enemy', w: 11, h: 11 },
      { name: 'enemy2', w: 11, h: 11 },
      { name: 'enemy3', w: 11, h: 11 }
    ]
  },{
    name: 'dark_blue',
    templates: [
      { name: 'player', w: 15, h: 15, actions: ['move', 'jump'] },
      { name: 'coin', w: 15, h: 15 },
      { name: 'lava', w: 15, h: 15 },
    ]
  }
]
const gameNames = games.map(g => g.name)


// app.use('/pixel/all', express.static('sprites'), serveIndex('sprites'))
app.use('/pixel', express.static('static'))

app.use(bodyParser.json())
app.use(cookieParser())

app.post('/pixel/save', (req, res) => {
  const dir = getSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
  }

  const filename = path.join(dir, req.body.name + '.png')
  const image = req.body.image.substr(22)
  fs.writeFile(filename, image, 'base64', error => {
    res.json({success: !error})
    if (error) return

    const template = getUser(req).activeTemplate
    const symlinkName = path.join(dir, template)
    if(fs.existsSync(symlinkName)) fs.unlinkSync(symlinkName)
    fs.symlinkSync(filename, symlinkName)
  })
})

app.post('/pixel/rename', (req, res) => {
  const dir = getSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
  }

  const filename = path.join(dir, req.body.name)
  const newName = path.join(dir, req.body.newName)
  fs.rename(filename, newName, error => res.json({success: !error}))
})

app.get('/pixel/list', (req, res) => {
  const dir = getSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
    return
  }

  const list = fs.readdirSync(dir).filter(name => /\.png$/.test(name)).map(name => name.replace(/\.png$/, ''))
  res.json(list)
})

app.get('/pixel/games', (req, res) => {
  res.json(games)
})

function setUser(email, id) {
  const spriteDir = path.join(baseSriteDir, email)
  const activeGame = 'space_invaders'
  const activeTemplate = 'enemy'
  users[id] = {spriteDir, activeGame, activeTemplate}

  if(!fs.existsSync(spriteDir)) fs.mkdirSync(spriteDir)
  games.forEach(game => {
    const gameSpriteDir = path.join(spriteDir, game.name)
    if(!fs.existsSync(gameSpriteDir)) fs.mkdirSync(gameSpriteDir)
    game.templates.forEach(template => {
      const templateDir = path.join(gameSpriteDir, template.name)
      if(!fs.existsSync(templateDir)) fs.mkdirSync(templateDir)
    })
  })

  return users[id]
}

app.post('/pixel/set_user', (req, res) => {
  const id_token = req.body.id_token

  if (loginHack) {
    const user = setUser(id_token, id_token)
    res.cookie('pixel_id', id_token)
    res.json({ok: true, user})
    return
  }

  fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`)
    .then(resp => resp.json().then(json => {
      const {name, sub, aud, email} = json
      if (aud === CLIENT_ID) {
        const id = `${sub}.${+new Date()}`
        const user = setUser(email, id)
        res.cookie('pixel_id', id)
        res.json({ok: true, user})
      }
    }))
})

app.get('/pixel/get_user', (req, res) => {
  const user = getUser(req)
  res.json({user})
})

app.post('/pixel/set_game', (req, res) => {
  const user = getUser(req)
  const game = req.body.game
  if (user && gameNames.includes(game)) {
    user.activeGame = game
    user.activeTemplate = games.find(g => g.name == game).templates[0].name
    res.json({success: true})
  } else {
    res.json({success: false})
  }
})

app.post('/pixel/set_template', (req, res) => {
  const user = getUser(req)
  const template = req.body.template

  if (!user) {
    res.json({success: false, message: 'User not found'})
    return
  }

  const game = games.find(g => g.name == user.activeGame)
  const templateNames = game.templates.map(t => t.name)
  if (templateNames.includes(req.body.template)) {
    user.activeTemplate = req.body.template
    res.json({success: true})
  } else {
    res.json({success: false, message: 'Template not found'})
  }
})

function getUser(req) {
  return users[req.cookies.pixel_id]
}

function getSpriteDir(req) {
  const user = getUser(req)
  if (user) {
    return path.join(user.spriteDir, user.activeGame, user.activeTemplate)
  }
}

function getBaseSpriteDir(req) {
  const user = getUser(req)
  if (user) {
    return path.join(user.spriteDir, user.activeGame)
  }
}

app.get('/pixel/sprites/*', (req, res) => {
  const fromPixel = /\.png$/.test(req.url)
  const dir = fromPixel ? getSpriteDir(req) : getBaseSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
  }

  const file = req.url.replace(/.+\//, '')
  const filePath = fromPixel ? path.join(dir, file) : path.join(dir, file, file)
  const stream = fs.createReadStream(filePath)
  stream.on('error', function() {
    res.writeHead(404)
    res.end()
  })
  stream.pipe(res)
})

app.listen(3000, _ => console.log('running'))

// wss.on('connection', function connection(ws) {
//   ws.on('message', function incoming(message) {
//     const obj = JSON.parse(message)
//     if (obj.set_user) {
//       ws.user = users[obj.set_user]
//       console.log("Set user to", ws.user)
//     }
//
//     if(obj.set_game && games.includes(obj.set_game)) {
//       ws.game = obj.set_game
//     }
//
//     if(obj.set_sprite) {
//       if (ws.logStream) ws.logStream.close()
//       ws.logStream = fs.createWriteStream('log.txt', {flags: 'a'})
//     }
//
//     console.log('received: %s', message)
//   })
//
//   ws.send('something')
// })
