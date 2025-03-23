import { useState } from "react";
import { initialState } from "../Store/store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SettingsMenu from "./SettingsMenu";


function JoinGame({socket}) {
  const [code,setCode] = useState(null);
  const [lobby, setLobby] = useState(null); // Tárolja a lobby állapotát
  const [error, setError] = useState(null); // Tárolja a hibát, ha van

  const navigate = useNavigate();
  if(!initialState.user_id){
    navigate("/login");
  }


  const postCode = () => {
    socket.emit("joinLobby",{
      code: parseInt(code),
      user: initialState.user,
      user_id: initialState.user_id,
    });
    socket.on("codeError", (data) => {
      setError(data.error);
      console.log("Invalid lobby code!");
    });
    socket.on("lobbyFull",(data)=>{
      setError(data.error);
      console.log(data.error);
    })
    socket.on("codeSuccess", (data) => {
      initialState.code = parseInt(data.code);
      navigate("/desk");
    });

  }
  
 


  
  useEffect(() => {
    // EZ SZTM NEM IS FOG KELLENI
    socket.on("updateLobby", (data) => {
      console.log("Lobby frissült:", data.players);
      initialState.code = parseInt(data.code);
      /* setTimeout(() => {
        navigate("/desk");
      }), */
      setError(null); // Ha sikeres volt a csatlakozás, töröljük a hibát
      setLobby(data);
    });

    // Hallgatja a "codeError" eseményt
    socket.on("codeError", () => {
      console.log("Hibás lobby kód!");
      setError("Invalid lobby code!"); // Állapot frissítés hiba esetén
    });

    // Cleanup (ha a komponens újra renderelődik, töröljük a régi hallgatókat)
    return () => {
      socket.off("updateLobby");
      socket.off("codeError");
    };
  }, [socket]); // Csak akkor fut le újra, ha a socket változik

  console.log("username" + initialState.user);
  return (
    <>
    <SettingsMenu />
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
            console.log("asd")
          }}
        >Join</button>
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </>
  );
}

export default JoinGame;
