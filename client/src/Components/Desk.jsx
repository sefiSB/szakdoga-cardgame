import { useEffect, useState } from "react";
import { initialState } from "../Store/store";
import { useNavigate } from "react-router-dom";
import SettingsMenu from "./SettingsMenu";

function Desk({ socket }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [amIIn, setAmIIn] = useState(true);
  const [data, setData] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  //const [swapOnHandRequest, setSwapOnHandRequest]= useState(false);
  const [onHandSwapName, setOnHandSwapName] = useState(null);
  const [playFrom, setPlayFrom] = useState(null);

  const navigate = useNavigate();
  if (!initialState.user_id) {
    navigate("/login");
  }

  const kickPlayer = () => {
    socket.emit("kickPlayer", {
      code: initialState.code,
      player_id: selectedPlayer,
    });
  };

  const isIn = () => {
    if (data) {
      if (data.players.find((p) => p.id === initialState.user_id)) {
        setAmIIn(true);
      }
      setAmIIn(false);
    }
  };

  const playCard = (tc,pf) => {
    console.log(tc);
    socket.emit("playCard", {
      code: initialState.code,
      player_id: initialState.user_id,
      cardName: tc,
      playFrom:pf,
    });
  };

  const sendOnHandReq = () => {
    socket.emit("switchOnHand", {
      from: initialState.user_id,
      to: selectedPlayer,
      code: initialState.code,
    });
    setSelectedPlayer(null);
  };

  const sendAnswer = (ans) => {
    socket.emit("respondOnHandSwitch", {
      from: onHandSwapName,
      to: initialState.user_id,
      code: initialState.code,
      isAccepted: ans,
    });
    setSelectedPlayer(null);
  };

  const drawOne = () => {
    socket.emit("drawCard", {
      code: initialState.code,
      player_id: initialState.user_id,
    });
  };

  const giveCardToPlayer = (player_id) => {
    socket.emit("giveCard", {
      player_id: player_id,
      code: initialState.code,
      cardname: selectedCard,
    });
  };

  console.log(initialState.code);

  const startingGame = () => {
    socket.emit("hostStarted", { code: initialState.code });
  };

  const giveHost = () => {
    socket.emit("grantHost", {
      player_id: selectedPlayer,
      code: initialState.code,
    });
  };

  const shuffleThrowDeckIn = () => {
    socket.emit("shuffleThrowDeckIn", { code: initialState.code });
  };

  const gameStart = async () => {
    const response = await fetch("http://127.0.0.1:3001/gamestart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: initialState.code,
      }),
    });

    const d = await response.json();
    setData(d);
    console.log(initialState.code);
    socket.emit("gameStart", { code: initialState.code });

    /* socket.emit("joinLobby", {
      code: d.code,
      user: initialState.user,
      user_id: initialState.user_id,
    }); */

    /* socket.on("updateLobby", (response) => {
      console.log("Kliens visszakapta az adatokat "+response);
      setData(response);
    }); */

    return () => {
      socket.off("gameStart");
    };
  };

  useEffect(() => {
    gameStart();

    socket.on("updateLobby", (response) => {
      console.log("Jött adat");
      setData(response);
      isIn();
    });

    socket.on("requestOnHandSwitch", (data) => {
      const { from, to, code } = data;

      console.log(to, " - ", initialState.user_id);
      if (to === initialState.user_id) {
        setOnHandSwapName(from);
      }
    });

    return () => {
      socket.off("updateLobby");
    };
  }, [socket]);
  if (!data) {
    return <div className="text-center text-white">Loading game data...</div>;
  }

  const players = data.players;
  const totalPlayers = players.length;
  const player = data.players.find((p) => p.id === initialState.user_id);
  console.log(player);

  if (data.state === "waiting") {
    return (
      <>
        <SettingsMenu socket={socket} />
        <div className="relative w-[90vw] h-[80vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
          {/* Középen a húzó- és dobópakli,  itt majd drag&drop-os téma lesz */}
          <div className="absolute bg-gray-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {data.host === initialState.user_id ? (
              <p>
                Join code: <strong>{data.code}</strong>
              </p>
            ) : (
              <p> Waiting for host to start the game...</p>
            )}
          </div>

          {/* Játékosok elhelyezése */}
          {players
            .filter((player) => player.id != initialState.user_id)
            .map((player, index) => {
              let positionStyle = {};
              if (index < totalPlayers / 2) {
                // Felső játékosok (elosztva)
                positionStyle = {
                  top: "3%",
                  left: `${(index / (totalPlayers / 2)) * 80 + 10}%`,
                };
              } else {
                // Oldalsó játékosok (bal/jobb)
                const sideIndex = index - Math.floor(totalPlayers / 2);
                const yPos = `${(sideIndex / (totalPlayers / 2)) * 70 + 10}%`;

                positionStyle =
                  index % 2 === 0
                    ? { left: "2%", top: yPos } // Bal oldal
                    : { right: "2%", top: yPos }; // Jobb oldal
              }

              return (
                <div
                  key={player.id}
                  className="absolute flex flex-col items-center"
                  style={positionStyle}
                >
                  <div className="bg-blue-500 p-2 rounded-md">
                    {player.username}
                  </div>
                </div>
              );
            })}
        </div>
        {data.host === initialState.user_id ? (
          <>
            <div className="justify-center items-center flex gap-5">
              <button
                class="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"
                onClick={startingGame}
              >
                Start game
              </button>
            </div>
          </>
        ) : (
          <></>
        )}
      </>
    );
  }

  if (data.state === "ended") {
    return (
      <>
        <SettingsMenu socket={socket} />
        <div className="relative w-[90vw] h-[80vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
          <div className="absolute bg-gray-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            Game ended
          </div>
          <div className="flex">
            <button>Exit</button>
          </div>
        </div>
      </>
    );
  }

  if (!amIIn) {
    return (
      <>
        <div className="items-center justify-center">
          <div>You've been kicked!</div>
          <button onClick={() => navigate("/createorjoin")}>Back</button>
        </div>
      </>
    );
  }

  return (
    <>
      <SettingsMenu socket={socket} />
      <div className="relative">
        {onHandSwapName !== null ? (
          <div
            role="alert"
            className="alert alert-vertical sm:alert-horizontal absolute bottom-0 right-0 left-0 m-4 z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-info h-6 w-6 shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <div>
              <h3 className="font-bold">New message!</h3>
              <div className="text-xs">
                Kitalálom wants to swap decks with you
              </div>
            </div>
            <button
              onClick={() => {
                sendAnswer(true);
                setOnHandSwapName(null);
              }}
              className="btn btn-sm"
            >
              Accept
            </button>
            <button
              onClick={() => {
                sendAnswer(false);
                setOnHandSwapName(null);
              }}
              className="btn btn-sm"
            >
              Reject
            </button>
          </div>
        ) : (
          <></>
        )}
        <div className="relative w-[90vw] h-[90vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
          {/* Középen a húzó- és dobópakli */}

          <div className="absolute bg-green-600 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex gap-4">
              {data.decks.drawDeck.length > 0 ? (
                <img
                  className="w-[5vh]"
                  src={`assets/cards/${data.presetdata.cardType}/card_back.${
                    data.presetdata.cardType === "french" ? "svg" : "png"
                  }`} //EZT IS ÁT KELL GONDOLNI SZINTÉN
                  alt="drawDeck"
                  deckdata="drawDeck"
                  onClick={(e) => {
                    const deckType = e.target.getAttribute("deckdata");
                    if (selectedDeck === deckType) {
                      setSelectedDeck(null);
                    } else {
                      setSelectedDeck(deckType);
                      setSelectedPlayer(null);
                      setSelectedCard(null);
                      setPllayFrom(null);
                    }
                  }}
                />
              ) : (
                <div
                  className="w-full h-full border-2 border-white rounded-lg"
                  style={{ width: "5vh", height: "7vh" }}
                ></div>
              )}
              {console.log(data.decks.throwDeck)}
              <div className="relative">
                {data.decks.throwDeck.length > 0 ? (
                  
                  <img
                  
                    src={
                      `/assets/cards/${data.presetdata.cardType}/` +
                      data.decks.throwDeck[data.decks.throwDeck.length - 1][1]
                    }
                    alt="throwDeck"
                    deckdata="throwDeck"
                    style={{ width: "5vh" }}
                    onClick={(e) => {
                      const deckType = e.target.getAttribute("deckdata");

                      if (selectedDeck === deckType) {
                        setSelectedDeck(null);
                      } else {
                        setSelectedDeck(deckType);
                        setSelectedPlayer(null);
                        setSelectedCard(null);
                        setPlayFrom(null);
                      }
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full border-2 border-white rounded-lg"
                    style={{ width: "5vh", height: "7vh" }}
                  ></div>
                )}
              </div>
            </div>
          </div>

          {selectedCard !== null ? (
            <div className="absolute top-1 right-1 bg-gray-700 rounded-lg">
              <h1 className="ml-3 mt-1">Card actions</h1>
              <ul class="menu menu-sm bg-base-200 rounded-box w-56">
                <li>
                  <a
                    onClick={() => {
                      playCard(selectedCard,playFrom);
                      setSelectedCard(null);
                      setPlayFrom(null);
                    }}
                  >
                    Play card (throwdeck)
                  </a>
                </li>
                <li>
                  <a>Reveal card</a>
                </li>
                <li>
                  <a>Hide card</a>
                </li>
                <li>
                  <a>Switch with other player</a>
                </li>
                {data.host === initialState.user_id ? (
                  <li>
                    <a>Give to other player</a>
                    <ul className="menu menu-sm bg-base-200 rounded-box w-56 ml-4">
                      {data.players
                        .filter((player) => player.id !== initialState.user_id)
                        .map((player) => (
                          <li key={player.id}>
                            <a
                              onClick={() => {
                                giveCardToPlayer(player.id);
                                setSelectedCard(null);
                                setPlayFrom(null);
                              }}
                            >
                              {player.username}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </li>
                ) : (
                  <></>
                )}
              </ul>
            </div>
          ) : (
            <></>
          )}

          {selectedDeck !== null ? (
            <div className="absolute top-1 right-1 bg-gray-700 rounded-lg">
              <h1 className="ml-3 mt-1">Deck actions</h1>
              <ul class="menu menu-sm bg-base-200 rounded-box w-56">
                {selectedDeck === "drawDeck" ? (
                  <li>
                    <a
                      onClick={() => {
                        drawOne();
                        setSelectedDeck(null);
                      }}
                    >
                      Draw ONE (draw deck)
                    </a>
                  </li>
                ) : (
                  <></>
                )}

                {selectedDeck === "throwDeck" ? (
                  <>
                    <li>
                      <a>Idk yet</a>
                    </li>
                    {data.host === initialState.user_id ? (
                      <>
                        <li>
                          <a onClick={shuffleThrowDeckIn}>
                            Shuffle throw deck into draw deck
                          </a>
                        </li>
                        <li>
                          <a>Give last card to player</a>
                        </li>
                      </>
                    ) : (
                      <> </>
                    )}
                  </>
                ) : (
                  <></>
                )}
              </ul>
            </div>
          ) : (
            <></>
          )}

          {selectedPlayer !== null ? (
            <div className="absolute top-1 right-1 bg-gray-700 rounded-lg">
              <h1 className="ml-3 mt-1">Player actions</h1>
              <ul className="menu menu-sm bg-base-200 rounded-box w-56">
                <li>
                  <a
                    onClick={() => {
                      sendOnHandReq();
                    }}
                  >
                    Swap cards on hands
                  </a>
                </li>
                {data.host === initialState.user_id ? (
                  <li>
                    <a onClick={kickPlayer}>Kick player</a>
                  </li>
                ) : (
                  <></>
                )}
                {data.host === initialState.user_id ? (
                  <li>
                    <a onClick={giveHost}>Give host</a>
                  </li>
                ) : (
                  <></>
                )}
              </ul>
            </div>
          ) : (
            <></>
          )}

          <div className="absolute top-1 right-1 bg-gray-700 rounded-lg"></div>

          {players
            .filter((player) => player.id !== initialState.user_id)
            .map((player, index) => {
              let positionStyle = {};
              if (index < totalPlayers / 2) {
                // Felső játékosok (elosztva)
                positionStyle = {
                  top: "3%",
                  left: `${(index / (totalPlayers / 2)) * 80 + 10}%`,
                };
              } else {
                // Oldalsó játékosok (bal/jobb)
                const sideIndex = index - Math.floor(totalPlayers / 2);
                const yPos = `${(sideIndex / (totalPlayers / 2)) * 70 + 10}%`;

                positionStyle =
                  index % 2 === 0
                    ? { left: "2%", top: yPos } // Bal oldal
                    : { right: "2%", top: yPos }; // Jobb oldal
              }

              return (
                <div
                  key={player.id}
                  className="absolute flex flex-col items-center"
                  style={positionStyle}
                >
                  <div
                    onClick={(e) => {
                      if (selectedPlayer === player.id) {
                        setSelectedPlayer(null);
                      } else {
                        console.log("mivan");
                        setSelectedDeck(null);
                        setSelectedCard(null);
                        setPlayFrom(null);
                        setSelectedPlayer(player.id);
                      }
                    }}
                    className="bg-blue-500 p-2 rounded-md"
                  >
                    {player.username}
                  </div>
                  <div className="flex flex-col items-center">
                    {/* onHand (lefordítva) */}
                    <div className="flex">
                      {player.cards.onHand.map((card, index) => (
                        <div key={index} className="bg-blue-500 m-1 rounded-md">
                          <img
                            src={`/assets/cards/${
                              data.presetdata.cardType
                            }/card_back.${
                              data.presetdata.cardType === "french"
                                ? "svg"
                                : "png"
                            }`}
                            alt=""
                            style={{ width: "5vh" }}
                          />
                        </div>
                      ))}
                    </div>
                    {/* onTableVisible (felfordítva) */}
                    <div className="flex">
                      {player.cards.onTableVisible.map(
                        ([cardname, cardfile], index) => (
                          <div
                            key={index}
                            className="bg-blue-500 m-1 rounded-md"
                          >
                            <img
                              src={`/assets/cards/${data.presetdata.cardType}/${cardfile}`}
                              alt={cardname}
                              style={{ width: "5vh" }}
                            />
                          </div>
                        )
                      )}
                    </div>
                    {/* onTableHidden (lefordítva) */}
                    <div className="flex">
                      {player.cards.onTableHidden.map((card, index) => (
                        <div key={index} className="bg-blue-500 m-1 rounded-md">
                          <img
                            src={`/assets/cards/${
                              data.presetdata.cardType
                            }/card_back.${
                              data.presetdata.cardType === "french"
                                ? "svg"
                                : "png"
                            }`}
                            alt=""
                            style={{ width: "5vh" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex">
                    {console.log(data.presetdata.cardType)}
                    {/* {player.cards.onTableVisible.map(
                      ([cardname, cardfile], index) => (
                        <div key={index} className="bg-blue-500 m-1 rounded-md">
                          <img
                            src={
                              "/assets/cards/" +
                              data.presetdata.cardType +
                              "/" +
                              cardfile
                            }
                            alt=""
                            style={{ width: "5vh" }}
                          />
                        </div>
                      )
                    )} */}
                  </div>
                </div>
              );
            })}

          {/* Saját lapok alul */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {player.cards.onHand.map(([cardname, cardfile], index) => {
              return (
                <div
                  onClick={(e) => {
                    if (selectedCard === cardname) {
                      setSelectedCard(null);
                    } else {
                      setSelectedDeck(null);
                      setSelectedPlayer(null);
                      setSelectedCard(cardname);
                      setPlayFrom("onHand");
                      console.log(cardname)
                    }
                  }}
                  key={index}
                  className={`bg-red-500 p-0 rounded-lg ${
                    selectedCard === cardname
                      ? "outline outline-4 outline-yellow-500"
                      : ""
                  }`}
                >
                  <img
                    className="w-[13vh]"
                    src={
                      `/assets/cards/${data.presetdata.cardType}/` + cardfile
                    }
                    alt=""
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default Desk;
