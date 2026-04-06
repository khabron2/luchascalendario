/**
 * GOOGLE APPS SCRIPT - Lucha Libre Calendar Backend
 * 
 * Instrucciones:
 * 1. Abre tu Google Sheet.
 * 2. Crea dos hojas: "Eventos" y "Show".
 * 3. En "Show": Columna A (Nombre del Show/Tipo), Columna B (URL del Logo).
 * 4. En "Eventos": Columna A (ID), B (Fecha), C (Nombre), D (Empresa), E (Tipo), F (Video URL), G (Descripción), H (Img).
 * 5. Ve a Extensiones > Apps Script y pega este código.
 * 6. Implementar > Nueva implementación > Aplicación web (Acceso: Cualquier persona).
 */

const SPREADSHEET_ID = "TU_ID_DE_HOJA_AQUI"; // Opcional si usas SpreadsheetApp.getActiveSpreadsheet()

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Eventos");
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const events = data.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header.toLowerCase()] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(events))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const eventosSheet = ss.getSheetByName("Eventos");
  const showSheet = ss.getSheetByName("Show");
  
  const params = JSON.parse(e.postData.contents);
  
  // 1. Buscar el logo en la hoja "Show"
  const showData = showSheet.getDataRange().getValues();
  let logoUrl = ""; // Default
  
  for (let i = 1; i < showData.length; i++) {
    if (showData[i][0].toString().toLowerCase() === params.tipo.toLowerCase()) {
      logoUrl = showData[i][1]; // Columna B
      break;
    }
  }
  
  // Si no se encuentra, usar un genérico (opcional)
  if (!logoUrl) {
    logoUrl = "https://i.imgur.com/ppv.jpg"; 
  }

  // 2. Guardar el nuevo evento
  const newId = eventosSheet.getLastRow();
  const newRow = [
    newId,
    params.fecha,
    params.nombre,
    params.empresa,
    params.tipo,
    params.video_url,
    params.descripcion,
    logoUrl
  ];
  
  eventosSheet.appendRow(newRow);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", img: logoUrl }))
    .setMimeType(ContentService.MimeType.JSON);
}
