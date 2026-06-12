# gok-fetch-article

Fetch the readable content of a web page from your terminal / coding agent,
**bypassing anti-bot interstitials** that block plain HTTP fetchers and
assistant browser sidebars (e.g. an "environment check — verify to continue" wall).

- **Cheapest path first.** Plain pages → `curl`. Only escalates to a local
  headless browser when a page is JS-rendered or anti-bot-gated.
- **Local only.** No third-party scraping API, no cloud. Your machine fetches
  the page; the content never leaves it (except to your own agent).
- **Two agents.** `SKILL.md` for Claude Code, `AGENTS.md` for Codex and other
  shell-driven agents — same behaviour.

## Install

```bash
git clone <this-repo> gok-fetch-article
cd gok-fetch-article
npm install                      # installs the Playwright npm package
# Browser: if you already have Google Chrome / Edge, nothing else is needed —
# the fetcher uses your installed Chrome. Only if you have neither:
npx playwright install chromium  # one Chromium build (~150MB), local
```

Then make it discoverable to your agent:

- **Claude Code**: symlink into your skills dir
  `ln -s "$PWD" ~/.claude/skills/gok-fetch-article`
- **Codex / others**: point the agent at `AGENTS.md`.

`curl` and `node` are the only system prerequisites. Playwright is only needed
for JS / anti-bot pages — the skill **asks before installing it**, never
auto-downloads.

## Usage

```
/gok-fetch-article https://example.com/some-article         # read + summarize
/gok-fetch-article https://example.com/post  save           # also save to disk
```

Or just say "read this link" / "save this article" with a URL.

Direct CLI (engine only):

```bash
node scripts/fetch.mjs https://example.com/post   # -> {status,url,title,text}
```

## Where saved articles go

Resolved by precedence (first match wins):

| Source | Example |
|---|---|
| `--dir <path>` arg | `... save --dir ~/reading` |
| `FETCH_ARTICLE_DIR` env var | `export FETCH_ARTICLE_DIR=~/reading` |
| `~/.config/gok-fetch-article/config` | a line `dir=/path/to/articles` |
| default | `~/articles` |

Files are `YYYY-MM-DD-<slug>.md` with YAML frontmatter
(`type / captured / source / author / site / published / tags`), write-once.

## How it gets past anti-bot

Anti-bot pages reject datacenter IPs and no-JS fetchers. Running a real
browser (your installed Chrome, or a bundled Chromium) from your own
(residential) IP, with JS rendered, looks like a normal visit — so the page
returns its real content. This is for reading
pages you can already open in your own browser; it is not a CAPTCHA solver
and won't touch login-gated content (use your browser's cookies for that).

## License

MIT. Depends only on [Playwright](https://playwright.dev) (Apache-2.0).
No affiliation with or code from any other tool.
