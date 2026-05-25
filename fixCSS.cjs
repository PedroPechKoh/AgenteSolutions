const fs = require('fs');
const file = 'src/styles/Admin/VistaPropiedades.css';
let css = fs.readFileSync(file, 'utf8');

// Replace property-card styles
css = css.replace(
    /\.property-card {[\s\S]*?cursor: pointer;\r?\n}/,
    `.property-card {
    background-color: #ffffff;
    border-radius: 25px;
    overflow: hidden;
    position: relative;
    height: 250px;
    width: calc(25% - 15px);
    min-width: 260px;
    max-width: 320px;
    flex: 0 0 auto;
    /* Estilo Figma: Sombra sólida desplazada */
    box-shadow: 12px 12px 0px 0px #f26624, 0 4px 10px rgba(0,0,0,0.05);
    border: 1px solid #eaeaea; /* Sutil borde para separar del fondo claro */
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    margin-bottom: 15px; /* Margen extra para que la sombra no se corte con otras filas */
}`
);

// Replace property-card:hover
css = css.replace(
    /\.property-card:hover {[\s\S]*?rgba\(0,0,0,0\.3\);\r?\n}/,
    `.property-card:hover {
    transform: translate(-3px, -3px);
    box-shadow: 15px 15px 0px 0px #f26624, 0 10px 25px rgba(0,0,0,0.15);
}`
);

// Replace property-card:hover .property-image
css = css.replace(
    /\.property-card:hover \.property-image {[\s\S]*?brightness\(0\.7\);\r?\n}/,
    `.property-card:hover .property-image {
    /* Eliminamos el scale(1.1) para que no haya un rebote feo en el hover, solo oscurecemos */
    filter: blur(1px) brightness(0.5);
}`
);

// Check if background-color is set for .main-container-users
css = css.replace(
    /\.main-container-users {\s*background-color: #ffffff;/,
    `.main-container-users {\n    background-color: #F5F5F5; /* Color del Figma */`
);

fs.writeFileSync(file, css);
console.log("CSS actualizado exitosamente.");
