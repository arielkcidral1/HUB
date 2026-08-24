(function () {
  function bind() {
    const legacyName = document.getElementById("vaga-filter-candidato");
    const currentName = document.getElementById("vaga-filter-nome");
    if (legacyName && currentName && !legacyName.dataset.vagasCompatReady) {
      legacyName.dataset.vagasCompatReady = "true";
      legacyName.addEventListener("input", () => {
        currentName.value = legacyName.value;
        currentName.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }

  document.addEventListener("DOMContentLoaded", bind);
  window.addEventListener("load", bind);
})();
