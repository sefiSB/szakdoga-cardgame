import { useEffect,useState } from "react";
import { initialState } from "../Store/store";
import { useNavigate } from "react-router-dom";

function CreateOrJoin({socket}) {
  const BACKEND_URL = `http://${import.meta.env.VITE_SERVER_IP}:3001`;


  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  if (!initialState.user_id) {
    navigate("/login");
  }

  useEffect(() => {
    if(!initialState.user_id){
      navigate("/login");
    }
  })

  console.log(localStorage.getItem("user_id"));
  console.log(initialState.user_id);
  console.log(initialState.user);

  return (
    <>
      
      <div className="flex flex-col justify-center items-center h-screen gap-6">
        {/* Szöveg */}
        <h1 className="text-4xl font-bold">Welcome {initialState.user}</h1>

        {/* Gombok */}
        <div className="flex flex-col gap-4">
          <button
            className="btn btn-primary w-40"
            onClick={() => {
              setTimeout(() => navigate("/newgame"), 0);
            }}
          >
            New Game
          </button>
          <button
            className="btn btn-secondary w-40"
            onClick={() => {
              setTimeout(() => navigate("/joingame"), 0);
            }}
          >
            Join Game
          </button>
        </div>
      </div>
    </>
  );
}

export default CreateOrJoin;
