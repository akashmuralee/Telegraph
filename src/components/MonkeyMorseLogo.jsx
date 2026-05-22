// Renders the brand logo from /public/logo.svg.
// Vite serves files in /public from the site root, so the path is just /logo.svg.
export function MonkeyMorseLogo({ size = 28, className = '' }) {
  return (
    <img
      src="/logo.svg"
      width={size}
      height={size}
      alt="Monkey Morse logo"
      className={className}
      draggable={false}
    />
  );
}
