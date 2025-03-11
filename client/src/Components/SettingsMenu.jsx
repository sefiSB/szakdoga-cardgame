import { initialState } from "../Store/store";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { useEffect } from "react";

function SettingsMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  if (!initialState.user_id) {
    navigate("/login");
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  const logout = () => {
    initialState.user_id = null;
    initialState.user = null;
    initialState.code = null;
    navigate("/login");
  };

  return (
    <div className="relative">
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
              </>
            ) : (
              <></>
            )}
            <li>
              <a href="#settings">Settings</a>
            </li>
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
