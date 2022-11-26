const express = require("express")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
var cors = require("cors")


const { signIn, verify, refresh, getUserData,createUser } = require("./handlers")

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())

app.post("/signin", signIn)
app.post("/verify", verify)
app.post("/refresh", refresh)
app.post("/datosUsuario", getUserData)
app.post("/crearUsuario", createUser)
app.use(cors())

app.listen(8000)