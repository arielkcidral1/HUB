// Dominio: regras de negocio de advertencias e suspensoes (limites de anexo, modelo de documento, relatorio). Sem acesso a DOM ou banco.

const DISCIPLINARY_ATTACHMENT_MAX_SIZE_BYTES = 3 * 1024 * 1024;

const DISCIPLINARY_ATTACHMENT_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function getDisciplinaryTypeLabel(type) {
  return String(type || "").toLowerCase() === "suspensao" ? "Suspensao" : "Advertencia";
}

function buildDisciplinaryReportWorksheet(rows) {
  const headers = ["Tipo", "Funcionario", "Unidade", "Data", "Local", "Motivo", "Registrado em", "Registrado por"];
  const sheetRows = [
    worksheetRowXml(["Relatorio de Advertencias e Suspensoes"], 1, 2),
    worksheetRowXml([`Gerado em ${formatVtReportDateTime(new Date())}`], 2, 2),
    worksheetRowXml(headers, 5, 1),
    ...rows.map((item, index) => worksheetRowXml([
      item.tipo,
      item.colaborador,
      item.unidade,
      item.dataMedida,
      item.local,
      item.motivo,
      item.registradoEm,
      item.registradoPor,
    ], index + 6)),
  ];
  const lastRow = rows.length + 5;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:H${lastRow}"/>
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="3" width="26" customWidth="1"/>
    <col min="4" max="5" width="18" customWidth="1"/>
    <col min="6" max="6" width="44" customWidth="1"/>
    <col min="7" max="8" width="22" customWidth="1"/>
  </cols>
  <sheetData>${sheetRows.join("")}</sheetData>
  <mergeCells count="2"><mergeCell ref="A1:H1"/><mergeCell ref="A2:H2"/></mergeCells>
</worksheet>`;
}

function createDisciplinaryReportXlsxBlob(rows) {
  const worksheet = buildDisciplinaryReportWorksheet(rows);
  return createZipBlob([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Medidas" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "xl/styles.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2F7D6D"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ]);
}

function readZipEntries(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocdOffset = -1;
  for (let index = bytes.length - 22; index >= 0; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("Modelo de documento invalido.");

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let centralOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder();
  const entries = [];
  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(centralOffset, true) !== 0x02014b50) throw new Error("Modelo de documento invalido.");
    const method = view.getUint16(centralOffset + 10, true);
    const compressedSize = view.getUint32(centralOffset + 20, true);
    const nameLength = view.getUint16(centralOffset + 28, true);
    const extraLength = view.getUint16(centralOffset + 30, true);
    const commentLength = view.getUint16(centralOffset + 32, true);
    const localHeaderOffset = view.getUint32(centralOffset + 42, true);
    const name = decoder.decode(bytes.subarray(centralOffset + 46, centralOffset + 46 + nameLength));
    entries.push({ name, method, compressedSize, localHeaderOffset });
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }

  return entries.map((entry) => {
    const localNameLength = view.getUint16(entry.localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(entry.localHeaderOffset + 28, true);
    const dataStart = entry.localHeaderOffset + 30 + localNameLength + localExtraLength;
    return {
      name: entry.name,
      method: entry.method,
      bytes: bytes.slice(dataStart, dataStart + entry.compressedSize),
    };
  });
}

async function inflateZipEntry(entry) {
  if (entry.method === 0) return entry.bytes;
  if (entry.method !== 8) throw new Error(`Metodo de compactacao do modelo nao suportado (${entry.method}).`);
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Atualize o navegador (Chrome, Edge ou Firefox recentes) para gerar este documento.");
  }
  const stream = new Blob([entry.bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function escapeDocumentXmlText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const DISCIPLINARY_TEMPLATE_FILES = [
  "01_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0001_17.docx",
  "02_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0003_89.docx",
  "03_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0004_60.docx",
  "04_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0011_99.docx",
  "05_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0013_50.docx",
  "06_Advertencia_DPA_COMERCIO_DE_PNEUS_LTDA_CNPJ_10_432_113_0001_10.docx",
  "07_Advertencia_DPA_COMERCIO_DE_PNEUS_LTDA_CNPJ_10_432_113_0002_09.docx",
  "08_Advertencia_JPL_COMERCIO_DE_AUTOPECAS_LTDA_BESTEN_CNPJ_05_218_575_0001_07.docx",
  "09_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0005_40.docx",
  "10_Advertencia_GCS_COMERCIO_DE_PNEUS_LTDA_ACHEI_CNPJ_05_326_792_0001_02.docx",
  "11_Advertencia_GCS_COMERCIO_DE_PNEUS_LTDA_ACHEI_CNPJ_05_326_792_0007_06.docx",
  "12_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0009_74.docx",
  "13_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0008_93.docx",
  "14_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0007_02.docx",
  "15_Advertencia_FAC_CNPJ_31_708_683_0001_58.docx",
  "16_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0012_70.docx",
  "17_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0014_31.docx",
  "18_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0015_12.docx",
  "19_Advertencia_TRINCA_CNPJ_56_067_067_0001_06.docx",
  "20_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0016_01.docx",
  "21_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0019_46.docx",
  "22_Advertencia_FREDI_PNEUS_LTDA_CNPJ_80_934_631_0017_84.docx",
];

function getDisciplinaryTemplateFile(unidade) {
  const index = UNIT_OPTIONS.indexOf(getCanonicalUnit(unidade));
  return index >= 0 ? DISCIPLINARY_TEMPLATE_FILES[index] : null;
}

function buildMotivoRunsXml(motivo) {
  const lines = String(motivo || "").split(/\r\n|\r|\n/).map((line) => escapeDocumentXmlText(line));
  return lines
    .map((line) => `<w:t xml:space="preserve">${line}</w:t>`)
    .join("<w:br/></w:r><w:r>");
}

function buildDisciplinaryDocumentXml(xml, record) {
  const isSuspensao = String(record.tipo || "").toLowerCase() === "suspensao";
  const nome = escapeDocumentXmlText(record.colaborador);
  const motivoRuns = buildMotivoRunsXml(record.motivo);
  const local = escapeDocumentXmlText(record.local);
  const [year, month, day] = String(record.dataMedida || "").split("-");
  const dia = day ? String(Number(day)) : "____";
  const mesExtenso = month ? (VT_MONTH_NAMES[Number(month) - 1] || "").toLowerCase() : "__________";
  const ano = year || "______";

  const motivoBlankLines = /MOTIVO: <\/w:t><\/w:r><w:r><w:t>_+<\/w:t><w:br\/><\/w:r><w:r><w:t>_+<\/w:t><w:br\/><\/w:r><w:r><w:t>_+<\/w:t><\/w:r>/;
  let filled = xml
    .replace(/NOME DO EMPREGADO: _+/, `NOME DO EMPREGADO: ${nome}`)
    .replace(motivoBlankLines, `MOTIVO: </w:t></w:r><w:r>${motivoRuns}</w:r>`)
    .replace(/MOTIVO: <\/w:t><\/w:r><w:r><w:t>_+/, `MOTIVO: </w:t></w:r><w:r>${motivoRuns}`)
    .replace(/Local e data: _+, _+ de _+ de _+\./, `Local e data: ${local}, ${dia} de ${mesExtenso} de ${ano}.`);

  if (isSuspensao) {
    const dias = escapeDocumentXmlText(String(record.diasSuspensao || "").replace(/\D/g, "") || "___");
    filled = filled
      .replace(/AVISO DE ADVERT[ÊE]NCIA AO EMPREGADO/, "AVISO DE SUSPENSÃO AO EMPREGADO")
      .replace(/identificado\(a\) ADVERTIDO\(A\) pelo/, `identificado(a) SUSPENSO(A) POR ${dias} DIA(S) pelo`);
  }

  return filled;
}
