import { useNavigate } from "react-router-dom";
import { initialState } from "./Store/store";
import { useState } from "react";
import { Link } from "react-router-dom";

function Login({ socket }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  /* const postUser = async () => {
    const response = await fetch("http://localhost:3001/adduser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        password,
      }),
    });
    const data = await response.json();
    console.log(data);
  }; */


  const postUser = () => {
    socket.emit("loginUser", {
      name,
      password,
    })

    socket.on("loginSuccess", (data) => {
      
    })
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen gap-4">

        <label className="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input
            type="text"
            className="grow"
            placeholder="Username"
            onChange={(e) => {
              setName(e.target.value);
            }}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path
              fillRule="evenodd"
              d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="password"
            className="grow"
            placeholder="Password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </label>
        <button
          className="btn btn-outline btn-primary"
          onClick={() => {
            initialState.user = name;
            postUser();
            setTimeout(() => navigate("/createorjoin"), 0);
          }}
        >
          Log in
        </button>

        <p>Still don't have an account? <Link className="link link-success" to="/register">Sign up!</Link></p>
        
        
      </div>
    </>
  );
}
export default Login;
