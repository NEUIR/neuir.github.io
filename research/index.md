---
title: 论文发表
nav:
  order: 1
---

# {% include icon.html icon="fa-solid fa-microscope" %}论文发表

## 全部论文

{% include search-box.html %}

{% include search-info.html %}

## 会议论文
{% include list.html data="citations" component="citation" filters="publisher: .*Proceedings.*" style="rich" %}

## 期刊论文
{% include list.html data="citations" component="citation" filters="publisher: .*Journal.*" style="rich" %}
