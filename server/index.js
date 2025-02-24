const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const { Sequelize } = require('sequelize');
const { User, Lobby, Preset } = require("./models");
const { on } = require("events");


const app = express();



//////////TESTING//////////

//////////TESTING//////////



const lobbies = {
    "1234": {
        name: "Lobby 1234",
        code: "1234",
        players: [
            {
                id: "socketId1",
                username: "Alice",
                cards: {
                    onHand: ["2 of clubs", "10 of clubs"],
                    onTableVisible: ["2 of clubs", "10 of clubs"],
                    onTableHidden: [],
                }
            },
            {
                id: "socketId3",
                username: "Charlie",
                cards: {
                    onHand: ["3 of hearts", "5 of diamonds"],
                    onTableVisible: ["3 of hearts", "5 of diamonds"],
                    onTableHidden: [],
                }
            },
            {
                id: "socketId4",
                username: "David",
                cards: {
                    onHand: ["7 of spades", "9 of spades"],
                    onTableVisible: ["7 of spades", "9 of spades"],
                    onTableHidden: [],
                }
            }
        ],
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
        players: [
            {
                id: "socketId2",
                username: "Bob",
                cards: {
                    onHand: ["4 of clubs", "6 of clubs"],
                    onTableVisible: ["4 of clubs", "6 of clubs"],
                    onTableHidden: [],
                }
            },
            {
                id: "socketId5",
                username: "Eve",
                cards: {
                    onHand: ["8 of hearts", "10 of hearts"],
                    onTableVisible: ["8 of hearts", "10 of hearts"],
                    onTableHidden: [],
                }
            }
        ],
        state: "waiting",
        decks: {
            drawDeck: [],
            throwDeck: [],
            onTable: [],
        },
    },
};


const createCode = () => {
    while (true) {
        const code = Math.floor(Math.random() * 10000);
        if (!lobbies[code]) {
            return code;
        }
    }
}

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        //origin:"http://192.168.0.59:5173",
        origin: "*",
        methods: ["GET", "POST"]
    },
});





io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    /* socket.on("loginUser",async (data)=>{
        if()
    }) */



    /* socket.on("addUser",async (data)=>{
        const user = await User.create({
            username:data.name,
            email:data.email,
            password:data.password,
        });
        console.log(user);
        io.to(socket.id).emit("userAdded",user);
    }); */

    app.get("/users", async (req, res) => {
        const users = await User.findAll();
        res.json(users);
    });

    app.post("/loginuser", async (req, res) => {
        const users = await User.findAll();
        let user = users.find((user) => user.username === req.body.name && user.password === req.body.password);
        if (user) {
            res.json(user);
        }
        else {
            res.json({ error: "User not found" });
        }
    });

    app.post("/adduser", async (req, res) => {
        try {
            const user = await User.create({
                username: req.body.name,
                email: req.body.email,
                password: req.body.password,
            });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: "Database error", details: error });
        }
    });
    //
    app.post("/addlobby", async (req, res) => {
        try {
            const lobby = await Lobby.create({
                host_id: req.body.host_id,
                code: createCode(),
                status: "waiting",
            });
            lobbies[lobby.code] = {
                name: req.body.gameName,
                code: lobby.code,
                players: [],
                state: "waiting",
                decks: {
                    drawDeck: [],
                    throwDeck: [],
                    onTable: [],
                },
            };

            res.json(lobby);
        } catch (error) {
            res.status(500).json({ error: "Database error", details: error });
        }
    });

    app.post("/joinlobby", async (req, res) => {
        //KELL HOZZÁ A KAPCSOLÓTÁBLA
        
        /* try {
            const lobby = await Lobby.findOne({
                where: {
                    code: req.body.code,
                }
            });
            if (lobby) {
                lobbies[lobby.code] = {
                    name: lobby.name,
                    code: lobby.code,
                    players: [],
                    state: "waiting",
                    decks: {
                        drawDeck: [],
                        throwDeck: [],
                        onTable: [],
                    },
                };
                res.json(lobby);
            }
            else {
                res.json({ error: "Invalid lobby code" });
            }
        } catch (error) {
            res.status(500).json({ error: "Database error", details: error });
        } */

        if (lobbies[req.body.code]) {
            lobbies[req.body.code].players.push({
                id: req.body.user_id, username: req.body.user, cards: {
                    onHand: [],
                    onTableVisible: [],
                    onTableHidden: [],
                }
            });
            res.json( lobbies[req.body.code] );
        }
        else{
            res.json({ error: "Invalid lobby code" });
        }
    });

    app.post("/gamestart", async (req, res) => {
        //ALAP ADATOK NINCSENEK FENT AZ ADATBÁZISON
        
        
        /* try {
            const lobby = await Lobby.findOne({
                where: {
                    code: req.body.code,
                }
            });
            if (lobby) {
                res.json(lobby);
            }
            else {
                res.json({ error: "Invalid lobby code" });
            }
        } catch (error) {
            res.status(500).json({ error: "Database error", details: error });
        } */

        if (lobbies[req.body.code]) {
            res.json(lobbies[req.body.code]);
        }
        else{
            res.json({ error: "Invalid lobby code" });
    }});


    socket.on("sendCode", (data) => {
        console.log(data);
        if (lobbies[data.code]) {
            lobbies[data.code].players.push({
                id: socket.id, username: data.user, cards: {
                    onHand: [],
                    onTableVisible: [],
                    onTableHidden: [],
                }
            });
            socket.join(data.code);
            io.to(data.code).emit("updateLobby", lobbies[data.code]);
            console.log(lobbies[data.code]);
        } else {
            io.to(socket.id).emit("codeError");
            //socket.emit("codeError");
        }
    });

    socket.on("newGame", async (data) => {
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
            host_id: data.user.id,
            code: code,
            status: "waiting",
        });
        io.to(code).emit("updateLobby", lobbies[code]);
    });

    socket.on("gameStart", (data) => {
        console.log(data.code);
        console.log("Szerver megkapta a kódot")
        //lobbies[data.code].state = "started";
        io.to(data.code).emit("gameStart", lobbies[data.code]);
    });


});






server.listen(3001, '0.0.0.0', () => {
    console.log("SERVER IS RUNNING")
    console.log(server.address().address + ":" + server.address().port);
})
