import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import io from "socket.io-client";
import { initialState, removeItem, setItem } from "./Store/store";


const socket = io(`http://${import.meta.env.VITE_SERVER_IP}:3001`, {
  query: {
    user_id: initialState.user_id
  }
});

import Login from "./Components/Login";
import CreateOrJoin from "./Components/CreateOrJoin";
import JoinGame from "./Components/JoinGame";
import NewGame from "./Components/NewGame";
import Register from "./Components/Register";
import Desk from "./Components/Desk";
import Kicked from "./Components/Kicked";

function App() {

window.addEventListener("beforeunload", function (event) {
  //30 másodperc beállítása
  setItem("expiration", Date.now() + 6 * 1000);
  initialState.expiration = Date.now() + 6 * 1000;
})

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
  if(parseInt(initialState.expiration) < Date.now()){
    console.log("Session expired...");
    removeItem("user_id");
    removeItem("user");
    removeItem("code");
    initialState.user_id = null;
    initialState.user = null;
    initialState.code = null;
    socket.emit("updateUserID",{user_id:null});
  }  
})

  return (
    <>
      <Routes>
        <Route path="/" element={<Login socket={socket} />} />
        <Route path="/login" element={<Login socket={socket} />} />
        <Route path="/register" element={<Register socket={socket} />} />
        <Route
          path="/createorjoin"
          element={<CreateOrJoin socket={socket} />}
        />
        <Route path="/joingame" element={<JoinGame socket={socket} />} />
        <Route path="/newgame" element={<NewGame socket={socket} />} />
        <Route path="/desk" element={<Desk socket={socket} />} />
        <Route path="/kicked" element={<Kicked socket={socket} />} />
      </Routes>
    </>
  );
}

export default App;
