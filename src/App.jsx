import { useEffect, useState } from "react";

export default function App() {
  // Todoリストをstateで管理する
  // バックエンドから取得する一覧(配列)
  const [todos, setTodos] = useState([]);
  // 新規追加
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false); //一覧取得中
  const [adding, setAdding] = useState(false); //追加中
  const [error, setError] = useState("");
  const inputRef = useState(null); //フォーカス用
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // 8787に
  const API_BASE = "http://localhost:8787";

  //一覧表示
  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/todos");

      if (!res.ok) {
        const txt = await res.text();
        console.log("response text:", txt);
        throw new Error("API取得に失敗しました");
      }
      const data = await res.json();
      console.log("取得したtodo", data);
      //サーバ側が{id, title, completed}で返す想定なのでそれに合わせる
      setTodos(data);
    } catch (e) {
      console.error(e);
      setError("一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 初回だけ一覧取得
  useEffect(() => {
    fetchTodos();
  }, []);

  // 追加処理(POST)
  const handleAdd = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;

    try {
      setError("");
      setAdding(true);
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "1", // ← 仮ユーザーIDを送る（DBに合わせて）
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
      inputRef.ccurent?.focus();
    } catch (e) {
      console.error(e);
      setError("登録に失敗しました");
    } finally {
      setAdding(false);
    }
  };

  //削除処理 
  const handleDelete = async (id) => {
    if (!confirm("このTodoを本当に削除しますか？")) return;
    try {
      setError("");
      const res = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": "1" }, //いまは固定
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
          "Content-Type": "application/json",
          "x-user-id": "1",
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
    setText("");
  }
  return (
    <div className="todo-app" style={{ padding: "16px" }}>
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