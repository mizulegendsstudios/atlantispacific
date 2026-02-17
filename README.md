 Aquí está todo documentado:

---

## README.md

```markdown
# 🌊 Atlantis Pacific

Sistema de autenticación y gestión de inventario 100% GitHub, sin Firebase ni servicios externos.

## Arquitectura

```
GitHub Repo
├── index.html          (página principal)
├── admin.html          (panel de administración)
├── registro.html       (solicitudes de acceso)
├── inventario.html     (gestión de stock)
├── tienda.html         (catálogo de productos)
├── auth.js             (librería de autenticación compartida)
├── datos.json          (usuarios aprobados)
├── productos.json      (base de datos de productos)
├── solicitudes.json    (pendientes de aprobación)
└── README.md           (este archivo)
```

## Flujo de usuarios

1. **Registro**: Usuario va a `registro.html` → solicita acceso → queda en `solicitudes.json` (localStorage temporal)
2. **Aprobación**: Admin entra a `admin.html` → ve solicitudes → aprueba y guarda en `datos.json`
3. **Acceso**: Usuario aprobado entra a `inventario.html` o `tienda.html` con sus credenciales
4. **Gestión**: Usuarios con permiso pueden leer/escribir productos

## Configuración inicial

### 1. Crear datos.json

```json
{
  "usuarios": [
    {
      "id": 1,
      "usuario": "tu_admin",
      "passwordHash": "tu_clave",
      "websAutorizadas": ["admin", "inventario", "tienda"],
      "fechaRegistro": "2024-01-01T00:00:00Z",
      "esAdmin": true
    }
  ]
}
```

### 2. Crear productos.json

```json
{
  "productos": []
}
```

### 3. Crear solicitudes.json

```json
{
  "pendientes": [],
  "rechazados": [],
  "historial": []
}
```

### 4. Obtener GitHub Token

- Settings → Developer settings → Personal access tokens → Tokens (classic)
- Marcar scope: `repo`
- Copiar token `ghp_xxxxxxxxxxxx`

### 5. Activar GitHub Pages

- Repo → Settings → Pages → Source: main branch → /(root)

## Permisos por web

| Web ID | Descripción | Quién accede |
|--------|-------------|--------------|
| `admin` | Panel de control | Solo admins |
| `inventario` | Gestión de stock | Admins + bodegueros |
| `tienda` | Catálogo de ventas | Admins + vendedores |
| `blog` | Editor de contenido | Admins + editores |

## Seguridad

- Token de GitHub solo se usa en `admin.html` (o backend propio)
- Contraseñas en `datos.json` pueden hashearse con SHA-256
- Todas las comunicaciones son HTTPS (GitHub)

## Limitaciones actuales

- Usuarios no-admin necesitan backend (Cloudflare Workers) para escribir productos
- O usar token compartido (menos seguro)

## Próximos pasos

- [ ] Implementar Cloudflare Workers para escritura segura
- [ ] Agregar hash SHA-256 a contraseñas
- [ ] Sistema de roles más granular
- [ ] Backup automático de datos
```

---

## PROMPT para recrear el proyecto

```
Crea un sistema de autenticación y gestión de datos usando solo GitHub (sin Firebase, Supabase ni servicios externos).

REQUISITOS TÉCNICOS:
- Frontend: HTML + CSS + JavaScript vanilla (cero frameworks)
- Backend: GitHub API directa o serverless propio
- Base de datos: Archivos JSON en el mismo repo de GitHub
- Hosting: GitHub Pages (frontend) + GitHub API (datos)

ESTRUCTURA DE ARCHIVOS:
1. auth.js - Librería compartida con:
   - login(usuario, password, webId): Verifica contra datos.json
   - cargarDB(): Lee datos.json desde raw.githubusercontent.com
   - guardarEnGitHub(filename, contenido, mensaje): PUT a GitHub API con token
   - cargarProductos() / guardarProductos(): CRUD de productos

2. datos.json - Estructura:
   { "usuarios": [{ id, usuario, passwordHash, websAutorizadas[], esAdmin }] }

3. admin.html - Panel de administración con:
   - Login con token de GitHub
   - Ver solicitudes de registro pendientes (localStorage)
   - Aprobar/rechazar solicitudes (escribe en datos.json)
   - Crear usuarios directamente
   - Ver JSON de datos

4. registro.html - Formulario público para solicitar acceso:
   - Campos: usuario, password, email, web solicitada
   - Guarda en localStorage temporal (espera aprobación admin)

5. inventario.html - Gestión de productos:
   - Login de usuarios aprobados
   - Tabla de productos editable (agregar, editar, borrar)
   - Formulario para nuevos productos (nombre, precio, stock, categoría)
   - Guarda cambios en productos.json

6. tienda.html - Catálogo de ventas:
   - Login de vendedores
   - Grid de productos con precios
   - Carrito de compras (solo frontend)

FLUJO DE DATOS:
- Lectura: fetch a raw.githubusercontent.com (público, caché-busting con ?t=Date.now())
- Escritura: GitHub API con token personal (requiere autenticación)

SEGURIDAD:
- Token de GitHub solo en admin.html (localStorage)
- Usuarios normales necesitan backend serverless para escritura
- Contraseñas en texto plano o SHA-256 simple

ESTILOS:
- Tema oscuro: fondo #0f172a, acentos #38bdf8, #0ea5e9
- Diseño responsive, system-ui font
- Tarjetas con border-left de color según estado

ENTREGA:
- Código completo de cada archivo listo para copy-paste
- Instrucciones de configuración paso a paso
- Notas de seguridad y limitaciones
```

---

## ¿Cloudflare Workers ahora?

Para que SuiRyu pueda guardar productos **sin tener el token**, necesitamos un endpoint intermedio:

```
SuiRyu (navegador) → Cloudflare Worker → GitHub API → productos.json
```

El Worker tiene el token **secreto** (no visible en frontend), valida que el usuario tenga permiso, y guarda.

**¿Te preparo el código del Worker?** Es gratis, 100k requests/día, y el código es tuyo.
