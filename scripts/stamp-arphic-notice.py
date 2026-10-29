#!/usr/bin/env python3
"""Write the Arphic Public License §2a modification notice into AR PL UKai subsets (name ID 10).
Usage: python3 scripts/stamp-arphic-notice.py <YYYY-MM-DD> <font.woff2> [...]
Needs fonttools + brotli (e.g. `uvx --from fonttools --with brotli python scripts/stamp-arphic-notice.py …`)."""
import sys
from fontTools.ttLib import TTFont

NOTICE = ('Modified by chaiyo on {date}: subset to the glyphs one screen uses (fontTools pyftsubset) '
          'and converted to WOFF2. Original: AR PL UKai CN 0.2.20080216, (c) Arphic Technology Co., Ltd., '
          'Arphic Public License, see ARPHICPL.TXT.')


def stamp(path, date):
    """Overwrite the font at path with the modification notice in name ID 10.

    The notice is set for Windows en-US and Macintosh English. The date is
    inserted verbatim; callers supply YYYY-MM-DD. Returns None. Font loading,
    name-table access, and saving errors propagate to the caller.
    """
    font = TTFont(path)
    name = font['name']
    text = NOTICE.format(date=date)
    name.setName(text, 10, 3, 1, 0x409)
    name.setName(text, 10, 1, 0, 0)
    font.save(path)


if __name__ == '__main__':
    date, *paths = sys.argv[1:]
    for p in paths:
        stamp(p, date)
        print(f'stamped {p}')
