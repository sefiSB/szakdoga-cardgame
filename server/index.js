const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const { Sequelize } = require("sequelize");
const { User, Lobby, Preset, Host } = require("./models");
const { on } = require("events");
const { platform } = require("os");
const user = require("./models/user");
const { create } = require("domain");
const {
  lobbies,
  createCode,
  addPLayer,
  createLobby,
} = require("./memory/lobbies");

const app = express();

const shuffleArray = (array) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

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
                onHand: [], //TEMPORARY
                onTableVisible: [], //TEMPORARY
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
        console.error(
          `Error fetching players for lobby ${lobby.code}:`,
          playerError
        );
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
      name: req.body.gameName,
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
    //await initLobbies();

    createLobby({
      name: req.body.gameName,
      code: lobby.code,
      host: req.body.host,
      presetdata: {
        startingCards: req.body.startingCards,
        host: req.body.host,
        cardType: req.body.cardType,
        packNumber: req.body.packNumber,
        usedCards: req.body.usedCards,
        maxplayers: req.body.maxplayers,
      },
    });

    addPLayer(lobby.code, {
      id: user.id,
      username: user.username,
    });

    res.json(lobbies[lobby.code]);
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error });

    console.log(error);
  }
});

//app.post("hostStarted");

app.post("/gamestart", async (req, res) => {
  //ALAP ADATOK NINCSENEK FENT AZ ADATBÁZISON

  if (lobbies[req.body.code]) {
    console.log("PEDIG KÜLD");
    res.json(lobbies[req.body.code]);
  } else {
    console.log("ITT IS");
    res.json({ error: "Invalid lobby code" });
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("hostStarted", (data) => {
    /* console.log("JÖTT AZ ADAT:");
    console.log(lobbies[data.code]); */

    //KEVERÉS ÉS KIOSZTÁS
    lobbies[data.code].state = "ongoing";
    lobbies[data.code].decks.drawDeck = lobbies[data.code].presetdata.usedCards;
    shuffleArray(lobbies[data.code].decks.drawDeck);
    for (let i = 0; i < lobbies[data.code].players.length; i++) {
      for (let j = 0; j < lobbies[data.code].presetdata.startingCards; j++) {
        //Teszt kedvéért visible kártyák
        lobbies[data.code].players[i].cards.onTableVisible.push(
          lobbies[data.code].presetdata.usedCards.pop()
        );
      }
    }

    console.log("EZT KÜLDI VISSZA:");
    console.log(lobbies[data.code]);
    //socket.join(data.code);
    //io.to(data.code).emit("updateLobby",lobbies[data.code])
    io.emit("updateLobby", lobbies[data.code]);
    //io.to(data.code).emit("hostStarted");
  });

  socket.on("throwCard", (data) => {
    const { code, player_id, cardName, from, to } = data;

    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    if (!player) {
      //vmi error
    }



    const cardIndex = player.cards.onTableVisible.findIndex(
      ([name, _]) => name === cardname
    );

    if (cardIndex < 0) {
      //vmi error
    }

    const [card] = player.cards.onTableVisible.splice(cardIndex, 1);

    lobby.decks.throwDeck.push(card);

    io.to(code).emit("updateLobby", lobby);
  });

  

  socket.on("drawCrad", (data) => {});

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

      if (!lobby) {
        io.to(socket.id).emit("codeError", { error: "Invalid lobby code" });
        return;
      }

      await user.update({ lobby_id: lobby.id });

      addPLayer(lobby.code, {
        id: user.id,
        username: user.username,
      });

      socket.join(data.code);

      io.in(data.code)
        .fetchSockets()
        .then((sockets) => {
          console.log(
            `A(z) ${data.code} lobbyban lévő socketek:`,
            sockets.map((s) => s.id)
          );
        });

      io.to(lobby.code).emit("updateLobby", lobbies[lobby.code]);
      io.to(socket.id).emit("codeSuccess", { code: lobby.code });
    } catch (error) {
      console.log(error);
      io.to(socket.id).emit("codeError", { error: "An error occurred" });
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

  socket.on("gameStart", async (data) => {
    console.log(data.code);
    console.log("Szerver megkapta a kódot");
    io.to(data.code).emit("gameStart", lobbies[data.code]);
  });

  socket.on("reconnectLobby", (data) => {
    const { user_id, code } = data;
    if (lobbies[code]) {
      socket.join(code);
      console.log(
        `Felhasználó (${user_id}) új socket ID-val újracsatlakozott a(z) ${code} lobbyhoz.`
      );
    }
  });
});

server.listen(3001, "127.0.0.1", async () => {
  console.log("SERVER IS RUNNING");
  console.log(server.address().address + ":" + server.address().port);
  await initLobbies();
});
