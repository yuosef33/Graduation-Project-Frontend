import { useState } from "react";
import { login } from "../context/AuthContext";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login({ email, password });
      alert("Login success");
    } catch (error) {
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-lg shadow-md w-96"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      <input
        type="email"
        placeholder="Email"
        className="w-full p-3 mb-4 border rounded"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full p-3 mb-4 border rounded"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white p-3 rounded"
      >
        Login
      </button>
    </form>
  );
}

export default LoginForm;
