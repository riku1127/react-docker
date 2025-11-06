// test PR branch for practiceimport { useState } from "react";
export default function App() {
  // Todoリストをstateで管理する
  const [todos, setTodos] = useState([
    { id: 1, text: "朝飯" },
    { id: 2, text: "昼飯" },
    { id: 3, text: "夜飯" }
  ]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const handleAdd = () => {
    // 空文字は追加しない
    if (!text.trim()) {
      alert("内容を入力してください");
      return;
    }

    const newTodo = { id: todos.length + 1, text: text };
    setTodos([...todos, newTodo]);
    setText("");
  };
  const handleDelete = (id) => {
    const newTodos = todos.filter((todo) => todo.id !== id);
    setTodos(newTodos);
  };
  const handleEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };
  const saveEdit = (id) => {
    const updated = todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, text: editText };
      }
      return todo;
    });
    setTodos(updated);
    setEditingId(null); // 編集モード終了
  };
  return (
    <div className="todo-app">
      <h1>Todoリスト</h1>
      {/*一覧表示 */}
      <div className="todo-input">
        <label>やること：</label>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="買い物する…とか" />
        <button onClick={handleAdd} value={text}>追加</button>
      </div>

      <ul className="todo-list">
        {todos.map((todo) => (
          <li key={todo.id} className="todo-item">
            {editingId === todo.id ? (
              <>
                <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} />
                <button onClick={() => saveEdit(todo.id)}>保存</button>
                <button onClick={() => setEditingId(null)}>キャンセル</button>
              </>
            ) : (
              <>
                {todo.text}
                <button onClick={() => handleEdit(todo)}>編集</button>
                <button onClick={() => handleDelete(todo.id)}>削除</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}