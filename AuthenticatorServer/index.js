const express = require("express")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")

const { signIn, welcome, refresh, getUserData,createUser } = require("./handlers")

const app = express()
app.use(bodyParser.json())
app.use(cookieParser())

app.post("/signin", signIn)
app.get("/welcome", welcome)
app.post("/refresh", refresh)
app.post("/datosUsuario", getUserData)
app.post("/crearUsuario", createUser)

app.listen(8000)