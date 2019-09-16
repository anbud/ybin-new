require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const errorHandler = require('errorhandler')

const app = express()

app.use(cors())
app.use(bodyParser.json({ extended: false }))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(errorHandler())

app.get('/', (req, res) => res.send('ybin API service.'))
app.use('/api/v1/', require('./api'))

app.listen(process.env.PORT || 3100)

console.log(`[INF] ybin API listening at port ${process.env.PORT || 3100}.`)

module.exports = app
