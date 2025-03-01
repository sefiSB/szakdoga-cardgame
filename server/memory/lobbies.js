// lobbies.js
const lobbies = {};

const createCode = () => {
  while (true) {
    const code = Math.floor(Math.random() * 10000);
    if (!lobbies[code]) {
      return code;
    }
  }
};

const lobbyContainsPlayer = (code, playerID) => {
    return lobbies[code].players.some((player) => player.id === playerID);
};

const createLobby = (data) => {
  lobbies[data.code] = {
    name: data.name,
    code: data.code,
    players: [],
    state: "waiting",
    decks: {
      drawDeck: [],
      throwDeck: [],
      onTable: [],
    },
  };
};

const addPLayer = (code, player) => {
  if (!lobbies[code]) {
    return false;
  }
  if (lobbyContainsPlayer(code,player.id)) {
    return false;
  }
  lobbies[code].players.push({
    id: player.id,
    username: player.username,
    cards: {
      onHand: ["2 of clubs"], //TEMPORARY
      onTableVisible: ["2 of clubs"], //TEMPORARY
      onTableHidden: [], //TEMPORARY
    },
  });
  return true;
};

module.exports = { lobbies, createCode, addPLayer, createLobby };
