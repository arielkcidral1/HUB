// Dominio: regras de calculo de vale-transporte, nomes de mes e montagem do relatorio .xlsx. Sem acesso a DOM ou banco.

const VT_MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function formatVtMonth(value) {
  if (VT_MONTH_NAMES.includes(String(value || ""))) return String(value);
  const match = String(value || "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return "Não informado";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(date);
}

function calculateVtValue(diasUteis, valorPassagem, saldoAtual) {
  return Math.max(0, (Number(diasUteis) || 0) * (Number(valorPassagem) || 0) - (Number(saldoAtual) || 0));
}

function filterVtRegistros(registros, { nameFilter = "", monthFilter = "", unitFilter = "" } = {}) {
  const normalizedName = String(nameFilter || "").trim().toLowerCase();
  return (registros || []).filter((item) => {
    const itemName = String(item.colaborador || "").toLowerCase();
    const itemMonth = formatVtMonth(item.mes);
    if (normalizedName && !itemName.includes(normalizedName)) return false;
    if (monthFilter && itemMonth !== monthFilter) return false;
    if (unitFilter && item.unidade !== unitFilter) return false;
    return true;
  });
}

function buildVtReportRows(registros) {
  return (registros || []).map((item) => ({
    colaborador: item.colaborador || "Colaborador não informado",
    unidade: item.unidade || "Não informada",
    mes: formatVtMonth(item.mes),
    diasUteis: Number(item.diasUteis) || 0,
    valorPassagem: Number(item.valorPassagem) || 0,
    saldoAtual: Number(item.saldoAtual) || 0,
    valorNecessario: Number(item.valorNecessario) || 0,
    registradoEm: formatVtReportDateTime(item.createdAt || todayLabel()),
  }));
}

function buildVtReportWorksheet(rows) {
  const headers = ["Colaborador", "Unidade", "Màs", "Dias úteis", "Valor da passagem", "Saldo atual", "Valor necessário", "Registrado em"];
  const sheetRows = [
    worksheetRowXml(["Relatório de Vale Transporte"], 1, 2),
    worksheetRowXml([`Gerado em ${formatVtReportDateTime(new Date())}`], 2, 2),
    worksheetRowXml(headers, 5, 1),
    ...rows.map((item, index) => worksheetRowXml([
      item.colaborador,
      item.unidade,
      item.mes,
      item.diasUteis,
      item.valorPassagem,
      item.saldoAtual,
      item.valorNecessario,
      item.registradoEm,
    ], index + 6)),
  ];
  const lastRow = rows.length + 5;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:H${lastRow}"/>
  <cols>
    <col min="1" max="1" width="30" customWidth="1"/>
    <col min="2" max="3" width="18" customWidth="1"/>
    <col min="4" max="4" width="12" customWidth="1"/>
    <col min="5" max="7" width="18" customWidth="1"/>
    <col min="8" max="8" width="22" customWidth="1"/>
  </cols>
  <sheetData>${sheetRows.join("")}</sheetData>
  <mergeCells count="2"><mergeCell ref="A1:H1"/><mergeCell ref="A2:H2"/></mergeCells>
</worksheet>`;
}

function createVtReportXlsxBlob(rows) {
  const worksheet = buildVtReportWorksheet(rows);
  return createZipBlob([
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Registros VT" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF2F7D6D"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`,
    },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ]);
}
