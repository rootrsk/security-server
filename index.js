const formidable = require('express-formidable');
const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const socket = require('socket.io')
var cors = require('cors')
app.use(cors())
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
})

// const cors = require('./src/utils/cors')
const port = process.env.PORT || 3001

io.on("connection", (socket) => {
    console.log('New Socket Connection')
});
app.use(function(req,res,next){
  req.io  = io;
  next()
})
require('./src/db/mongoose')
const userRouter = require('./src/routes/user')
const arduinoRouter = require('./src/routes/arduino')
app.use(cors())
app.use(express.json())
app.use(cors())

app.use(userRouter)

app.use(formidable());
app.use(arduinoRouter)

server.listen(port, () => {
  console.log(`Backend server is listening at http://localhost:${port}`)
})

