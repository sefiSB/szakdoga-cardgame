const { User, Lobby, Preset, Host } = require("../models");

beforeAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
});


jest.setTimeout(10000);
