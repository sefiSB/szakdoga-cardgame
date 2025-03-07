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
const { emit } = require("process");

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

app.post("/addpreset", async (req, res) => {
  try {
    console.log(req.body);
    const preset = await Preset.create({
      name: req.body.name,
      startingcards: req.body.startingCards,
      cards_on_desk: req.body.cards_on_desk,
      revealed: req.body.revealed,
      hidden: req.body.hidden,
      user_id: req.body.user_id,
    });
    res.json(preset);
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error });
  }
});

app.get("/presets", async (req, res) => {
  const presets = await Preset.findAll();
  res.json(presets);
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
    res.json(lobbies[req.body.code]);
  } else {
    res.json({ error: "Invalid lobby code" });
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("hostStarted", (data) => {
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

    //socket.join(data.code);
    //io.to(data.code).emit("updateLobby",lobbies[data.code])
    io.emit("updateLobby", lobbies[data.code]);
    //io.to(data.code).emit("hostStarted");
  });

  socket.on("playCard", (data) => {
    const { code, player_id, cardName } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    if (!player || !lobby) {
      console.log("vmi nemjo");
    }

    console.log(player.cards.onTableVisible);
    const cardIndex = player.cards.onTableVisible.findIndex(
      ([name, _]) => name === cardName
    );

    if (cardIndex < 0) {
      //vmi error
    }

    const [card] = player.cards.onTableVisible.splice(cardIndex, 1);

    lobby.decks.throwDeck.push(card);
    console.log(socket.rooms);
    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("drawCard", (data) => {
    console.log("kuki");
    const { code, player_id } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    console.log(player);
    console.log(lobby);
    if (!player || !lobby) {
      console.log("vmi nemjó");
    }

    console.log(player.cards.onTableVisible);
    player.cards.onTableVisible.push(lobby.decks.drawDeck.pop());
    console.log(player.cards.onTableVisible);
    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  /* socket.on("switchCard",(data)=>{
      const {from, to, cardName, code} = data

      
      const lobby = lobbies[code];
      const fromPlayer = lobby.players.find((player) => player.id === from);
      const toPlayer = lobby.players.find((player) => player.id === to);
      

  }); */

  socket.on("switchOnHand", (data) => {
    const { from, to, code } = data;
    console.log("jött a csere");
    const lobby = lobbies[code];
    const fromPlayer = lobby.players.find((player) => player.id === from);
    const toPlayer = lobby.players.find((player) => player.id === to);
    console.log(toPlayer);
    console.log(fromPlayer);

    io.to(code).emit("requestOnHandSwitch", {
      from: from,
      to: to,
      code: code,
    });
  });

  socket.on("respondOnHandSwitch", (data) => {
    const { from, to, code, isAccepted } = data;
    console.log("ez:");
    console.log(data);
    if (isAccepted) {
      const lobby = lobbies[code];
      const fromPlayer = lobby.players.find((player) => player.id === from);
      const toPlayer = lobby.players.find((player) => player.id === to);
      const tmpFrom = [...fromPlayer.cards.onTableVisible];
      const tmpTo = [...toPlayer.cards.onTableVisible];
      fromPlayer.cards.onTableVisible = tmpTo;
      toPlayer.cards.onTableVisible = tmpFrom;
    }

    io.to(code).emit("updateLobby", lobbies[code]);
  });
  /*

  socket.on("revealCard");

  socket.on("hideCard"); */

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
      console.log("XDDDDDDDDDDDDDDD");
      console.log(socket.rooms);

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
      //socket.emit("updateLobby", lobbies[code]);
    }
  });

  socket.on("joinHost", async (data) => {
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
      console.log("XDDDDDDDDDDDDDDD");
      console.log(socket.rooms);

      io.in(data.code)
        .fetchSockets()
        .then((sockets) => {
          console.log(
            `A(z) ${data.code} lobbyban lévő socketek:`,
            sockets.map((s) => s.id)
          );
        });

      io.to(lobby.code).emit("updateLobby", lobbies[lobby.code]);
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

    //io.to(code).emit("updateLobby", lobbies[code]);
    socket.emit("updateLobby", lobbies[code]);
  });

  socket.on("gameStart", async (data) => {
    console.log("Szerver megkapta a kódot");
    io.to(data.code).emit("gameStart", lobbies[data.code]);
  });

  socket.on("disconnect", () => {
    console.log(`USER DISCONNECTED: ${socket.id}`);
    console.log("JELENLEGI SOCKETEK:", io.sockets.adapter.rooms);
  });
});

server.listen(3001, "127.0.0.1", async () => {
  console.log("SERVER IS RUNNING");
  console.log(server.address().address + ":" + server.address().port);
  await initLobbies();
});
