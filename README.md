# my-web-language

A web language you write like writing.

You describe a page in plain English. A small library reads your words and
builds a real webpage from them. The English is the truth — the browser code
is just the receipt.

## The whole grammar

- Name a thing, then describe it in **bullets underneath**.
- Indented = belongs to the line above.
- Defaults are whatever a normal person would assume; you only add words for the unobvious.

```
button 1
  - says "The folder"
  - is dark blue
  - sits bottom

folder 1
  - says "Grid Logs — the entry at 02:13 is missing."
  - is white
  - sits center
  - is hidden

when the user clicks button 1
  if the folder is open
    close it
  otherwise
    animate it open
      - takes 1 seconds
      - speeds up
      - bounces
```

One button. If the folder's already open, it closes. Otherwise it opens. The
language remembers whether the folder is open all by itself — you never set
that up.

## What you can say so far

- **things that exist:** `page` `box` `row` `column` `button` `folder` `text` `image` `link`
- **what they look like:** `says "..."`, `is <color>`, `is <size>` (small / medium / large)
- **where they sit:** the nine spots — `top-left` `top` `top-right` `left` `center` `right` `bottom-left` `bottom` `bottom-right`, read inside whatever field they're in
- **fields:** `box` is a stage (you place things at its nine spots); `row` / `column` arrange things for you
- **what happens:** `when the user clicks <thing>` → `<thing> appears` / `animates open` / `disappears` (or `opens` / `closes`)
- **how it moves (stackable):** `takes N seconds`, `steady`, `speeds up`, `slows down`, `bounces`

## Deciding (if / otherwise / it)

Every thing on the page already knows one fact about itself: whether it's
open (on screen) or closed (hidden). So you can ask, and act on the answer.

```
if the folder is open
  close it
otherwise
  open it
```

- **`if the folder is open`** — check whether it's on screen right now.
- whatever's **indented under the `if`** happens only if the answer is yes.
- **`otherwise`** is the other road — its indented lines happen if the answer is no.
- **`it`** means *the last thing you named.* After `if the folder is open`, "it" can only mean the folder, so you never repeat the name.
- **`the folder`** works when there's only one folder. With more than one, say `folder 1`.

## Run it

Open `index.html` in a browser. Edit the English at the top of the file, save, refresh.

## Files

- `index.html` — the website, written in the language.
- `my-first-my-language.js` — the library that reads the language and builds the page.
