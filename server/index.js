const express = require("express");
const app = express();
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors")


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
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"http://localhost:5173",
        methods:["GET","POST"]
    },
});

io.on("connection",(socket)=>{
    console.log(`User connected: ${socket.id}`);

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

    socket.on("newGame",(data)=>{
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
        io.to(code).emit("updateLobby", lobbies[code]);
    });
})

server.listen(3001,()=>{
    console.log("SERVER IS RUNNING")
})