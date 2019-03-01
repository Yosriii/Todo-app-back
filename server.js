var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var methods = require('./controllers/methods')

app.use(bodyParser.json())

app.use(methods.CORS);

app.post('/register', methods.register)
app.post('/login',methods.login)
app.get('/todo/:userid', methods.getAllTodo)
app.post('/todo/:userid/addtodo',methods.tokenAccess, methods.AddTodo)
app.post('/todo/:userid/deletetodo', methods.tokenAccess, methods.DeleteTodo)
app.get('/todo/:userid/deletealltodo', methods.tokenAccess, methods.DeleteAllTodo)
app.post('/todo/:userid/inverse', methods.tokenAccess, methods.inverse)




app.listen(3000, () => console.log("server on .."))