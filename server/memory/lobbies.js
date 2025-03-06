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
    host:data.host,
    presetdata: {
      startingCards: data.presetdata.startingCards,
      host: data.presetdata.user_id,
      cardType: data.presetdata.cardType,
      packNumber: data.presetdata.packNumber,
      usedCards: data.presetdata.usedCards,
      maxplayers: data.presetdata.maxplayers,
    },
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
  if (lobbyContainsPlayer(code, player.id)) {
    return false;
  }
  lobbies[code].players.push({
    id: player.id,
    username: player.username,
    cards: {
      onHand: [], //TEMPORARY
      onTableVisible: [], //TEMPORARY
      onTableHidden: [], //TEMPORARY
    },
  });
  return true;
};

module.exports = { lobbies, createCode, addPLayer, createLobby };
