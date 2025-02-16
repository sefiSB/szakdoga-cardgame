import { useState } from "react";
import { initialState } from "./Store/store";
import { useEffect } from "react";


function JoinGame({socket}) {
  const [code,setCode] = useState("");
  const [lobby, setLobby] = useState(null); // Tárolja a lobby állapotát
  const [error, setError] = useState(null); // Tárolja a hibát, ha van

  const sendCode = ()=>{
    socket.emit("sendCode",{code:code,user:initialState.user, isAdmin:initialState.isAdmin});
  }


  
  useEffect(() => {
    // EZ SZTM NEM IS FOG KELLENI
    socket.on("updateLobby", (data) => {
      console.log("Lobby frissült:", data);
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
            sendCode()
            console.log("asd")
          }}
        >Join</button>
      </div>
    </>
  );
}

export default JoinGame;
