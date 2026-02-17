const AUTH = {
    // URLs de tus archivos en GitHub
    DB_URL: 'https://raw.githubusercontent.com/mizulegendsstudios/atlantispacific/main/datos.json',
    SOLICITUDES_URL: 'https://raw.githubusercontent.com/mizulegendsstudios/atlantispacific/main/solicitudes.json',
    
    // Token para escritura (SOLO en admin.html, no en registro.html)
    TOKEN: localStorage.getItem('admin_token') || '',
    
    sesion: null,
    
    // ========== LECTURA ==========
    async cargarDB() {
        const res = await fetch(this.DB_URL + '?t=' + Date.now());
        return await res.json();
    },
    
    async cargarSolicitudes() {
        const res = await fetch(this.SOLICITUDES_URL + '?t=' + Date.now());
        return await res.json();
    },
    
    // ========== LOGIN ==========
    async login(usuario, password, webId) {
        const db = await this.cargarDB();
        const user = db.usuarios.find(u => u.usuario === usuario);
        
        if (!user) return { ok: false, error: 'Usuario no existe' };
        if (user.passwordHash !== password) return { ok: false, error: 'Contraseña incorrecta' };
        if (!user.websAutorizadas.includes(webId)) return { ok: false, error: 'No autorizado para esta web' };
        
        this.sesion = {
            usuario: user.usuario,
            web: webId,
            inicio: Date.now(),
            esAdmin: user.esAdmin || false
        };
        
        localStorage.setItem('auth_sesion_' + webId, JSON.stringify(this.sesion));
        return { ok: true, usuario: user };
    },
    
    verificarSesion(webId) {
        const guardada = localStorage.getItem('auth_sesion_' + webId);
        if (!guardada) return null;
        this.sesion = JSON.parse(guardada);
        return this.sesion;
    },
    
    logout(webId) {
        localStorage.removeItem('auth_sesion_' + webId);
        this.sesion = null;
    },
    
    // ========== SOLICITUDES (para registro.html) ==========
    async enviarSolicitud(usuario, password, webSolicitada, email = '') {
        // Verificar que no exista en usuarios
        const db = await this.cargarDB();
        if (db.usuarios.find(u => u.usuario === usuario)) {
            return { ok: false, error: 'Usuario ya existe' };
        }
        
        // Verificar que no haya solicitud pendiente
        const solicitudes = await this.cargarSolicitudes();
        if (solicitudes.pendientes.find(s => s.usuario === usuario)) {
            return { ok: false, error: 'Ya tienes una solicitud pendiente' };
        }
        
        // Crear solicitud
        const nueva = {
            id: Date.now(),
            usuario: usuario,
            passwordHash: password,
            webSolicitada: webSolicitada,
            email: email,
            fechaSolicitud: new Date().toISOString(),
            estado: 'pendiente'
        };
        
        // Guardar en localStorage temporal (esperando aprobación)
        const pendientes = JSON.parse(localStorage.getItem('solicitudes_temp') || '[]');
        pendientes.push(nueva);
        localStorage.setItem('solicitudes_temp', JSON.stringify(pendientes));
        
        return { 
            ok: true, 
            mensaje: 'Solicitud enviada. El admin la revisará pronto.',
            datos: nueva
        };
    },
    
    // ========== ADMIN: Obtener solicitudes pendientes ==========
    obtenerSolicitudesLocales() {
        return JSON.parse(localStorage.getItem('solicitudes_temp') || '[]');
    },
    
    limpiarSolicitudesLocales() {
        localStorage.removeItem('solicitudes_temp');
    },
    
    // ========== ADMIN: Guardar en GitHub (requiere token) ==========
    async guardarEnGitHub(filename, contenido, mensajeCommit) {
        if (!this.TOKEN) {
            return { ok: false, error: 'No hay token de admin configurado' };
        }
        
        const path = filename;
        const url = `https://api.github.com/repos/mizulegendsstudios/atlantispacific/contents/${path}`;
        
        // Obtener SHA si existe
        let sha = null;
        try {
            const check = await fetch(url + '?ref=main', {
                headers: { 'Authorization': `token ${this.TOKEN}` }
            });
            if (check.ok) {
                const data = await check.json();
                sha = data.sha;
            }
        } catch(e) {}
        
        // Preparar contenido
        const body = {
            message: mensajeCommit,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(contenido, null, 2)))),
            branch: 'main'
        };
        if (sha) body.sha = sha;
        
        // Enviar
        const res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (res.ok) {
            return { ok: true };
        } else {
            const err = await res.json();
            return { ok: false, error: err.message };
        }
    }
};
