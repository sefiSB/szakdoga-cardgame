const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql");
const cors = require("cors");
const { Sequelize, where } = require("sequelize");
const { User, Lobby, Preset, Host } = require("./models");
const { on } = require("events");
const user = require("./models/user");
const { create } = require("domain");
const bcrypt = require("bcryptjs");
const {
  lobbies,
  createCode,
  addPLayer,
  createLobby,
  canJoin,
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
    /* connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    } */
  },
});

app.get("/users", async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

app.post("/loginuser", async (req, res) => {
  try {
    const user = await User.findOne({ where: { username: req.body.name } });
    if (!user) {
      return res.json({ error: "User not found!" });
    }

    const pwcmp = await bcrypt.compare(req.body.password, user.password);
    if (!pwcmp) {
      return res.json({ error: "Password is incorrect!" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

app.post("/adduser", async (req, res) => {
  try {
    const usernameExists = await User.findOne({
      where: { username: req.body.name },
    });

    const emailExists = await User.findOne({
      where: { email: req.body.email },
    });

    if (usernameExists) {
      res.status(500).json({ error: "This username is already in use" });
    } else if (emailExists) {
      res.status(500).json({ error: "This email is already in use" });
    } else {
      const hashedPw = await bcrypt.hash(req.body.password, 10);
      const user = await User.create({
        username: req.body.name,
        email: req.body.email,
        password: hashedPw,
      });

      res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error });
  }
});

app.post("/addpreset", async (req, res) => {
  try {
    const preset = await Preset.create({
      name: req.body.name,
      startingcards: req.body.startingcards,
      cards_on_desk: req.body.cards_on_desk,
      revealed: req.body.revealed,
      hidden: req.body.hidden,
      user_id: req.body.user_id,
      maxplayers: req.body.maxplayers,
      packNumber: req.body.packNumber,
      cardType: req.body.cardType,
    });
    res.json(preset);
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error });
  }
});

app.get("/presets", async (req, res) => {
  const presets = await Preset.findAll({
    include: {
      model: User,
      attributes: ["id", "username"],
    },
  });

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

    await user.update({ lobby_id: lobby.id });

    const host = await Host.create({
      host_id: user.id,
      lobby_id: lobby.id,
    });
    createLobby({
      name: req.body.gameName,
      code: lobby.code,
      host: req.body.host,
      presetdata: {
        startingCards: req.body.startingcards,
        host: req.body.host,
        cardType: req.body.cardType,
        packNumber: req.body.packNumber,
        usedCards: req.body.usedCards,
        maxplayers: req.body.maxplayers,
        hiddenCards: req.body.hiddenCards,
        revealedCards: req.body.revealedCards,
        isCardsOnDesk: req.body.isCardsOnDesk,
      },
    });

    addPLayer(lobby.code, {
      id: user.id,
      username: user.username,
    });

    res.json(lobbies[lobby.code]);
  } catch (error) {
    res.status(500).json({ error: "Database error", details: error });
  }
});

app.post("/gamestart", async (req, res) => {

  if (lobbies[req.body.code]) {
    res.json(lobbies[req.body.code]);
  } else {
    res.json({ error: "Invalid lobby code" });
  }
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.user_id;

  if (userId) {
    console.log(
      `User connected/reconnected: ${userId}, Socket ID: ${socket.id}`
    );
    socket.emit("reconnectClient", { user_id: userId });
    // A szerver az új socket ID-re küld egy eseményt
  } else {
    console.log(`New connection without user_id ${socket.id}`);
  }


  console.log(io.engine.clientsCount);


  socket.on("reconnectClient", (data) => {
    const { user_id, code } = data;
    if (!code) {
      console.log("A reconnectClient kérésben nincs code!");
      return;
    }

    socket.join(code);
    console.log(`Socket ${socket.id} belépett a ${code} szobába`);

    io.to(socket.id).emit("updateLobby", lobbies[code]);
  });

  socket.on("hostStarted", (data) => {
    //KEVERÉS ÉS KIOSZTÁS
    lobbies[data.code].state = "ongoing";

    lobbies[data.code].decks.drawDeck = JSON.parse(
      JSON.stringify(lobbies[data.code].presetdata.usedCards)
    ); //trükk, hogy ne referencia másolás legyen

    lobbies[data.code].decks.drawDeck = lobbies[data.code].decks.drawDeck.map(
      (card, i) => [...card, i]
    );

    shuffleArray(lobbies[data.code].decks.drawDeck);
    for (let i = 0; i < lobbies[data.code].players.length; i++) {
      for (let j = 0; j < lobbies[data.code].presetdata.startingCards; j++) {
        lobbies[data.code].players[i].cards.onHand.push(
          lobbies[data.code].decks.drawDeck.pop()
        );
      }
    }

    if (lobbies[data.code].presetdata.isCardsOnDesk) {
      for (let i = 0; i < lobbies[data.code].players.length; i++) {
        for (let j = 0; j < lobbies[data.code].presetdata.revealedCards; j++) {
          lobbies[data.code].players[i].cards.onTableVisible.push(
            lobbies[data.code].decks.drawDeck.pop()
          );
        }
      }

      for (let i = 0; i < lobbies[data.code].players.length; i++) {
        for (let j = 0; j < lobbies[data.code].presetdata.hiddenCards; j++) {
          lobbies[data.code].players[i].cards.onTableHidden.push(
            lobbies[data.code].decks.drawDeck.pop()
          );
        }
      }
    }
    io.to(data.code).emit("updateLobby", lobbies[data.code]);
    //io.emit("updateLobby", lobbies[data.code]);
  });

  socket.on("presetAdded", () => {
    socket.emit("presetAdded");
  });

  socket.on("restartGame", (data) => {
    const { code } = data;
    let lobby = lobbies[code];
    lobby.state = "ongoing";

    lobby.decks.drawDeck = JSON.parse(
      JSON.stringify(lobby.presetdata.usedCards)
    );
    lobby.decks.throwDeck = [];

    lobby.decks.drawDeck = lobby.decks.drawDeck.map((card, i) => [...card, i]);

    // Játékosok kártyáinak törlése
    lobby.players.forEach((player) => {
      player.cards.onHand = [];
      player.cards.onTableVisible = [];
      player.cards.onTableHidden = [];
    });

    // Keverjük meg a drawDeck-et
    shuffleArray(lobby.decks.drawDeck);

    // Kártyák kiosztása a játékosoknak
    for (let i = 0; i < lobby.players.length; i++) {
      for (let j = 0; j < lobby.presetdata.startingCards; j++) {
        lobby.players[i].cards.onHand.push(lobby.decks.drawDeck.pop());
      }
    }

    // Ha vannak kártyák az asztalon, osszuk ki őket
    if (lobby.presetdata.isCardsOnDesk) {
      for (let i = 0; i < lobby.players.length; i++) {
        for (let j = 0; j < lobby.presetdata.revealedCards; j++) {
          lobby.players[i].cards.onTableVisible.push(
            lobby.decks.drawDeck.pop()
          );
        }
      }

      for (let i = 0; i < lobby.players.length; i++) {
        for (let j = 0; j < lobby.presetdata.hiddenCards; j++) {
          lobby.players[i].cards.onTableHidden.push(lobby.decks.drawDeck.pop());
        }
      }
    }

    // Frissítjük a lobby állapotát
    lobbies[code] = lobby;

    io.to(code).emit("updateLobby", lobbies[code]);
  });

  socket.on("endGame", async (data) => {
    const { code } = data;
    lobbies[code].state = "ended";
    io.to(code).emit("updateLobby", lobbies[code]);
  });

  socket.on("leaveGame", async (data) => {
    const { user_id, code } = data;
    try {
      const lobby = lobbies[code];
      const playerIndex = lobby.players.findIndex(
        (player) => player.id === user_id
      );

      if (playerIndex < 0) {
        return;
      }

      lobby.players.splice(playerIndex, 1);

      const user = await User.findOne({
        where: {
          id: user_id,
        },
      });

      if (lobby.players.length === 0) {
        await Lobby.destroy({
          where: {
            code: code,
          },
        });
        delete lobbies[code];
        return; // Kilépés, mert nincs több játékos
      }

      if (lobby.host === user_id) {
        if (lobby.players.length > 0) {
          const player_id = lobby.players[0].id;
          /* if (player_id === user_id) {
            return; */
          const player = await User.findOne({
            where: {
              id: player_id,
            },
          });

          const host = await Host.findOne({
            where: {
              host_id: lobby.host,
            },
          });
          await host.update({ host_id: player_id });
          lobby.host = player_id;
        } else {
          //MÉG TESZT JELLEGGEL KINT HAGYOM
          /* await Host.destroy({
            where: {
              host_id: user_id,
            },
          }); */
        }
      }
      await user.update({ lobby_id: null });

      lobbies[code] = lobby;

      // Töröljük az előző hostot az adatbázisból

      // Csak akkor hozzuk létre az új hostot, ha megváltozott
      const existingHost = await Host.findOne({
        where: {
          host_id: lobby.host,
        },
      });

      if (!existingHost) {
        await Host.create({
          host_id: lobby.host,
          lobby_id: lobby.id,
        });
      }

      io.to(code).emit("updateLobby", lobby);
    } catch (error) {
      console.log("HIBA A LEAVEGAME-BEN:", error);
    }
  });

  socket.on("giveFromThrowDeck", (data) => {
    const { code, player_id } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    player.cards.onTableVisible.push(lobby.decks.throwDeck.pop());
    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("kickPlayer", async (data) => {
    const { player_id, code } = data;
    const lobby = lobbies[code];
    const playerIndex = lobby.players.findIndex(
      (player) => player.id === player_id
    );
    if (playerIndex < 0) {
      return;
    }
    const user = await User.findOne({
      where: {
        id: player_id,
      },
    });

    await user.update({ lobby_id: null });

    lobby.players.splice(playerIndex, 1);
    io.to(code).emit("kicked", player_id);
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("revealCard", (data) => {
    const { player_id, code, cardNo, playFrom } = data;

    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    if (!player || !lobby) {
      console.log("vmi nemjo");
    }

    let cardInd = -1;
    let card;
    if (playFrom === "onTableHidden") {
      cardInd = player.cards.onTableHidden.findIndex(
        ([name, _, cardn]) => cardn === cardNo
      );
      if (cardInd >= 0) {
        [card] = player.cards.onTableHidden.splice(cardInd, 1);
      }
    }

    if (playFrom === "onHand") {
      cardInd = player.cards.onHand.findIndex(
        ([name, _, cardn]) => cardn === cardNo
      );
      if (cardInd >= 0) {
        [card] = player.cards.onHand.splice(cardInd, 1);
      }
    }

    if (cardInd >= 0) {
      player.cards.onTableVisible.push(card);
      lobbies[code] = lobby;
    }
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("hideCard", (data) => {
    const { player_id, code, cardNo, playFrom } = data;
    const lobby = lobbies[code];

    const player = lobby.players.find((player) => player.id === player_id);
    if (!player || !lobby) {
      console.log("vmi nemjo");
    }
    let cardInd = -1;
    let card;

    if (playFrom === "onTableVisible") {
      cardInd = player.cards.onTableVisible.findIndex(
        ([__, _, cno]) => cno === cardNo
      );
      if (cardInd >= 0) {
        [card] = player.cards.onTableVisible.splice(cardInd, 1);
      }
    }

    if (playFrom === "onHand") {
      console.log("ON HAND");

      cardInd = player.cards.onHand.findIndex(([__, _, cno]) => cno === cardNo);
      if (cardInd >= 0) {
        [card] = player.cards.onHand.splice(cardInd, 1);
      }
    }

    if (cardInd >= 0) {
      player.cards.onTableHidden.push(card);
      lobbies[code] = lobby;
    }
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("toOnHand", (data) => {
    const { player_id, code, cardNo, playFrom } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    if (!player || !lobby) {
      console.log("vmi nemjo");
    }

    let cardInd = -1;
    let card;

    if (playFrom === "onTableVisible") {
      cardInd = player.cards.onTableVisible.findIndex(
        ([__, _, cno]) => cno === cardNo
      );
      if (cardInd >= 0) {
        [card] = player.cards.onTableVisible.splice(cardInd, 1);
      }
    }

    if (playFrom === "onTableHidden") {
      cardInd = player.cards.onTableHidden.findIndex(
        ([__, _, cno]) => cno === cardNo
      );
      if (cardInd >= 0) {
        [card] = player.cards.onTableHidden.splice(cardInd, 1);
      }
    }

    if (cardInd >= 0) {
      player.cards.onHand.push(card);
      lobbies[code] = lobby;
    }
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("giveCard", (data) => {
    const { from, player_id, code, cardNo } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    if (!player || !lobby) {
      console.log("vmi nemjo");
    }

    let cardInd = -1;
    let card;

    if (from === "onHand") {
      cardInd = lobby.players
        .find((player) => player.id === lobby.host)
        .cards.onHand.findIndex(([__, _, cno]) => cno === cardNo);

      [card] = lobby.players
        .find((player) => player.id === lobby.host)
        .cards.onHand.splice(cardInd, 1);
    }
    if (from === "onTableVisible") {
      cardInd = lobby.players
        .find((player) => player.id === lobby.host)
        .cards.onTableVisible.findIndex(([__, _, cno]) => cno === cardNo);

      [card] = lobby.players
        .find((player) => player.id === lobby.host)
        .cards.onTableVisible.splice(cardInd, 1);
    }
    if (from === "onTableHidden") {
      cardInd = lobby.players
        .find((player) => player.id === lobby.host)
        .cards.onTableHidden.findIndex(([__, _, cno]) => cno === cardNo);

      [card] = lobby.players
        .find((player) => player.id === lobby.host)
        .cards.onTableHidden.splice(cardInd, 1);
    }

    player.cards.onHand.push(card);

    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("grantHost", async (data) => {
    const { player_id, code } = data;
    const lobby = lobbies[code];
    const playerInd = lobby.players.findIndex(
      (player) => player.id === player_id
    );
    if (playerInd < 0) {
      return;
    }
    try {
      const user = await User.findOne({
        where: {
          id: player_id,
        },
      });

      const host = await Host.findOne({
        where: {
          host_id: lobby.host,
        },
      });

      await host.update({ host_id: player_id });

      lobby.host = player_id;
      io.to(code).emit("updateLobby", lobby);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("playCard", (data) => {
    const { code, player_id, cardNo, playFrom } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    console.log(player.cards.onHand);
    if (!player || !lobby) {
      console.log("vmi nemjo");
    }

    let cardIndex = -1;
    let card;

    if (playFrom === "onHand") {
      cardIndex = player.cards.onHand.findIndex(
        ([name, _, cardn]) => cardn === cardNo
      );
      [card] = player.cards.onHand.splice(cardIndex, 1);
    }

    if (playFrom === "onTableVisible") {
      cardIndex = player.cards.onTableVisible.findIndex(
        ([name, _, cardn]) => cardn === cardNo
      );
      [card] = player.cards.onTableVisible.splice(cardIndex, 1);
    }
    if (playFrom === "onTableHidden") {
      cardIndex = player.cards.onTableHidden.findIndex(
        ([name, _, cardn]) => cardn === cardNo
      );
      [card] = player.cards.onTableHidden.splice(cardIndex, 1);
    }

    if (cardIndex < 0) {
      console.log("Nincs ilyen kártya");
    }

    lobby.decks.throwDeck.push(card);

    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("shuffleThrowDeckIn", (data) => {
    const { code } = data;
    const lobby = lobbies[code];
    lobby.decks.drawDeck = [...lobby.decks.drawDeck, ...lobby.decks.throwDeck];
    shuffleArray(lobby.decks.drawDeck);
    lobby.decks.throwDeck = [];
    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("drawCard", (data) => {
    const { code, player_id } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);

    if (!player || !lobby) {
      console.log("vmi nemjó");
    }

    player.cards.onHand.push(lobby.decks.drawDeck.pop());

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
    const lobby = lobbies[code];
    const fromPlayer = lobby.players.find((player) => player.id === from);
    const toPlayer = lobby.players.find((player) => player.id === to);

    io.to(code).emit("requestOnHandSwitch", {
      from: fromPlayer,
      to: toPlayer,
      code: code,
    });
  });

  socket.on("respondOnHandSwitch", (data) => {
    const { from, to, code, isAccepted } = data;

    if (isAccepted) {
      const lobby = lobbies[code];
      const fromPlayer = lobby.players.find((player) => player.id === from);

      const toPlayer = lobby.players.find((player) => player.id === to);

      const tmpFrom = [...fromPlayer.cards.onHand];
      const tmpTo = [...toPlayer.cards.onHand];
      fromPlayer.cards.onHand = tmpTo;
      toPlayer.cards.onHand = tmpFrom;
    }

    io.to(code).emit("updateLobby", lobbies[code]);
  });

  socket.on("joinLobby", async (data) => {
    let { code, user, user_id } = data;
    code = parseInt(code);
    try {
      const lobby = await Lobby.findOne({
        where: {
          code: code,
        },
      });
      const user = await User.findOne({
        where: {
          id: user_id,
        },
      });

      if (!lobby) {
        io.to(socket.id).emit("codeError", { error: "Invalid lobby code" });
        return;
      }

      if (canJoin(lobby.code)) {
        addPLayer(lobby.code, {
          id: user.id,
          username: user.username,
        });
        await user.update({ lobby_id: lobby.id });

        socket.join(code);
        console.log(socket.rooms);

        io.to(data.code).emit("updateLobby", lobbies[lobby.code]);
        io.to(socket.id).emit("codeSuccess", { code: lobby.code });
      } else {
        io.to(socket.id).emit("lobbyFull", {
          error: "The lobby is full or already started.",
        });
      }

      io.in(data.code)
        .fetchSockets()
        .then((sockets) => {
          console.log(
            `A(z) ${data.code} lobbyban lévő socketek:`,
            sockets.map((s) => s.id)
          );
        });
    } catch (error) {
      console.log(error);
      io.to(socket.id).emit("codeError", { error: "An error occurred" });
      //socket.emit("updateLobby", lobbies[code]);
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

  /* socket.on("disconnect", function () {
    console.log("JELENLEGI SOCKETEK:", io.sockets.adapter.rooms);
    
  }); */
});

server.listen(3001, "127.0.0.1", async () => {
  console.log("SERVER IS RUNNING");
  console.log(server.address().address + ":" + server.address().port);
  await initLobbies();
});
