import { useState } from "react";

export default function Register() {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // по умолчанию student
  const [roleKey, setRoleKey] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch("http://ibrat.onrender.com/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phoneNumber, password, role, roleKey }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Зарегистрирован!");
    } else {
      setMessage("❌ " + data.message);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      className="bg-gray-800 p-4 rounded-xl w-full max-w-sm space-y-3"
    >
      <h2 className="text-xl font-bold">Регистрация</h2>

      <input
        className="w-full p-2 bg-gray-700 rounded"
        type="text"
        placeholder="Имя"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="w-full p-2 bg-gray-700 rounded"
        type="text"
        placeholder="Номер телефона"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <input
        className="w-full p-2 bg-gray-700 rounded"
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        className="w-full p-2 bg-gray-700 rounded"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="student">Ученик</option>
        <option value="teacher">Учитель</option>
        <option value="admin">Админ</option>
        <option value="panda">🐼 Суперроль (panda)</option>
      </select>

      {role !== "student" && (
        <input
          className="w-full p-2 bg-gray-700 rounded"
          type="text"
          placeholder="Ключ для доступа (roleKey)"
          value={roleKey}
          onChange={(e) => setRoleKey(e.target.value)}
        />
      )}

      <button
        type="submit"
        className="w-full bg-green-600 py-2 rounded hover:bg-green-700"
      >
        Зарегистрироваться
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
