// Casos de uso: editar, excluir e gerar o documento .doc de um registro de RH.

function editarDocumento(id) {
  const doc = getAccessibleDocumentRecord(id);
  if (!doc) {
    showModal("Acesso restrito", "Voce so pode acessar documentos gerados pelo seu usuario.", "error");
    return;
  }

  window.editingDocId = id;

  document.querySelectorAll("#documentos .doc-tab").forEach((item) => item.classList.remove("active"));
  document.querySelectorAll("#documentos .doc-view").forEach((view) => view.classList.remove("active"));

  const tabButton = document.querySelector(`#documentos .doc-tab[data-doc="${doc.type}"]`);
  if (tabButton) tabButton.classList.add("active");

  const viewElement = document.getElementById(`doc-${doc.type}`);
  if (viewElement) viewElement.classList.add("active");

  const form = document.querySelector(`form[data-doc-form="${doc.type}"]`);
  if (form && doc.formData) {
    Object.entries(doc.formData).forEach(([key, value]) => {
      if (form.elements[key]) setFieldValue(form.elements[key], value);
    });
    normalizeDocumentDateInputs(form);
    const btn = form.querySelector("button[type='submit']");
    if (btn) {
      if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
      btn.textContent = "Salvar alterações";
    }
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function excluirDocumento(id) {
  const doc = getAccessibleDocumentRecord(id);
  if (!doc) {
    showModal("Acesso restrito", "Voce so pode excluir documentos gerados pelo seu usuario.", "error");
    return;
  }
  showPasswordActionModal({
    title: "Excluir registro",
    text: `Confirme a senha de autorizacao para excluir o registro "${documentLabels[doc.type] || doc.type}" de ${doc.summary || "colaborador nao informado"}.`,
    confirmText: "Excluir",
    danger: true,
    validatePassword: async (password) => verifyAuthorizationPassword(password),
    onConfirm: async () => {
      await deleteItem("documentos", id);
    },
  });
}

function baixarDocumentoRH(id) {
  const doc = getAccessibleDocumentRecord(id);
  if (!doc) {
    showModal("Acesso restrito", "Voce so pode gerar documentos criados pelo seu usuario.", "error");
    return;
  }
  const title = documentLabels[doc.type] || doc.type;
  downloadStyledRhDocument(doc, title);
}
