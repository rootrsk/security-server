const express = require('express')
const app = express()
const http = require('http').createServer(app)
// const cors = require('cors')
const cors = require('./src/utils/cors')
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
app.use(
  function cors(req, res, next) {

    // Website you wish to allow to connect
    const allowedOrigins = [
      "http://localhost:3000",
    ];
    const origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Set-Cookie,Authorization,authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of 
    next();
  }
)
app.use(express.json())

app.use(userRouter)
app.use(teacherRouter)
app.use(arduinoRouter)


app.listen(port, () => {
  console.log(`Backend server is listening at http://localhost:${port}`)
})