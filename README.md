# 💸 Ahorraulin: cómo ponerla en marcha

App para apuntar gastos e ingresos de Raúl, Sara y Marta. Cada uno tiene su perfil con código privado, ajustes, gráficas, consejos de ahorro y Excel.

Tienes **3 pasos**. Solo el 1 es obligatorio. Con él la app ya funciona en «modo prueba», guardando los datos solo en el móvil donde se usa.

---

## Paso 1 · Subirla a GitHub Pages (5 min)

1. Entra en github.com → **New repository** → nombre: `ahorraulin` → **Public** → Create.
2. Pulsa **uploading an existing file** y arrastra **todos los archivos de esta carpeta**. `supabase.sql`, `worker.js` y `README.md` pueden ir también, no molestan. → **Commit changes**.
3. Ve a **Settings → Pages**. En *Branch* elige `main` y `/ (root)` → **Save**.
4. En 1-2 minutos tendrás la app en `https://TU-USUARIO.github.io/ahorraulin/`.
5. En el móvil, abre esa dirección e instálala como app:
   - **iPhone (Safari):** botón Compartir → **Añadir a pantalla de inicio**.
   - **Android (Chrome):** menú ⋮ → **Instalar aplicación**.

---

## Paso 2 · Que los datos se compartan entre móviles (Supabase, gratis, 10 min)

Sin este paso, cada móvil guarda sus propios datos. Con él, todo está en la nube y cada uno entra desde su móvil.

1. Entra en **supabase.com** → *Start your project* (puedes entrar con GitHub) → **New project**.
   Nombre: `ahorraulin` · Región: **West EU (Ireland)** o **Central EU (Frankfurt)** · Inventa una contraseña de base de datos y guárdala.
2. Cuando termine de crearse: menú izquierdo **SQL Editor → New query**. Abre el archivo `supabase.sql`, copia **todo**, pégalo y pulsa **Run**. Debe salir *Success*.
3. Ve a **Project Settings → API** (o el botón **Connect**) y copia:
   - **Project URL** (algo como `https://abcd.supabase.co`)
   - La clave **anon public** o **publishable**. Es pública y no pasa nada porque se vea: sin el código de cada uno no se puede leer nada.
4. En GitHub abre `config.js` → icono ✏️ → pega los dos valores entre las comillas → **Commit changes**.
5. Espera un minuto y recarga la app. Arriba de cada perfil pondrá «Guardado en la nube ☁️».

> ⚠️ Lo que se haya apuntado en modo prueba no pasa a la nube: empieza a apuntar después de este paso.

**¿Alguien ha olvidado su código?** Lo más fácil: Raúl entra en su perfil → **Ajustes → 👑 Administrador → Restablecer**. La próxima vez que esa persona entre, creará un código nuevo. Si es Raúl quien lo olvida, en Supabase → SQL Editor ejecuta esta línea, cambiando `p2` por el perfil (`p1` Raúl, `p2` Sara, `p3` Marta):

```sql
update public.perfiles set pin_hash = null, fallos = 0, bloqueado_hasta = null where id = 'p2';
```

La próxima vez que entre podrá crear un código nuevo. Sus gastos no se borran.

**Pagos fijos:** al apuntar un gasto o ingreso puedes marcar «🔁 Repetir cada mes» (Netflix, gimnasio, alquiler, nómina…). Se apuntará solo el mismo día de cada mes. Para quitarlo, toca la ✕ en «Pagos fijos cada mes»: lo ya apuntado se queda.

**Copia de seguridad:** todas las noches a las 00:00 la base de datos guarda sola una copia de todo, y se conservan las de los últimos 30 días. En Ajustes verás cuándo fue la última. Para recuperar una copia, mira las instrucciones al final de `supabase.sql`.

**Seguridad:** los códigos se guardan cifrados. Tras 5 intentos fallidos, el perfil se bloquea 5 minutos. Si la app se queda en segundo plano más de 10 minutos, se cierra la sesión sola.

---

## Paso 3 (opcional) · Consejos con IA (Cloudflare)

Sin este paso, la pestaña **Ahorro** ya te da consejos y recetas baratas. Con este paso aparece además el botón **✨ Pedir consejos a la IA**, que analiza tus 3 últimos meses y te hace un plan.

1. Crea una clave de la API de Claude en **console.anthropic.com → API Keys** y añade saldo: con 5 € tienes para muchísimas consultas, porque cada análisis cuesta menos de un céntimo.
2. En **dash.cloudflare.com → Workers & Pages → Create → Worker** → nombre `ahorraulin-ia` → Deploy → **Edit code**. Borra lo que haya, pega el contenido de `worker.js` → **Deploy**.
3. En el Worker → **Settings → Variables and Secrets**:
   - `ANTHROPIC_API_KEY` → tipo **Secret** → tu clave.
   - `ORIGEN` → tipo **Text** → `https://TU-USUARIO.github.io` (sin `/ahorraulin` y sin barra final).
4. Copia la dirección del Worker (algo como `https://ahorraulin-ia.TU-USUARIO.workers.dev`) y pégala en `workerUrl` dentro de `config.js` en GitHub.

> La clave de la IA vive solo en Cloudflare. Nunca la pongas en `config.js`, porque GitHub es público.

---

## Qué archivo es cada cosa

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app (diseño) |
| `app.js` | La app (funcionamiento) |
| `datos.js` | Categorías, colores, emoticonos, consejos y recetas. Puedes editarlo para añadir los tuyos |
| `config.js` | **Lo único que tienes que rellenar** |
| `plantilla.js` | La plantilla del Excel |
| `sw.js`, `manifest.webmanifest`, iconos | Para que se instale como app y abra rápido |
| `supabase.sql` | Se pega una vez en Supabase |
| `worker.js` | Se pega una vez en Cloudflare (opcional, para la IA) |

**Si cambias algo y no se actualiza en el móvil:** abre `sw.js`, cambia `ahorraulin-v1` por `ahorraulin-v2` y súbelo. Después cierra la app del todo y vuelve a abrirla.
