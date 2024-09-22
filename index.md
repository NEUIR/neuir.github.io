---
---

# 课题组介绍

<div style="text-align: center">欢迎来到东北大学信息检索团队（NEUIR）</div>

<div style="text-align: center">我们是一个由学生和教师组成的充满激情、兼容并蓄和富有创造力的团队</div>

<!-- {%
  include button.html
  type="docs"
  link="https://greene-lab.gitbook.io/lab-website-template-docs"
%}
{%
  include button.html
  type="github"
  text="On GitHub"
  link="greenelab/lab-website-template"
%} -->


## Highlights

{% capture text %}

Our research interests are very extensive, including information retrieval, multimodality, code intelligence, recommendation system and so on.

{%
  include button.html
  link="research"
  text="See our publications"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% endcapture %}

{%
  include feature.html
  image="images/home/1.jpg"
  link="research"
  title="Reseearch"
  text=text
%}

{% capture text %}

We have carried out close academic cooperation and exchanges with research institutions such as THUNLP, Beijing Advanced  Innovation Center for Language Resources, OpenBMB, Qiyuan Lab and Alibaba.

{%
  include button.html
  link="projects"
  text="Browse our projects"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% endcapture %}

{%
  include feature.html
  image="images/home/2.png"
  link="projects"
  title="Projects"
  flip=true
  style="bare"
  text=text
%}

{% capture text %}

NEUIR is led by Professor Ge Yu and Associate Professor Zhenghao Liu, and has more than 20 members.

{%
  include button.html
  link="team"
  text="Meet our team"
  icon="fa-solid fa-arrow-right"
  flip=true
  style="bare"
%}

{% endcapture %}

{%
  include feature.html
  image="images/home/3.jpg"
  link="team"
  title="Team"
  text=text
%}
