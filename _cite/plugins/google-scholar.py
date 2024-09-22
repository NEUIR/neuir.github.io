import os
from scholarly import scholarly
from util import *


def main(entry):
    """
    receives single list entry from google-scholar data file
    returns list of sources to cite
    """

    # get id from entry
    _id = get_safe(entry, "gsid", "")
    if not _id:
        raise Exception('No "gsid" key')

    # query api
    @log_cache
    @cache.memoize(name=__file__, expire=1 * (60 * 60 * 24))
    def query(_id):
        author = scholarly.search_author_id(_id)
        return scholarly.fill(author, sections=["publications"])["publications"]

    response = query(_id)
    # print(response)

    # list of sources to return
    sources = []

    # go through response and format sources
    for res in response:
        title = get_safe(res, "bib", {}).get("title", "")
        work_iter = scholarly.search_pubs(title)
        work = next(work_iter, None)
        if not work:
            continue
        # create source
        year = get_safe(work, "bib", {}).get("pub_year", "")
        source = {
            "id": get_safe(res, "author_pub_id", ""),
            "title": get_safe(work, "bib", {}).get("title", ""),
            "authors": list(get_safe(work, "bib", {}).get("author", "")),
            "publisher": get_safe(work, "bib", {}).get("venue", ""),
            "date": (year + "-01-01") if year else "",
            "link": get_safe(work, "pub_url", ""),
        }

        # copy fields from entry to source
        source.update(entry)

        # add source to list
        sources.append(source)
        print(source)

    return sources
