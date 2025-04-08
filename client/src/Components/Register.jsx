import { useNavigate } from "react-router-dom";
import { initialState, setItem } from "../Store/store";
import { useState } from "react";
import { Link } from "react-router-dom";
import passwordValidator from "password-validator";


function Register({ socket }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [error, setError] = useState([]);
  var schema = new passwordValidator();
  schema
    .is().min(8)
    .is().max(20)
    .has().uppercase()
    .has().lowercase()
    .has().digits()
    .has().not().spaces();

    var schema2 = new passwordValidator();
    schema2
      .is().min(3)
      .is().max(20)
      .has().not().spaces();

  const navigate = useNavigate();

  const postUser = async () => {
    const response = await fetch("http://localhost:3001/adduser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        password,
        email,
      }),
    });

  
    const data = await response.json();
    if (data.error) {
      setServerError(data.error);
      console.log(data.details);
    } else {
      initialState.user_id = data.id;
      setItem("user_id",data.id);
      navigate("/createorjoin");
      console.log(data);
    }
  };

  const validateEmail = (email) => {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const checkCredentials = () => {
    let errors=[];
    if (!schema2.validate(name)) {
      const nameerrorlist = schema2.validate(name, { list: true });
      console.log(nameerrorlist);
      nameerrorlist.forEach((e) => {
        if(e === "min") errors=[...errors, "Username must be at least 3 characters long"];
        if(e === "max") errors=[...errors, "Username must be at most 20 characters long"];
        if(e === "spaces") errors=[...errors, "Username cannot contain whitespaces"];
      })
    }
    if (password !== confirmPassword) {
      errors=[...errors, "Passwords do not match"];
    }
    if (!schema.validate(password)) {
      const errorlist = schema.validate(password, { list: true });
      errorlist.forEach((e) => {
        if(e === "min") errors=[...errors, "Password must be at least 8 characters long"];
        if(e === "max") errors=[...errors, "Password must be at most 20 characters long"];
        if(e === "uppercase") errors=[...errors, "Password must contain at least one uppercase letter"];
        if(e === "lowercase") errors=[...errors, "Password must contain at least one lowercase letter"];
        if(e === "digits") errors=[...errors, "Password must contain at least one digit"];
        if(e === "spaces") errors=[...errors, "Password cannot contain whitespaces"];
      })
      
    }
    if (!validateEmail(email)) {
      errors=[...errors, "Invalid email"];
    }
    if (name === "") {
      errors=[...errors, "Username cannot be empty"];
    }
    setError(errors);
    console.log(errors)
    if (errors.length === 0) {
      return true;
    }
    return false;
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <label
          className={`input input-bordered flex items-center gap-2 ${
            validateEmail(email) ? "" : "border border-red-500"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
            <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
          </svg>
          <input
            type="text"
            className="grow"
            placeholder="Email"
            onChange={(e) => {
              setEmail(e.target.value);
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
            placeholder="password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </label>
        <label
          className={`input input-bordered flex items-center gap-2 ${
            confirmPassword !== "" && password !== confirmPassword
              ? "border border-red-500"
              : ""
          }`}
        >
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
            placeholder="confirm password"
            onChange={(e) => {
              setConfirmPassword(e.target.value);
            }}
          />
        </label>
        <button
          className="btn btn-outline btn-primary"
          onClick={() => {
            if(!checkCredentials()) return;
            initialState.user = name;
            setItem("user",name);
            initialState.email = email;
            setItem("email",email);
            postUser();
          }}
        >
          Sign up
        </button>
        <ul>
          {error.map((e)=>{
          return <li className="text-red-500">{e}</li>
        })}
        <li className="text-red-500">{serverError}</li>
        </ul>

        <p>
          Already have an account?{" "}
          <Link className="link link-success" to="/login">
            Log in!
          </Link>
        </p>
      </div>
    </>
  );
}
export default Register;
