(() => {
  "use strict";

  const TARGET_SELECTOR =
    "div.x1qjc9v5.x78zum5.x1q0g3np.xl56j7k.xh8yej3 > div.x1dr59a3.x13vifvy.x7vhb2i.x6bx242";

  let observer = null;

  function getTarget() {
    return document.querySelector(TARGET_SELECTOR);
  }

  function hideTarget() {
    const target = getTarget();
    if (!target) return;

    target.style.setProperty("display", "none", "important");
  }

  function showTarget() {
    const target = getTarget();
    if (!target) return;

    target.style.removeProperty("display");
  }

  function applyMode(mode) {
    const target = getTarget();
    if (!target) return;

    if (mode === "Shown") {
      showTarget();
      return;
    }

    if (mode === "Hidden") {
      hideTarget();
      return;
    }
  }
  if (!chrome?.storage?.sync) {
    function watch() {
      if (observer) observer.disconnect();

      observer = new MutationObserver(() => {
        chrome.storage.sync.get(
          { visibilityMode: "Shown" },
          ({ visibilityMode }) => {
            applyMode(visibilityMode);
          },
        );
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  chrome.storage.sync.get({ visibilityMode: "Shown" }, ({ visibilityMode }) => {
    applyMode(visibilityMode);
    watch();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.visibilityMode) {
      applyMode(changes.visibilityMode.newValue);
    }
  });
})();
