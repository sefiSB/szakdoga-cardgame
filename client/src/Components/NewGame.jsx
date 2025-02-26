import { useState } from "react";
import { initialState } from "../Store/store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function NewGame({ socket }) {
  const [isCardsOnDesk, setIsCardsOnDesk] = useState(false);
  const [gameName, setGameName] = useState("");
  const [startingCards, setStartingCards] = useState(0);
  const [revealedCards, setRevealedCards] = useState(0);
  const [hiddenCards, setHiddenCards] = useState(0);

  const navigate= useNavigate();
  //csak teszt jelleggel
  const postGame = async () => {
    const response = await fetch("http://localhost:3001/addlobby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        gameName: gameName,
        startingCards: startingCards,
        isCardsOnDesk: isCardsOnDesk,
        revealedCards: revealedCards,
        hiddenCards: hiddenCards,
        host: initialState.user_id,
      }),
    });
    const data = await response.json();
    if(data.error){
      alert("Game creation failed");
    }
    else{
      initialState.code = data.code;
      navigate("/desk");
    }
    console.log(data);
    console.log("asd")
  };

  /* const sendNewGame = () => {
    socket.emit("newGame", {
      gameName,
      user: initialState.user,
      startingCards,
      isCardsOnDesk,
      revealedCards,
      hiddenCards,
    });
    
    socket.on("updateLobby", (data) => {
      console.log(data);
    });
  }; */

  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">What's the game called?</span>
            {/* <span className="label-text-alt">Top Right label</span> */}
          </div>
          <input
            type="text"
            placeholder="Name"
            className="input input-bordered w-full max-w-xs"
            onChange={(e) => {
              setGameName(e.target.value);
            }}
          />
          {/* <div className="label">
            <span className="label-text-alt">Bottom Left label</span>
            <span className="label-text-alt">Bottom Right label</span>
          </div> */}
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Number of starting cards in hand</span>
            {/* <span className="label-text-alt">Top Right label</span> */}
          </div>
          <input
            type="number"
            placeholder="Place a number here"
            className="input input-bordered w-full max-w-xs"
            onChange={(e) => {
              setStartingCards(e.target.value);
            }}
          />
          {/* <div className="label">
            <span className="label-text-alt">Bottom Left label</span>
            <span className="label-text-alt">Bottom Right label</span>
          </div> */}
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Cards on desk/player</span>
            {/* <span className="label-text-alt">Top Right label</span> */}
          </div>
          <input
            type="checkbox"
            className="toggle border-indigo-600 bg-indigo-500 checked:bg-orange-400 checked:text-orange-800 checked:border-orange-500 "
            onClick={(e) => {
              console.log(e.target.checked);
              setIsCardsOnDesk(e.target.checked);
            }}
          />
        </label>

        {isCardsOnDesk ? (
          <>
            <div className="border p-5 rounded-3xl border-dashed border-orange-600">
              <label className="form-control w-full max-w-xs ">
                <div className="label">
                  <span className="label-text">
                    Number of revealed cards on desk/player
                  </span>
                  {/* <span className="label-text-alt">Top Right label</span> */}
                </div>
                <input
                  type="number"
                  placeholder="Place a number here"
                  className="input input-bordered w-full max-w-xs"
                  onChange={(e) => {
                    setRevealedCards(e.target.value);
                  }}
                />
                {/* <div className="label">
            <span className="label-text-alt">Bottom Left label</span>
            <span className="label-text-alt">Bottom Right label</span>
          </div> */}
              </label>

              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">
                    Number of hideen cards on desk/player
                  </span>
                  {/* <span className="label-text-alt">Top Right label</span> */}
                </div>
                <input
                  type="number"
                  placeholder="Place a number here"
                  className="input input-bordered w-full max-w-xs"
                  onChange={(e) => {
                    setHiddenCards(e.target.value);
                  }}
                />
                {/* <div className="label">
            <span className="label-text-alt">Bottom Left label</span>
            <span className="label-text-alt">Bottom Right label</span>
          </div> */}
              </label>
            </div>
          </>
        ) : (
          <></>
        )}

        <button
          className="btn btn-outline btn-primary"
          onClick={() => {
            //postGame();
            postGame();
            //redirect to desk
          }}
        >
          Submit
        </button>
      </div>
    </>
  );
}

export default NewGame;
