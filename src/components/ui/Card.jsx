// Panel used across the dashboard. `status` renders on the right of the title.
function Card({ title, icon, status, className = "", children }) {
  return (
    <div
      className={`rounded-lg border border-[#293535] bg-[#191e1e] p-4 ${className}`}
    >
      {(title || status) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 className="text-xs font-semibold text-[#58d9d0]">
              {icon && <span className="mr-1">{icon}</span>}
              {title}
            </h2>
          )}

          {status}
        </div>
      )}

      {children}
    </div>
  );
}

export default Card;
