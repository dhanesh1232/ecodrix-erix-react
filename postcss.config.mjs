import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import erixVars from "./postcss-erix-vars.cjs";

const config = {
  plugins: [tailwindcss(), autoprefixer(), erixVars()],
};

export default config;
