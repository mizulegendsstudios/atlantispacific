const AUTH = {
    // URLs
    DB_URL: 'https://raw.githubusercontent.com/mizulegendsstudios/atlantispacific/main/datos.json',
    SOLICITUDES_URL: 'https://raw.githubusercontent.com/mizulegendsstudios/atlantispacific/main/solicitudes.json',
    CLOUDFLARE_URL: 'https://atlantis-pacific-api.mizulegendsstudios.workers.dev', 
    
    // Token para admin (GitHub directo)
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
        localStorage.removeItem('inv_usuario');
        localStorage.removeItem('inv_password');
        this.sesion = null;
    },
    
    // ========== SOLICITUDES ==========
    async enviarSolicitud(usuario, password, webSolicitada, email = '') {
        const db = await this.cargarDB();
        if (db.usuarios.find(u => u.usuario === usuario)) {
            return { ok: false, error: 'Usuario ya existe' };
        }
        
        const solicitudes = await this.cargarSolicitudes();
        if (solicitudes.pendientes?.find(s => s.usuario === usuario)) {
            return { ok: false, error: 'Ya tienes una solicitud pendiente' };
        }
        
        const nueva = {
            id: Date.now(),
            usuario: usuario,
            passwordHash: password,
            webSolicitada: webSolicitada,
            email: email,
            fechaSolicitud: new Date().toISOString(),
            estado: 'pendiente'
        };
        
        const pendientes = JSON.parse(localStorage.getItem('solicitudes_temp') || '[]');
        pendientes.push(nueva);
        localStorage.setItem('solicitudes_temp', JSON.stringify(pendientes));
        
        return { 
            ok: true, 
            mensaje: 'Solicitud enviada. El admin la revisará pronto.',
            datos: nueva
        };
    },
    
    obtenerSolicitudesLocales() {
        return JSON.parse(localStorage.getItem('solicitudes_temp') || '[]');
    },
    
    limpiarSolicitudesLocales() {
        localStorage.removeItem('solicitudes_temp');
    },
    
    // ========== ADMIN: GitHub directo ==========
    async guardarEnGitHub(filename, contenido, mensajeCommit) {
        if (!this.TOKEN) {
            return { ok: false, error: 'No hay token de admin configurado' };
        }
        
        const path = filename;
        const url = `https://api.github.com/repos/mizulegendsstudios/atlantispacific/contents/${path}`;
        
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
        
        const body = {
            message: mensajeCommit,
            content: btoa(unescape(encodeURIComponent(JSON.stringify(contenido, null, 2)))),
            branch: 'main'
        };
        if (sha) body.sha = sha;
        
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
    },
    
    // ========== CLOUDFLARE API (usuarios normales) ==========
    async cargarProductosCloud() {
        const res = await fetch(`${this.CLOUDFLARE_URL}/productos?t=${Date.now()}`);
        if (res.ok) {
            return await res.json();
        }
        return { productos: [] };
    },
    
    async guardarProductosCloud(usuario, password, productos) {
        const credentials = btoa(`${usuario}:${password}`);
        
        const res = await fetch(`${this.CLOUDFLARE_URL}/productos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify(productos)
        });
        
        if (res.ok) {
            return { ok: true, data: await res.json() };
        } else {
            const err = await res.json();
            return { ok: false, error: err.error || 'Error del servidor' };
        }
    }
};
