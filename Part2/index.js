// const express = require('express');
const cors = require('cors');
const express = require('express');
const SocketIO = require('socket.io');
const app = express();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
// const url = env.url;
const session = require('express-session');
const passport = require('passport');
const uuidv4 = require('uuid/v4');
const url = "mongodb://localhost:27017/"
const ObjectId = require('mongodb').ObjectId;

// const exphbs=require('express-handlebars');
// uuidv4();

const MongoClient = require('mongodb').MongoClient;

app.use(passport.initialize());
app.use(passport.session());
initializePassport = require('./passport-config')
initializePassport(
    passport,
    getUserByEmail,
    getUserById
);

// const exphbs=require('express-handlebars');
//
// let hbs = exphbs.create({
//     helpers: {
//         test: function () { console.log('test'); }
//     }
// });


// app.engine('hbs',hbs.engine )
// app.set('view engine', 'hbs');
// app.set('views', __dirname + '/views');
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'test123',
    resave: false,
    saveUninitialized :false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'))


let client;
async function connectToDb()
{
    MongoClient.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }, function (err, db) {
        let dbo = db.db('PartB');
        // let a  = dbo.collection('Users').find().toArray();
        // console.log('a',a);
        client = dbo;
        // console.log('client12', client);
    });
}

connectToDb();


app.get('/', checkAuthenticated, async function (req, res) {
    // console.log('req');
    // console.log(req.session.passport.user);
    let user = await getUserById(req.session.passport.user);
    // console.log('user', user[0]);
    //let rooms = getRooms(user._id);
    if(req.isAuthenticated()){
        // res.render('index', {User: user[0], });
        // res.render('index.t');
        // res.sendFile(path.join(__dirname, 'main.html'));
        console.log(path.join(__dirname, 'public', 'main.html'));
        res.sendFile(path.join(__dirname, 'public', 'main.html'));
    }
    else
        res.redirect('/login');
});



app.get('/signup', function(req, res){
    // console.log('signup');
    res.sendFile(path.join(__dirname, 'signup.html'));
});


app.get('/login', function(req, res){
    // console.log('login');
    res.sendFile(path.join(__dirname, 'login.html'));
});


app.post('/login', passport.authenticate('local',{
    successRedirect : '/',
    failureRedirect : '/login',
    // failureFlash : true
}));


app.get('/getRooms', async function(req, res) {
    let user = await getUserById(req.session.passport.user);
    // console.log('>>',user[0]);
    // console.log('>>',user[0].rooms);
    // let totalRooms = JSON.stringify(user[0].rooms);
    // console.log('romms', totalRooms);
    // res.send({totalRooms});
    res.json(user[0].rooms);
});



app.post('/createRoom', async function(req,res){
    let room = {};
    // console.log(req);
    room.name = req.body.roomName;
    room.users  = [];
    room.id = uuidv4();
    room.users.push(req.session.passport.user);
    let user = await getUserById(req.session.passport.user);
    // console.log('>>>>>', user[0]);
     user[0].rooms.push(room.id);

     updateUser(user[0]._id, user[0].rooms);
     // console.log('id', user[0].id);
     console.log('new rooms', user[0].rooms);

    // console.log('user',req);
     let a = await addRoom(room);
     // console.log('>>',user[0]);

});

async function updateUser(id,newRooms){
    try{
        console.log('new',newRooms);
        let uniqueId = ObjectId(id);
        // console.log('client', client);
        let collection = await client.collection("Users");
        let myQuery = { _id: uniqueId };
        let newValues = { $set: {rooms:newRooms} };
        console.log('values',newValues);
        collection.update(myQuery,newValues, function(err, res){
            if(err) throw err;
        });

        // console.log(a);
    }
    catch (err) {
        console.log(err);
    }
}

async function addRoom(room){
    try {
        // console.log('client', client);
        let collection = await client.collection("Rooms");

        await collection.insertOne(room, function(err, res){
            if (err) throw err;
            console.log("Room added");
        });
    }
    catch (err) {
        console.log(err);
    }
}


app.post('/register', async function(req, res){
    //console.log(req.body);
    let user = {};
    user.email = req.body.email;
    user.password = req.body.password;
    user.password2 = req.body.password2;

    // console.log(user);
    let userExists = await checkUser(user);
    // console.log('user Exists',userExists);
    if(userExists.length==0){
        if(user.password != user.password2)
        {
            res.send("password do not match, Please try again");
        }
        else
        {
            let salt = bcrypt.genSaltSync(10);
            //console.log(salt);

            bcrypt.hash(user.password, salt, (err, hash) => {
                if(err) throw err;
                let Account = {email: user.email, password:hash, rooms:[]};
                //console.log(Account);
                addUser(Account);
            });
            res.redirect('/login');
            //res.send("success");
        }
    } else {
        //console.log('userExists', userExists);
        res.redirect('/register');
        //res.send("username or password already exists!!!!!");
    }
});

function checkUser(user){
    console.log('check if user aleady exits');
    let users = getFromDb('Users', {email:user.email});
    return users;
}


async function getUserByEmail(email)
{
    let Account = await getFromDb('Users', {email:email});
    return Account;
}

async function getUserById(id)
{
    let uniqueId = ObjectId(id);
    // console.log(uniqueId);
    let Account = await getFromDb('Users', {_id:uniqueId});
    return Account;
}

function addUser(user){
    console.log('adding the user');
    MongoClient.connect(url,{
            useNewUrlParser: true,
            useUnifiedTopology: true
        },
        function (err, db) {
            if (err) throw err;
            let dbo = db.db("PartB");
            // console.log(user, 'user');
            dbo.collection("Users").insertOne(user, function(err, res){
                if (err) throw err;
                console.log("user added");
                db.close();
            })
        });
}

async function getFromDb(col , query){

    try {
        //console.log('client', client);
        let collection = client.collection(col);
        //console.log(collection);
        let res = await collection.find(query).toArray();
        // console.log('res',res);
        return res;
    }
    catch (err) {
        console.log(err);
    }
}

// let Account = {email: "mail", password:"pass", rooms:[]};
// addUser(Account);

function checkAuthenticated(req, res, next){
    console.log('checkAuth',req.isAuthenticated());
    if(req.isAuthenticated()){
        return next()
    }

    res.redirect('./login');
}



// app.listen(3000);


let server = app.listen(3000, () => {
    console.log('server is running', server.address().port);
});
const io = new SocketIO(server);
io.on('connection', function(socket){
    console.log('a user connected');
    io.sockets.emit('event', 'some clients connected!');
});
