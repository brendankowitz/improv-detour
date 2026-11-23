interface ToggleProps {
  readonly label: string;
  readonly hint?: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}

export function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="toggle"
      onClick={() => {
        onChange(!checked);
      }}
    >
      <strong>{label}</strong>
      {hint && <span>{hint}</span>}
    </button>
  );
}
