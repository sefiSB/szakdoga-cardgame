import { useNavigate } from "react-router-dom";
import { initialState } from "./Store/store";
import { useState } from "react";

function Name() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <input
          type="text"
          placeholder="Username"
          className="input input-bordered input-primary w-full max-w-xs"
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <button
          className="btn btn-outline btn-primary"
          onClick={() => {
            initialState.user = name;
            setTimeout(() => navigate("/createorjoin"), 0);
          }}
        >
          Submit
        </button>
      </div>
    </>
  );
}
export default Name;
