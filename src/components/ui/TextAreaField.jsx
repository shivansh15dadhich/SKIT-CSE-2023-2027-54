import { useId } from "react";

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 10000,
  rows = 4,
  error,
  hint,
  disabled = false,
}) {
  const id = useId();

  return (
    <div>
      {label && (
        <label htmlFor={id} className="text-[9px] text-[#899595]">
          {label}
        </label>
      )}

      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 w-full resize-none rounded-md border bg-[#101414] px-3 py-2.5 text-xs leading-5 text-[#dce4e2] placeholder:text-[#4f5b5a] focus:outline-none disabled:opacity-60 ${
          error
            ? "border-red-900/70 focus:border-red-400"
            : "border-[#29403f] focus:border-[#58d9d0]"
        }`}
      />

      <div className="mt-1 flex justify-between text-[8px]">
        <span className={error ? "text-red-300" : "text-[#657675]"}>
          {error || hint}
        </span>

        <span className="text-[#657675]">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

export default TextAreaField;
