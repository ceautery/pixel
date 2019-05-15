const express = require('express')
const app = express()

app.use('/pixel/sprites', express.static('sprites'))
app.use('/pixel', express.static('static'))

app.listen(3000, _ => console.log('running'))
