const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const { Sequelize } = require("sequelize");
const { User, Lobby, Preset, Host } = require("./models");
const { on } = require("events");
const { platform } = require("os");
const { initialState } = require("../client/src/Store/store");
const user = require("./models/user");
const { create } = require("domain");

const app = express();

//////////TESTING//////////
//172.20.10.5
//////////TESTING//////////

const lobbies = {};

const createCode = () => {
  while (true) {
    const code = Math.floor(Math.random() * 10000);
    if (!lobbies[code]) {
      return code;
    }
  }
};

/* const initLobbies = async () => {
  const lobbylist = await Lobby.findAll();
  lobbylist.forEach(async (lobby) => {
    const players = await User.findAll({
      where: {
        lobby_id: lobby.id,
      },
    });
    lobbies[lobby.code] = {
      name: lobby.name,
      code: lobby.code,
      players: players.map((player) => {
        return {
          id: player.id,
          username: player.username,
          cards: {
            onHand: ["2 of clubs"], //TEMPORARY
            onTableVisible: ["2 of clubs"], //TEMPORARY
            onTableHidden: [], //TEMPORARY
          },
        };
      }),
      state: "waiting",
      decks: {
        drawDeck: [],
        throwDeck: [],
        onTable: [],
      },
    };
  });
}; */

const initLobbies = async () => {
    try {
      const lobbylist = await Lobby.findAll();
      for (const lobby of lobbylist) {
        try {
          const players = await User.findAll({
            where: {
              lobby_id: lobby.id,
            },
          });
          lobbies[lobby.code] = {
            name: lobby.name,
            code: lobby.code,
            players: players.map((player) => {
              return {
                id: player.id,
                username: player.username,
                cards: {
                  onHand: ["2 of clubs"], //TEMPORARY
                  onTableVisible: ["2 of clubs"], //TEMPORARY
                  onTableHidden: [], //TEMPORARY
                },
              };
            }),
            state: "waiting",
            decks: {
              drawDeck: [],
              throwDeck: [],
              onTable: [],
            },
          };
        } catch (playerError) {
          console.error(`Error fetching players for lobby ${lobby.code}:`, playerError);
        }
      }
    } catch (lobbyError) {
      console.error("Error fetching lobbies:", lobbyError);
    }
  };
  

app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    //origin:"http://192.168.0.59:5173",
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/users", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post("/loginuser", async (req, res) => {
  const users = await User.findAll();
  let user = users.find(
    (user) =>
      user.username === req.body.name && user.password === req.body.password
  );
  if (user) {
    res.json(user);
  } else {
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
    initialState.user_id = user.id;
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error });
  }
});
//
app.post("/addlobby", async (req, res) => {
  try {
    const cde = createCode();
    const lobby = await Lobby.create({
      host: req.body.host,
      code: cde,
      status: "waiting",
    });

    const user = await User.findOne({
      where: {
        id: req.body.host,
      },
    });

    user.update({ lobby_id: lobby.id });

    const host = await Host.create({
      host_id: user.id,
      lobby_id: lobby.id,
    });
    await initLobbies();
    

    /* lobbies[lobby.code] = {
      name: req.body.gameName,
      code: cde,
      players: [
        {
          id: user.id,
          username: user.username,
          cards: {
            onHand: [],
            onTableVisible: [],
            onTableHidden: [],
          },
        },
      ],
      state: "waiting",
      decks: {
        drawDeck: [],
        throwDeck: [],
        onTable: [],
      },
    }; */
    res.json(lobbies[lobby.code]);
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error });

    console.log(error);
  }
});

/* app.post("/joinlobby", async (req, res) => {
  //KELL HOZZÁ A KAPCSOLÓTÁBLA

  try {
    const lobby = await Lobby.findOne({
      where: {
        code: req.body.code,
      },
    });
    const user = await User.findOne({
      where: {
        id: req.body.user_id,
      },
    });
    user.update({ lobby_id: lobby.id });
    if (lobby) {
      if (lobbies[lobby.code]) {
        lobbies[lobby.code].players.push({
          id: req.body.user_id,
          username: req.body.user,
          cards: {
            onHand: [],
            onTableVisible: [],
            onTableHidden: [],
          },
        });
        socket.join(lobby.code);
        io.to(lobby.code).emit("updateLobby", lobbies[lobby.code]);
      } else {
        console.log("Most hozzáadom/CLEARELEM a játékosokat");
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
        socket.join(lobby.code);
        console.log(lobbies[lobby.code]);
        io.to(lobby.code).emit("updateLobby", lobbies[lobby.code]);
      }
      res.json(lobby);
    } else {
      res.json({ error: "Invalid lobby code" });
    }
  } catch (error) {
    console.log("ITT A HIBA AMI KELL");
    console.log(error);
    res.status(500).json({ error: "Database error", details: error });
  }
});
 */
app.post("/gamestart", async (req, res) => {
  //ALAP ADATOK NINCSENEK FENT AZ ADATBÁZISON

  await initLobbies();
  if (lobbies[req.body.code]) {
    console.log("PEDIG KÜLD")
    res.json(lobbies[req.body.code]);
  } else {
    console.log("ITT IS")
    res.json({ error: "Invalid lobby code" });
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("sendCode", (data) => {
    console.log(data);
    if (lobbies[data.code]) {
      lobbies[data.code].players.push({
        id: socket.id,
        username: data.user,
        cards: {
          onHand: [],
          onTableVisible: [],
          onTableHidden: [],
        },
      });
      socket.join(data.code);
      io.to(data.code).emit("updateLobby", lobbies[data.code]);
      console.log(lobbies[data.code]);
    } else {
      io.to(socket.id).emit("codeError");
      //socket.emit("codeError");
    }
  });

  socket.on("joinLobby", async (data) => {
    try {
      const lobby = await Lobby.findOne({
        where: {
          code: data.code,
        },
      });
      const user = await User.findOne({
        where: {
          id: data.user_id,
        },
      });
      user.update({ lobby_id: lobby.id });
      if (lobby) {
        io.to(socket.id).emit("codeSuccess", { code: lobby.code });
        await initLobbies();
        socket.join(lobby.code);
        
        io.to(lobby.code).emit("updateLobby", lobbies[lobby.code]);
      } else {
        io.to(socket.id).emit("codeError");
      }
    } catch (error) {
      
      console.log(error);
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

    const newLobby = await Lobby.create({
      host: data.user.id,
      code: code,
      status: "waiting",
    });

    io.to(code).emit("updateLobby", lobbies[code]);
  });

  socket.on("gameStart",async (data) => {
    await initLobbies()
    console.log(data.code);
    console.log("Szerver megkapta a kódot");
    //lobbies[data.code].state = "started";
    io.to(data.code).emit("gameStart", lobbies[data.code]);
  });
});

server.listen(3001, "127.0.0.1",async () => {
  console.log("SERVER IS RUNNING");
  console.log(server.address().address + ":" + server.address().port);
  await initLobbies();
});
