import { useEffect, useState } from "react";
import { initialState } from "../Store/store";
import cardNames from "../Utils/French";

function Desk({ socket }) {
  const [data, setData] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);

  const playCard = (tc) => {
    socket.emit("playCard", {
      code: initialState.code,
      player_id: initialState.user_id,
      cardName: tc,
    });
  };

  const drawOne = ()=>{
    socket.emit("drawCard",{
      code:initialState.code,
      player_id:initialState.user_id
    })
  }

  console.log(initialState.code);

  const startingGame = () => {
    socket.emit("hostStarted", { code: initialState.code });
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

    socket.emit("joinLobby", {
      code: d.code,
      user: initialState.user,
      user_id: initialState.user_id,
    });

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
      console.log("MOST KAPTAM UPDATET");
      console.log(response);
      setData(response);
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
        <div className="relative w-[90vw] h-[80vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
          {/* Középen a húzó- és dobópakli,  itt majd drag&drop-os téma lesz */}
          <div className="absolute bg-gray-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            Waiting for host to start the game...
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
                  <div
                    onClick={(e) => {
                      if (selectedPlayer === player.username) {
                        setSelectedCard(null);
                      } else {
                        setSelectedDeck(null);
                        setSelectedCard(null);
                        setSelectedPlayer(player.username);
                      }
                    }}
                    className="bg-blue-500 p-2 rounded-md"
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

  return (
    <div className="relative w-[90vw] h-[90vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
      {/* Középen a húzó- és dobópakli */}
      <div className="absolute bg-green-600 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex gap-4">
          {data.decks.drawDeck.length > 0 ? (
            <img
              className="w-[5vh]"
              src="assets/cards/french/card_back.svg"
              alt="drawDeck"
              deckdata="drawDeck"
              onClick={(e) => {
                const deckType = e.target.getAttribute("deckdata");
                if (selectedDeck === deckType) {
                  setSelectedCard(null);
                } else {
                  setSelectedDeck(deckType);
                  setSelectedPlayer(null);
                  setSelectedCard(null);
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
                src={
                  "/assets/cards/french/" +
                  data.decks.throwDeck[data.decks.throwDeck.length - 1][1]
                }
                alt="throwDeck"
                deckdata="throwDeck"
                style={{ width: "5vh" }}
                onClick={(e) => {
                  const deckType = e.target.getAttribute("deckdata");
                  if (selectedDeck === deckType) {
                    setSelectedCard(null);
                  } else {
                    setSelectedDeck(deckType);
                    setSelectedPlayer(null);
                    setSelectedCard(null);
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
                  playCard(selectedCard);
                  setSelectedCard(null);
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
          </ul>
        </div>
      ) : (
        <></>
      )}

      {selectedDeck !== null ? (
        <div className="absolute top-1 right-1 bg-gray-700 rounded-lg">
          <h1 className="ml-3 mt-1">Deck actions</h1>
          <ul class="menu menu-sm bg-base-200 rounded-box w-56">
            
            {
              selectedDeck==="drawDeck"?<li>
              <a
                onClick={() => {
                  drawOne();
                  setSelectedDeck(null);
                }}
              >
                Draw ONE (draw deck)
              </a>
            </li>:<></>
            }

            {
              selectedDeck==="throwDeck"?
              <>
              <li>
                <a>Idk yet</a>
              </li>
              </>
              :
              <></>
            }
            
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
              <a>Play card (throwdeck)</a>
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
              <div className="bg-blue-500 p-2 rounded-md">
                {player.username}
              </div>
              <div className="flex">
                {player.cards.onHand.map((card, index) => (
                  <div key={index} className="bg-blue-500 m-1 rounded-md">
                    <img
                      src={"/assets/cards/french/card_back.svg"}
                      alt=""
                      style={{ width: "5vh" }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex">
                {player.cards.onTableVisible.map(
                  ([cardname, cardfile], index) => (
                    <div key={index} className="bg-blue-500 m-1 rounded-md">
                      <img
                        src={"/assets/cards/french/" + cardfile}
                        alt=""
                        style={{ width: "5vh" }}
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}

      {/* Saját lapok alul */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {player.cards.onTableVisible.map(([cardname, cardfile], index) => {
          return (
            <div
              onClick={(e) => {
                if (selectedCard === cardname) {
                  setSelectedCard(null);
                } else {
                  setSelectedDeck(null);
                  setSelectedPlayer(null);
                  setSelectedCard(cardname);
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
                src={"/assets/cards/french/" + cardfile}
                alt=""
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Desk;
