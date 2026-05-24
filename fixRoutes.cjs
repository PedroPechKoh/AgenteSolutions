const fs = require('fs');

// Fix VistaNotificaciones.jsx
let content1 = fs.readFileSync('src/components/Shared/VistaNotificaciones.jsx', 'utf8');
content1 = content1.replace(
  /url = propId \? `\/DetallePropiedad\/\$\{propId\}` : '\/propiedades';/g,
  "url = propId ? `/propiedad/${propId}/tablero` : '/propiedades';"
);
fs.writeFileSync('src/components/Shared/VistaNotificaciones.jsx', content1);

// Fix NotificationBell.jsx
let content2 = fs.readFileSync('src/components/Shared/NotificationBell.jsx', 'utf8');
content2 = content2.replace(
  /url = `\/DetallePropiedad\/\$\{notification\.data\.property_id\}`;/g,
  "const propId = notification.data.property_id; url = propId ? `/propiedad/${propId}/tablero` : '/propiedades';"
);
fs.writeFileSync('src/components/Shared/NotificationBell.jsx', content2);
