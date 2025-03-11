import { initialState } from "../Store/store";
import { useNavigate } from "react-router-dom";
import SettingsMenu from "./SettingsMenu";

import { useEffect } from "react";


function CreateOrJoin() {
  const navigate = useNavigate();
  if (!initialState.user_id) {
    navigate("/login");
  }
  //console.log("username" + initialState.user);
  return (
    <>
      <SettingsMenu />
      <div className="flex flex-col justify-center items-center h-screen gap-6">
        {/* Szöveg */}
        <h1 className="text-4xl font-bold">Welcome {initialState.user}</h1>

        {/* Gombok */}
        <div className="flex flex-col gap-4">
          <button
            className="btn btn-primary w-40"
            onClick={() => {
              setTimeout(() => navigate("/newgame"), 0);
            }}
          >
            New Game
          </button>
          <button
            className="btn btn-secondary w-40"
            onClick={() => {
              setTimeout(() => navigate("/joingame"), 0);
            }}
          >
            Join Game
          </button>
        </div>
      </div>
    </>
  );
}

export default CreateOrJoin;
