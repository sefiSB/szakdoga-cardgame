import { initialState, setItem } from "../Store/store";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function SettingsMenu({ socket, isHost }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  console.log("host: ", isHost);
  console.log("code",initialState.code);
  if (!initialState.user_id) {
    navigate("/login");
  }

  const endGame = () => {
    socket.emit("endGame", {
      code: initialState.code,
    });
    setIsOpen(false);
  };

  const toggleMenu = () => {
    console.log("Menu toggled");
    setIsOpen(!isOpen);
  };
  const logout = () => {
    socket.emit("leaveGame", {
      user_id: initialState.user_id,
      code: initialState.code,
    });

    initialState.user_id = null;
    setItem("user_id", null);
    initialState.user = null;
    setItem("user", null);
    initialState.code = null;
    setItem("code", null);
    navigate("/login");
    socket.emit("updateUserID", { user_id: null });
    setIsOpen(false);
  };

  const leaveGame = () => {
    socket.emit("leaveGame", {
      user_id: initialState.user_id,
      code: initialState.code,
    });
    initialState.code = null;
    setItem("code", null);
    navigate("/createorjoin");
    setIsOpen(false);
  };

  return (
    <div className="relative z-10">
      <button
        onClick={toggleMenu}
        className="absolute top-0 left-0 m-4 p-2 bg-gray-800 text-white rounded w-9 h-9 flex items-center justify-center"
      >
        <i className="fa fa-cog"></i>
      </button>
      {initialState.code !=null? (
        <></>
      ) : (
        <>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-10 left-0 m-4 p-2 bg-gray-800 text-white rounded w-9 h-9 flex items-center justify-center"
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        </>
      )}

      {isOpen && (
        <div className="absolute top-12 16 left-4 bg-gray-700 shadow-lg rounded p-4">
          <ul className="menu menu-compact">
            {initialState.code ? (
              <>
                <li className="font-bold text-white">
                  <a onClick={leaveGame}>Leave game</a>
                </li>
                {isHost ? (
                  <>
                    <li className="font-bold text-white">
                      <a
                        onClick={() => {
                          socket.emit("restartGame", {
                            code: initialState.code,
                          });
                          setIsOpen(false);
                        }}
                      >
                        Restart game
                      </a>
                    </li>
                    <li className="font-bold text-white">
                      <a onClick={endGame}>End game</a>
                    </li>
                  </>
                ) : (
                  <></>
                )}
              </>
            ) : (
              <></>
            )}
            <li className="font-bold text-white">
              <a onClick={logout}>Logout</a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;
