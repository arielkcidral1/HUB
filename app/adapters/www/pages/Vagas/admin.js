// Compatibilidade com cache antigo: este arquivo nao faz mais nada alem de
// espelhar o campo legado no campo atual. A renderizacao e os filtros reais ficam em script.js
// (vaga-filter-candidato -> vaga-filter-nome).
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
