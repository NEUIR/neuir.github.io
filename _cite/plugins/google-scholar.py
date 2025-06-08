import os
from scholarly import scholarly
from util import *
import time
from tqdm import tqdm


def main(entry):

    gsid = entry.get("gsid", "")
    if not gsid:
        raise Exception('Missing "gsid" in entry')

    try:
        author = scholarly.search_author_id(gsid)
        author = scholarly.fill(author, sections=["publications"])
    except Exception as e:
        log(f"Failed to fetch author data: {str(e)}", level="ERROR")
        return []

    sources = []
    for pub in tqdm(author["publications"]):
        try:
            pub = scholarly.fill(pub)
            time.sleep(1)

            doi = pub.get("bib", {}).get("doi", "")
            url = pub.get("pub_url", "") or pub.get("eprint_url", "")
            title = pub.get("bib", {}).get("title", "")
            source_id = doi if doi else (url if url else f"title:{hash(title)}")

            source = {
                "id": source_id,
                "title": title,
                "authors": pub["bib"].get("author", []),
                "publisher": pub["bib"].get("journal", ""),
                "date": format_date(pub["bib"].get("pub_year", "")),
                "link": url,
                "citedby": pub.get("num_citations", 0),
            }
            sources.append(source)
        except Exception as e:
            log(f"Failed to process publication: {str(e)}", level="WARNING")
            continue

    return sources
