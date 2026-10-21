# LastSeen para Vencord

Plugin de Vencord que muestra la **última vez que viste conectado** a alguien ("últ. vez hace 2 h"), junto a su nombre en los mensajes y en la lista de miembros. Al pasar el ratón aparece la fecha completa y la plataforma (móvil, escritorio o web).

Solo funciona en la aplicación de escritorio de Discord con Vencord instalado.

## Limitaciones
- Solo registra a la gente que ves conectada mientras tu Discord está abierto. Empieza vacío y se va llenando.
- Discord no envía datos de usuarios invisibles, así que de ellos no se puede saber nada.
- Los datos se guardan solo en tu equipo.

## Instalación
Los plugins propios no están en el instalador oficial, así que hay que compilar Vencord:

1. Instala [Node.js LTS](https://nodejs.org) y [Git](https://git-scm.com).
2. Descarga Vencord:
   ```bash
   git clone https://github.com/Vendicated/Vencord.git
   cd Vencord
   ```
3. Copia la carpeta `lastSeen` de este repositorio a `Vencord/src/userplugins/`.
4. Compila e inyecta (con Discord cerrado):
   ```bash
   npm i -g pnpm
   pnpm install
   pnpm build
   pnpm inject
   ```
5. Reinicia Discord y activa **LastSeen** en Ajustes → Vencord → Plugins.

Los mods de cliente van contra los Términos de Servicio de Discord. Úsalo bajo tu propia responsabilidad.
