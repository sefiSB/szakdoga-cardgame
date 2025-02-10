import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import io from 'socket.io-client';

const socket = io.connect("http://localhost:3001");

import Name from "./Name";
import CreateOrJoin from "./CreateOrJoin";
import JoinGame from "./JoinGame";
import NewGame from "./NewGame";

import { initialState } from "./Store/store";

function App() {
  return (
    <>
      <Routes>
      <Route path="/" element={<Name/>} />
        <Route path="/username" element={<Name />} />
        <Route path="/createorjoin" element={<CreateOrJoin/>} />
        <Route path="/joingame" element={<JoinGame socket={socket} />}/>
        <Route path="/newgame" element={<NewGame/>}/>
      </Routes>
    </>
  );
}

export default App;
