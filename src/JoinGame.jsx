import { initialState } from "./Store/store";

function JoinGame() {
  console.log("username" + initialState.user);
  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Enter code to join</span>
          </label>
          <label className="input-group">
            <span>Code: </span>
            <input
              type="text"
              placeholder="Enter code here..."
              className="input input-bordered"
            />
          </label>

          
        </div>
        <button
          className="btn btn-outline btn-primary"
          onClick={() => {
            //itt kell majd egy check, majd az asztalhoz ültetés
          }}
        >Join</button>
      </div>
    </>
  );
}

export default JoinGame;
