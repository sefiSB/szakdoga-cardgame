import { useState } from "react";
import { initialState } from "./Store/store";


function JoinGame({socket}) {
  const [code,setCode] = useState("0000");
  const sendCode = ()=>{
    socket.emit("sendCode",{code:code,user:initialState.user, isAdmin:initialState.isAdmin});
  }


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
