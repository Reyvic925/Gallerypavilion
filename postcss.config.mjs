// When running tests with vitest, Vite may attempt to load PostCSS plugins
// which can fail in the test environment. Allow skipping PostCSS by
// setting VITE_SKIP_POSTCSS=1 in the test runner.
const config =
  process.env.VITE_SKIP_POSTCSS === '1'
    ? { plugins: {} }
    : { plugins: ["@tailwindcss/postcss"] }

export default config
