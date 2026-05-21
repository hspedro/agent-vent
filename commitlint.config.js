/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-min-length": [2, "always", 50],
    "header-max-length": [2, "always", 60],
    "body-max-line-length": [2, "always", 70],
  },
};
