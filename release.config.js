module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    // update app.json version so it is committed with the release
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node ./scripts/update-app-json.mjs ${nextRelease.version}',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'app.json', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    '@semantic-release/github',
  ],
};
