---
title: 论文发表
nav:
  order: 1
---

# {% include icon.html icon="fa-solid fa-microscope" %}论文发表

## 全部论文

{% include search-box.html %}

{% include search-info.html %}

<div id="paper-results" markdown="1">

<div data-search-group="conference" markdown="1">

## 会议论文
{% include list.html data="citations" component="citation" filters="publisher: .*Proceedings.*" style="rich" %}

</div>

<div data-search-group="journal" markdown="1">

## 期刊论文
{% include list.html data="citations" component="citation" filters="publisher: .*Journal.*" style="rich" %}

</div>

</div>
