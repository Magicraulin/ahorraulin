# 📊 Tu hoja de Ahorraulin que se actualiza sola

Una sola hoja de cálculo, la tuya, en tu Google Drive. Se actualiza sola:
- **cada noche a las 00:00**
- **cada vez que la abres en el ordenador**
- y cuando quieras, con el menú **💸 Ahorraulin → 🔄 Refrescar ahora**

Es siempre **la misma hoja**: no se crean archivos nuevos. Tiene el mismo diseño que el Excel de la app (tarjetas, una pestaña por mes, comparación con el mes anterior, ahorro aparte y gráficas). Cuando quieras el archivo, en Google Sheets: **Archivo → Descargar → Microsoft Excel**.

> Hazlo **desde el ordenador** (en el móvil Google no deja abrir Apps Script). Son unos 5 minutos y solo una vez.

## Pasos

1. **Crea la hoja.** Entra en **[sheets.new](https://sheets.new)** con tu cuenta de Google y ponle de nombre `Ahorraulin` (arriba a la izquierda, donde pone «Hoja de cálculo sin título»).

2. **Pega el código.** En la hoja: menú **Extensiones → Apps Script**. Se abre una pestaña nueva con un poco de código. **Bórralo todo** y pega el código de este enlace (abre el enlace, selecciona todo con Ctrl+A o Cmd+A y copia):
   👉 **https://raw.githubusercontent.com/Magicraulin/ahorraulin/main/google-sheets/Ahorraulin.gs**

   Pulsa el icono de **guardar 💾**. Ya puedes cerrar esa pestaña.

3. **Recarga la hoja** (F5). En unos segundos aparece un menú nuevo arriba: **💸 Ahorraulin**.

4. **Conéctala.** Menú **💸 Ahorraulin → 🔑 Configurar mi perfil y código**.
   - Google te pedirá permiso. Pulsa **Continuar**, elige tu cuenta y, si sale «Google no ha verificado esta aplicación», pulsa **Configuración avanzada → Ir a Ahorraulin (no seguro) → Permitir**. Es normal: la «aplicación» es tu propio código en tu propia hoja.
   - Vuelve a pulsar **🔑 Configurar mi perfil y código** si se cerró.
   - Escribe tu nombre (**Raúl**, **Sara** o **Marta**) y tu **código de 4 números** de la app.

¡Listo! La hoja se rellena con todos tus datos de la app.

## Cosas que conviene saber

- **Es privada:** solo tú tienes la hoja y solo con tu código se leen tus datos.
- **Si cambias tu código en la app,** cámbialo también aquí: **💸 Ahorraulin → 🔑 Configurar mi perfil y código**.
- **La hoja se redibuja entera** cada vez que se actualiza: no escribas cosas tuyas en ella, porque se borrarían. Si quieres apuntar algo, hazlo en la app.
- **En el móvil** ábrela con la app de **Google Sheets**: verás tus datos actualizados de la última vez (cada noche a las 00:00 seguro). El menú «Refrescar» y la actualización al abrir solo funcionan desde el ordenador; Google no los permite en la app del móvil.
- **Para desconectarla:** **💸 Ahorraulin → ❌ Desconectar esta hoja**.
