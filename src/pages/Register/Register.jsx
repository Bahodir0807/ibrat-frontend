import { useState } from "react";
import axios from "axios";

export default function LogRegister() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "guest",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/auth/register", form);
      setMessage("✅ Успешно зарегистрирован и вошёл");
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 409) {
        try {
          const res = await axios.post("/auth/login", {
            username: form.username,
            password: form.password,
          });
          localStorage.setItem("token", res.data.access_token);
          setMessage("🔑 Уже был зарегистрирован — вошли");
        } catch (loginErr) {
          setMessage("❌ Ошибка входа: " + loginErr.response?.data?.message);
        }
      } else {
        setMessage("❌ Ошибка регистрации: " + err.response?.data?.message);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-6 w-96 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Регистрация / Логин</h1>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="Student">Студент</option>
          <option value="Guest">Гость</option>
        </select>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Войти / Зарегистрироваться
        </button>
        {message && (
          <p className="text-center text-sm text-gray-700 mt-2">{message}</p>
        )}
      </form>
    </div>
  );
}
