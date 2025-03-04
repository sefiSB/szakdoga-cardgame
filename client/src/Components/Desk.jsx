import { useEffect, useState } from "react";
import { initialState } from "../Store/store";
import cardNames from "../Utils/French";

function Desk({ socket }) {
  const [data, setData] = useState(null);
  const [isStarted, setIsStarted] = useState(false);

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
      code: data.code,
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
      console.log("Kliens visszakapta az adatokat ");
      console.log(response);
      setData(response);
    });

    socket.emit("reconnectLobby", {
      user_id: initialState.user_id,
      code: initialState.code,
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
  const player=data.players.find((p)=>p.id===initialState.user_id);
  console.log(player)

  console.log(data.state === "waiting");
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
    <div className="relative w-[90vw] h-[90vh] bg-green-600 rounded-2xl mx-auto flex items-center justify-center bottom-0 mb-2">
      {/* Középen a húzó- és dobópakli */}
      <div className="absolute bg-gray-700 p-4 rounded-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {/* <img src="/assets/cards/french/card_back.svg" alt="" /> */}
      </div>

      <div className="absolute top-1 right-1 bg-gray-700 rounded-lg">
        <ul class="menu bg-base-200 rounded-box w-56">
          <li>
            <details open>
              <summary>Actions</summary>
              <ul>
                <li>
                  <a>Submenu 1</a>
                </li>
                <li>
                  <a>Submenu 2</a>
                </li>
                <li>
                  <details open>
                    <summary>Parent</summary>
                    <ul>
                      <li>
                        <a>Submenu 1</a>
                      </li>
                      <li>
                        <a>Submenu 2</a>
                      </li>
                    </ul>
                  </details>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </div>

      
      {
        players
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
        {
          player.cards.onTableVisible.map(([cardname,cardfile],index)=>{
            return(<div key={index} className="bg-red-500 p-3 rounded-lg"><img src={"/assets/cards/french/"+cardfile} alt="" /></div>)
            
          })
        }
        
        {/* <div className="bg-red-500 p-3 rounded-lg">Card 1</div>
        <div className="bg-red-500 p-3 rounded-lg">Card 2</div>
        <div className="bg-red-500 p-3 rounded-lg">Card 3</div> */}
      </div>
    </div>
  );
}

export default Desk;
