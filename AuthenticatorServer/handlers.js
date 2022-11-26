const jwt = require("jsonwebtoken")

const jwtKey = "my_secret_key"
const jwtExpirySeconds = 300
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://vass:vass@cluster0.mqhdi1v.mongodb.net/test";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


async function run(username) {
    let dataUsuario = [] 
    try {
      await client.connect();
      const database = client.db("users");
      const users = database.collection("users");

      var query = { correo:username };
      const cursor = users.find(query);
      await cursor.forEach((doc)=>dataUsuario.push(doc.nombre, doc.clave, doc.roles, doc._id));//<- que datos se obtienen del usuario
   
   } finally {
      await client.close();
      return dataUsuario  //<- datos a respuesta
    }
}
async function insert(username,password,fullname,roles) {
    let dataUsuario = 500
    try {
      await client.connect();
      const database = client.db("users");
      const users = database.collection("users");

      var query = { correo: username, nombre: fullname, clave: password, roles:roles };
      await users.insertOne(query);
     dataUsuario=200;
   } finally {
      await client.close();
      return dataUsuario  //<- datos a respuesta
    }
}
const signIn = async (req, res) => {
		
	// Daots ingresados por el usuario de JSON body
	const { username, password } = req.body
	if (!username || !password) {
		// return 401 error si usuario o clave no existe, o si la clave no es la correcta		
		return res.status(401).send({msg : 'Usuario y Clave son obligatorios'}).end()
	}

    let results = await run(username);
	if(results.length<4){
		// return 401 error si usuario o clave no existe, o si la clave no es la correcta
		return res.status(401).send({msg : 'Usuario o Clave incorrecto'}).end()	
	}
	var userQuery=results[0];
	var passQuery=results[1];
	
	if (userQuery=='' || passQuery=='' || passQuery !== password) {
		// return 401 error si usuario o clave no existe, o si la clave no es la correcta
		return res.status(401).send({msg : 'Usuario o Clave incorrecto'}).end()
	}

	// Crea un nuevo token con correo en el payload
	// expira en 300 segundos
	const token = jwt.sign({ username }, jwtKey, {
		algorithm: "HS256",
		expiresIn: jwtExpirySeconds,
	})
	console.log("token:", token)

	// crea una cookie con el token 
	res.cookie("token", token, { maxAge: jwtExpirySeconds * 1000 })
	res.status(200)
	res.send({msg:'success' , token: token})
	res.end()
}

const welcome = (req, res) => {
	// We can obtain the session token from the requests cookies, which come with every request
	const token = req.cookies.token

	// if the cookie is not set, return an unauthorized error
	if (!token) {
		return res.status(401).end()
	}

	var payload
	try {
		// Parse the JWT string and store the result in `payload`.
		// Note that we are passing the key in this method as well. This method will throw an error
		// if the token is invalid (if it has expired according to the expiry time we set on sign in),
		// or if the signature does not match
		payload = jwt.verify(token, jwtKey)
	} catch (e) {
		if (e instanceof jwt.JsonWebTokenError) {
			// if the error thrown is because the JWT is unauthorized, return a 401 error
			return res.status(401).end()
		}
		// otherwise, return a bad request error
		return res.status(400).end()
	}

	// Finally, return the welcome message to the user, along with their
	// username given in the token
	res.send(`Welcome ${payload.username}!`)
}
const refresh = (req, res) => {
	// (BEGIN) The code uptil this point is the same as the first part of the `welcome` route
	const token = req.cookies.token

	if (!token) {
		return res.status(401).end()
	}

	var payload
	try {
		payload = jwt.verify(token, jwtKey)
	} catch (e) {
		if (e instanceof jwt.JsonWebTokenError) {
			return res.status(401).end()
		}
		return res.status(400).end()
	}
	// (END) The code uptil this point is the same as the first part of the `welcome` route

	// We ensure that a new token is not issued until enough time has elapsed
	// In this case, a new token will only be issued if the old token is within
	// 30 seconds of expiry. Otherwise, return a bad request status
	const nowUnixSeconds = Math.round(Number(new Date()) / 1000)
	if (payload.exp - nowUnixSeconds > 30) {
		return res.status(400).end()
	}

	// Now, create a new token for the current user, with a renewed expiration time
	const newToken = jwt.sign({ username: payload.username }, jwtKey, {
		algorithm: "HS256",
		expiresIn: jwtExpirySeconds,
	})

	// Set the new token as the users `token` cookie
	res.cookie("token", newToken, { maxAge: jwtExpirySeconds * 1000 })
	res.end()
}
const getUserData = async (req, res) => {
		
	const { username } = req.body
	if (!username) {
		// return 401 error si usuario o clave no existe, o si la clave no es la correcta		
		return res.status(401).send({msg : 'Usuario es obligatorio'}).end()
	}
	let results = await run(username);
	if(results.length<4){
		// return 401 error si usuario o clave no existe, o si la clave no es la correcta
		return res.status(401).send({msg : 'Usuario no existe'}).end()	
	}
	var user=results[0];
	var roles=results[2];
	var id=results[3];
	var dataUser="{ correo :"+username+", nombre:"+user+", roles:"+roles+", idUser:"+id+"}";

	res.status(200)
	res.send({msg:'success' , data: dataUser})
	res.end()
}
const createUser = async (req, res) => {
		
	const { username, password, fullName, roles } = req.body
	if (!username || !password || !fullName|| !roles) {
		// todos los datos son obligaotrios		
		return res.status(401).send({msg : 'Todos los datos son obligatorio'}).end()
	}
	if (username.length==0 || password.length==0 || fullName.length==0|| roles.length==0) {
		// todos los datos son obligaotrios		
		return res.status(401).send({msg : 'Todos los datos son obligatorio'}).end()
	}
	let results = await run(username);
	if(results.length!=0){
		// return 401 error si usuario o clave no existe, o si la clave no es la correcta
		return res.status(401).send({msg : 'El usuario ya existe'}).end()	
	}else{
	let results = await insert(username, password,fullName, roles);
	if(results==500){
		// return 401 error si usuario o clave no existe, o si la clave no es la correcta
		return res.status(500).send({msg : 'Error al insertar'}).end()	
	}else{
	res.status(200)
	res.send({msg:'success' })
	res.end()
	}}
}
module.exports = {
	signIn,
	welcome,
	refresh,
	getUserData,
	createUser
}
const logout = (req, res) => {
  res.cookie('token', '', { maxAge: 0 })
  res.end()
}




