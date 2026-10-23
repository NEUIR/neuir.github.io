# NEUIR

[neuir.github.io](https://neuir.github.io)

```bash
bundle install
npm ci && npm run prepare:assets
JEKYLL_ENV=production bundle exec jekyll build
npm test && bundle exec ruby scripts/check_site.rb
```

提交更改后运行 `git push origin main`，GitHub Actions 会自动部署到 GitHub Pages。
