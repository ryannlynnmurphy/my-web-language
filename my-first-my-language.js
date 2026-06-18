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
  const KINDS = ["page", "box", "row", "column", "button", "folder", "text", "image", "link"];


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
    node.children.forEach(function (child) {
      if (child.text.charAt(0) === "-") {
        applyProp(el, kind, child.text);
        var maybe = readPosition(child.text);
        if (maybe) pos = maybe;
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
    return el;
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
      el.textContent = quoted(p);
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

  // find which registered thing this action line is talking about
  function findTarget(line) {
    var best = null;
    for (var name in registry) {
      if (line.toLowerCase().indexOf(name.toLowerCase()) === 0) {
        if (!best || name.length > best.length) best = name;
      }
    }
    return best;
  }

  function wireBehavior(node) {
    // "when the user clicks button 1"  ->  trigger is "button 1"
    var m = node.text.toLowerCase().match(/clicks?\s+(.+)$/);
    if (!m) return;
    var triggerName = findTargetFromPhrase(m[1]);
    var trigger = registry[triggerName];
    if (!trigger) return;

    var actions = node.children.filter(function (c) { return c.text.charAt(0) === "-"; });

    trigger.addEventListener("click", function () {
      actions.forEach(function (action) { runAction(action); });
    });
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

  function runAction(action) {
    var line = action.text.replace(/^-\s*/, "");
    var targetName = findTarget(line);
    var target = registry[targetName];
    if (!target) return;

    var verb = line.slice(targetName.length).toLowerCase();

    if (verb.indexOf("animate") !== -1) {
      // gather the motion bullets sitting under this action
      var motions = [];
      var seconds = null;
      action.children.forEach(function (sub) {
        var t = sub.text.replace(/^-\s*/, "").toLowerCase();
        if (t.indexOf("takes") === 0) seconds = numberIn(t);
        for (var word in MOTION) if (t.indexOf(word) !== -1) motions.push(word);
      });
      animateOpen(target, motions, seconds);
    }
    else if (verb.indexOf("appear") !== -1 || verb.indexOf("open") !== -1) {
      target.style.display = "";
    }
    else if (verb.indexOf("disappear") !== -1 || verb.indexOf("close") !== -1 || verb.indexOf("hide") !== -1) {
      target.style.display = "none";
    }
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

    behaviors.forEach(wireBehavior);
  }

  // hand the library to the page
  window.MyLanguage = { render: render };

})();
