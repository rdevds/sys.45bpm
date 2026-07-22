import "../../styles/button.css";

function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
}) {

  const variants = {
    primary:
      "btn btn-primary",

    secondary:
      "btn btn-secondary",

    warning:
      "btn btn-warning",

    danger:
      "btn btn-danger",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={variants[variant]}
    >
      {children}
    </button>
  );
}

export default Button;