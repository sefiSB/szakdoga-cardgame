import { useState } from "react";
import { initialState } from "../Store/store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cardNames } from "../Utils/French";
import Presets from "./SettingsMenu";

function NewGame({ socket }) {
  const [isCardsOnDesk, setIsCardsOnDesk] = useState(false);
  const [gameName, setGameName] = useState("");
  const [startingCards, setStartingCards] = useState(0);
  const [revealedCards, setRevealedCards] = useState(0);
  const [hiddenCards, setHiddenCards] = useState(0);
  const [cardType, setCardType] = useState("french");
  const [maxplayers, setMaxplayers] = useState(4);
  const [notUsed, setNotUsed] = useState(["card back"]);
  const [packNumber, setPackNumber] = useState(1);
  const [presetSuccesful, setPresetSuccesful] = useState(null);
  const [presetsData, setPresetsData] = useState([]);
  const [activeTab, setActiveTab] = useState(1);

  const navigate = useNavigate();
  if(!initialState.user_id){
    navigate("/login");
  }


  const getPresets = async () => {
    const response = await fetch("http://127.0.0.1:3001/presets", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const resp = await response.json();
    console.log(resp)
    setPresetsData(resp);
  };

  const submitPreset = async () => {
    const response = await fetch("http://localhost:3001/addpreset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: gameName,
        startingcards: startingCards,
        cards_on_desk: isCardsOnDesk,
        revealed: revealedCards,
        hidden: hiddenCards,
        packNumber:packNumber,
        cardType:cardType,
        maxplayers:maxplayers,
        user_id: initialState.user_id,
      }),
    });
    const data = await response.json();
    if (data.error) {
      setPresetSuccesful(false);
      console.log(data.details)
    } else {
      setPresetSuccesful(true);
    }
    socket.emit("presetAdded");
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
        startingcards: startingCards,
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

  const setPresetSettings = (preset) =>{
    setGameName(preset.name);
    setMaxplayers(preset.maxplayers);
    setCardType(preset.cardType);
    setPackNumber(preset.packNumber);
    setStartingCards(preset.startingcards);
    setIsCardsOnDesk(preset.cards_on_desk);
    setRevealedCards(preset.revealed);
    setHiddenCards(preset.hidden);
  }

  useEffect(() => {
    getPresets();
    socket.on("presetAdded", () => {
      getPresets();
    });
  }, []);

  return (
    <>
      <div className="flex flex-row justify-center items-start  gap-4 ">
        <div className="flex flex-col justify-center items-center h-screen gap-4 flex-grow">
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">What's the game called?</span>
              {/* <span className="label-text-alt">Top Right label</span> */}
            </div>
            <input
              type="text"
              placeholder="Name"
              className="input input-bordered w-full max-w-xs"
              value={gameName}
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
              value={maxplayers}
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
                  value={cardType}
                  class="select select-secondary"
                  onChange={(e) => setCardType(e.target.value)}
                >
                  <option disabled={true}>Type of card</option>
                  <option>french</option>
                  <option>hungarian</option>
                  <option>uno</option>
                </select>
              </fieldset>

              {/* Open the modal using document.getElementById('ID').showModal() method */}
              <button
                className="btn"
                onClick={() =>
                  document.getElementById("my_modal_1").showModal()
                }
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
              <span className="label-text">
                Number of starting cards in hand
              </span>
              {/* <span className="label-text-alt">Top Right label</span> */}
            </div>
            <input
              type="number"
              placeholder="Place a number here"
              className="input input-bordered w-full max-w-xs"
              value={startingCards}
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
              checked={isCardsOnDesk}
              className="toggle border-indigo-600 bg-indigo-500 checked:bg-orange-400 checked:text-orange-800 checked:border-orange-500"
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
                    value={revealedCards}
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
                      Number of hidden cards on desk/player
                    </span>
                    {/* <span className="label-text-alt">Top Right label</span> */}
                  </div>
                  <input
                    type="number"
                    placeholder="Place a number here"
                    value={hiddenCards}
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
          {presetSuccesful !== null ? (
            <>
              <div>
                {presetSuccesful ? (
                  <p className="success-content">
                    Preset created successfully!
                  </p>
                ) : (
                  <p className="error">Preset creation failed!</p>
                )}
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
        <div className="flex flex-col mt-10 items-center gap-4 w-1/4 border p-5 rounded-xl">
          <div role="tablist" className="tabs tabs-boxed">
            <a
              role="tab"
              className={`tab ${activeTab === 1 ? "tab-active" : ""}`}
              onClick={() => setActiveTab(1)}
            >
              My presets
            </a>
            <a
              role="tab"
              className={`tab ${activeTab === 2 ? "tab-active" : ""}`}
              onClick={() => setActiveTab(2)}
            >
              Explore
            </a>
          </div>
          <div className="h-60 overflow-y-auto">
            
              {activeTab === 1 ? (
                <>
                  {presetsData.map((preset) => {
                    if (preset.user_id === initialState.user_id) {
                      return <div className="border p-5" onClick={()=>{
                        setPresetSettings(preset);
                      }}>
                        <strong>{preset.name}</strong>
                        <p>Starting cards:{preset.startingcards}, Max players: {preset.maxplayers}, Pack count: {preset.packNumber}, <br />
                        Card type: {preset.cardType}
                        </p>
                      </div>;
                    }
                  })}
                </>
              ) : (
                <>
                  {presetsData.map((preset) => {
                    console.log(preset)
                    return <div className="border p-5">
                        <strong>{preset.name} - {preset.User.username}</strong>
                        <p>Starting cards:{preset.startingcards}, Max players: {preset.maxplayers}, Pack count: {preset.packNumber}, <br />
                        Card type: {preset.cardType}
                        </p>
                      </div>;
                  })}
                </>
              )}
            
          </div>
        </div>
      </div>
    </>
  );
}

export default NewGame;
