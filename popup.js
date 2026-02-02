const DEFAULT_BINDS = {
  nextPost: "j",
  previousPost: "k",
  likePost: "l",
  bookmark: "o",
  follow: "p",
  nextImage: "i",
  previousImage: "u",
  mute: "m",
  profile: "y",
};

const LABELS = {
  nextPost: "Next post",
  previousPost: "Previous post",
  likePost: "Like",
  bookmark: "Save",
  follow: "Follow",
  nextImage: "Next image",
  previousImage: "Previous image",
  mute: "Toggle audio",
  profile: "Open profile",
};

const KEY_ORDER = [
  "nextPost",
  "previousPost",

  "nextImage",
  "previousImage",

  "likePost",
  "bookmark",
  "follow",

  "mute",
  "profile",
];

const visibilityToggle = document.getElementById("visibilityToggle");

chrome.storage.sync.get({ visibilityMode: "off" }, ({ visibilityMode }) => {
  updateVisibilityUI(visibilityMode);
});

function updateVisibilityUI(mode) {
  visibilityToggle.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

visibilityToggle.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const mode = btn.dataset.mode;

  chrome.storage.sync.set({ visibilityMode: mode });
  updateVisibilityUI(mode);
});

const resetBtn = document.getElementById("resetBtn");
let resetArmed = false;

const form = document.getElementById("keybinds");
const saveBtn = document.getElementById("saveBtn");

function render(binds) {
  form.innerHTML = "";

  KEY_ORDER.forEach((action) => {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
      <label>${LABELS[action]}</label>
      <input
        maxlength="1"
        value="${binds[action] || ""}"
        data-action="${action}"
      >
    `;

    form.appendChild(row);
  });
}

chrome.storage.sync.get(DEFAULT_BINDS, render);

saveBtn.onclick = () => {
  // collect values
  const newBinds = {};
  form.querySelectorAll("input").forEach((i) => {
    newBinds[i.dataset.action] = i.value.toLowerCase();
  });

  chrome.storage.sync.set(newBinds, () => {
    // Saved state
    saveBtn.textContent = "✓ Saved";
    saveBtn.className = "success";

    // Morph to refresh
    setTimeout(() => {
      saveBtn.textContent = "Refresh";
      saveBtn.className = "refresh";

      saveBtn.onclick = () => {
        chrome.tabs.query({ url: "*://www.instagram.com/*" }, (tabs) => {
          tabs.forEach((tab) => chrome.tabs.reload(tab.id));
          window.close();
        });
      };
    }, 1200);
  });
};

resetBtn.onclick = () => {
  // First press: arm reset
  if (!resetArmed) {
    resetArmed = true;
    resetBtn.textContent = "Press again to reset";
    resetBtn.classList.add("confirm");

    // auto-disarm after a moment
    setTimeout(() => {
      resetArmed = false;
      resetBtn.textContent = "Reset";
      resetBtn.classList.remove("confirm");
    }, 2500);

    return;
  }

  // Second press: actually reset
  resetArmed = false;
  resetBtn.textContent = "Reset";
  resetBtn.classList.remove("confirm");

  // Fade out
  form.classList.add("fade-out");

  setTimeout(() => {
    // Reset storage
    chrome.storage.sync.set(DEFAULT_BINDS, () => {
      // Re-render defaults
      render(DEFAULT_BINDS);

      // Fade back in
      form.classList.remove("fade-out");
      form.classList.add("fade-in");

      setTimeout(() => {
        form.classList.remove("fade-in");
      }, 200);
    });
  }, 180);
};
