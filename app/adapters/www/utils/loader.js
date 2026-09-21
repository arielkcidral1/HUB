// Injeta o HTML de um modulo no ponto exato da tag <script data-src="...">.
// ponytail: XHR sincrono garante que o DOM exista antes do script.js; trocar por build/bundle se o numero de modulos crescer.
(function () {
  var tag = document.currentScript;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", tag.dataset.src, false);
  xhr.send();
  if (xhr.status >= 200 && xhr.status < 300) {
    tag.insertAdjacentHTML("afterend", xhr.responseText);
  } else {
    console.error("Falha ao carregar modulo:", tag.dataset.src, xhr.status);
  }
})();
