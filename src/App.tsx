import React, { useState, useEffect, useRef } from "react";

type Todo = {
  id: number;
  task: string;
  done: boolean;
  dueDate?: string;
  tags?: string[];
};

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  });

  const [task, setTask] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("All");

  const draggingIndex = useRef<number | null>(null);
  const dragStartY = useRef<number>(0);
  const [draggingStyle, setDraggingStyle] = useState<React.CSSProperties>({});
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (task.trim() === "") return;

    const newTodo: Todo = {
      id: Date.now(),
      task: task.trim(),
      done: false,
      dueDate: dueDate ? dueDate : undefined,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };

    setTodos([newTodo, ...todos]);
    setTask("");
    setDueDate("");
  };

  const Done = (id: number) => {
    const updated = todos.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );

    const undone = updated.filter((todo) => !todo.done);
    const done = updated.filter((todo) => todo.done);

    setTodos([...undone, ...done]); // undone first, then done
  };

  const removeTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    draggingIndex.current = index;
    dragStartY.current = e.clientY;
    setDraggingStyle({
      position: "absolute",
      width: e.currentTarget.parentElement?.clientWidth || 200,
      pointerEvents: "none",
      zIndex: 1000,
      padding: "8px",
      borderRadius: "4px",
      color: "black",
      left: e.currentTarget.parentElement?.getBoundingClientRect().left || 0,
      top: e.clientY - 20,
    });

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    const currentIndex = draggingIndex.current;
    if (currentIndex === null) return;

    setDraggingStyle((prev) => ({
      ...prev,
      top: e.clientY - 20,
    }));

    if (!listRef.current) return;

    const listItems = Array.from(listRef.current.children);
    if (!listItems[currentIndex]) return;

    listItems.forEach((item, i) => {
      if (i === currentIndex) return;

      const rect = item.getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;

      if (e.clientY > middleY && i > currentIndex) {
        swapItems(currentIndex, i);
        draggingIndex.current = i;
      } else if (e.clientY < middleY && i < currentIndex) {
        swapItems(currentIndex, i);
        draggingIndex.current = i;
      }
    });
  };

  const swapItems = (from: number, to: number) => {
    setTodos((old) => {
      const newTodos = [...old];
      const [removed] = newTodos.splice(from, 1);
      newTodos.splice(to, 0, removed);
      return newTodos;
    });
  };

  const handleMouseUp = () => {
    draggingIndex.current = null;
    setDraggingStyle({});
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const draggedIndex = draggingIndex.current;

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredTodos = todos
    .filter((todo) => selectedTag === "All" || todo.tags?.includes(selectedTag))
    .sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);

      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  return (
    <div className="bg-black h-screen text-white p-4 max-w-md mx-auto">
      <h1 className="text-center text-2xl mb-4">Todo App</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addTodo();
        }}
        className="flex mb-4"
      >
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Add new task"
          className="flex-grow px-2 py-1 rounded text-black"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-2 py-1 rounded text-black"
          title="Due date"
        />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags"
        />
        <button type="submit" className="ml-2 px-4 py-1 bg-blue-600 rounded">
          Add
        </button>
      </form>
      <div className="mb-2">
        <label className="mr-2">Filter by tag:</label>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="text-black px-2 py-1 rounded"
        >
          <option value="All">All</option>
          {[...new Set(todos.flatMap((t) => t.tags || []))].map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <ul ref={listRef} style={{ position: "relative", listStyleType: "none" }}>
        {filteredTodos.map((todo, index) => (
          <li
            key={todo.id}
            style={
              draggedIndex === index
                ? { opacity: 0.5 }
                : { userSelect: "none" }
            }
            className="flex items-center justify-between p-2 mb-1 bg-gray-800 rounded"
          >
            <div
              onMouseDown={(e) => handleMouseDown(e, index)}
              style={{ cursor: "grab", paddingRight: 8 }}
              title="Drag handle"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M2 4h12v1H2V4zm0 3h12v1H2V7zm0 3h12v1H2v-1z" />
              </svg>
            </div>
            <div className="flex items-center space-x-2 flex-grow">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => Done(todo.id)}
              />
              <span className={`${todo.done ? "line-through text-gray-400" : ""}`}>
                {todo.task}
              </span>
              {todo.dueDate && (
                <div className="text-xs text-gray-400">
                  Due: {formatDueDate(todo.dueDate)}
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTodo(todo.id);
              }}
              className="ml-2 text-red-500 font-bold"
            >
              X
            </button>
            {todo.tags?.map((tag, i) => (
              <span
                key={i}
                className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full mr-1"
              >
                {tag}
              </span>
            ))}
          </li>
        ))}
      </ul>
      {draggedIndex !== null && (
        <div style={draggingStyle}>{todos[draggedIndex].task}</div>
      )}
    </div>
  );
};

export default App;
