const CLIENT_ID = '495982056560-ckkrv6pmrp5de7hhh9kk5hs22do83enu.apps.googleusercontent.com'
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const cookieParser = require('cookie-parser')

const users = {curtis: 'curtis'} // 

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
  res.cookie('pixel_id', 'curtis')
  const dir = getSpriteDir(req)
  console.log(dir)
  console.log(req.url)
  if (!dir) {
    res.writeHead(404)
    res.end()
  }

  const list = fs.readdirSync(dir)
  res.json(list)
})

app.post('/set_user', (req, res) => {
  const id_token = req.body.id_token
  fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`)
    .then(resp => resp.json().then(json => {
      const {name, sub, aud, email} = json
      if (aud === client_id) {
        const id = `${sub}.${+new Date()}`
        users[id] = email
        res.cookie('pixel_id', 'id')
      }
    }))
  res.json({ok: true})
})

function getSpriteDir(req) {
  console.log(req.cookies)
  const cookie = req.cookies.pixel_id
  if (cookie && users[cookie]) {
    return path.join(__dirname, 'sprites', users[cookie], 'space_invaders')
  }
}

app.get('/sprites/*', (req, res) => {
  const dir = getSpriteDir(req)
  if (!dir) {
    res.writeHead(404)
    res.end()
  }

  const file = req.url.replace(/.+\//, '')
  console.log(file)
  console.log(req.url)
  const stream = fs.createReadStream(path.join(dir, file))
  stream.on('error', function() {
    res.writeHead(404)
    res.end()
  })
  stream.pipe(res)
})

app.listen(3000, _ => console.log('running'))
