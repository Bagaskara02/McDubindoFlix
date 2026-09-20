#!/usr/bin/env python3
"""
McDubindoFlix Incremental Scraper & Catalog Updater
===================================================
Fetches latest uploads from Dubbindo, filters out Indian/Bollywood and Anime content,
extracts direct stream URLs for new entries, and updates the catalog JSONs.
Can be executed via GitHub Actions, CLI, or triggered from FastAPI server.
"""

import argparse
from datetime import datetime
import json
import os
import re
import sys
import time

try:
    from bs4 import BeautifulSoup
    import requests
except ImportError:
    print("[ERROR] Required libraries missing. Please run: pip install requests beautifulsoup4")
    sys.exit(1)

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "https://www.dubbindo.site"
PAGE_LOADING_URL = f"{BASE_URL}/page_loading.php"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": BASE_URL,
}

INDIAN_PATTERNS = [
    r"\bagneepath\b", r"\baitraaz\b", r"\bdil\s*maange\b", r"\bmohab+atein\b",
    r"\bghajini\b", r"\bkoi\s*mil\s*gaya\b", r"\bmain\s*hoon\s*na\b",
    r"\bom\s*shanti\s*om\b", r"\brab\s*ne\s*bana\b", r"\bfanaa\b",
    r"\bgolmaal\b", r"\bhindi\s*dub\b", r"\bbhagban\b", r"\bswades\b",
    r"\bchak\s*de\b", r"\bjab\s*we\s*met\b", r"\byeh\s*jawaani\b",
    r"\bbajirao\b", r"\bpadmaavat\b", r"\bandhadhun\b", r"\bdrishyam\b",
    r"\bkabir\s*singh\b", r"\barticle\s*15\b", r"\btanhaji\b",
    r"\bshershaah\b", r"\bsooryavanshi\b", r"\bdunki\b", r"\bfighter\b",
    r"\banimal\b", r"\bkalki\b", r"\bkantara\b", r"\bvikram\b",
    r"\bjailer\b", r"\bsalaar\b", r"\bponniyin\b", r"\benthiran\b",

    r"\bbollywood\b", r"\bindia\b", r"\bindian\b", r"\bhindi\b", r"\btamil\b",
    r"\btelugu\b", r"\bmalayalam\b", r"\bpunjabi\b", r"\bkollywood\b", r"\btollywood\b",
    r"\bshah\s*rukh\b", r"\bsalman\s*khan\b", r"\baamir\s*khan\b", r"\bdeepika\b",
    r"\bkatrina\s*kaif\b", r"\branbir\s*kapoor\b", r"\bkareena\b", r"\bakshay\s*kumar\b",
    r"\bhrithik\s*roshan\b", r"\bpriyanka\s*chopra\b", r"\bkajol\b", r"\bajay\s*devgn\b",
    r"\bamitabh\s*bachchan\b", r"\branveer\s*singh\b", r"\balia\s*bhatt\b",
    r"\banushka\s*sharma\b", r"\bshahrukh\b", r"\bvarun\s*dhawan\b", r"\bsidharth\s*malhotra\b",
    r"\bshraddha\s*kapoor\b", r"\bkriti\s*sanon\b", r"\btiger\s*shroff\b",
    r"\bkuch\s*kuch\b", r"\bkabhi\s*khushi\b", r"\bdilwale\b", r"\bchennai\s*express\b",
    r"\bpathaan\b", r"\bjawan\b", r"\bdangal\b", r"\bbaahubali\b", r"\brrr\b",
    r"\bkgf\b", r"\bpushpa\b", r"\bbrahmastra\b", r"\banjaana\s*anjaani\b",
    r"\bdil\s*to\s*pagal\b", r"\bbarsaat\b", r"\bbombay\s*boys\b", r"\baap\s*mujhe\b",
    r"\bkrrish\b", r"\bdhoom\b", r"\bdabbang\b", r"\braees\b", r"\bzero\b",
    r"\bdon\s*2\b", r"\bkal\s*ho\s*naa\s*ho\b", r"\bveer\s*zaara\b", r"\bdevdas\b",
    r"\blagaan\b", r"\btaare\s*zameen\b", r"\bpk\b", r"\bsanjoo\b", r"\bwar\b.*hrithik",
    r"\bkrishna\b", r"\bkrisna\b", r"\bmasti\b", r"\bgrand\s*masti\b", r"\bshiva\b",
    r"\bchhota\s*bheem\b", r"\bmotu\s*patlu\b", r"\bmahabharata\b", r"\bramayana\b",
    r"sub__698",
]

ANIME_PATTERNS = [
    r"\bsubaru\b", r"\bbeako\b", r"\brem\b", r"\bemilia\b", r"\bre:?zero\b",
    r"\bluffy\b", r"\bzoro\b", r"\bsanji\b", r"\bgoku\b", r"\bvegeta\b",
    r"\btanjiro\b", r"\bnezuko\b", r"\bgojo\b", r"\bsukuna\b", r"\bitadori\b",
    r"\bdeku\b", r"\bbakugo\b", r"\bfrieren\b", r"\bsolo\s*leveling\b",
    r"\bkaiju\s*no\b", r"\bdungeon\s*meshi\b", r"\bwind\s*breaker\b",
    r"\boshi\s*no\s*ko\b",

    r"\banime\b", r"\bmanga\b", r"\bshounen\b", r"\bseinen\b", r"\bisekai\b",
    r"\bnaruto\b", r"\bboruto\b", r"\bone\s*piece\b", r"\bbleach\b", r"\bjujutsu\s*kaisen\b",
    r"\bkimetsu\s*no\s*yaiba\b", r"\bdemon\s*slayer\b", r"\battack\s*on\s*titan\b",
    r"\bshingeki\s*no\s*kyojin\b", r"\bdragon\s*ball\b", r"\bdetective\s*conan\b",
    r"\bdoraemon\b", r"\bcrayon\s*shinchan\b", r"\bshinchan\b", r"\bmy\s*hero\s*academia\b",
    r"\bboku\s*no\s*hero\b", r"\bdeath\s*note\b", r"\bhunter\s*x\s*hunter\b",
    r"\bfullmetal\s*alchemist\b", r"\bsword\s*art\s*online\b", r"\btokyo\s*ghoul\b",
    r"\bone\s*punch\s*man\b", r"\bchainsaw\s*man\b", r"\bspy\s*x\s*family\b",
    r"\bhaikyuu\b", r"\bblack\s*clover\b", r"\bfairy\s*tail\b", r"\bgintama\b",
    r"\bdr\.\s*stone\b", r"\boverlord\b", r"\bre:zero\b", r"\bkonosuba\b",
    r"\bno\s*game\s*no\s*life\b", r"\byurucamp\b", r"\bslam\s*dunk\b",
    r"\bcaptain\s*tsubasa\b", r"\binuyasha\b", r"\byu-gi-oh\b", r"\bpokemon\b",
    r"\bdigimon\b", r"\bgundam\b", r"\bevangelion\b", r"\bspirited\s*away\b",
    r"\bghibli\b", r"\byour\s*name\b", r"\bkimi\s*no\s*na\s*wa\b", r"\bweathering\s*with\s*you\b",
    r"\bsuzume\b", r"\ba\s*silent\s*voice\b", r"\bkoe\s*no\s*katachi\b",
]

PLATFORM_TAGS = {
    "Netflix": [
        r"\bnetflix\b", r"\bstranger\s*things\b", r"\bsquid\s*game\b", r"\bmoney\s*heist\b",
        r"\blupin\b", r"\bthe\s*witcher\b", r"\bbridgerton\b", r"\bwednesday\b",
        r"\bcobra\s*kai\b", r"\bblack\s*mirror\b", r"\bsex\s*education\b", r"\bdark\b",
        r"\belite\b", r"\ball\s*of\s*us\s*are\s*dead\b", r"\bglory\b",
        r"\bqueen'?s\s*gambit\b", r"\bpeaky\s*blinders\b", r"\byou\b.*netflix",
        r"\bheartstopper\b", r"\balice\s*in\s*borderland\b", r"\bsweet\s*home\b"
    ],
    "Disney+": [
        r"\bdisney\b", r"\bpixar\b", r"\bmarvel\b", r"\bmcu\b", r"\bavengers\b",
        r"\biron\s*man\b", r"\bcaptain\s*america\b", r"\bthor\b", r"\bloki\b",
        r"\bwandavision\b", r"\bhawkeye\b", r"\bmoon\s*knight\b", r"\bms\.\s*marvel\b",
        r"\bshe-hulk\b", r"\bsecret\s*invasion\b", r"\becho\b", r"\bstar\s*wars\b",
        r"\bmandalorian\b", r"\bandor\b", r"\bahsoka\b", r"\bobi-wan\b", r"\bboba\s*fett\b",
        r"\bfrozen\b", r"\bmoana\b", r"\bencanto\b", r"\bluca\b", r"\bturning\s*red\b",
        r"\bcoco\b", r"\bsoul\b", r"\binside\s*out\b", r"\bzootopia\b", r"\btangled\b"
    ],
    "HBO / Warner": [
        r"\bhbo\b", r"\bgame\s*of\s*thrones\b", r"\bhouse\s*of\s*the\s*dragon\b",
        r"\bthe\s*last\s*of\s*us\b", r"\beuphoria\b", r"\bsuccession\b", r"\bwhite\s*lotus\b",
        r"\bbarbie\b", r"\boppenheimer\b", r"\bdune\b", r"\bbatman\b", r"\bsuperman\b",
        r"\bdc\b", r"\bjoker\b", r"\baquaman\b", r"\bflash\b", r"\bharry\s*potter\b"
    ],
    "Box Office Blockbuster": [
        r"\bavatar\b", r"\bfast\s*(&|and)?\s*furious\b", r"\bjohn\s*wick\b",
        r"\bmission\s*impossible\b", r"\btop\s*gun\b", r"\bjurassic\b", r"\btransformers\b",
        r"\bspider-?man\b", r"\bgladiator\b", r"\bvenom\b", r"\bdeadpool\b",
        r"\bwolverine\b", r"\bgodzilla\b", r"\bkong\b", r"\bplanet\s*of\s*the\s*apes\b",
        r"\bquiet\s*place\b", r"\bmad\s*max\b", r"\bfallout\b", r"\brings\s*of\s*power\b",
        r"\blord\s*of\s*the\s*rings\b", r"\bhobbit\b", r"\bpirates\s*of\s*the\s*caribbean\b",
        r"\bindiana\s*jones\b", r"\bthe\s*matrix\b", r"\bterminator\b", r"\balien\b"
    ],
}


def matches_any(patterns, text):
    if not text:
        return False
    lower = text.lower()
    return any(re.search(pat, lower) for pat in patterns)


def is_indian_content(item):
    text = f"{item.get('title', '')} {item.get('description', '')} {item.get('slug', '')}"
    return matches_any(INDIAN_PATTERNS, text)



def is_short_clip(duration_str):
    """Detect if duration is under 3 minutes (clips, scenes, shorts)."""
    if not duration_str:
        return False
    parts = duration_str.strip().split(":")
    if len(parts) == 1:
        return True
    if len(parts) == 2:
        try:
            mins = int(parts[0])
            return mins < 3
        except ValueError:
            pass
    return False

def is_anime_content(item):

    if "anopoikun" in item.get("uploader", "").lower():
        return True
    if "/shorts/" in item.get("url", "").lower():
        return True
    category = item.get("category", "").lower()
    if "anime" in category:
        return True
    text = f"{item.get('title', '')} {item.get('description', '')} {item.get('slug', '')}"
    return matches_any(ANIME_PATTERNS, text)


def assign_tags(item):
    tags = []
    text = f"{item.get('title', '')} {item.get('description', '')}"

    for platform, patterns in PLATFORM_TAGS.items():
        if matches_any(patterns, text):
            tags.append(platform)

    views = item.get("views", 0)
    if views >= 100:
        tags.append("Popular")
    if views >= 500:
        tags.append("Top Viewed")

    if not tags:
        tags.append("Dubbing Indo")

    item["tags"] = tags
    item["is_popular"] = (
        "Popular" in tags
        or "Top Viewed" in tags
        or any(p in tags for p in ["Netflix", "Disney+", "HBO / Warner", "Box Office Blockbuster"])
    )
    return item


def fetch_page(page=1):
    """Fetch video listing page from Dubbindo."""
    url = f"{PAGE_LOADING_URL}?page={page}&load=all"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=25)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"[WARN] Failed to fetch page {page}: {e}")
        return None


def extract_cards(html):
    """Extract and parse video cards from HTML."""
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    containers = soup.select("div.col-md-3[data-id]")
    cards = []

    for container in containers:
        vid_id = container.get("data-id", "").strip()
        if not vid_id:
            continue

        try:
            views = int(container.get("data-views", "0"))
        except (ValueError, TypeError):
            views = 0

        img = container.select_one("img")
        title = (img.get("alt") if img else "") or ""
        thumb = (img.get("src") if img else "") or ""

        link = container.select_one("a")
        href = (link.get("href") if link else "") or ""

        # Extract slug
        slug = ""
        m = re.search(r"/watch/(.+?)\.html", href)
        if m:
            slug = m.group(1)
        else:
            m = re.search(r"/shorts/(.+?)\.html", href)
            if m:
                slug = m.group(1)

        dur_elem = container.select_one(".video-duration, .duration")
        duration = dur_elem.get_text(strip=True) if dur_elem else ""

        gif_elem = container.select_one(".play_hover_btn[onmouseenter]")
        gif_preview = ""
        if gif_elem:
            me = gif_elem.get("onmouseenter", "")
            gm = re.search(r"show_gif\(this,'([^']+)'\)", me)
            if gm:
                gif_preview = gm.group(1)

        uploader_elem = container.select_one(".video-info a, .video-list-by a")
        uploader = uploader_elem.get_text(strip=True) if uploader_elem else ""
        uploader_url = uploader_elem.get("href", "") if uploader_elem else ""

        spans = container.select(".video-info span, .video-list-by span")
        time_ago = ""
        for s in spans:
            st = s.get_text(strip=True)
            if any(w in st.lower() for w in ["ago", "hour", "day", "week", "month", "year", "lalu"]):
                time_ago = st
                break

        desc_elem = container.select_one(".descc")
        description = desc_elem.get_text(strip=True) if desc_elem else ""

        # Check if title indicates series / episodes
        is_series = bool(
            re.search(r"\b(season|musim|episode|eps?\.?|s\d+e\d+)\b", title, re.I)
        )
        category = "TV Series" if is_series else "Film Movie"

        item = {
            "id": vid_id,
            "views": views,
            "title": title,
            "url": href,
            "slug": slug,
            "thumbnail": thumb,
            "duration": duration,
            "gif_preview": gif_preview,
            "uploader": uploader,
            "uploader_url": uploader_url,
            "time_ago": time_ago,
            "description": description,
            "category": category,
            "scraped_at": datetime.now().isoformat(),
        }
        cards.append(item)

    return cards


def extract_stream_url(watch_url):
    """Fetch watch page and extract direct MP4/M3U8 or driveduo stream URL."""
    if not watch_url:
        return None
    try:
        r = requests.get(watch_url, headers=HEADERS, timeout=12)
        sources = re.findall(r'(https?://[^\s"\'<>]+\.(?:mp4|m3u8|webm)[^\s"\'<>]*)', r.text)
        if sources:
            preferred = [s for s in sources if "720p" in s or "1080p" in s]
            return preferred[0] if preferred else sources[0]
        duo = re.findall(r'(https?://stream\.dubbindo\.site/driveduo/uploads/[^\s"\'<>]+)', r.text)
        if duo:
            return duo[0]
    except Exception as e:
        print(f"  [WARN] Failed stream extraction for {watch_url}: {e}")
    return None


def get_embed_code(slug_or_url):
    if not slug_or_url:
        return ""
    m = re.search(r"_([A-Za-z0-9_-]{8,})", slug_or_url)
    return m.group(1) if m else ""


def update_catalog(data_dir, max_pages=2, fetch_streams=True, max_new_streams=20):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting Catalog Update...")
    print(f"Data directory: {data_dir}")

    all_content_path = os.path.join(data_dir, "all_content.json")
    latest_path = os.path.join(data_dir, "latest.json")
    popular_path = os.path.join(data_dir, "popular.json")
    boxoffice_path = os.path.join(data_dir, "boxoffice.json")
    netflix_path = os.path.join(data_dir, "netflix.json")
    disney_path = os.path.join(data_dir, "disney.json")
    movies_path = os.path.join(data_dir, "movies.json")
    series_path = os.path.join(data_dir, "series.json")
    stream_sources_path = os.path.join(data_dir, "stream_sources.json")
    metadata_path = os.path.join(data_dir, "metadata.json")

    def read_json(path, default):
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[WARN] Error reading {path}: {e}")
        return default

    all_content = read_json(all_content_path, [])
    latest_list = read_json(latest_path, [])
    stream_sources = read_json(stream_sources_path, {})
    metadata = read_json(metadata_path, {})

    existing_ids = {str(item.get("id")) for item in all_content if item.get("id")}
    existing_slugs = {item.get("slug") for item in all_content if item.get("slug")}

    print(f"Current catalog size: {len(all_content)} items | Existing stream sources: {len(stream_sources)}")

    scraped_cards = []
    for p in range(1, max_pages + 1):
        print(f"Fetching page {p}/{max_pages}...")
        html = fetch_page(p)
        cards = extract_cards(html)
        print(f"  Page {p}: Found {len(cards)} video cards")
        scraped_cards.extend(cards)
        time.sleep(1)

    new_items = []
    filtered_indian = 0
    filtered_anime = 0
    already_present = 0

    for card in scraped_cards:
        cid = str(card.get("id", ""))
        cslug = card.get("slug", "")


        if "/shorts/" in card.get("url", "").lower() or is_short_clip(card.get("duration", "")):
            continue
        if cid in existing_ids or (cslug and cslug in existing_slugs):
            already_present += 1
            continue

        if is_indian_content(card):
            filtered_indian += 1
            continue

        if is_anime_content(card):
            filtered_anime += 1
            continue

        card = assign_tags(card)
        new_items.append(card)
        existing_ids.add(cid)
        if cslug:
            existing_slugs.add(cslug)

    print(f"\nScrape summary:")
    print(f"  Already present: {already_present}")
    print(f"  Filtered Indian/Bollywood: {filtered_indian}")
    print(f"  Filtered Anime: {filtered_anime}")
    print(f"  New valid items found: {len(new_items)}")

    streams_added = 0
    if fetch_streams and new_items:
        print(f"\nExtracting direct video streams for up to {max_new_streams} new items...")
        for item in new_items[:max_new_streams]:
            url = item.get("url")
            vid_id = str(item.get("id"))
            slug = item.get("slug", "")
            embed_code = get_embed_code(slug)

            if vid_id in stream_sources or (slug and slug in stream_sources):
                continue

            print(f"  Resolving stream for: {item.get('title')}...")
            stream_url = extract_stream_url(url)
            if stream_url:
                stream_sources[vid_id] = stream_url
                if slug:
                    stream_sources[slug] = stream_url
                if embed_code:
                    stream_sources[embed_code] = stream_url
                streams_added += 1
                print(f"    -> OK: {stream_url[:65]}...")
            else:
                print(f"    -> No direct stream found")
            time.sleep(0.4)

    if not new_items and streams_added == 0:
        print("\nNo new content found. Everything is up to date.")
        metadata["updated_at"] = datetime.now().isoformat()
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        return False

    updated_all_content = new_items + all_content
    updated_latest = new_items + [item for item in latest_list if str(item.get("id")) not in {str(n.get("id")) for n in new_items}]
    updated_latest = updated_latest[:60]

    movies_list = [item for item in updated_all_content if item.get("category") == "Film Movie"]
    series_list = [item for item in updated_all_content if item.get("category") == "TV Series"]
    popular_list = [item for item in updated_all_content if item.get("is_popular") or item.get("views", 0) >= 30]
    popular_list.sort(key=lambda x: x.get("views", 0), reverse=True)

    boxoffice_list = [item for item in updated_all_content if "Box Office Blockbuster" in item.get("tags", [])]
    netflix_list = [item for item in updated_all_content if "Netflix" in item.get("tags", [])]
    disney_list = [item for item in updated_all_content if "Disney+" in item.get("tags", [])]

    print("\nWriting updated catalog files...")
    def write_json(path, data, compact=True):
        with open(path, "w", encoding="utf-8") as f:
            if compact:
                json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
            else:
                json.dump(data, f, ensure_ascii=False, indent=2)

    write_json(all_content_path, updated_all_content, compact=True)
    write_json(latest_path, updated_latest, compact=False)
    write_json(popular_path, popular_list, compact=False)
    write_json(boxoffice_path, boxoffice_list, compact=False)
    write_json(netflix_path, netflix_list, compact=False)
    write_json(disney_path, disney_list, compact=False)
    write_json(movies_path, movies_list, compact=False)
    write_json(series_path, series_list, compact=False)
    write_json(stream_sources_path, stream_sources, compact=True)

    metadata["updated_at"] = datetime.now().isoformat()
    if "stats" not in metadata:
        metadata["stats"] = {}
    metadata["stats"]["total_content"] = len(updated_all_content)
    metadata["stats"]["total_movies"] = len(movies_list)
    metadata["stats"]["total_series"] = len(series_list)
    metadata["stats"]["total_popular"] = len(popular_list)
    metadata["stats"]["total_boxoffice"] = len(boxoffice_list)
    metadata["stats"]["total_netflix"] = len(netflix_list)
    metadata["stats"]["total_disney"] = len(disney_list)
    metadata["stats"]["total_stream_sources"] = len(stream_sources)

    write_json(metadata_path, metadata, compact=False)
    print(f"Catalog successfully updated! Total items: {len(updated_all_content)} (+{len(new_items)} new)")
    return True


def main():
    parser = argparse.ArgumentParser(description="McDubindoFlix Incremental Scraper")
    parser.add_argument("--pages", type=int, default=2, help="Number of pages to scrape (default: 2)")
    parser.add_argument("--no-streams", action="store_true", help="Skip stream extraction")
    parser.add_argument("--data-dir", type=str, default=None, help="Custom data directory")
    args = parser.parse_args()

    if args.data_dir:
        data_dir = args.data_dir
    else:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        web_data_dir = os.path.join(os.path.dirname(current_dir), "public", "data")
        if os.path.exists(web_data_dir):
            data_dir = web_data_dir
        else:
            data_dir = os.path.join(os.path.dirname(current_dir), "api")

    if not os.path.exists(data_dir):
        print(f"[ERROR] Target data directory '{data_dir}' not found.")
        sys.exit(1)

    has_changes = update_catalog(
        data_dir=data_dir,
        max_pages=args.pages,
        fetch_streams=not args.no_streams,
    )
    if has_changes:
        sys.exit(0)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()

