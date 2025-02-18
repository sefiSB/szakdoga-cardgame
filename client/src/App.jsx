import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import io from 'socket.io-client';
import { initialState } from "./Store/store";

const socket = io.connect("http://localhost:3001");

import Login from "./Login";
import CreateOrJoin from "./CreateOrJoin";
import JoinGame from "./JoinGame";
import NewGame from "./NewGame";
import Register from "./Register";




function App() {
  useEffect(() => {
    fetch('http://localhost:3001/users')
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.log(err))
  })
  

  return (
    <>
      <Routes>
      <Route path="/" element={<Login socket={socket}/>} />
        <Route path="/username" element={<Login socket={socket}/>} />
        <Route path="/register" element={<Register socket={socket}/>} />
        <Route path="/createorjoin" element={<CreateOrJoin/>} />
        <Route path="/joingame" element={<JoinGame socket={socket} />}/>
        <Route path="/newgame" element={<NewGame socket={socket} />}/>
      </Routes>
    </>
  );
}

export default App;
