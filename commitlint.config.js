module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'style', 'perf', 'docs', 'chore'],
    ],
    'scope-enum': [
      2,
      'always',
      ['web', 'api', 'db', 'shared', 'app', 'repo'],
    ],
    'header-max-length': [2, 'always', 72],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [0],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
}
