---
title: Blog
nav:
  order: 4
  tooltip: Musings and miscellany
---

# {% include icon.html icon="fa-solid fa-feather-pointed" %}Blog

<div style="text-align: center">欢迎来到东北大学信息检索团队（NEUIR）</div>

<div style="text-align: center">我们是一个由学生和教师组成的充满激情、兼容并蓄和富有创造力的团队</div>

{% include section.html %}

{% include search-box.html %}

{% include tags.html tags=site.tags %}

{% include search-info.html %}

{% include list.html data="posts" component="post-excerpt" %}
