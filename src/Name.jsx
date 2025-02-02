import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Name({ user }) {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <>
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <input
        type="text"
        placeholder="Username"
        className="input input-bordered input-primary w-full max-w-xs"
      />
      <button className="btn btn-outline btn-primary" onClick={(e)=>{
        user(e.target.value);
        navigate("/createorjoin")
      }}>Submit</button>
    </div>
    </>
  );
}
export default Name;
