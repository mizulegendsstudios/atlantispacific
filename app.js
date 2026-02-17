// Configura esto con tu usuario de GitHub
const GITHUB_USER = 'mizulegendsstudios';
const REPO = 'atlantispacific';
const BRANCH = 'main';

// URL raw de tu db.json (lectura directa)
const DB_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO}/${BRANCH}/db.json`;

// Para escritura usaremos GitHub API (más adelante)
// Por ahora: solo lectura

async function cargarDatos(tabla) {
    try {
        const res = await fetch(DB_URL + '?t=' + Date.now()); // evita caché
        const db = await res.json();
        return db[tabla] || [];
    } catch (e) {
        console.error('Error cargando datos:', e);
        return [];
    }
}

function mostrarTab(tabla) {
    const cont = document.getElementById('contenido');
    cont.innerHTML = '<p>Cargando...</p>';
    
    cargarDatos(tabla).then(datos => {
        if (datos.length === 0) {
            cont.innerHTML = `<p>No hay datos en ${tabla}</p>`;
            return;
        }
        
        // Crear tabla HTML
        const columnas = Object.keys(datos[0]);
        let html = `<h2>${tabla.toUpperCase()}</h2><div class="grid">`;
        
        datos.forEach(item => {
            html += `<div class="card">`;
            for (let [key, val] of Object.entries(item)) {
                html += `<p><strong>${key}:</strong> ${val}</p>`;
            }
            html += `</div>`;
        });
        
        html += `</div>`;
        cont.innerHTML = html;
    });
}

// Cargar productos al iniciar
mostrarTab('productos');
