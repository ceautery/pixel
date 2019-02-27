const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const fs = require('fs')

app.use(express.static('static'))
app.use(express.static('sprites'))
app.use(bodyParser.json())

app.post('/save', (req, res) => {
  const filename = `sprites/${req.body.name}`
  const image = req.body.image.substr(22)
  fs.writeFile(filename, image, 'base64', error => res.json({success: !error}))
})

app.get('/list', (req, res) => {
  const list = fs.readdirSync('sprites')
  res.json(list)
})

app.listen(3000, _ => console.log('running'))
