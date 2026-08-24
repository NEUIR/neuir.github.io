# NEU-ModelBest Data Intelligence Joint Lab

This repository contains the source code and content for the official website of the **NEU-ModelBest Data Intelligence Joint Lab** at Northeastern University, China.

**Website:** [neuir.github.io](https://neuir.github.io)

## Repository structure

- `_data/`: publications, projects, and structured site content
- `_members/`: team member profiles
- `_posts/`: news and announcements
- `images/`: images and other static assets

## Local development

The site is built with [Jekyll](https://jekyllrb.com/). Ruby 3.3 is used in continuous integration.

```bash
bundle install
bundle exec jekyll serve
```

The local site is available at <http://localhost:4000>.

To create a production build:

```bash
JEKYLL_ENV=production bundle exec jekyll build
```

## Deployment

Changes pushed to `main` are built by GitHub Actions and deployed to the `gh-pages` branch.

## Acknowledgements

This website is based on the [Lab Website Template](https://greene-lab.gitbook.io/lab-website-template-docs) developed by Greene Lab.

## License

The website source code is distributed under the [BSD 3-Clause License](LICENSE.md). Third-party materials remain subject to their respective terms. Unless otherwise stated, original website content is copyright © 2026 NEU-ModelBest Data Intelligence Joint Lab.
