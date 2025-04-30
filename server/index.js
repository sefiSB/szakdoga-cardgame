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

const app = express();

const shuffleArray = (array) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const user_socket = new Map();

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
          host: lobby.host,
          presetdata: {
            startingCards: 0,
            host: lobby.host,
            cardType: null,
            packNumber: null,
            usedCards: [],
            maxplayers: 0,
            hiddenCards: 0,
            revealedCards: 0,
            isCardsOnDesk: false,
          },
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

app.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id", "username", "lobby_id"], // csak a szükséges mezők
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
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

    const isUserLoggedIn = user_socket.has(user.id);
    if (isUserLoggedIn) {
      return res.json({ error: "User already logged in!" });
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

const reconnects = {};

io.on("connection", (socket) => {
  const rawUserId = socket.handshake.query.user_id;
  if (rawUserId) {
    const userId = parseInt(rawUserId);
    if (!isNaN(rawUserId)) {
      if (user_socket.has(userId)) {
        const oldSocketId = user_socket.get(userId);
        io.to(oldSocketId).emit("forceDisconnect", {
          message: "Another device has connected with this user ID.",
        });
        user_socket.delete(userId);
      }
      user_socket.set(parseInt(userId), socket.id);
      if (userId in reconnects) {
        clearTimeout(reconnects[userId]);
        delete reconnects[userId];
      }
      console.log(
        `User connected/reconnected: ${userId}, Socket ID: ${socket.id}`
      );
      socket.emit("reconnectClient", { user_id: userId });
    } else {
      console.log(`New connection without user_id ${socket.id}`);
    }
  }
  socket.on("updateUserID", (data) => {
    if (data.user_id === null) {
      let userToDelete = null;
      for (const [uid, sid] of user_socket.entries()) {
        if (sid === socket.id) {
          userToDelete = uid;
          break;
        }
      }
      user_socket.delete(userToDelete);
      console.log("actives:", user_socket);
      return;
    }
    user_socket.set(parseInt(data.user_id), socket.id);
    console.log(`User ID updated: ${data.user_id}, Socket ID: ${socket.id}`);
    console.log("actives:", user_socket);
  });

  socket.on("reconnectClient", (data) => {
    const { user_id, code } = data;
    if (!code) {
      console.log("No code in reconnect request!");
      return;
    }

    socket.join(code);
    console.log(`Socket ${socket.id} joined the ${code} room`);

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
    lobbies[code] = lobby;

    io.to(code).emit("updateLobby", lobbies[code]);
  });

  socket.on("endGame", async (data) => {
    const { code } = data;
    lobbies[code].state = "ended";
    io.to(code).emit("updateLobby", lobbies[code]);
  });

  socket.on("leaveGame", async (data) => {
    try {
      console.log("Server got the code!");
      const user = await User.findOne({
        where: { id: data.user_id },
      });

      const checklobby = await Lobby.findOne({
        where: { id: user.lobby_id },
      });

      if (!user || !checklobby) {
        console.log("User or Lobby not found");
        return;
      }

      const lobbyId = parseInt(checklobby.id);
      const code = parseInt(checklobby.code);

      //nullázzuk a user lobby_id-ját
      await User.update(
        { lobby_id: null },
        {
          where: { id: data.user_id },
        }
      );

      //ha a játékos a host, akkor új hostot kell választani
      if (lobbies[code].host === data.user_id) {
        const newHost = lobbies[code].players.find(
          (player) => player.id !== data.user_id
        );
        if (newHost) {
          console.log("New host:", newHost.username);
          lobbies[code].host = newHost.id;
          await Host.update(
            { host_id: newHost.id },
            {
              where: { lobby_id: lobbyId },
            }
          );
        } else {
          console.log("No new host!");
        }
      }

      //eltávolítjuk a játékost a memóriából
      if (lobbies[code]) {
        const playerIndex = lobbies[code].players.findIndex(
          (player) => player.id === data.user_id
        );

        if (playerIndex >= 0) {
          lobbies[code].players.splice(playerIndex, 1);

          // Ha üres a lobby, töröljük
          if (lobbies[code].players.length === 0) {
            await Host.destroy({
              where: {
                lobby_id: lobbyId,
              },
            });

            await Lobby.destroy({
              where: {
                id: lobbyId,
              },
            });

            delete lobbies[code];
            console.log("Empty lobby deleted");
          } else {
            io.to(code).emit("updateLobby", lobbies[code]);
          }
        }
      }

      socket.leave(code);
    } catch (error) {
      console.error("HIBA A LEAVEGAME-BEN:", error);
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
      console.log("Player or lobby not found");
    }
    if(player.cards.onTableVisible.length==10){
      return;
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
      console.log("Player or lobby not found");
    }

    if(player.cards.onTableHidden.length==10){
      return;
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
      console.log("Player or lobby not found");
    }

    if(player.cards.onHand.length==20){
      return
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
      console.log("Player or lobby not found");
    }
    if(player.cards.onHand.length==20){
      return
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
    if (!player || !lobby) {
      console.log("Player or lobby not found");
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
      console.log("No such card");
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

  socket.on("giveLastCard", (data) => {
    const { code, player_id, playFrom } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);
    if (!player || !lobby) {
      console.log("Player or lobby not found");
    }

    if(player.cards.onHand.length==20){
      return
    }

    let card;
    if (playFrom === "throwDeck") {
      card = lobby.decks.throwDeck.pop();
    }
    if (playFrom === "drawDeck") {
      card = lobby.decks.drawDeck.pop();
    }
    player.cards.onHand.push(card);
    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("drawCard", (data) => {
    const { code, player_id } = data;
    const lobby = lobbies[code];
    const player = lobby.players.find((player) => player.id === player_id);

    if (!player || !lobby) {
      console.log("Player or lobby not found");
    }
    if(player.cards.onHand.length==20){
      return
    }
    player.cards.onHand.push(lobby.decks.drawDeck.pop());

    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

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
    socket.emit("updateLobby", lobbies[code]);
  });

  socket.on("disconnect", async () => {
    let userID = null;
    for (const [uid, sid] of user_socket.entries()) {
      if (sid === socket.id) {
        userID = uid;
        break;
      }
    }
    if (!userID) {
      console.log("No user_id found for socket:", socket.id);
    }
    console.log("Disconnecting user:", userID);

    reconnects[userID] = setTimeout(async () => {
      try {
        const user = await User.findOne({
          where: { id: userID },
          attributes: ["lobby_id"],
        });

        if (!user) {
          console.log("User not found:", userID);
          return;
        }

        // Lobby keresése a user lobby_id alapján
        const lobby = await Lobby.findOne({
          where: { id: user.lobby_id },
        });

        if (!lobby) {
          console.log("Lobby not found for user:", userID);
        } else {
          const code = parseInt(lobby.code);
          console.log("Processing disconnect for lobby code:", code);

          // User lobby_id nullázása
          await User.update({ lobby_id: null }, { where: { id: userID } });

          //ha a játékos a host, akkor új hostot kell választani
          if (lobbies[code].host === userID) {
            const newHost = lobbies[code].players.find(
              (player) => player.id !== userID
            );
            if (newHost) {
              console.log("New host:", newHost.username);
              lobbies[code].host = newHost.id;
              await Host.update(
                { host_id: newHost.id },
                {
                  where: { lobby_id: user.lobby_id },
                }
              );
            } else {
              console.log("No new host!");
            }
          }
          if (lobbies[code]) {
            // Játékos eltávolítása a memóriából
            const playerIndex = lobbies[code].players.findIndex(
              (player) => player.id === userID
            );

            if (playerIndex >= 0) {
              lobbies[code].players.splice(playerIndex, 1);
              io.to(code).emit("updateLobby", lobbies[code]);
              console.log(lobbies[code]);

              // Ha üres a lobby, töröljük
              if (lobbies[code].players.length === 0) {
                console.log("Removing empty lobby:", code);
                try {
                  // Először keressük meg a lobby ID-t
                  const lobbyToDelete = await Lobby.findOne({
                    where: { code: code },
                  });

                  if (lobbyToDelete) {
                    // Először töröljük a kapcsolódó Host rekordokat
                    await Host.destroy({
                      where: {
                        lobby_id: lobbyToDelete.id,
                      },
                    });

                    // Majd nullázzuk a felhasználók lobby_id-ját
                    await User.update(
                      { lobby_id: null },
                      {
                        where: {
                          lobby_id: lobbyToDelete.id,
                        },
                      }
                    );

                    // Végül töröljük magát a Lobby-t
                    await Lobby.destroy({
                      where: {
                        id: lobbyToDelete.id,
                      },
                    });

                    // Töröljük a memóriából
                    delete lobbies[code];
                  }
                } catch (error) {
                  console.error("Error deleting lobby:", error);
                }
              }
            }
          }
        }
        user_socket.delete(userID);
        console.log("actives:", user_socket);

        console.log("Disconnected user:", userID);
      } catch (error) {
        console.log("Error during disconnect handling:", error);
      }
    }, 5000);
  });

  socket.on("shuffleDrawDeck", (data) => {
    const { code } = data;
    const lobby = lobbies[code];
    shuffleArray(lobby.decks.drawDeck);
    lobbies[code] = lobby;
    io.to(code).emit("updateLobby", lobby);
  });

  socket.on("gameStart", async (data) => {
    console.log("Server got the code!");
    io.to(data.code).emit("gameStart", lobbies[data.code]);
  });
});

if (process.env.NODE_ENV !== "test") {
  server.listen(3001, "127.0.0.1", async () => {
    console.log("SERVER IS RUNNING");
    console.log(server.address().address + ":" + server.address().port);
    await initLobbies();
  });
}

module.exports = { app, server, io, User, Lobby, Preset, Host, shuffleArray };
