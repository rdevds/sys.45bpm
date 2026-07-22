import { motion } from "framer-motion";

function CardMenu({ icon, title, description, color = "blue" }) {
  const colors = {
    blue: "border-blue-500 bg-blue-900/30",
    orange: "border-orange-500 bg-orange-900/30",
    red: "border-red-500 bg-red-900/30",
    purple: "border-purple-500 bg-purple-900/30",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`${colors[color]} rounded-3xl border p-8 h-80 flex flex-col justify-between shadow-xl cursor-pointer text-left`}
    >
      <div>
        <div className="text-6xl mb-6">{icon}</div>

        <h2 className="text-2xl font-bold text-white">
          {title}
        </h2>

        <p className="mt-4 text-slate-300">
          {description}
        </p>
      </div>

      <div className="flex justify-end">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">
          →
        </div>
      </div>
    </motion.div>
  );
}

export default CardMenu;