from scholarly import scholarly

_id = "4vrZRk0AAAAJ"
author = scholarly.search_author_id(_id)
pubs = scholarly.fill(author, sections=["publications"])["publications"]
title_list = [pub["bib"]["title"] for pub in pubs]
search_query = scholarly.search_pubs(title_list[0])
scholarly.pprint(next(search_query))
