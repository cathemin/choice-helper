import nextConfig from "eslint-config-next"

/** @type {import("eslint").Linter.Config[]} */
const config = [
  { ignores: ["v0-minimal-cat-ui/**"] },
  ...nextConfig,
]

export default config
