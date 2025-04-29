const ioc = require("socket.io-client");
const request = require("supertest");
const { Server } = require("socket.io");
const { server, app, Host, shuffleArray } = require("../../index");
const { User, Lobby, Preset } = require("../../models");
const {
  testlobbies,
  createLobby,
  addPLayer,
} = require("../testmemory/testlobbies");
const { where } = require("sequelize");

//const { request } = require("express");

function waitFor(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

describe("Lobby Tests", () => {
  let io, serverSocket, clientSocket, user;
  const TEST_PORT = 3002;

  beforeEach(async () => {
    const user = await User.create({
      username: "testuser",
      email: "test23@test.com",
      password: "password123",
    });
    const user2 = await User.create({
      username: "testuser2",
      email: "asdasf@asdsad.hu",
      password: "password123",
    });

    const lobby = await Lobby.create({
      name: "Test Lobby",
      code: 1234,
      startingcards: 5,
      isCardsOnDesk: true,
      revealedCards: 3,
      hiddenCards: 1,
      host: user.id,
      cardType: "french",
      packNumber: 1,
      usedCards: [],
      maxplayers: 2,
    });

    createLobby({
      name: "testlobby",
      code: 1234,
      host: user.id,
      presetdata: {
        startingCards: 5,
        host: user.id,
        cardType: "french",
        packNumber: 1,
        usedCards: ["card1", "card2", "card3"],
        maxplayers: 2,
        hiddenCards: 1,
        revealedCards: 3,
        isCardsOnDesk: true,
      },
    });
    addPLayer(1234, { id: user.id });
  });

  afterEach(async () => {
    await User.destroy({
      where: {
        username: "testuser",
      },
    });
    await User.destroy({
      where: {
        username: "testuser2",
      },
    });

    await Lobby.destroy({
      where: {
        name: "Test Lobby",
      },
    });
    Object.keys(testlobbies).forEach((key) => {
      delete testlobbies[key];
    });
  });

  beforeAll(async () => {
    return new Promise((resolve) => {
      server.listen(TEST_PORT, async () => {
        // Setup socket.io server
        io = new Server(server);

        // Setup client socket with user_id
        clientSocket = ioc(`http://localhost:${TEST_PORT}`);

        // Wait for connection and setup
        io.on("connection", (socket) => {
          socket.on("joinLobby", async (data) => {
            const lobby = await Lobby.findOne({ where: { code: data.code } });
            if (lobby) {
              socket.join(parseInt(lobby.code));
              io.to(parseInt(lobby.code)).emit("updateLobby", {
                players: {
                  id: data.user_id,
                  username: data.user,
                },
              });
            } else {
              io.to(socket.id).emit("codeError", {
                error: "Invalid lobby code",
              });
            }
          });

          socket.on("hostStarted", (data) => {
            testlobbies[data.code].state = "ongoing";

            testlobbies[data.code].decks.drawDeck = JSON.parse(
              JSON.stringify(testlobbies[data.code].presetdata.usedCards)
            ); //trükk, hogy ne referencia másolás legyen

            testlobbies[data.code].decks.drawDeck = testlobbies[
              data.code
            ].decks.drawDeck.map((card, i) => [...card, i]);
            shuffleArray(testlobbies[data.code].decks.drawDeck);
            for (let i = 0; i < testlobbies[data.code].players.length; i++) {
              for (
                let j = 0;
                j < testlobbies[data.code].presetdata.startingCards;
                j++
              ) {
                testlobbies[data.code].players[i].cards.onHand.push(
                  testlobbies[data.code].decks.drawDeck.pop()
                );
              }
            }

            if (testlobbies[data.code].presetdata.isCardsOnDesk) {
              for (let i = 0; i < testlobbies[data.code].players.length; i++) {
                for (
                  let j = 0;
                  j < testlobbies[data.code].presetdata.revealedCards;
                  j++
                ) {
                  testlobbies[data.code].players[i].cards.onTableVisible.push(
                    testlobbies[data.code].decks.drawDeck.pop()
                  );
                }
              }

              for (let i = 0; i < testlobbies[data.code].players.length; i++) {
                for (
                  let j = 0;
                  j < testlobbies[data.code].presetdata.hiddenCards;
                  j++
                ) {
                  testlobbies[data.code].players[i].cards.onTableHidden.push(
                    testlobbies[data.code].decks.drawDeck.pop()
                  );
                }
              }
            }
            io.to(socket.id).emit("updateLobby", testlobbies[data.code]);
          });

          socket.on("kickPlayer", async (data) => {
            const { player_id, code } = data;
            const lobby = testlobbies[code];
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

          socket.on("grantHost", async (data) => {
            const { player_id, code } = data;
            const lobby = testlobbies[code];
            const playerInd = lobby.players.findIndex(
              (player) => player.id === player_id
            );
            if (playerInd < 0) {
              return;
            }
            try {
              lobby.host = player_id;
              io.to(code).emit("updateLobby", lobby);
            } catch (error) {
              console.log(error);
            }
          });

          socket.on("restartGame", (data) => {
            const { code } = data;
            let lobby = testlobbies[code];
            lobby.state = "restarted";

            lobby.decks.drawDeck = JSON.parse(
              JSON.stringify(lobby.presetdata.usedCards)
            );
            lobby.decks.throwDeck = [];

            lobby.decks.drawDeck = lobby.decks.drawDeck.map((card, i) => [
              ...card,
              i,
            ]);

            // Játékosok kártyáinak törlése
            lobby.players.forEach((player) => {
              player.cards.onHand = [];
              player.cards.onTableVisible = [];
              player.cards.onTableHidden = [];
            });
            testlobbies[code] = lobby;
            io.to(code).emit("updateLobby", testlobbies[code]);
          });

          socket.on("endGame", async (data) => {
            const { code } = data;
            testlobbies[code].state = "ended";
            io.to(code).emit("updateLobby", testlobbies[code]);
          });

          socket.on("giveFromThrowDeck", (data) => {
            const { code, player_id } = data;
            const lobby = testlobbies[code];
            const player = lobby.players.find(
              (player) => player.id === player_id
            );
            console.log(player_id);
            console.log(lobby.players);
            player.cards.onHand.push(lobby.decks.throwDeck.pop());
            testlobbies[code] = lobby;
            console.log("asdasdasd");
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("giveCard", (data) => {
            const { from, player_id, code, cardNo } = data;
            const lobby = testlobbies[code];
            const player = lobby.players.find(
              (player) => player.id === player_id
            );
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
                .cards.onTableVisible.findIndex(
                  ([__, _, cno]) => cno === cardNo
                );

              [card] = lobby.players
                .find((player) => player.id === lobby.host)
                .cards.onTableVisible.splice(cardInd, 1);
            }
            if (from === "onTableHidden") {
              cardInd = lobby.players
                .find((player) => player.id === lobby.host)
                .cards.onTableHidden.findIndex(
                  ([__, _, cno]) => cno === cardNo
                );

              [card] = lobby.players
                .find((player) => player.id === lobby.host)
                .cards.onTableHidden.splice(cardInd, 1);
            }
            player.cards.onHand.push(card);

            testlobbies[code] = lobby;
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("shuffleDrawDeck", (data) => {
            const { code } = data;
            lobby = testlobbies[code];
            //shuffleArray(lobby.decks.drawDeck);
            //Kevés kártya esetén megegyezhet a sorrend, azért csak megcserélem az elsőt és az utolsót
            tmp = lobby.decks.drawDeck[0];
            lobby.decks.drawDeck[0] =
              lobby.decks.drawDeck[lobby.decks.drawDeck.length - 1];
            lobby.decks.drawDeck[lobby.decks.drawDeck.length - 1] = tmp;
            testlobbies[code] = lobby;
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("shuffleThrowDeckIn", (data) => {
            const { code } = data;
            const lobby = testlobbies[code];
            lobby.decks.drawDeck = [
              ...lobby.decks.drawDeck,
              ...lobby.decks.throwDeck,
            ];
            shuffleArray(lobby.decks.drawDeck);
            lobby.decks.throwDeck = [];
            testlobbies[code] = lobby;
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("playCard", (data) => {
            const { code, player_id, cardNo, playFrom } = data;
            const lobby = testlobbies[code];
            const player = lobby.players.find(
              (player) => player.id === player_id
            );

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
            testlobbies[code] = lobby;
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("drawCard", (data) => {
            const { code, player_id } = data;
            const lobby = testlobbies[code];
            const player = lobby.players.find(
              (player) => player.id === player_id
            );

            if (!player || !lobby) {
              console.log("vmi nemjó");
            }

            player.cards.onHand.push(lobby.decks.drawDeck.pop());

            testlobbies[code] = lobby;
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("revealCard", (data) => {
            const { player_id, code, cardNo, playFrom } = data;

            const lobby = testlobbies[code];
            const player = lobby.players.find(
              (player) => player.id === player_id
            );
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
              testlobbies[code] = lobby;
            }
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("hideCard", (data) => {
            const { player_id, code, cardNo, playFrom } = data;
            const lobby = testlobbies[code];

            const player = lobby.players.find(
              (player) => player.id === player_id
            );
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

              cardInd = player.cards.onHand.findIndex(
                ([__, _, cno]) => cno === cardNo
              );
              if (cardInd >= 0) {
                [card] = player.cards.onHand.splice(cardInd, 1);
              }
            }

            if (cardInd >= 0) {
              player.cards.onTableHidden.push(card);
              testlobbies[code] = lobby;
            }
            io.to(code).emit("updateLobby", lobby);
          });

          socket.on("toOnHand", (data) => {
            const { player_id, code, cardNo, playFrom } = data;
            const lobby = testlobbies[code];
            const player = lobby.players.find(
              (player) => player.id === player_id
            );
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
              testlobbies[code] = lobby;
            }
            io.to(code).emit("updateLobby", lobby);
          });

          serverSocket = socket;
          resolve();
        });
      });
    });
  }, 20000); // Increase timeout for setup

  afterAll(async () => {
    return new Promise(async (resolve) => {
      // Cleanup in correct order
      if (clientSocket) clientSocket.disconnect();
      if (io) io.close();
      if (server) server.close();

      // Wait a bit before cleaning up database
      setTimeout(async () => {
        try {
          resolve();
        } catch (error) {
          console.error("Cleanup error:", error);
          resolve();
        }
      }, 500);
    });
  });

  test("should join lobby", async () => {
    // Create a lobby first

    const user2 = await User.findOne({
      where: {
        username: "testuser2",
      },
    });
    // Emit joinLobby event
    clientSocket.emit("joinLobby", {
      code: 1234,
      user: user2.username,
      user_id: user2.id,
    });

    // Wait for updateLobby event with timeout
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        )
      ),
    ]);

    expect(data.players).toMatchObject({
      id: user2.id,
      username: "testuser2",
    });
  }, 15000);

  test("should not join lobby", async () => {
    const user2 = await User.findOne({
      where: {
        username: "testuser2",
      },
    });

    clientSocket.emit("joinLobby", {
      code: 0,
      user: user2.username,
      user_id: user2.id,
    });

    const data = await Promise.race([
      waitFor(clientSocket, "codeError"),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        )
      ),
    ]);

    expect(data).toMatchObject({
      error: "Invalid lobby code",
    });
  });

  test("should create a lobby", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });

    const response = await request(app).post("/addlobby").send({
      gameName: "testlobby",
      startingcards: 5,
      isCardsOnDesk: true,
      revealedCards: 3,
      hiddenCards: 1,
      host: user.id,
      cardType: "french",
      packNumber: 1,
      usedCards: [],
      maxplayers: 2,
    });

    expect(response.body.host).toBe(user.id);

    await Host.destroy({
      where: {
        host_id: user.id,
      },
    });

    await User.update(
      { lobby_id: null },
      {
        where: {
          id: user.id,
        },
      }
    );

    await Lobby.destroy({
      where: {
        name: "testlobby",
      },
    });
  });

  test("should add a preset", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });

    const response = await request(app).post("/addpreset").send({
      name: "testpreset",
      startingcards: 5,
      cards_on_desk: true,
      revealed: 3,
      hidden: 1,
      user_id: user.id,
      maxplayers: 2,
      packNumber: 1,
      cardType: "french",
    });
    expect(response.body.name).toBe("testpreset");

    await Preset.destroy({
      where: {
        name: "testpreset",
      },
    });
  });

  test("game should start", async () => {
    clientSocket.emit("hostStarted", { code: 1234 });

    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.state).toBe("ongoing");
  });

  test("should kick player", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });
    clientSocket.emit("kickPlayer", {
      player_id: user.id,
      code: 1234,
    });
    const data = await Promise.race([
      waitFor(clientSocket, "kicked"),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout waiting for kicked")), 5000);
      }),
    ]);
    expect(data).toBe(user.id);
  });

  test("should grant host", async () => {
    const user2 = await User.findOne({
      where: {
        username: "testuser",
      },
    });
    clientSocket.emit("grantHost", {
      player_id: user2.id,
      code: 1234,
    });
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.host).toBe(user2.id);
  });

  test("should restart game", async () => {
    clientSocket.emit("restartGame", {
      code: 1234,
    });
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.state).toBe("restarted"); //csak azért van ilyen állapot, hogy tesztelni lehessen
  });

  test("should end game", async () => {
    clientSocket.emit("endGame", {
      code: 1234,
    });
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.state).toBe("ended"); //csak azért van ilyen állapot, hogy tesztelni lehessen
  });

  test("should give throwdeck's last card to player", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });

    clientSocket.emit("giveFromThrowDeck", {
      code: 1234,
      player_id: user.id,
    });
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.players[0].cards.onHand.length).toBe(4);
  });

  test("should give card to player", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });
    const user2 = await User.findOne({
      where: {
        username: "testuser2",
      },
    });

    addPLayer(1234, { id: user2.id });
    clientSocket.emit("giveCard", {
      from: "onHand",
      player_id: user2.id,
      code: 1234,
      cardNo: 5,
    });
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.players[1].cards.onHand.length).toBe(4);
  });

  test("should shuffle drawdeck", async () => {
    clientSocket.emit("shuffleDrawDeck", {
      code: 1234,
    });

    last =
      testlobbies[1234].decks.drawDeck[
        testlobbies[1234].decks.drawDeck.length - 1
      ];

    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.decks.drawDeck[0]).toMatchObject(last);
  });

  test("should shuffle throwdeck in", async () => {
    clientSocket.emit("shuffleThrowDeckIn", {
      code: 1234,
    });
    const sum =
      testlobbies[1234].decks.drawDeck.length +
      testlobbies[1234].decks.throwDeck.length;
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.decks.drawDeck.length).toBe(sum);
  });

  test("should play a card", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });

    clientSocket.emit("playCard", {
      code: 1234,
      player_id: user.id,
      cardNo: 3,
      playFrom: "onHand",
    });
    card = testlobbies[1234].players[0].cards.onHand[0];
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);

    expect(data.decks.throwDeck[data.decks.throwDeck.length - 1]).toMatchObject(
      card
    );
  });

  test("should draw a card", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });

    clientSocket.emit("drawCard", {
      code: 1234,
      player_id: user.id,
    });
    cardcount = testlobbies[1234].players[0].cards.onHand.length;
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);

    expect(data.players[0].cards.onHand.length).toBe(cardcount + 1);
  });

  test("should reveal a card", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });

    clientSocket.emit("revealCard", {
      player_id: user.id,
      code: 1234,
      cardNo: 3,
      playFrom: "onHand",
    });
    const visiblecount =
      testlobbies[1234].players[0].cards.onTableVisible.length;
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.players[0].cards.onTableVisible.length).toBe(visiblecount + 1);
  });

  test("should hide a card", async () => {
    const user = await User.findOne({
      where: {
        username: "testuser",
      },
    });

    clientSocket.emit("hideCard", {
      player_id: user.id,
      code: 1234,
      cardNo: 3,
      playFrom: "onHand",
    });
    const hiddencount = testlobbies[1234].players[0].cards.onTableHidden.length;
    const data = await Promise.race([
      waitFor(clientSocket, "updateLobby"),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout waiting for updateLobby")),
          5000
        );
      }),
    ]);
    expect(data.players[0].cards.onTableHidden.length).toBe(hiddencount + 1);
  });
});
