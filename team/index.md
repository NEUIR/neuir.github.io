---
title: Team
nav:
  order: 3
  tooltip: About our team
---

# {% include icon.html icon="fa-solid fa-users" %}Team

<div style="text-align: center">欢迎来到东北大学信息检索团队（NEUIR）</div>

<div style="text-align: center">我们是一个由学生和教师组成的充满激情、兼容并蓄和富有创造力的团队</div>

{% include section.html %}

## Director
{% include list.html data="members" component="portrait" filters="role: pi" %}

## Ph.D. Student
{% include list.html data="members" component="portrait" filters="role: phd" %}

## M.S. Student
{% include list.html data="members" component="portrait" filters="role: ms" %}

## B.S. Student
{% include list.html data="members" component="portrait" filters="role: bs" %}

## Graduated Student
{% include list.html data="members" component="portrait" filters="role: graduated" %}
