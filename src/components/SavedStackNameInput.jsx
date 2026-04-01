import { useEffect, useState } from "react";

export function SavedStackNameInput({ initialName, onCommit }) {
  const [value, setValue] = useState(() => initialName ?? "");

  useEffect(() => {
    setValue(initialName ?? "");
  }, [initialName]);

  return (
    <input
      className="form-input"
      style={{ maxWidth: 360, fontSize: 13 }}
      value={value}
      placeholder="Name this stack (optional)"
      aria-label="Saved stack name"
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value.trim())}
    />
  );
}
