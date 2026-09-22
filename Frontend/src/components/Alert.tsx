export function Alert({
  message,
  variant = "error",
}: {
  message: string;
  variant?: "error" | "success";
}) {
  return (
    <p
      role="alert"
      className={`mt-4 rounded-lg p-3 text-sm ${variant === "success" ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}
    >
      {message}
    </p>
  );
}
