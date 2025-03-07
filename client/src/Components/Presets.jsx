import { useNavigate } from "react-router-dom";
import { initialState } from "../Store/store";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Presets({ socket }) {
  const [data, setData] = useState(null);

  const getPresets = async () => {
    const response = await fetch("http://127.0.0.1:3001/presets", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const resp = await response.json();
    setData(resp);
  };

  useEffect(() => {
    fetch('http://localhost:3001/users')
    .then(res => res.json())
    .then(res=>setData(res))
    .catch(err => console.log(err))
    console.log(data);
  }, []);

  return (
    <>
      <ul>
        {data.map((preset) => {
          <li>{preset.name}</li>;
        })}
      </ul>
    </>
  );
}
export default Presets;
