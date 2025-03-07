import { useState } from "react";
import { initialState } from "../Store/store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cardNames } from "../Utils/French";

function NewGame({ socket }) {
  const [isCardsOnDesk, setIsCardsOnDesk] = useState(false);
  const [gameName, setGameName] = useState("");
  const [startingCards, setStartingCards] = useState(0);
  const [revealedCards, setRevealedCards] = useState(0);
  const [hiddenCards, setHiddenCards] = useState(0);
  const [cardType, setCardType] = useState("French");
  const [maxplayers, setMaxplayers] = useState(4);
  const [notUsed, setNotUsed] = useState(["card back"]);
  const [packNumber, setPackNumber] = useState(1);
  const [presetSuccesful, setPresetSuccesful] = useState(null);

  const navigate = useNavigate();

  const submitPreset = async () => {
    const response = await fetch("http://localhost:3001/addpreset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: initialState.user,
        startingCards: startingCards,
        cards_on_desk: isCardsOnDesk,
        revealed: revealedCards,
        hidden: hiddenCards,
        user_id: initialState.user_id,
      }),
    });
    const data = await response.json();
    if (data.error) {
      setPresetSuccesful(false);
    } else {
      setPresetSuccesful(true);
    }
  };

  const postGame = async () => {
    let usedCards = [];
    for (let i = 0; i < packNumber; i++) {
      let used = Object.entries(cardNames).filter(
        ([cardName]) => !notUsed.includes(cardName)
      );
      usedCards = [...usedCards, ...used];
    }

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
        cardType: cardType,
        packNumber: packNumber,
        usedCards: usedCards,
        maxplayers: maxplayers,
      }),
    });
    const data = await response.json();
    if (data.error) {
      alert("Game creation failed");
    } else {
      initialState.code = data.code;
      socket.emit("joinHost", {
        code: data.code,
        user: initialState.user,
        user_id: initialState.user_id,
      });
      navigate("/desk");
    }
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
            <span className="label-text">Max players</span>
            {/* <span className="label-text-alt">Top Right label</span> */}
          </div>
          <input
            type="number"
            placeholder="Place a number here"
            className="input input-bordered w-full max-w-xs"
            onChange={(e) => {
              setMaxplayers(e.target.value);
            }}
          />
          {/* <div className="label">
            <span className="label-text-alt">Bottom Left label</span>
            <span className="label-text-alt">Bottom Right label</span>
          </div> */}
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">Type of cards</span>
          </div>
          <div className="flex gap-10">
            <fieldset class="fieldset">
              <select
                defaultValue="Pick a browser"
                class="select select-secondary"
                onChange={(e) => setCardType(e.target.value)}
              >
                <option disabled={true}>Type of card</option>
                <option>French</option>
                <option>Hungarian</option>
                <option>Uno</option>
              </select>
            </fieldset>

            {/* Open the modal using document.getElementById('ID').showModal() method */}
            <button
              className="btn"
              onClick={() => document.getElementById("my_modal_1").showModal()}
            >
              Select cards
            </button>
            <dialog id="my_modal_1" className="modal">
              <div className="modal-box w-11/12 max-w-5xl">
                <h3 className="font-bold text-lg">Select Cards</h3>
                <div className="grid grid-cols-6 gap-2">
                  {Object.entries(cardNames)
                    .filter(([cardName]) => !notUsed.includes(cardName))
                    .map(([cardName, cardImage]) => (
                      <div
                        key={cardName}
                        className="flex flex-col items-center"
                      >
                        <img
                          src={`/assets/cards/french/${cardImage}`}
                          alt={cardName}
                          style={{ width: "100px", height: "auto" }}
                        />
                        <p>{cardName}</p>
                        <button
                          className="btn btn-sm"
                          onClick={() => {
                            setNotUsed((prev) => [...prev, cardName]);
                            console.log(notUsed);
                            console.log(cardName);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
                <p className="py-4">
                  Press ESC key or click the button below to close
                </p>
                <div className="modal-action">
                  <form method="dialog">
                    <button className="btn">Close</button>
                  </form>
                </div>
              </div>
            </dialog>
          </div>
        </label>

        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">How many packs do you need?</span>
          </div>
          <input
            type="number"
            placeholder="Place a number here"
            className="input input-bordered w-full max-w-xs"
            value={packNumber}
            onChange={(e) => {
              setPackNumber(e.target.value);
            }}
          />
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
            <div className="border p-5 rounded-3xl border-solid border-orange-600">
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

        <div className="flex gap-10">
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
          <button
            className="btn btn-outline btn-secondary"
            onClick={() => {
              submitPreset();
            }}
          >
            Save preset
          </button>
        </div>
        {presetSuccesful!==null ? (
          <>
            <div>
              {
                presetSuccesful?(<p className="success-content">Preset created successfully!</p>):(<p className="error">Preset creation failed!</p>)
              } 
            </div>
          </>
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

export default NewGame;
