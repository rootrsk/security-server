const formidable = require('express-formidable');
const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const socket = require('socket.io')
const cors = require('cors')
const dotnev = require('dotenv')
dotnev.config()
app.use(cors())
// app.use(require("morgan"));
const io = socket(server, {
  cors: {
    origin: "*",
    methods: ['GET', 'POST']
  }
})

// const cors = require('./src/utils/cors')

const port = process.env.PORT || 3001
let arduino = false
let sensors = {
  F: true,
  U: true,
  S: true,
}
io.on("connection", (socket) => {
  console.log('New Socket Connection')
  console.log(socket.handshake.headers['user-agent'])
  if (socket.handshake.headers['user-agent'] === 'arduino-WebSocket-Client') {
    arduino = true
    io.to("123456789").emit("arduino-update", {status:'connected',sensors})
  }else{
    socket.emit("arduino-update", {status:'connected',sensors})
  }
  socket.join("123456789");

  socket.on("capture-image", (data) => {
    console.log(data)
    io.to("123456789").emit("capture-image","rootrsk")
  })
  socket.on('event_name',(data)=>{
    console.log(data)
  })
  socket.on("sensor-update", (data) => {
    console.log(data)
    sensors=data
    io.to("123456789").emit("sensor-update",data)
  })
  socket.on("camera-update", (data) => {
    console.log(data)
    io.to("123456789").emit("camera-update", data)
  })
  /** Sensors Handling Events */
  socket.on("FF",()=>{
    io.to("123456789").emit("FF")
  })
  socket.on("OF", () => {
    io.to("123456789").emit("OF")
  })
  socket.on("OS", () => {
    io.to("123456789").emit("OS")
  })
  socket.on("FS", () => {
    io.to("123456789").emit("FS")
  })
  socket.on("OU", () => {
    io.to("123456789").emit("OU")
  })
  socket.on("FU", () => {
    io.to("123456789").emit("FU")
  })
  /**End Sensor Handling Event */
  socket.on("disconnect",()=>{
    console.log("disconnected",socket.handshake.headers['user-agent'])
    io.to("123456789").emit("arduino-update", {status:'disconnected'})
  })
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
app.use(userRouter)

app.use(formidable());
app.use(arduinoRouter)

server.listen(port, () => {
  console.log(`Backend server is listening at http://localhost:${port}`)
})

