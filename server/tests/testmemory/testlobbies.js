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
      drawDeck: [["card0","jpg",0],["card1","jpg",1],["card2","jpg",2]],
      throwDeck: [["card100","jpg",100]],
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
      onHand: [["card3","jpg",3],["card4","jpg",4],["card5","jpg",5]], //TEMPORARY
      onTableVisible: [["card6","jpg",6],["card7","jpg",7]], //TEMPORARY
      onTableHidden: [],
    },
  });
  return true;
};

module.exports = { testlobbies, createCode, addPLayer, createLobby,canJoin };
