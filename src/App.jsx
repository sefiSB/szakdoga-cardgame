import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Name from "./Name";
import CreateOrJoin from "./CreateOrJoin";

function App() {
  const [username, setUsername] = useState(null);

  return (
    <>
      <Routes>
      <Route path="/" element={<Name user={setUsername} />} />
        <Route path="/username" element={<Name user={setUsername} />} />
        <Route path="/createorjoin" element={<CreateOrJoin username={username}/>} />
      </Routes>
    </>
  );
}

export default App;
