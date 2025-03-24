import { initialState } from "../Store/store";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { useEffect } from "react";

function SettingsMenu({ socket, isHost }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  if (!initialState.user_id) {
    navigate("/login");
  }

  const toggleMenu = () => {
    console.log("Menu toggled");
    setIsOpen(!isOpen);
  };
  const logout = () => {
    initialState.user_id = null;
    initialState.user = null;
    initialState.code = null;
    navigate("/login");
  };

  const leaveGame = () => {
    socket.emit("leaveGame", {
      user_id: initialState.user_id,
      code: initialState.code,
    });
    initialState.code = null;
    navigate("/createorjoin");
  };

  return (
    <div className="relative z-10">
      <button
        onClick={toggleMenu}
        className="absolute top-0 left-0 m-4 p-2 bg-gray-800 text-white rounded"
      >
        Settings
      </button>
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white shadow-lg rounded p-4">
          <ul className="menu menu-compact">
            {initialState.code ? (
              <>
                <li>
                  <a onClick={leaveGame}>Leave game</a>
                </li>
                {isHost ? (
                  <>
                    <li>
                      <a>Restart game</a>
                    </li>
                    <li>
                      <a>End game</a>
                    </li>
                  </>
                ) : (
                  <></>
                )}
              </>
            ) : (
              <></>
            )}
            <li>
              <a onClick={logout}>Logout</a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;
