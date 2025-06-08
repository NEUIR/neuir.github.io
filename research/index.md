---
title: 论文发表
nav:
  order: 1
---

# {% include icon.html icon="fa-solid fa-microscope" %}Research

## ALL

{% include search-box.html %}

{% include search-info.html %}

## Conference
{% include list.html data="citations" component="citation" filters="publisher: .*Proceedings.*" style="rich" %}

## Journal
{% include list.html data="citations" component="citation" filters="publisher: .*Journal.*" style="rich" %}
