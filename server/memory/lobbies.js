// lobbies.js
const lobbies = {};

const createCode = () => {
  while (true) {
    const code = Math.floor(1000 + Math.random() * 9000);
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
    host: data.host,
    presetdata: {
      startingCards: data.presetdata.startingCards,
      host: data.presetdata.host,
      cardType: data.presetdata.cardType,
      packNumber: data.presetdata.packNumber,
      usedCards: data.presetdata.usedCards,
      maxplayers: data.presetdata.maxplayers,
      hiddenCards: data.presetdata.hiddenCards,
      revealedCards: data.presetdata.revealedCards,
      isCardsOnDesk: data.presetdata.isCardsOnDesk,
    },
    decks: {
      drawDeck: [],
      throwDeck: [],
      onTable: [],
    },
  };
};

const canJoin = (code) => {
  console.log("max players: ",lobbies[code].presetdata.maxplayers);
  return lobbies[code].players.length < lobbies[code].presetdata.maxplayers;
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

module.exports = { lobbies, createCode, addPLayer, createLobby,canJoin };
