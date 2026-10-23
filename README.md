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

## Maintaining team members

Each profile lives in `_members/`. Membership and ordering use separate fields:

- `role`: `pi` (lead faculty), `co` (collaborator), `phd`, or `ms`.
- `status: incoming`: add this for 研0 members. They share the master's section and follow the enrolled master's members.
- `enrollment_year`: the doctoral admission year, for `phd` members.
- `joined_year`: the group joining year, for master's members, including 研0. This stays fixed as students advance.
- `image`: a square portrait under `images/headshots/`, preferably WebP. Use `images/headshots/placeholder.svg` until a portrait is available.
- `affiliation`: the member's email address; omit it until confirmed.

`_data/team.yaml` records the joining order as a readable list of Chinese names. Add each new member to `join_order` at the appropriate position. Faculty use the independent `faculty_order` list. Within each role, enrolled members come first, followed by incoming members; each group sorts by year, then by its position in these lists. An unlisted profile appears after listed members in the same year instead of disappearing. Years and status control ordering without adding labels or subheadings to the page.

For example, an enrolled master's member can be added as:

```yaml
---
name: Ruyue Shang
name_cn: 尚如月
image: images/headshots/ruyue_shang.webp
role: ms
joined_year: 2026
affiliation: shangruyue_ry@outlook.com
---
```

When an incoming student enrolls, remove `status: incoming` and keep the confirmed joining year and joining order. Do not encode grade or order in a numeric `year` field.

## Acknowledgements

This website is based on the [Lab Website Template](https://greene-lab.gitbook.io/lab-website-template-docs) developed by Greene Lab.

## License

The website source code is distributed under the [BSD 3-Clause License](LICENSE.md). Third-party materials remain subject to their respective terms. Unless otherwise stated, original website content is copyright © 2026 NEU-ModelBest Data Intelligence Joint Lab.
