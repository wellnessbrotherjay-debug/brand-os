import Link from "next/link";

const HomeButton = () => {
  return (
    <Link
      href="/"
      className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:border-white/40 hover:text-sky-200"
    >
      <span className="text-lg font-light">←</span>
      Home
    </Link>
  );
};

export default HomeButton;
