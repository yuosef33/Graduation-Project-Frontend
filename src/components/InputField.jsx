const InputField = ({ label, error, touched, ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600 tracking-wide">
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-900
          placeholder:text-gray-400 text-sm outline-none transition-all duration-200
          focus:bg-white focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10
          ${touched && error ? "border-red-400 bg-red-50" : "border-gray-200"}`}
        {...props}
      />
      {touched && error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
};

export default InputField;