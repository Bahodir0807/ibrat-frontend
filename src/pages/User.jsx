import { useEffect, useState } from "react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("https://b.sultonoway.uz/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Загрузка пользователей...</p>;

  return (
    <div>
      <h2>Все пользователи</h2>
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            {user.username} — {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
}
