const ioc = require("socket.io-client");
const { Server } = require("socket.io");
const { server } = require("../../index");
const { User, Lobby } = require("../../models");
const {
  testlobbies,
  createCode,
  addPLayer,
  createLobby,
  canJoin,
} = require("../../testmemory/testlobbies");

function waitFor(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, resolve);
  });
}

describe("Lobby Tests", () => {
  let io, serverSocket, clientSocket, user;
  const TEST_PORT = 3002;


 /*  beforeEach(async () => {

  }) */

  beforeAll(async () => {
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

    return new Promise((resolve) => {
      server.listen(TEST_PORT, async () => {
        // Create test user
        user = await User.create({
          username: "testuser",
          email: "test@test.com",
          password: "password123",
        });
        user2 = await User.create({
          username: "testuser2",
          email: "test2@test2.com",
          password: "password123",
        });

        // Setup socket.io server
        io = new Server(server);

        // Setup client socket with user_id
        clientSocket = ioc(`http://localhost:${TEST_PORT}`, {
          query: { user_id: user.id },
        });

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
            }
          });

          socket.on("newGame", (socket) => {});

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
    const user = await User.findOne({ where: { username: "testuser" } });
    const user2 = await User.findOne({ where: { username: "testuser2" } });
    const lobby = await Lobby.create({
      name: "Test Lobby",
      host: user2.id,
      code: 1234,
      status: "waiting",
    });

    // Emit joinLobby event
    clientSocket.emit("joinLobby", {
      code: 1234,
      user: user.username,
      user_id: user.id,
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
      id: user.id,
      username: "testuser",
    });
  }, 15000); 


  test("should create a lobby", async () => {
    // Create a lobby first
    const user = await User.findOne({ where: { username: "testuser" } });
    const user2 = await User.findOne({ where: { username: "testuser2" } });
    const lobby = await Lobby.create({
      name: "Test Lobby",
      host: user2.id,
      code: 1234,
      status: "waiting",
    });
    // Emit createLobby event
  },15000); 
});
