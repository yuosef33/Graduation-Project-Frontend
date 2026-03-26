import { useState } from "react";
import { useAuth  } from "../context/AuthContext";

function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
    const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signup({ email, password });
      alert("Signup success");
    } catch (error) {
      alert(`Signup failed: ${error.message}`);
    }
  };

  return (
    <form
      className="bg-white p-8 rounded-lg shadow-md w-96"
      onSubmit={handleSubmit}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Signup</h2>

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
        className="w-full bg-indigo-600 text-white p-3 rounded"
        type="submit"
      >
        Signup
      </button>
    </form>
  );
}

export default SignupForm;
