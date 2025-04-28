const ioc = require("socket.io-client");
const request = require("supertest");
const { Server } = require("socket.io");
const { server, app, Host, shuffleArray } = require("../../index");
const { User, Lobby, Preset } = require("../../models");
const { testlobbies, createLobby } = require("../testmemory/testlobbies");
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
        usedCards: [],
        maxplayers: 2,
        hiddenCards: 1,
        revealedCards: 3,
        isCardsOnDesk: true,
      },
    });
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
    })
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
            testlobbies[data.code].state="ongoing";

            testlobbies[data.code].decks.drawDeck = JSON.parse(
              JSON.stringify(testlobbies[data.code].presetdata.usedCards)
            ); //trükk, hogy ne referencia másolás legyen
        
            testlobbies[data.code].decks.drawDeck = testlobbies[data.code].decks.drawDeck.map(
              (card, i) => [...card, i]
            );
        
            shuffleArray(testlobbies[data.code].decks.drawDeck);
            for (let i = 0; i < testlobbies[data.code].players.length; i++) {
              for (let j = 0; j < testlobbies[data.code].presetdata.startingCards; j++) {
                testlobbies[data.code].players[i].cards.onHand.push(
                  testlobbies[data.code].decks.drawDeck.pop()
                );
              }
            }
        
            if (testlobbies[data.code].presetdata.isCardsOnDesk) {
              for (let i = 0; i < testlobbies[data.code].players.length; i++) {
                for (let j = 0; j < testlobbies[data.code].presetdata.revealedCards; j++) {
                  testlobbies[data.code].players[i].cards.onTableVisible.push(
                    testlobbies[data.code].decks.drawDeck.pop()
                  );
                }
              }
        
              for (let i = 0; i < testlobbies[data.code].players.length; i++) {
                for (let j = 0; j < testlobbies[data.code].presetdata.hiddenCards; j++) {
                  testlobbies[data.code].players[i].cards.onTableHidden.push(
                    testlobbies[data.code].decks.drawDeck.pop()
                  );
                }
              }
            }
            io.to(data.code).emit("updateLobby", testlobbies[data.code]);
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

  test("game should start", async ()=>{
    clientSocket.emit("hostStarted",{code:1234});

  })
});
