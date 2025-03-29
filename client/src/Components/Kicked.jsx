import { initialState } from "../Store/store";
import { useNavigate } from "react-router-dom";


import { useEffect } from "react";

function Kicked(socket) {
  const navigate = useNavigate();
  if (!initialState.user_id) {
    navigate("/login");
  }
  //console.log("username" + initialState.user);
  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen gap-6">
        {/* Szöveg */}
        <h1 className="text-4xl font-bold">You've been kicked..</h1>

        {/* Gombok */}
        <div className="flex flex-col gap-4">
          <button
            className="btn btn-primary w-40"
            onClick={() => {
              setTimeout(() => navigate("/createorjoin"), 0);
            }}
          >
            Play again
          </button>
          <button
            className="btn btn-secondary w-40"
            onClick={() => {
            initialState.user=null;
            initialState.user_id=null;
            initialState.code=null;
              setTimeout(() => navigate("/"), 0);
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}

export default Kicked;
