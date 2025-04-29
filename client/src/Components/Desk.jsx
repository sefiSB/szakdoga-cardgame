import { useEffect, useState } from "react";
import { initialState, setItem } from "../Store/store";
import { useNavigate } from "react-router-dom";
import SettingsMenu from "./SettingsMenu";

function Desk({ socket }) {
  const BACKEND_URL = `http://${import.meta.env.VITE_SERVER_IP}:3001`;

  const [data, setData] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [onHandSwapName, setOnHandSwapName] = useState(null);
  const [onHandSwapId, setOnHandSwapId] = useState(null);
  const [playFrom, setPlayFrom] = useState(null);

  const navigate = useNavigate();
  if (!initialState.user_id) {
    navigate("/login");
  }
  if (!initialState.code) {
    navigate("/createorjoin");
  }

  const giveLastToPlayer = (player_id) => {
    socket.emit("giveLastCard", {
      code: initialState.code,
      player_id: player_id,
      playFrom: selectedDeck,
    });
    setSelectedDeck(null);
  };

  const shuffleDrawDeck = () => {
    socket.emit("shuffleDrawDeck", { code: initialState.code });
    setSelectedDeck(null);
  };

  const kickPlayer = () => {
    socket.emit("kickPlayer", {
      code: initialState.code,
      player_id: selectedPlayer,
    });
    setSelectedPlayer(null);
  };

  const revealCard = () => {
    socket.emit("revealCard", {
      player_id: initialState.user_id,
      code: initialState.code,
      cardNo: selectedCard,
      playFrom: playFrom,
    });
    setPlayFrom("onTableVisible");
    setSelectedCard(null);
  };

  const hideCard = () => {
    socket.emit("hideCard", {
      player_id: initialState.user_id,
      code: initialState.code,
      cardNo: selectedCard,
      playFrom: playFrom,
    });
    setPlayFrom("onTableHidden");
    setSelectedCard(null);
  };

  const toOnHand = () => {
    socket.emit("toOnHand", {
      player_id: initialState.user_id,
      code: initialState.code,
      cardNo: selectedCard,
      playFrom: playFrom,
    });
    setPlayFrom("onHand");
    setSelectedCard(null);
  };

  const playCard = (tc, pf) => {
    socket.emit("playCard", {
      code: initialState.code,
      player_id: initialState.user_id,
      cardNo: tc,
      playFrom: pf,
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
      from: onHandSwapId,
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
      from: playFrom,
      player_id: player_id,
      code: initialState.code,
      cardNo: selectedCard,
    });
  };

  const startingGame = () => {
    socket.emit("hostStarted", { code: initialState.code });
  };

  const giveHost = () => {
    socket.emit("grantHost", {
      player_id: selectedPlayer,
      code: initialState.code,
    });
    setSelectedPlayer(null);
  };

  const shuffleThrowDeckIn = () => {
    socket.emit("shuffleThrowDeckIn", { code: initialState.code });
  };

  const gameStart = async () => {
    const response = await fetch(`${BACKEND_URL}/gamestart`, {
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

    return () => {
      socket.off("gameStart");
    };
  };

  useEffect(() => {
    gameStart();
    if(!initialState.user_id){
      navigate("/login");
    }

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      if (initialState.user_id) {
        socket.emit("reconnectClient", {
          user_id: initialState.user_id,
          code: initialState.code,
        });
      } else {
        console.log("No user_id found");
      }
    });

    socket.on("reconnectClient", (data) => {
      console.log("Reconnection acknowledged by server:", data);
    });

    socket.on("updateLobby", (response) => {
      console.log("Jött adat");
      console.log(response);
      setData(response);
    });

    socket.on("kicked", (data) => {
      if (data === initialState.user_id) {
        initialState.code = null;
        setItem("code", null);
        navigate("/kicked");
      }
    });

    socket.on("requestOnHandSwitch", (d) => {
      const { from, to, code } = d;

      console.log(to, " - ", initialState.user_id);
      if (to.id === initialState.user_id) {
        setOnHandSwapName(from.username);
        setOnHandSwapId(from.id);
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

  if (data.state === "waiting") {
    return (
      <>
        <SettingsMenu
          socket={socket}
          isHost={data.host === initialState.user_id}
        />

        {selectedCard !== null ? (
          <div className="absolute top-1 right-1 bg-gray-700 rounded-lg z-50">
            <h1 className="ml-3 mt-1 font-bold text-white">Card actions</h1>
            <ul className="menu menu-sm bg-base-200 rounded-box w-56">
              <li className="font-bold text-white">
                <a
                  onClick={() => {
                    playCard(selectedCard, playFrom);
                    console.log("kártya: ", selectedCard, playFrom);
                    setSelectedCard(null);
                    setPlayFrom(null);
                  }}
                >
                  Play card (throwdeck)
                </a>
              </li>
              <li className="font-bold text-white">
                <a onClick={revealCard}>Reveal card</a>
              </li>
              <li className="font-bold text-white">
                <a onClick={hideCard}>Hide card</a>
              </li>
              <li className="font-bold text-white">
                <a onClick={toOnHand}>Pick up to hand</a>
              </li>
              {data.host === initialState.user_id ? (
                <li className="font-bold text-white">
                  <a>Give to other player</a>
                  <ul className="menu menu-sm bg-base-200 rounded-box w-56 ml-4">
                    {data.players
                      .filter((player) => player.id !== initialState.user_id)
                      .map((player) => (
                        <li key={player.id} className="font-bold text-white">
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
          <div className="absolute top-1 right-1 bg-gray-700 rounded-lg z-50">
            <h1 className="ml-3 mt-1 font-bold text-white">Deck actions</h1>
            <ul className="menu menu-sm bg-base-200 rounded-box w-56">
              {selectedDeck === "drawDeck" ? (
                <>
                  <li className="font-bold text-white">
                    <a
                      onClick={() => {
                        drawOne();
                        setSelectedDeck(null);
                      }}
                    >
                      Draw ONE (draw deck)
                    </a>
                  </li>

                  {data.host === initialState.user_id ? (
                    <>
                      <li className="font-bold text-white">
                        <a>Give last card to player</a>
                        <ul className="menu menu-sm bg-base-200 rounded-box w-56 ml-4">
                          {data.players
                            .filter(
                              (player) => player.id !== initialState.user_id
                            )
                            .map((player) => (
                              <li
                                key={player.id}
                                className="font-bold text-white"
                              >
                                <a
                                  onClick={() => {
                                    giveLastToPlayer(player.id);
                                  }}
                                >
                                  {player.username}
                                </a>
                              </li>
                            ))}
                        </ul>
                      </li>
                    </>
                  ) : (
                    <> </>
                  )}
                </>
              ) : (
                <></>
              )}

              {selectedDeck === "throwDeck" ? (
                <>
                  {data.host === initialState.user_id ? (
                    <>
                      <li className="font-bold text-white">
                        <a onClick={shuffleThrowDeckIn}>
                          Shuffle throw deck into draw deck
                        </a>
                      </li>
                      <li className="font-bold text-white">
                        <a>Give last card to player</a>
                        <ul className="menu menu-sm bg-base-200 rounded-box w-56 ml-4">
                          {data.players
                            .filter(
                              (player) => player.id !== initialState.user_id
                            )
                            .map((player) => (
                              <li
                                key={player.id}
                                className="font-bold text-white"
                              >
                                <a
                                  onClick={() => {
                                    giveLastToPlayer(player.id);
                                  }}
                                >
                                  {player.username}
                                </a>
                              </li>
                            ))}
                        </ul>
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

        {selectedPlayer !== null && initialState.user_id === data.host ? (
          <div className="absolute top-1 right-1 bg-gray-700 rounded-lg z-50">
            <h1 className="ml-3 mt-1 font-bold text-white">Player actions</h1>
            <ul className="menu menu-sm bg-base-200 rounded-box w-56">
              {data.host === initialState.user_id ? (
                <li className="font-bold text-white">
                  <a onClick={kickPlayer}>Kick player</a>
                </li>
              ) : (
                <></>
              )}
              {data.host === initialState.user_id ? (
                <li className="font-bold text-white">
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
        <div className="relative w-[90vw] h-[90vh] bg-green-600 rounded-2xl mx-auto grid grid-cols-3 grid-rows-3">
          {/* Középen a húzó- és dobópakli,  itt majd drag&drop-os téma lesz */}
          <div className="absolute bg-green-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {data.host === initialState.user_id ? (
              <h1 className="text-white text-2xl mb-4">
                Join code: <strong>{data.code}</strong>
              </h1>
            ) : (
              <h1 className="text-white text-2xl mb-4">
                Waiting for host to start the game...
              </h1>
            )}
          </div>

          {/* Játékosok elhelyezése */}
          {players
            .filter((player) => player.id !== initialState.user_id)
            .slice(0, 7) // Csak 7 ellenfelet engedélyezünk
            .map((player, index) => {
              const positionClasses = [
                "top-5 left-10", // 0 - Bal felső
                "top-5 left-1/2 -translate-x-1/2", // 1 - Középső felső
                "top-5 right-10", // 2 - Jobb felső
                "left-5 top-1/3 -translate-y-1/2", // 3 - Bal középső oldal
                "right-5 top-1/3 -translate-y-1/2", // 4 - Jobb középső oldal
                "left-5 bottom-1/3 translate-y-1/2", // 5 - Bal alsó oldal
                "right-5 bottom-1/3 translate-y-1/2", // 6 - Jobb alsó sarok
              ];

              return (
                <div
                  key={player.id}
                  className={`absolute ${positionClasses[index]}`}
                >
                  <div
                    className={`bg-red-500 p-2 rounded-md font-bold text-white shadow-md text-center ${
                      selectedPlayer === player.id
                        ? "outline outline-4 outline-yellow-500"
                        : ""
                    }`}
                    onClick={(e) => {
                      if (selectedPlayer === player.id) {
                        setSelectedPlayer(null);
                      } else {
                        setSelectedDeck(null);
                        setSelectedCard(null);
                        setPlayFrom(null);
                        setSelectedPlayer(player.id);
                      }
                    }}
                  >
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
                className="btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"
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
        <SettingsMenu
          socket={socket}
          isHost={initialState.user_id === data.host}
        />
        <div className="relative w-[90vw] h-[80vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
          <div className="absolute bg-green-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <h1 className="text-white text-2xl font-bold mb-4">Game ended</h1>
            {/* Gombok a felirat alatt */}
            <div className="flex justify-center space-x-4 mt-4">
              <button
                className="btn btn-primary"
                onClick={() => {
                  socket.emit("leaveGame", {
                    code: initialState.code,
                    user_id: initialState.user_id,
                  });
                  navigate("/createorjoin");
                }}
              >
                Exit Game
              </button>
              {initialState.user_id === data.host && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    socket.emit("restartGame", { code: initialState.code });
                  }}
                >
                  Restart Game
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SettingsMenu
        socket={socket}
        isHost={initialState.user_id === data.host}
      />
      <div className="relative">
        {onHandSwapName !== null ? (
          <div
            role="alert"
            className="alert alert-vertical sm:alert-horizontal absolute bottom-0 right-0 left-[10%] m-4 z-10 w-[80vw] "
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
                {onHandSwapName} wants to swap decks with you
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
        <div className="relative w-[90vw] h-[90vh] bg-green-600 rounded-2xl mx-auto grid grid-cols-3 grid-rows-3">
          {/* Középen a húzó- és dobópakli */}

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-700 p-4 rounded-lg">
            <div className="relative flex gap-4">
              {data.decks.drawDeck.length > 0 ? (
                <img
                  className={`w-[5vh] ${
                    selectedDeck === "drawDeck"
                      ? "outline outline-4 outline-yellow-500"
                      : ""
                  }`}
                  src={`assets/cards/${data.presetdata.cardType}/card_back.${
                    data.presetdata.cardType === "french" ? "svg" : "png"
                  }`}
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

              <div className="relative">
                {data.decks.throwDeck.length > 0 ? (
                  <img
                    className={`w-[5vh] ${
                      selectedDeck === "throwDeck"
                        ? "outline outline-4 outline-yellow-500"
                        : ""
                    }`}
                    src={
                      `/assets/cards/${data.presetdata.cardType}/` +
                      data.decks.throwDeck[data.decks.throwDeck.length - 1][1]
                    }
                    alt="throwDeck"
                    deckdata="throwDeck"
                    onClick={(e) => {
                      if (initialState.user_id !== data.host) return;
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
            <div className="absolute top-1 right-1 bg-gray-700 rounded-lg z-50">
              <h1 className="ml-3 mt-1 font-bold text-white">Card actions</h1>
              <ul className="menu menu-sm bg-base-200 rounded-box w-56">
                <li className="font-bold text-white">
                  <a
                    onClick={() => {
                      playCard(selectedCard, playFrom);
                      console.log("kártya: ", selectedCard, playFrom);
                      setSelectedCard(null);
                      setPlayFrom(null);
                    }}
                  >
                    Play card (throwdeck)
                  </a>
                </li>
                <li className="font-bold text-white">
                  <a onClick={revealCard}>Reveal card</a>
                </li>
                <li className="font-bold text-white">
                  <a onClick={hideCard}>Hide card</a>
                </li>
                <li className="font-bold text-white">
                  <a onClick={toOnHand}>Pick up to hand</a>
                </li>
                {data.host === initialState.user_id ? (
                  <li className="font-bold text-white">
                    <a>Give to other player</a>
                    <ul className="menu menu-sm bg-base-200 rounded-box w-56 ml-4">
                      {data.players
                        .filter((player) => player.id !== initialState.user_id)
                        .map((player) => (
                          <li key={player.id} className="font-bold text-white">
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
            <div className="absolute top-1 right-1 bg-gray-700 rounded-lg z-50">
              <h1 className="ml-3 mt-1 font-bold text-white">Deck actions</h1>
              <ul className="menu menu-sm bg-base-200 rounded-box w-56">
                {selectedDeck === "drawDeck" ? (
                  <>
                    <li className="font-bold text-white">
                      <a
                        onClick={() => {
                          drawOne();
                          setSelectedDeck(null);
                        }}
                      >
                        Draw ONE (draw deck)
                      </a>
                    </li>
                    {data.host === initialState.user_id ? (
                      <>
                        <li className="font-bold text-white">
                          <a onClick={shuffleDrawDeck}>Shuffle draw deck</a>
                        </li>
                        <li className="font-bold text-white">
                          <a>Give last card to player</a>
                          <ul className="menu menu-sm bg-base-200 rounded-box w-56 ml-4">
                            {data.players
                              .filter(
                                (player) => player.id !== initialState.user_id
                              )
                              .map((player) => (
                                <li
                                  key={player.id}
                                  className="font-bold text-white"
                                >
                                  <a
                                    onClick={() => {
                                      giveLastToPlayer(player.id);
                                    }}
                                  >
                                    {player.username}
                                  </a>
                                </li>
                              ))}
                          </ul>
                        </li>
                      </>
                    ) : (
                      <></>
                    )}
                  </>
                ) : (
                  <></>
                )}

                {selectedDeck === "throwDeck" ? (
                  <>
                    {data.host === initialState.user_id ? (
                      <>
                        <li className="font-bold text-white">
                          <a onClick={shuffleThrowDeckIn}>
                            Shuffle throw deck into draw deck
                          </a>
                        </li>
                        <li className="font-bold text-white">
                          <a>Give last card to player</a>
                          <ul className="menu menu-sm bg-base-200 rounded-box w-56 ml-4">
                            {data.players
                              .filter(
                                (player) => player.id !== initialState.user_id
                              )
                              .map((player) => (
                                <li
                                  key={player.id}
                                  className="font-bold text-white"
                                >
                                  <a
                                    onClick={() => {
                                      giveLastToPlayer(player.id);
                                    }}
                                  >
                                    {player.username}
                                  </a>
                                </li>
                              ))}
                          </ul>
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
            <div className="absolute top-1 right-1 bg-gray-700 rounded-lg z-50">
              <h1 className="ml-3 mt-1 font-bold text-white">Player actions</h1>
              <ul className="menu menu-sm bg-base-200 rounded-box w-56">
                <li className="font-bold text-white">
                  <a
                    onClick={() => {
                      sendOnHandReq();
                    }}
                  >
                    Swap cards on hands
                  </a>
                </li>
                {data.host === initialState.user_id ? (
                  <li className="font-bold text-white">
                    <a onClick={kickPlayer}>Kick player</a>
                  </li>
                ) : (
                  <></>
                )}
                {data.host === initialState.user_id ? (
                  <li className="font-bold text-white">
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
            .slice(0, 7) // Csak 7 ellenfelet engedélyezünk
            .map((player, index) => {
              const positionClasses = [
                "top-2 left-10", // 0 - Bal felső
                "top-2 left-1/2 -translate-x-1/2", // 1 - Középső felső
                "top-2 right-10", // 2 - Jobb felső
                "left-5 top-1/2 -translate-y-1/2", // 3 - Bal középső oldal
                "right-5 top-1/2 -translate-y-1/2", // 4 - Jobb középső oldal
                "left-5 bottom-[15%] translate-y-1/2", // 5 - Bal alsó oldal
                "right-5 bottom-[15%] translate-y-1/2", // 6 - Jobb alsó sarok
              ];

              return (
                <div
                  key={player.id}
                  className={`absolute ${positionClasses[index]}`}
                >
                  <div
                    onClick={(e) => {
                      if (selectedPlayer === player.id) {
                        setSelectedPlayer(null);
                      } else {
                        setSelectedDeck(null);
                        setSelectedCard(null);
                        setPlayFrom(null);
                        setSelectedPlayer(player.id);
                      }
                    }}
                    className={`bg-red-500 p-2 rounded-md font-bold text-white shadow-md text-center  ${
                      selectedPlayer === player.id
                        ? "outline outline-4 outline-yellow-500"
                        : ""
                    }`}
                  >
                    {player.username}
                  </div>
                  <div className="flex flex-col items-center">
                    {/* onHand (lefordítva) */}
                    <div className="flex grid grid-cols-10 gap-1 ">
                      {player.cards.onHand.map((card, index) => (
                        <div key={index} className="bg-blue-500 rounded-md">
                          <img
                            src={`/assets/cards/${
                              data.presetdata.cardType
                            }/card_back.${
                              data.presetdata.cardType === "french"
                                ? "svg"
                                : "png"
                            }`}
                            alt=""
                            className="w-[2vh]"
                          />
                        </div>
                      ))}
                    </div>

                    {/* onTableVisible (felfordítva) */}
                    <div className="flex grid grid-cols-8 gap-1 ">
                      {player.cards.onTableVisible.map(
                        ([cardname, cardfile, cardNo], index) => (
                          <div key={index} className="bg-blue-500 rounded-md">
                            <img
                              src={`/assets/cards/${data.presetdata.cardType}/${cardfile}`}
                              alt={cardname}
                              className="w-[4vh] sm:w-[6vh] md:w-[5vh]"
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
                            className="w-[4vh] sm:w-[6vh] md:w-[5vh]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-red-500 p-1 rounded-lg">
            <div className="flex flex-col items-center">
              {/* Saját onTableHidden (lefordítva) */}
              <div className="flex">
                {player.cards.onTableHidden.map(
                  ([cardname, cardfile, cardNo], index) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        if (selectedCard === cardNo) {
                          setSelectedCard(null);
                        } else {
                          setSelectedDeck(null);
                          setSelectedPlayer(null);
                          setSelectedCard(cardNo);
                          console.log(cardNo);
                          setPlayFrom("onTableHidden");
                        }
                      }}
                      className={`bg-red-500 p-0 rounded-lg ${
                        selectedCard === cardNo
                          ? "outline outline-4 outline-yellow-500"
                          : ""
                      }`}
                    >
                      <img
                        className="w-[5vh]"
                        src={`/assets/cards/${
                          data.presetdata.cardType
                        }/card_back.${
                          data.presetdata.cardType === "french" ? "svg" : "png"
                        }`}
                        alt=""
                      />
                    </div>
                  )
                )}
              </div>

              {/* Saját onTableVisible (felfordítva) */}
              <div className="flex">
                {player.cards.onTableVisible.map(
                  ([cardname, cardfile, cardNo], index) => (
                    <div
                      key={index}
                      onClick={(e) => {
                        if (selectedCard === cardNo) {
                          setSelectedCard(null);
                        } else {
                          setSelectedDeck(null);
                          setSelectedPlayer(null);
                          setSelectedCard(cardNo);
                          setPlayFrom("onTableVisible");
                          console.log(cardNo);
                        }
                      }}
                      className={`bg-red-500 p-0 rounded-lg ${
                        selectedCard === cardNo
                          ? "outline outline-4 outline-yellow-500"
                          : ""
                      }`}
                    >
                      <img
                        className="w-[5vh]"
                        src={`/assets/cards/${data.presetdata.cardType}/${cardfile}`}
                        alt=""
                      />
                    </div>
                  )
                )}
              </div>

              <div className="flex justify-center">
                <div className="grid grid-cols-10 max-w-[90vw]">
                  {player.cards.onHand.map(
                    ([cardname, cardfile, cardNo], index) => {
                      return (
                        <div
                          onClick={(e) => {
                            if (selectedCard === cardNo) {
                              setSelectedCard(null);
                            } else {
                              setSelectedDeck(null);
                              setSelectedPlayer(null);
                              setSelectedCard(cardNo);
                              setPlayFrom("onHand");
                              console.log(cardname);
                              console.log(cardNo);
                              console.log(player.cards.onHand);
                            }
                          }}
                          key={index}
                          className={`bg-red-500 p-0 rounded-lg ${
                            selectedCard === cardNo
                              ? "outline outline-4 outline-yellow-500"
                              : ""
                          }`}
                        >
                          <img
                            className="w-[7vh]"
                            src={`/assets/cards/${data.presetdata.cardType}/${cardfile}`}
                            alt=""
                          />
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Desk;
