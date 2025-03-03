import { useEffect, useState } from "react";
import { initialState } from "../Store/store";
import cardNames from "../Utils/French";

function Desk({ socket }) {
  const [data, setData] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

  const startingGame = () => {
    setIsStarted(true);

    shuffleArray(data.presetdata.usedCards)

    for(let i=0; i<data.players.length;i++){
      for(let j=0;j<data.presetdata.startingCards;j++){
        //Teszt kedvéért visible kártyák
        data.players[i].cards.onTableVisible.push(data.presetdata.usedCards.pop())
      }
    }
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

    socket.on("updateLobby", (response) => {
      console.log("Kliens visszakapta az adatokat");
      console.log("Game started, received data:", response.players);
      setData(response);
    });

    return () => {
      socket.off("gameStart");
    };
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  

  useEffect(() => {
    gameStart();
  }, [socket]);
  if (!data) {
    return <div className="text-center text-white">Loading game data...</div>;
  }

  const currentPlayerId = initialState.user_id;
  const players = data.players;
  const totalPlayers = players.length;

  console.log(isStarted)
  if (!isStarted) {
    return (
      <>
        <div className="relative w-[90vw] h-[80vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
          {/* Középen a húzó- és dobópakli,  itt majd drag&drop-os téma lesz */}
          <div className="absolute bg-gray-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            Waiting for host to start the game...
          </div>

          {/* Játékosok elhelyezése */}
          {players.map((player, index) => {
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

  return (
    <div className="relative w-[90vw] h-[80vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
      {/* Középen a húzó- és dobópakli */}
      <div className="absolute bg-gray-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        Decks
      </div>

      {/* Játékosok elhelyezése */}
      {players.map((player, index) => {
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
            <div className="bg-blue-500 p-2 rounded-md">{player.username}</div>
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
              {player.cards.onTableVisible.map(([cardname,cardfile], index) => (
                <div key={index} className="bg-blue-500 m-1 rounded-md">
                  <img
                    src={"/assets/cards/french/" + cardfile}
                    alt=""
                    style={{ width: "5vh" }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Saját lapok alul */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <div className="bg-red-500 p-3 rounded-lg">Card 1</div>
        <div className="bg-red-500 p-3 rounded-lg">Card 2</div>
        <div className="bg-red-500 p-3 rounded-lg">Card 3</div>
      </div>
    </div>
  );
}

export default Desk;
