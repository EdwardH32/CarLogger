const SIZES = {
  xs: "w-6 h-6 text-base",
  sm: "w-8 h-8 text-lg",
  md: "w-10 h-10 text-xl",
  lg: "w-14 h-14 text-2xl",
  xl: "w-20 h-20 text-4xl",
};

export default function Avatar({ photo, emoji, size = "md", className = "" }) {
  const sizeClasses = SIZES[size] || SIZES.md;

  if (photo) {
    return (
      <img
        src={`/uploads/${photo}`}
        alt="Avatar"
        className={`${sizeClasses} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClasses} rounded-full bg-stone-800 flex items-center justify-center shrink-0 ${className}`}
    >
      {emoji || "🚗"}
    </span>
  );
}
