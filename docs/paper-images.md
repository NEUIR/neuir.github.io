# 论文配图补齐（2026-10-23）

补齐 7 处缺图，83 篇论文现在均有明确的 `image` 路径。新增 6 张图取自对应论文的公开 PDF，按原比例裁剪，保留图中标注和图例，240dpi 渲染后转为 WebP；另有 1 张原图通过修正 `iamge` 为 `image` 恢复显示。论文卡片排布与顺序沿用原样。

| 论文 | 图源 | 本地文件 |
| --- | --- | --- |
| Towards Efficient and Effective Diffusion Language Model Inference via Semantic-Aware Adaptive Denoising | [ACL 2026 原文](https://aclanthology.org/2026.acl-long.819.pdf)，PDF 第 5 页 Figure 3 | `images/projects/ada-dlm.webp` |
| Explore Entity Embedding Effectiveness in Entity Retrieval | [作者公开预印本](https://arxiv.org/pdf/1908.10554)，PDF 第 11 页 Figure 1 | `images/projects/entity-retrieval.webp` |
| PVFH-Bench | [作者公开预印本](https://arxiv.org/pdf/2610.14635)，PDF 第 3 页 Figure 2 | `images/projects/pvfh-bench.webp` |
| Adapting Open Domain Fact Extraction and Verification to COVID-FACT through In-Domain Language Modeling | [EMNLP Findings 2020 原文](https://aclanthology.org/2020.findings-emnlp.216.pdf)，PDF 第 4 页 Table 3 的两个案例；原文没有方法示意图 | `images/projects/covid-fact.webp` |
| Writing As Reasoning: Interleaving Drafting and Deepening for Open-Ended Deep Research | [对应工作的作者预印本](https://arxiv.org/pdf/2602.06540v1)，PDF 第 3 页 Figure 2（WARP 框架） | `images/projects/writing-as-reasoning.webp` |
| Capturing Global Informativeness in Open Domain Keyphrase Extraction | [作者公开预印本](https://arxiv.org/pdf/2004.13639)，PDF 第 6 页 Figure 1 | `images/projects/jointkpe.webp` |
| Neural Quality Estimation with Multiple Hypotheses for Grammatical Error Correction | 恢复仓库中已有图，论文为 [NAACL 2021](https://aclanthology.org/2021.naacl-main.429/) | `images/projects/vernet.webp` |

Writing As Reasoning 的公开预印本标题为 AgentCPM-Report，正文明确使用同名 WARP（Writing As Reasoning Policy）框架；本次只选用其框架图，保留站点已登记的会议标题和作者信息。PVFH-Bench 新增了与标题、作者一致的公开论文入口。

完整图用于点击放大，卡片优先加载 480px WebP 预览（这 6 张合计 138,042 字节，约 138KB），有条件时提供 960px 版本。所有图补充了固有尺寸，避免加载时挤动布局。图源页码、裁剪坐标、PDF SHA-256 见 [提取记录](audit-2026-10-23/paper-image-sources.json)：`crop` 为以页面左上为原点的 `[左, 上, 右, 下]` PDF 点坐标，按 240dpi 渲染，周围添加 16px 白边后以 WebP quality 92 输出。原论文及图的权利归相应作者或出版方，仓库源码许可不改变图源许可。

逐一验证了 7 张图的缩略图加载、原图解码、预览关闭与焦点恢复；Safari 额外复测 PVFH 图的预览操作。原 PDF 和中间渲染文件留在临时目录，不随网站发布。
