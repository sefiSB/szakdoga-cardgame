import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import io from "socket.io-client";
import { initialState } from "./Store/store";

const socket = io.connect("http://127.0.0.1:3001");

import Login from "./Components/Login";
import CreateOrJoin from "./Components/CreateOrJoin";
import JoinGame from "./Components/JoinGame";
import NewGame from "./Components/NewGame";
import Register from "./Components/Register";
import Desk from "./Components/Desk";
import Presets from "./Components/Presets";

function App() {
  /* useEffect(() => {
    fetch('http://localhost:3001/users')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.log(err))
  }) */

  return (
    <>
      <Routes>
        <Route path="/" element={<Login socket={socket} />} />
        <Route path="/login" element={<Login socket={socket} />} />
        <Route path="/register" element={<Register socket={socket} />} />
        <Route path="/createorjoin" element={<CreateOrJoin />} />
        <Route path="/joingame" element={<JoinGame socket={socket} />} />
        <Route path="/newgame" element={<NewGame socket={socket} />} />
        <Route path="/desk" element={<Desk socket={socket} />} />
        <Route path="/presets" element={<Presets socket={socket} />} />
      </Routes>
    </>
  );
}

export default App;
