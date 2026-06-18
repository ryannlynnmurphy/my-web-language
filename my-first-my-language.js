/* ============================================================
   my-first-my-language.js  —  the library that runs your language

   You write a page in plain English (see index.html).
   This file reads those words and builds a real webpage.

   The English is the truth. This file is just the receipt.
   ============================================================ */

(function () {

  /* ----------------------------------------------------------
     THE MENUS  —  the fixed vocabularies you legislated.
     Small on purpose. You grow them by adding a line.
     ---------------------------------------------------------- */

  // colors you're allowed to say
  const COLORS = {
    "black":      "#0b0b0c",
    "white":      "#f5f5f2",
    "gray":       "#8a8a86",
    "grey":       "#8a8a86",
    "red":        "#c0392b",
    "blue":       "#2d6cdf",
    "dark blue":  "#1b3a73",
    "light blue": "#7fb0ff",
    "green":      "#2e8b57",
    "yellow":     "#e6c84f",
    "pink":       "#e58fb0",
    "purple":     "#6a4c93",
    "orange":     "#d98032"
  };

  // sizes you're allowed to say
  const SIZES = { "small": 1, "medium": 2, "large": 3 };

  // the nine spots  —  where a thing sits inside its field.
  // these only mean something relative to the field they're in.
  const SPOTS = {
    "top-left":     { top: "0%",   left: "0%",   tx: "0",     ty: "0"    },
    "top":          { top: "0%",   left: "50%",  tx: "-50%",  ty: "0"    },
    "top-right":    { top: "0%",   left: "100%", tx: "-100%", ty: "0"    },
    "left":         { top: "50%",  left: "0%",   tx: "0",     ty: "-50%" },
    "center":       { top: "50%",  left: "50%",  tx: "-50%",  ty: "-50%" },
    "right":        { top: "50%",  left: "100%", tx: "-100%", ty: "-50%" },
    "bottom-left":  { top: "100%", left: "0%",   tx: "0",     ty: "-100%"},
    "bottom":       { top: "100%", left: "50%",  tx: "-50%",  ty: "-100%"},
    "bottom-right": { top: "100%", left: "100%", tx: "-100%", ty: "-100%"}
  };

  // how a thing moves when it animates  —  the motion menu.
  const MOTION = {
    "steady":     "linear",
    "speeds up":  "cubic-bezier(0.5, 0, 1, 1)",
    "slows down": "cubic-bezier(0, 0, 0.5, 1)",
    "bounces":    "cubic-bezier(0.34, 1.56, 0.64, 1)"
  };

  // the words that name a thing that exists
  // ("blank" is a box you type into — like a fill-in-the-blank)
  const KINDS = ["page", "box", "row", "column", "button", "folder", "text", "image", "link", "blank"];


  /* ----------------------------------------------------------
     READING THE LANGUAGE
     Indentation is meaning: a line indented under another
     line belongs to it. So first we turn the text into a
     tree based on how far each line is indented.
     ---------------------------------------------------------- */

  function buildTree(text) {
    const root = { text: "(root)", children: [] };
    const stack = [{ node: root, indent: -1 }];

    text.replace(/\t/g, "  ").split("\n").forEach(function (raw) {
      if (raw.trim() === "") return;            // blank lines are just breathing room
      var indent = raw.match(/^ */)[0].length;  // how far in does it start?
      var node = { text: raw.trim(), children: [] };

      // climb back out until we find this line's parent
      while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
      stack[stack.length - 1].node.children.push(node);
      stack.push({ node: node, indent: indent });
    });

    return root;
  }

  // is this line naming a thing?  (e.g. "button 1", "folder", "box")
  function kindOf(line) {
    var first = line.toLowerCase().split(/\s+/)[0];
    return KINDS.indexOf(first) !== -1 ? first : null;
  }

  // pull the text between the first pair of quotes
  function quoted(line) {
    var m = line.match(/"([^"]*)"/);
    return m ? m[1] : "";
  }

  // pull the first number out of a line
  function numberIn(line) {
    var m = line.match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }


  /* ----------------------------------------------------------
     BUILDING THE PAGE
     ---------------------------------------------------------- */

  var registry = {};   // remembers every thing by its name, so "when ... clicks button 1" can find it
  var styleEl  = null; // where the animation lives

  // decide if text on a colored thing should be light or dark
  function contrastOn(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? "#0b0b0c" : "#f5f5f2";
  }

  // turn one "thing" node into a real element on the page
  function makeThing(node, parentEl, fieldType) {
    var kind = kindOf(node.text);
    var name = node.text.replace(/\s+/g, " ").trim();   // e.g. "button 1"  — this is its id

    // make the right kind of element
    var el;
    if (kind === "button") el = document.createElement("button");
    else if (kind === "link") el = document.createElement("a");
    else if (kind === "image") el = document.createElement("img");
    else if (kind === "blank") { el = document.createElement("input"); el.type = "text"; }
    else el = document.createElement("div");

    el.className = "thing kind-" + kind;

    // a box/row/column is a FIELD — things sit inside it.
    // a box is a stage (you place things at its nine spots).
    // a row lines things up sideways; a column stacks them down.
    var childField = "stage";
    if (kind === "box")    { el.style.position = "relative"; }
    if (kind === "row")    { el.style.display = "flex"; el.style.flexDirection = "row";    el.style.gap = "16px"; childField = "row"; }
    if (kind === "column") { el.style.display = "flex"; el.style.flexDirection = "column"; el.style.gap = "16px"; childField = "column"; }

    // the bullets under this thing describe it; other things under it live inside it
    var pos = null;
    var draggable = false;
    node.children.forEach(function (child) {
      if (child.text.charAt(0) === "-") {
        applyProp(el, kind, child.text);
        var maybe = readPosition(child.text);
        if (maybe) pos = maybe;
        if (/can be dragged|can be moved|can drag|drag it/.test(child.text.toLowerCase())) draggable = true;
      } else if (kindOf(child.text)) {
        makeThing(child, el, childField);   // a thing inside a field
      }
    });

    // place it. inside a stage we use the nine spots; inside a row/column the field arranges it.
    if (fieldType === "stage") {
      el.style.position = "absolute";
      var spot = SPOTS[(pos && pos.spot) || "center"];
      el.style.top = spot.top;
      el.style.left = spot.left;
      el.style.transform = "translate(" + spot.tx + ", " + spot.ty + ")";
      if (pos && pos.down)  el.style.marginTop  = pos.down + "px";
      if (pos && pos.right) el.style.marginLeft = pos.right + "px";
    }

    registry[name] = el;
    parentEl.appendChild(el);
    if (draggable) makeDraggable(el);
    return el;
  }

  // let the user pick a thing up and move it around
  function makeDraggable(el) {
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var rect = el.getBoundingClientRect();
      var grabX = e.clientX - rect.left;   // where on the thing you grabbed it
      var grabY = e.clientY - rect.top;
      el.style.cursor = "grabbing";
      el.style.transform = "none";         // stop centering — you're holding it now

      function move(ev) {
        el.style.left = (ev.clientX - grabX) + "px";
        el.style.top  = (ev.clientY - grabY) + "px";
      }
      function drop() {
        el.style.cursor = "grab";
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", drop);
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", drop);
    });
  }

  // read a "sits ..." bullet into a spot (+ optional nudge)
  function readPosition(praw) {
    var p = praw.replace(/^-\s*/, "").toLowerCase();
    if (p.indexOf("sits") !== 0) return null;

    var clean = p.replace(/sits|in the|at the|to the|the/g, " ").replace(/\s+/g, " ").trim();
    var result = {};

    for (var key in SPOTS) {
      var spoken = key.replace("-", " ");
      if (clean.indexOf(spoken) !== -1 || clean.indexOf(key) !== -1) { result.spot = key; break; }
    }

    // nudges: "sits 40 down from the top", "sits 30 from the left"
    if (/down from (the )?top/.test(p))    result.down  = numberIn(p);
    if (/up from (the )?bottom/.test(p))   result.down  = -numberIn(p);
    if (/from (the )?left/.test(p))        result.right = numberIn(p);
    if (/from (the )?right/.test(p))       result.right = -numberIn(p);

    return (result.spot || result.down || result.right) ? result : null;
  }

  // apply one descriptive bullet to a thing
  function applyProp(el, kind, praw) {
    var p = praw.replace(/^-\s*/, "").trim();
    var low = p.toLowerCase();

    if (low.indexOf("says") === 0 || low.indexOf("holds") === 0) {
      // a blank "says" its ghost hint; everything else says its words outright
      if (kind === "blank") el.placeholder = quoted(p);
      else el.textContent = quoted(p);
      return;
    }
    if (low.indexOf("shows") === 0 && kind === "image") {
      el.src = quoted(p);
      return;
    }
    if (low === "is hidden" || low === "starts hidden") {
      el.style.display = "none";
      el.dataset.hidden = "true";
      return;
    }

    if (low.indexOf("is ") === 0) {
      var word = low.slice(3).replace(/\bsized\b/, "").trim();

      // a size?
      if (SIZES[word]) { applySize(el, kind, word); return; }

      // a color?
      if (COLORS[word]) { applyColor(el, kind, word); return; }
    }
  }

  function applySize(el, kind, word) {
    var step = SIZES[word];
    if (kind === "button") {
      el.style.fontSize = [14, 17, 22][step - 1] + "px";
      el.style.padding  = ["8px 16px", "12px 22px", "16px 30px"][step - 1];
    } else {
      el.style.fontSize = [16, 24, 44][step - 1] + "px";
    }
  }

  function applyColor(el, kind, word) {
    var hex = COLORS[word];
    // text & links: the color is the lettering.
    if (kind === "text" || kind === "link") {
      el.style.color = hex;
    } else {
      // buttons, folders, boxes, pages: the color fills the thing,
      // and the lettering flips to stay readable.
      el.style.backgroundColor = hex;
      if (kind !== "page" && kind !== "box") el.style.color = contrastOn(hex);
    }
  }


  /* ----------------------------------------------------------
     MAKING THINGS HAPPEN  —  the "when the user clicks" blocks
     ---------------------------------------------------------- */

  // route a "when ..." block to the right kind of gesture
  function wireWhen(node) {
    var low = node.text.toLowerCase();
    if (low.indexOf("hover") !== -1)        wireHover(node);
    else if (low.indexOf("double") !== -1)  wireTrigger(node, "dblclick", /double[- ]?clicks?\s+(.+)$/);
    else if (low.indexOf("type") !== -1)    wireTyping(node);
    else                                    wireTrigger(node, "click", /clicks?\s+(.+)$/);
  }

  // the plain "do it when this gesture happens" wiring — used by click and double-click.
  // everything written underneath runs, in order, every time the gesture happens.
  // we carry a little memory of "the last thing we named" so "it" works.
  function wireTrigger(node, domEvent, phrase) {
    var m = node.text.toLowerCase().match(phrase);
    if (!m) return;
    var trigger = registry[findTargetFromPhrase(m[1])];
    if (!trigger) return;
    // "it" starts out meaning the very thing you clicked, so
    // "double-clicks folder 1: close it" knows what "it" is.
    trigger.addEventListener(domEvent, function () {
      runStatements(node.children, { last: trigger });
    });
  }

  function wireTyping(node) {
    // "when the user types in blank 1"  ->  runs on every keystroke,
    // and remembers what they typed so you can use it.
    var m = node.text.toLowerCase().match(/types?(?:\s+in)?\s+(.+)$/);
    if (!m) return;
    var trigger = registry[findTargetFromPhrase(m[1])];
    if (!trigger) return;
    trigger.addEventListener("input", function () {
      runStatements(node.children, { last: trigger, typed: trigger.value });
    });
  }

  function wireHover(node) {
    // "when the user hovers over button 1"  ->  trigger is "button 1"
    var m = node.text.toLowerCase().match(/hovers?\s+(?:over\s+)?(.+)$/);
    if (!m) return;
    var trigger = registry[findTargetFromPhrase(m[1])];
    if (!trigger) return;

    // a hover has two moments: the pointer arrives, and the pointer leaves.
    // on arrival we run what's written. on leave we put everything back the
    // way it was — so a hover effect quietly undoes itself, like people expect.
    trigger.addEventListener("mouseenter", function () {
      var before = {};
      Object.keys(registry).forEach(function (n) { before[n] = registry[n].style.display; });
      trigger._before = before;
      runStatements(node.children, { last: trigger });
    });
    trigger.addEventListener("mouseleave", function () {
      var before = trigger._before || {};
      Object.keys(before).forEach(function (n) { registry[n].style.display = before[n]; });
    });
  }

  // run a list of statements in order, keeping track of what "it" means
  function runStatements(statements, ctx) {
    for (var i = 0; i < statements.length; i++) {
      var line = statements[i].text.replace(/^-\s*/, "");
      var low  = line.toLowerCase();

      if (low.indexOf("if ") === 0) {
        // "if the folder is open"  ->  check, then run the right branch
        var yes = checkCondition(low, ctx);
        if (yes) {
          runStatements(statements[i].children, ctx);
        } else {
          var next = statements[i + 1];
          if (next && next.text.toLowerCase().replace(/^-\s*/, "").indexOf("otherwise") === 0) {
            runStatements(next.children, ctx);
          }
        }
        // the "otherwise" belongs to this "if" — don't run it again on its own
        var peek = statements[i + 1];
        if (peek && peek.text.toLowerCase().replace(/^-\s*/, "").indexOf("otherwise") === 0) i++;
      }
      else if (low.indexOf("otherwise") === 0) {
        continue;   // already handled as part of its "if"
      }
      else {
        runAction(statements[i], ctx);
      }
    }
  }

  // "if the folder is open"  ->  true or false
  function checkCondition(low, ctx) {
    var body  = low.replace(/^if\s+/, "");
    var parts = body.split(/\s+is\s+/);
    var target = resolveThing(parts[0], ctx);     // also remembers it for "it"
    if (!target) return false;

    var state   = parts[1] || "";
    var visible = target.style.display !== "none";
    if (/closed|hidden|gone|away|shut/.test(state)) return !visible;
    return visible;   // open / shown / showing / here  -> is it on screen?
  }

  // do one action: open it, close it, animate it open, "folder 1 appears", etc.
  function runAction(node, ctx) {
    var line = node.text.replace(/^-\s*/, "");
    var low  = line.toLowerCase();
    var target = resolveThing(line, ctx);
    if (!target) return;

    // "text 1 says what they typed" -> echo the typing into that thing, live
    if (/says\s+what\s+(they|was)\s+typed/.test(low)) {
      target.textContent = ctx.typed || "";
      return;
    }
    // "text 1 says ..." -> set its words outright
    if (/\bsays\b/.test(low) && /"/.test(line)) {
      target.textContent = quoted(line);
      return;
    }

    if (low.indexOf("animate") !== -1) {
      var motions = [], seconds = null;
      node.children.forEach(function (sub) {
        var t = sub.text.replace(/^-\s*/, "").toLowerCase();
        if (t.indexOf("takes") === 0) seconds = numberIn(t);
        for (var word in MOTION) if (t.indexOf(word) !== -1) motions.push(word);
      });
      animateOpen(target, motions, seconds);
    }
    else if (/\b(open|opens|appear|appears|show|shows)\b/.test(low)) {
      target.style.display = "";
    }
    else if (/\b(close|closes|disappear|disappears|hide|hides|gone)\b/.test(low)) {
      target.style.display = "none";
    }
  }

  // work out which thing a phrase means: a name, "it", or "the <kind>"
  function resolveThing(phrase, ctx) {
    var low = phrase.toLowerCase();

    // "it" means the last thing we named
    if (/\bit\b/.test(low) && !/\b(folder|button|text|box|row|column|image|link|blank)\b/.test(low)) {
      return ctx.last;
    }

    // a name spoken in full: "button 1", "folder 1"
    var byName = findTargetFromPhrase(low);
    if (byName) { ctx.last = registry[byName]; return ctx.last; }

    // "the folder" / "the button" -> the one thing of that kind
    var k = low.match(/\b(button|folder|text|box|row|column|image|link|blank)\b/);
    if (k) {
      var ofKind = Object.keys(registry).filter(function (n) { return n.split(" ")[0] === k[1]; });
      if (ofKind.length) { ctx.last = registry[ofKind[0]]; return ctx.last; }
    }

    return ctx.last;   // nothing matched — fall back to whatever "it" was
  }

  // match a spoken phrase like "button 1" to a registered name
  function findTargetFromPhrase(phrase) {
    var best = null;
    for (var name in registry) {
      if (phrase.indexOf(name.toLowerCase()) !== -1) {
        if (!best || name.length > best.length) best = name;
      }
    }
    return best;
  }

  function animateOpen(el, motions, seconds) {
    var duration = seconds || 0.4;

    // motion words stack. CSS can only ride one curve at a time, so we
    // blend honestly: a bounce wins the feel; otherwise the speed word leads.
    // (this is the parked ruling — conflicting motions get a sensible blend.)
    var timing = MOTION.steady;
    if (motions.indexOf("bounces") !== -1)         timing = MOTION.bounces;
    else if (motions.indexOf("speeds up") !== -1)  timing = MOTION["speeds up"];
    else if (motions.indexOf("slows down") !== -1) timing = MOTION["slows down"];

    el.style.display = "";
    el.style.animation = "none";
    void el.offsetWidth;                 // nudge the browser so it replays
    el.style.animation = "openAnim " + duration + "s " + timing + " both";
  }


  /* ----------------------------------------------------------
     THE RUN BUTTON
     ---------------------------------------------------------- */

  function render(sourceText, mount) {
    registry = {};

    // base look + the one animation, dropped in once
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.textContent =
        "html,body{margin:0;height:100%}" +
        "body{font-family:Inter,system-ui,-apple-system,sans-serif;overflow:hidden}" +
        ".thing{box-sizing:border-box}" +
        ".kind-button{border:none;border-radius:10px;cursor:pointer;font-family:inherit;font-weight:600;letter-spacing:.2px}" +
        ".kind-folder{padding:22px 26px;border-radius:14px;max-width:60vw;line-height:1.4;box-shadow:0 18px 50px rgba(0,0,0,.45)}" +
        ".kind-text{line-height:1.3;letter-spacing:-.01em}" +
        ".kind-blank{border:1px solid rgba(255,255,255,.28);border-radius:10px;padding:11px 15px;font-family:inherit;font-size:16px;background:rgba(255,255,255,.06);color:#f5f5f2;outline:none;min-width:240px}" +
        ".kind-blank::placeholder{color:rgba(245,245,242,.45)}" +
        "@keyframes openAnim{from{opacity:0;transform:var(--from)}to{opacity:1}}";
      document.head.appendChild(styleEl);
    }

    var tree = buildTree(sourceText);
    var behaviors = [];

    // the page is the biggest field — its bullets set the backdrop
    mount.style.position = "relative";
    mount.style.minHeight = "100vh";

    tree.children.forEach(function (node) {
      var head = node.text.toLowerCase();
      if (head === "page" || head.indexOf("page ") === 0) {
        node.children.forEach(function (c) { applyProp(mount, "page", c.text); });
      } else if (head.indexOf("when ") === 0) {
        behaviors.push(node);
      } else if (kindOf(node.text)) {
        makeThing(node, mount, "stage");   // top-level things sit on the page (a stage)
      }
    });

    // animated things need a starting offset so "open" feels like opening
    Object.keys(registry).forEach(function (name) {
      var el = registry[name];
      var tf = el.style.transform || "";
      el.style.setProperty("--from", tf + " translateY(14px) scale(.96)");
    });

    behaviors.forEach(wireWhen);
  }

  // hand the library to the page
  window.MyLanguage = { render: render };

})();
