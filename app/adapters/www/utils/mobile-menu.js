// UI: abrir/fechar o menu lateral em telas mobile.

function closeMobileMenu() {
  const shell = document.getElementById("app-shell");
  const toggle = document.getElementById("mobile-menu-toggle");
  document.querySelector(".mobile-menu-backdrop")?.remove();
  shell?.classList.remove("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "false");
}

function openMobileMenu() {
  const shell = document.getElementById("app-shell");
  const toggle = document.getElementById("mobile-menu-toggle");
  if (!shell || shell.classList.contains("mobile-menu-open")) return;
  const backdrop = document.createElement("button");
  backdrop.type = "button";
  backdrop.className = "mobile-menu-backdrop";
  backdrop.setAttribute("aria-label", "Fechar menu");
  backdrop.addEventListener("click", closeMobileMenu);
  document.body.appendChild(backdrop);
  shell.classList.add("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "true");
}

function toggleMobileMenu() {
  const shell = document.getElementById("app-shell");
  if (shell?.classList.contains("mobile-menu-open")) closeMobileMenu();
  else openMobileMenu();
}
