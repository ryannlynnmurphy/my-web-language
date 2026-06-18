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
  - says "Open the folder"
  - is dark blue
  - sits bottom-left

when the user clicks button 1
  - folder 1 animates open
    - takes 1 seconds
    - speeds up
    - bounces
```

## What you can say so far

- **things that exist:** `page` `box` `row` `column` `button` `folder` `text` `image` `link`
- **what they look like:** `says "..."`, `is <color>`, `is <size>` (small / medium / large)
- **where they sit:** the nine spots — `top-left` `top` `top-right` `left` `center` `right` `bottom-left` `bottom` `bottom-right`, read inside whatever field they're in
- **fields:** `box` is a stage (you place things at its nine spots); `row` / `column` arrange things for you
- **what happens:** `when the user clicks <thing>` → `<thing> appears` / `animates open` / `disappears`
- **how it moves (stackable):** `takes N seconds`, `steady`, `speeds up`, `slows down`, `bounces`

## Run it

Open `index.html` in a browser. Edit the English at the top of the file, save, refresh.

## Files

- `index.html` — the website, written in the language.
- `my-first-my-language.js` — the library that reads the language and builds the page.
