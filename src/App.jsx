import { useEffect, useRef, useState } from "react";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("test@icloud.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    //前後の空白カット
    const cleanEmail = email.trim();
    const cleanPassword = password;
    if (!cleanEmail || !cleanPassword) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
      const data = await res.json();
      console.log("login response:", res.status, data);

      if (!res.ok) {
        setError(data.message || "ログインに失敗しました");
        return;
      }

      //ログイン成功を親コンポーネントに通知
      onLoginSuccess?.(data);
    } catch (err) {
      console.error("login error:", err);
      setError("ログイン中にエラーが発生しました");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Todoリスト(API連携)</h1>
      <h2>ログイン画面</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 8 }}>
          <label>
            メール：
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            パスワード：
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        <button type="submit">ログイン</button>
      </form>
    </div>
  );
}

export default function App() {
  // バックエンドから取得する一覧(配列)
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false); //一覧取得中
  const [error, setError] = useState("");
  const inputRef = useRef(null); //フォーカス用
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));

  const token = localStorage.getItem("token");


  //一覧表示
  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/todos", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const txt = await res.text();
        console.log("response text:", txt);
        throw new Error("API取得に失敗しました");
      }
      const data = await res.json();
      console.log("取得したtodo", data);
      setTodos(data);
    } catch (e) {
      console.error(e);
      setError("一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 初回&userId変更時に一覧取得
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchTodos();
  }, [isLoggedIn]);

  // 追加処理(POST)
  const handleAdd = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    try {
      setError("");
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: text, completed: false }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.log("POST / api/ todos failed:", res.status, t);
        throw new Error("登録に失敗しました");
      }
      //入力クリア
      setText("");
      // 追加に成功したら一覧取得し直し
      await fetchTodos();
      inputRef.current?.focus();
    } catch (e) {
      console.error(e);
      setError("登録に失敗しました");
    }
  };

  //削除処理 
  const handleDelete = async (id) => {
    if (!confirm("このTodoを本当に削除しますか？")) return;
    try {
      setError("");
      const res = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      if (!res.ok) throw new Error("削除に失敗しました");
      await fetchTodos(); //成功したら一覧再取得
    } catch (e) {
      console.error(e);
      setError("削除に失敗しました");
    }
  };
  //編集処理(開始)
  const startEdit = async (todo) => {
    setEditingId(todo.id);
    setEditText(todo.title);
  };
  //編集処理(保存)
  const saveEdit = async (id) => {
    const title = editText.trim();
    if (!title) return;

    try {
      setError("");
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.log("PATCH failed:", res.status, t);
        throw new Error("更新に失敗しました");
      }
      setEditingId(null);
      setEditText("");
      await fetchTodos();
    } catch (e) {
      console.error(e);
      setError("更新に失敗しました");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  }
  if (!isLoggedIn) {
    //ログインしていない時はログイン画面を表示
    return (
      <Login onLoginSuccess={(data) => {
        // data= {token, user}
        localStorage.setItem("token", data.token);
        setIsLoggedIn(true);
      }}
      />
    )
  }
  return (
    <div className="todo-app" style={{ padding: "16px" }}>
      <button onClick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("uid");
        window.location.reload();
      }}
        style={{ marginBottom: 16 }}
      >
        ログアウト
      </button>
      <h1>Todoリスト(API連携)</h1>

      {/* 入力欄 (フォーム化)*/}
      <form onSubmit={handleAdd} style={{ marginBottom: "16px" }}>
        <label>やること：</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="買い物するとか..."
          style={{ marginRight: "8px" }}
        />
        <button type="submit" disabled={!text.trim() || loading}>
          追加
        </button>
        <button type="button" onClick={fetchTodos} style={{ marginLeft: "8px" }}>
          再読み込み
        </button>
      </form>

      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/*一覧表示 */}
      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} style={{ marginBottom: "8px" }}>
            {editingId === todo.id ? (
              <>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id);
                    if (e.key === "Escape") cancelEdit(todo.id);
                  }}
                  style={{ marginTop: 8 }}
                  autoFocus
                />
                <button onClick={() => saveEdit(todo.id)} style={{ marginRight: 4 }}>
                  保存
                </button>
                <button onClick={cancelEdit}>キャンセル</button>
              </>
            ) : (
              <>
                <span style={{ marginRight: 8 }}>{todo.title}</span>
                <button onClick={() => startEdit(todo)} style={{ marginRight: 4 }}>
                  編集
                </button>
                <button onClick={() => handleDelete(todo.id)} >削除</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}