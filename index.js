const express = require('express')
const app = express()
const http = require('http').createServer(app)
const cors = require('cors')
// const cors = require('./src/utils/cors')
const port = process.env.PORT || 3001
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: '*'
  }
})
require('./src/db/mongoose')
const userRouter = require('./src/routes/user')
const teacherRouter = require('./src/routes/teacher')
const arduinoRouter = require('./src/routes/arduino')
app.use(cors())
app.use(express.json())
app.use(cors())
app.use(userRouter)
app.use(teacherRouter)
app.use(arduinoRouter)


app.listen(port, () => {
  console.log(`Backend server is listening at http://localhost:${port}`)
})