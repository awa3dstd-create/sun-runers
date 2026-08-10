# 🔄 Cómo recuperar el proyecto desde GitHub

> **Guia paso a paso** para que el asistente (o tú mismo) pueda recuperar
> todo el proyecto desde GitHub si se pierde el chat, se crashea la sesión,
> o se necesita continuar el trabajo en otro momento.

---

## ⚠️ Aclaración importante sobre cómo funciona

**Lo que SÍ hace GitHub:**
- ✅ Guarda una copia completa y permanente de todo el código, documentos, scripts e historial del proyecto.
- ✅ Cada commit es una "foto" del estado del proyecto en ese momento.
- ✅ Cualquiera con acceso al repo puede clonarlo y tener todo en su máquina.

**Lo que GitHub NO hace automáticamente:**
- ❌ El asistente (Super Z) NO puede "conectarse solo" a GitHub al iniciar un nuevo chat. Cada conversación empieza desde cero sin memoria de sesiones anteriores.
- ❌ GitHub NO empuja los cambios al chat — hay que pedirle explícitamente al asistente que clone el repo.

**Flujo real de recuperación:**
1. El repo está en GitHub (privado, seguro).
2. Inicias un nuevo chat con el asistente.
3. Le dices: *"Clona el repo https://github.com/USUARIO/sun-runers y continúa el proyecto SUN-RUNERS"*
4. El asistente ejecuta `git clone`, lee el `README.md`, el `worklog.md` y el `download/SUN-RUNERS-RESTORE-POINT.md`, y recupera TODO el contexto.

---

## 📋 Pasos para configurar GitHub (una sola vez)

### Paso 1: Crear cuenta de GitHub (si no tienes)

Ir a https://github.com/signup y crear cuenta gratuita.

### Paso 2: Crear el repositorio

1. Ir a https://github.com/new
2. Configurar:
   - **Repository name:** `sun-runers`
   - **Description:** `Sitio web + automatización Cloudflare para SUN-RUNERS (empresa cubana de ingeniería eléctrica)`
   - **Visibility:** ⚠️ **PRIVATE** (recomendado — aunque ya saneamos los tokens, mejor prevenir)
   - **Initialize this repository with:** DEJAR TODO DESMARCADO (sin README, sin .gitignore, sin license — ya los tenemos)
3. Click en **Create repository**
4. GitHub te va a mostrar una URL como: `https://github.com/USUARIO/sun-runers.git` — **cópiala**

### Paso 3: Crear un Personal Access Token (PAT)

Necesitas un token para que el script pueda autenticarse al pushear.

1. Ir a https://github.com/settings/tokens?type=beta (tokens fine-grained)
2. Click en **Generate new token**
3. Configurar:
   - **Token name:** `sun-runers-sync`
   - **Expiration:** 90 días (o lo que prefieras)
   - **Repository access:** Only select repositories → elegir `sun-runers`
   - **Permissions:**
     - Repository permissions → Contents: **Read and write**
     - Repository permissions → Metadata: **Read-only** (selecciona automáticamente)
4. Click en **Generate token**
5. **Copia el token** (empieza con `github_pat_...`). Solo se ve una vez.

### Paso 4: Sincronizar el proyecto a GitHub

Pásame en un mensaje:
- La URL del repo (ej: `https://github.com/USUARIO/sun-runers.git`)
- El PAT (ej: `github_pat_xxxxxxxxxxxx`)

Y yo ejecuto:
```bash
./scripts/sync-to-github.sh https://github.com/USUARIO/sun-runers.git github_pat_xxxxxxxxxxxx
```

Eso hace commit + push de TODO el proyecto al repo.

---

## 🔄 Cómo recuperar el proyecto en un nuevo chat

Cuando pierdas este chat y quieras continuar, abre un nuevo chat y dile al asistente:

> *"Clona este repo y continúa el proyecto SUN-RUNERS:*
> *https://github.com/USUARIO/sun-runers.git*
>
> *Para autenticarte usa mi token: github_pat_xxxxxxxxxxxx*
>
> *Lee el README.md, el worklog.md y el archivo download/SUN-RUNERS-RESTORE-POINT.md para recuperar el contexto completo."*

El asistente va a:
1. Clonar el repo a `/home/z/my-project/`
2. Instalar dependencias (`npm install`)
3. Leer los documentos clave
4. Continuar desde donde quedó

---

## 📦 Cómo actualizar el repo con nuevos cambios

Cada vez que el asistente termine una tarea significativa, dile:

> *"Sincroniza los cambios a GitHub"*

Y va a ejecutar el script `sync-to-github.sh` con el token que le diste, haciendo un nuevo commit con todos los cambios nuevos.

---

## 🔐 Seguridad

- **Repo PRIVADO:** Solo tú y quien tú invites pueden ver el código.
- **Token rotativo:** Si sospechas que se filtró, revócalo en https://github.com/settings/tokens y genera uno nuevo.
- **Tokens de Cloudflare/Brevo:** Ya saneamos los archivos trackeados (reemplazados con `[REVOCADO POR SEGURIDAD]`). Los tokens reales viven en `.env` (que está en `.gitignore` y NO se commitea).
- **2FA:** Recomendado activarlo en tu cuenta de GitHub: https://github.com/settings/security

---

## ❓ Preguntas frecuentes

**¿Puedo usar un repo público?**
Sí, pero NO recomendado. Aunque saneamos los tokens, pueden quedar otros datos sensibles. Mejor privado.

**¿Qué pasa si pierdo el PAT?**
Generas uno nuevo en https://github.com/settings/tokens y lo usas para futuros syncs. Los commits ya hechos no se pierden.

**¿Puedo editar archivos directamente en GitHub?**
Sí, pero no recomendado para código. Para documentos markdown (`README.md`, `SUN-RUNERS-RESTORE-POINT.md`) sí está bien. Si editas código, después haz `git pull` antes de seguir trabajando en local.

**¿Cuánto espacio ocupa el repo?**
Aproximadamente 5-10 MB (sin `node_modules`, sin `.next`, sin `download/*.zip` que están en `.gitignore`). Bien dentro del límite gratuito de GitHub.
