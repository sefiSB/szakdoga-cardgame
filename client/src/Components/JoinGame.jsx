import { useState } from "react";
import { initialState, setItem } from "../Store/store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SettingsMenu from "./SettingsMenu";


function JoinGame({socket}) {
  const [code,setCode] = useState(null);
  const [lobby, setLobby] = useState(null); // Tárolja a lobby állapotát
  const [error, setError] = useState(null); // Tárolja a hibát, ha van

  const navigate = useNavigate();
  


  const postCode = () => {
    socket.emit("joinLobby",{
      code: parseInt(code),
      user: initialState.user,
      user_id: initialState.user_id,
    });
    socket.on("codeError", (data) => {
      setError(data.error);
    });
    socket.on("lobbyFull",(data)=>{
      setError(data.error);
      console.log(data.error);
    })
    socket.on("codeSuccess", (data) => {
      initialState.code = parseInt(data.code);
      setItem("code",parseInt(data.code));
      navigate("/desk");
    });
  }
  
  useEffect(() => {
    if(!initialState.user_id){
      navigate("/login");
    }


    socket.on("updateLobby", (data) => {
      initialState.code = parseInt(data.code);
      setItem("code",parseInt(data.code));
      setError(null);
      setLobby(data);
    });

    // Hallgatja a "codeError" eseményt
    socket.on("codeError", () => {
      console.log("Invalid lobby code!");
      setError("Invalid lobby code!"); // Állapot frissítés hiba esetén
    });

    return () => {
      socket.off("updateLobby");
      socket.off("codeError");
    };
  }, [socket]); // Csak akkor fut le újra, ha a socket változik

  return (
    <>
    <SettingsMenu socket={socket}/>
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Enter code to join</span>
          </label>
          <label className="input-group">
            <span>Code: </span>
            <input
              type="text"
              placeholder="Enter code here..."
              className="input input-bordered"
              onChange={(e)=>{
                setCode(e.target.value)
              }}
            />
          </label>

          
        </div>
        <button
          className="btn btn-outline btn-primary"
          onClick={() => {
            postCode()
          }}
        >Join</button>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </>
  );
}

export default JoinGame;
