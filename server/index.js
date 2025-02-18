const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const { Sequelize } = require('sequelize');
const {User,Lobby,Preset} = require("./models");

const app = express();

const lobbies = {
    "1234": {
        name: "Lobby 1234",
        code: "1234",
        players: [{ id: "socketId1", username: "Alice" }],
        state: "waiting",
        decks: {
            drawDeck: [],
            throwDeck: [],
            onTable: [],
        },
    },
    "5678": {
        name: "Lobby 5678",
        code: "5678",
        players: [{ id: "socketId2", username: "Bob" }],
        state: "waiting",
        decks: {
            drawDeck: [],
            throwDeck: [],
            onTable: [],
        },
    },
};


const createCode = ()=>{
    while(true){
        const code = Math.floor(Math.random()*10000);
        if(!lobbies[code]){
            return code;
        }
    }
}

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"http://localhost:5173",
        methods:["GET","POST"]
    },
});



/* 
//GET REQUESTS
app.get("/",(req,res)=>{
    return res.json({message:"Hello World"});
})

app.get("/users",(req,res)=>{
    const sql = "select * from users";
    db.query(sql,(err,result)=>{
        if(err) return res.json(err);
        return res.json(result);
    })
})
 */

//POST REQUESTS
app.post("/adduser",(req,res)=>{
    console.log(req.body);
    const sql = `insert into users (username, email, password, created_at) values ('${req.body.username}','${req.body.email}','${req.body.password}',now())`;
    /* db.query(sql,(err,result)=>{
        if(err) return res.json(err);
        return res.json(result);
    }) */
})


io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.id}`);

    /* socket.on("loginUser",async (data)=>{
        if()
    }) */

    socket.on("addUser",async (data)=>{
        const user = await User.create({
            username:data.name,
            email:data.email,
            password:data.password,
        });
        console.log(user);
        io.to(socket.id).emit("userAdded",user);
    });




    socket.on("sendCode",(data)=>{
        console.log(data);
        if(lobbies[data.code]){
            lobbies[data.code].players.push({id:socket.id,username:data.user});
            socket.join(data.code);
            io.to(data.code).emit("updateLobby",lobbies[data.code]);
            console.log(lobbies[data.code]);
        }else{
            io.to(socket.id).emit("codeError");
            //socket.emit("codeError");
        }
    });

    socket.on("newGame",async (data)=>{
        const code = createCode();
        lobbies[code] = {
            name: data.gameName,
            code: code,
            players: [{ id: socket.id, username: data.user }],
            state: "waiting",
            decks: {
                drawDeck: [],
                throwDeck: [],
                onTable: [],
            },
        };
        socket.join(code);
        console.log(lobbies);
        const newLobby = await Lobby.create({
            host_id:data.user.id,
            code:code,
            status:"waiting",
        });
        io.to(code).emit("updateLobby", lobbies[code]);
    });
})

server.listen(3001,()=>{
    console.log("SERVER IS RUNNING")
})