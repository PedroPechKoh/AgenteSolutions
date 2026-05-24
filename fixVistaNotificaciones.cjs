const fs = require('fs');
let content = fs.readFileSync('src/components/Shared/VistaNotificaciones.jsx', 'utf8');
content = content.replace(
  "url = propId ? `/propiedad/${propId}/tablero` : '/propiedades';",
  "url = propId ? `/DetallePropiedad/${propId}` : '/propiedades';"
);
fs.writeFileSync('src/components/Shared/VistaNotificaciones.jsx', content);
