// lobbies.js
const testlobbies = {};

const createCode = () => {
  while (true) {
    const code = Math.floor(1000 + Math.random() * 9000);
    if (!testlobbies[code]) {
      return code;
    }
  }
};

const lobbyContainsPlayer = (code, playerID) => {
  return testlobbies[code].players.some((player) => player.id === playerID);
};

const createLobby = (data) => {
  testlobbies[data.code] = {
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
  console.log(testlobbies[code].state);
  return (testlobbies[code].players.length < testlobbies[code].presetdata.maxplayers && testlobbies[code].state==="waiting");
};

const addPLayer = (code, player) => {
  if (!testlobbies[code]) {
    return false;
  }
  if (lobbyContainsPlayer(code, player.id)) {
    return false;
  }
  testlobbies[code].players.push({
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

module.exports = { testlobbies, createCode, addPLayer, createLobby,canJoin };
