// Standard PostCSS pipeline for Tailwind: run Tailwind's own transforms,
// then autoprefix the result for browser compatibility.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
