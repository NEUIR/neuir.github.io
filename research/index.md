---
title: Research
nav:
  order: 1
  tooltip: Published works
---

# {% include icon.html icon="fa-solid fa-microscope" %}Research

<div style="text-align: center">欢迎来到东北大学信息检索团队（NEUIR）</div>

<div style="text-align: center">我们是一个由学生和教师组成的充满激情、兼容并蓄和富有创造力的团队</div>

## ALL

{% include search-box.html %}

{% include search-info.html %}

## Conference
{% include list.html data="citations" component="citation" filters="publisher: .*Proceedings.*" %}

## Journal
{% include list.html data="citations" component="citation" filters="publisher: .*Journal.*" %}
