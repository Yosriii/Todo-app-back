var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/"
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');



const connection = (closure) => {
    return MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
        if (err) throw err;
        let db = client.db('todo')
        closure(db)
    })
};

exports.tokenAccess = (req,res,next)=>{
    var decoded = jwt.verify(req.headers.authorization, 'key');
    if(req.params.userid==decoded.user) next()
    else res.send({message:'error'})
}

exports.CORS = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization');
    next();
}

exports.register = (req, res) => {
    var user = {
        name: req.body.name,
        mail: req.body.mail,
        password: '',
        todo: []
    }
    connection(async (db) => {
        const result1 = await db.collection('users').findOne({ mail: req.body.mail }).catch(err => err);
        if (result1) res.send({ message: 'mail already in use' })
        else {
            user.password = bcrypt.hashSync(req.body.password, 10)
            /* db.collection('users').insertOne(user, function (err, res1) {
                 if (err) throw res.send({ message: "failed!" })
                 res.send({ message: "done!" })
             });*/
            const result = await db.collection('users').insertOne(user).catch(err => err)
            if (result.err) res.send({ message: "failed!" })
            res.send({ message: "done!" })
        }
    })
}


exports.login = (req, res, next) => {
    connection(async (db) => {
        var userMail = req.body.mail
        // db.collection('users').findOne({ mail: userMail }, async (err, res1) => {
        // try {
        //     var valid = await bcrypt.compare(req.body.password, res1.password)
        //     if (valid) res.send(res1)
        //     if (!valid) res.send({ message: 'wrong password' })
        // }
        // catch (err) { res.send({ message: 'no user found' }) }

        const result = await db.collection('users').findOne({ mail: userMail }).catch(err => err);
        if (!result || result.err) { res.send({ message: 'no user found' }) }
        if (!bcrypt.compareSync(req.body.password, result.password)) { res.send({ message: 'wrong pass' }) }
        var token = jwt.sign({ user: result.name }, 'key');
        res.status(200).json({token:token,user:result.name})
        // });

    })
}

exports.getAllTodo = (req, res) => {
    connection(async (db) => {
        /*db.collection('users').findOne({ name: req.params.userid }, (err, res1) => {
            try {
                res.send(res1.todo)
            }
            catch (err) { res.send({ message: 'error' }) }
        });*/
        const result = await db.collection('users').findOne({ name: req.params.userid })
        if (!result) { res.send({ message: 'error' }) }
        res.send(result.todo)
    })
}

exports.AddTodo = (req, res, next) => {
    connection(async (db) => {
        /* db.collection('users').findOne({ name: req.params.userid }, (err, res1) => {
             try {
                 var tempTodo = res1.todo
                 tempTodo.push(req.body.todo)
                 db.collection("users").updateOne({ name: req.params.userid }, { $set: { todo: tempTodo } }, function (err, res1) {
                     try { res.send({ message: 'updated ' }) }
                     catch (err) { res.send({ message: 'error' }) }
                 });
             }
             catch (err) { res.send({ message: 'error' }) }
         })*/
        const result1 = await db.collection('users').findOne({ name: req.params.userid })
        var tempTodo = result1.todo
        tempTodo.push(req.body)
        const result2 = await db.collection("users").updateOne({ name: req.params.userid }, { $set: { todo: tempTodo } }).catch(err => err)
        if (result2.err) { res.send({ message: 'error' }) }
        res.send({ message: 'updated ' })
    })
}

exports.DeleteTodo = (req, res, next) => {
    connection(async (db) => {
        /* db.collection('users').findOne({ name: req.params.userid }, (err, res1) => {
             try {
                 var tempTodo = res1.todo
                 var indexToDelete = tempTodo.indexOf(req.body.todo)
                 if (indexToDelete >= 0) {
                     tempTodo.splice(indexToDelete, 1)
                     db.collection("users").updateOne({ name: req.params.userid }, { $set: { todo: tempTodo } }, (err, res1) => {
                         try { res.send({ message: 'updated ' }) }
                         catch (err) { res.send({ message: 'error' }) }
                     });
                 }
                 else res.send({ message: 'error' })
             }
             catch (err) { res.send({ message: 'error' }) }
         })*/
        const result1 = await db.collection('users').findOne({ name: req.params.userid }).catch(err => err)
        if (!result1.err) {
            var tempTodo = result1.todo
            //var indexToDelete = tempTodo.indexOf(req.body)
            var indexToDelete = -1
            for (var i = tempTodo.length - 1; i >= 0; i--) {
                if (tempTodo[i].name == req.body.name) indexToDelete = i
            }
            if (indexToDelete >= 0) {
                tempTodo.splice(indexToDelete, 1)
                const result2 = await db.collection("users").updateOne({ name: req.params.userid }, { $set: { todo: tempTodo } }).catch(err => err)
                if (result2.err) res.send({ message: 'error element not updated' })
                res.send({ message: 'updated ' })
            }
            else res.send({ message: 'error element not found' })
        }
        else res.send({ message: 'error user not found' })
    })
}

exports.DeleteAllTodo = (req, res, next) => {
    connection(async (db) => {
        /*db.collection("users").updateOne({ name: req.params.userid }, { $set: { todo: [] } }, function (err, res1) {
            try { res.send({ message: 'updated ' }) }
            catch (err) { res.send({ message: 'error' }) }
        });*/
        const result = await db.collection("users").updateOne({ name: req.params.userid }, { $set: { todo: [] } })
        if (!result) res.send({ message: 'error' })
        else res.send({ message: 'updated ' })
    })
}

exports.inverse = (req, res, next) => {
    connection(async (db) => {
        const result1 = await db.collection('users').findOne({ name: req.params.userid }).catch(err => err)
        if (!result1.err) {
            var tempTodo = result1.todo
            var indexToChange = -1
            for (var i = tempTodo.length - 1; i >= 0; i--) {
                if (tempTodo[i].name == req.body.name) indexToChange = i
            }
            if (indexToChange >= 0) {
                tempTodo[indexToChange].done = !tempTodo[indexToChange].done
                const result2 = await db.collection("users").updateOne({ name: req.params.userid }, { $set: { todo: tempTodo } }).catch(err => err)
                if (result2.err) res.send({ message: 'error element not updated' })
                res.send({ message: 'updated ' })
            }
            else res.send({ message: 'error element not found' })
        }
        else res.send({ message: 'error user not found' })


    })

}