const { User, Lobby, Preset, Host } = require('../models');

beforeAll(async () => {
  // Clean database before all tests
  /* await User.destroy({ where: {} });
  await Lobby.destroy({ where: {} });
  await Preset.destroy({ where: {} });
  await Host.destroy({ where: {} }); */
});

afterAll(async () => {
  // Close connections after all tests
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Increase timeout for all tests
jest.setTimeout(10000);