export default function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  hint,
  disabled,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`w-full rounded-lg border bg-slate-900/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${
          error ? "border-red-500/70" : "border-slate-600"
        }`}
      />
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
