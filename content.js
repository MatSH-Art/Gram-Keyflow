(() => {
  "use strict";

  /* ----------------------- helpers ----------------------- */

  function log(...args) {
    console.log("[IG KB]", ...args);
  }

  function warn(...args) {
    console.warn("[IG KB]", ...args);
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getArticles() {
    return Array.from(document.querySelectorAll("article"));
  }

  function getCurrentArticle() {
    const viewportCenter = window.innerHeight / 2;
    return getArticles().find((article) => {
      const rect = article.getBoundingClientRect();
      return rect.top < viewportCenter && rect.bottom > viewportCenter;
    });
  }
  let KEYBINDS = {};

  chrome.storage.sync.get(
    {
      nextPost: "j",
      previousPost: "k",
      likePost: "l",
      bookmark: "o",
      follow: "p",
      nextImage: "i",
      previousImage: "u",
      mute: "m",
      profile: "y",
    },
    (binds) => {
      KEYBINDS = binds;
    },
  );
  /* ----------------------- Visible ----------------------- */

  function isVisibleArticle(article) {
    if (!article) return false;

    const rect = article.getBoundingClientRect();
    if (rect.height < 200 || rect.width < 200) return false;

    const style = window.getComputedStyle(article);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    )
      return false;

    if (article.querySelector('[data-stndz-hidden-1="true"]')) return false;
    if (!article.querySelector("img, video")) return false;

    return true;
  }

  /* ----------------------- actions ----------------------- */

  async function nextPost() {
    const viewportCenter = window.innerHeight / 2;
    const articles = () =>
      Array.from(document.querySelectorAll("article")).filter(isVisibleArticle);

    const current = articles()
      .map((a) => {
        const r = a.getBoundingClientRect();
        return { a, center: r.top + r.height / 2 };
      })
      .sort(
        (x, y) =>
          Math.abs(x.center - viewportCenter) -
          Math.abs(y.center - viewportCenter),
      )[0];

    if (!current) return;

    let next = articles()
      .map((a) => {
        const r = a.getBoundingClientRect();
        return { a, center: r.top + r.height / 2 };
      })
      .filter((x) => x.center > current.center + 10)
      .sort((a, b) => a.center - b.center)[0];

    if (!next) {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
      await sleep(600);

      next = articles()
        .map((a) => {
          const r = a.getBoundingClientRect();
          return { a, center: r.top + r.height / 2 };
        })
        .filter((x) => x.center > current.center + 10)
        .sort((a, b) => a.center - b.center)[0];
    }

    next?.a.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function previousPost() {
    const viewportCenter = window.innerHeight / 2;
    const articles = () =>
      Array.from(document.querySelectorAll("article")).filter(isVisibleArticle);

    const current = articles()
      .map((a) => {
        const r = a.getBoundingClientRect();
        return { a, center: r.top + r.height / 2 };
      })
      .sort(
        (x, y) =>
          Math.abs(x.center - viewportCenter) -
          Math.abs(y.center - viewportCenter),
      )[0];

    if (!current) return;

    const prev = articles()
      .map((a) => {
        const r = a.getBoundingClientRect();
        return { a, center: r.top + r.height / 2 };
      })
      .filter((x) => x.center < current.center - 10)
      .sort((a, b) => b.center - a.center)[0];

    prev?.a.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function likePost() {
    const post = getCurrentArticle();
    if (!post) return;

    const button = Array.from(post.querySelectorAll('div[role="button"]')).find(
      (btn) =>
        btn.querySelector('svg[aria-label="Like"], svg[aria-label="Unlike"]'),
    );

    button ? button.click() : warn("Like button not found");
  }

  function toggleBookmark() {
    const post = getCurrentArticle();
    if (!post) return;

    post
      .querySelector('svg[aria-label="Save"]')
      ?.closest('div[role="button"]')
      ?.click();
    post
      .querySelector('svg[aria-label="Remove"]')
      ?.closest('div[role="button"]')
      ?.click();
  }

  function nextImage() {
    getCurrentArticle()?.querySelector('button[aria-label="Next"]')?.click();
  }

  function previousImage() {
    getCurrentArticle()?.querySelector('button[aria-label="Go back"]')?.click();
  }

  function toggleAudio() {
    getCurrentArticle()
      ?.querySelector('button[aria-label="Toggle audio"]')
      ?.click();
  }
  function followToggle() {
    const getArticles = () => Array.from(document.querySelectorAll("article"));
    const viewportCenter = window.innerHeight / 2;

    const current = getArticles()
      .map((article) => {
        const rect = article.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        return { article, center };
      })
      .sort(
        (a, b) =>
          Math.abs(a.center - viewportCenter) -
          Math.abs(b.center - viewportCenter),
      )[0];

    if (!current) return;

    const button = Array.from(
      current.article.querySelectorAll('div[role="button"]'),
    ).find((el) => {
      const text = el.textContent.trim();
      return text === "Follow" || text === "Following" || text === "Unfollow";
    });

    if (button) {
      button.click();
    } else {
      console.warn("Follow button not found in current post");
    }
  }

  function openPostProfile() {
    const viewportCenter = window.innerHeight / 2;

    const current = getArticles()
      .map((a) => {
        const r = a.getBoundingClientRect();
        return { a, center: r.top + r.height / 2 };
      })
      .sort(
        (x, y) =>
          Math.abs(x.center - viewportCenter) -
          Math.abs(y.center - viewportCenter),
      )[0];

    if (!current) return;

    const link = Array.from(
      current.a.querySelectorAll('a[role="link"][href^="/"]'),
    ).find(
      (a) =>
        !a.href.includes("/p/") &&
        !a.href.includes("/reel/") &&
        !a.href.includes("/explore/"),
    );

    if (link) window.location.href = link.href.split("?")[0];
  }

  /* ----------------------- keybinds ----------------------- */

  document.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

    const k = e.key.toLowerCase();

    if (k === KEYBINDS.nextPost) nextPost();
    else if (k === KEYBINDS.previousPost) previousPost();
    else if (k === KEYBINDS.likePost) likePost();
    else if (k === KEYBINDS.bookmark) toggleBookmark();
    else if (k === KEYBINDS.follow) followToggle();
    else if (k === KEYBINDS.nextImage) nextImage();
    else if (k === KEYBINDS.previousImage) previousImage();
    else if (k === KEYBINDS.mute) toggleAudio();
    else if (k === KEYBINDS.profile) openPostProfile();
  });

  log("Instagram keyboard controls loaded");
})();
