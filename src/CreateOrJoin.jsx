function CreateOrJoin({username}) {
  console.log("username"+username)
  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen gap-6">
      {/* Szöveg */}
      <h1 className="text-4xl font-bold">Welcome {username}</h1>

      {/* Gombok */}
      <div className="flex flex-col gap-4">
        <button className="btn btn-primary w-40">New Game</button>
        <button className="btn btn-secondary w-40">Join Game</button>
      </div>
    </div>
    </>
  );
}

export default CreateOrJoin;
