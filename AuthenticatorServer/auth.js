const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

app.post('/api/signup' , (req,res) => {
   const id  = req.id;
   const username = req.username;
   const password = req.password;
   jwt.sign(id , 'secret_key' , (err,token) => {
      if(err){
		  console.log('erroroso '+err);
         res.status(400).send({msg : 'Error'})
      }
 else {
	    console.log('tokenosos '+token);
         res.send({msg:'success' , token: token})
      }
   })
})

app.listen(9999,() => console.log('esta vivo, esta vivo !!'));