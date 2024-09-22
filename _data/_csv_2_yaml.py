import pandas as pd
import yaml
from datetime import datetime

# 读取 CSV 文件
csv_file = "_citations.csv"
df = pd.read_csv(csv_file)

# 生成 YAML 格式的数据
yaml_list = []
for index, row in df.iterrows():
    # 将作者字符串拆分成列表，并去除多余的空格
    authors = [
        author.replace(",", "").strip()
        for author in row["Authors"].split(";")
        if author.strip()
    ]

    # 创建 YAML 数据项
    entry = {
        "authors": authors,
        "date": f"{row['Year']}-01-01",  # 将年份转化为日期格式
        # "gsid": "4vrZRk0AAAAJ",  # 假设 gsid 是固定的
        # "id": f"4vrZRk0AAAAJ:{index}",  # 用 index 生成唯一 id
        "link": f"https://scholar.google.com/scholar?q={row['Title']}",  # 拼接 Google Scholar 链接
        "publisher": row["Publication"],
        "title": row["Title"],
    }
    yaml_list.append(entry)

# 将数据转换为 YAML 格式并写入文件
yaml_file = "citations.yaml"
with open(yaml_file, "w") as file:
    yaml.dump(yaml_list, file, default_flow_style=False, allow_unicode=True)

print(f"YAML file '{yaml_file}' generated successfully!")
