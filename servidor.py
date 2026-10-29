"""
servidor.py — Servidor de desarrollo con recarga automática
============================================================
Cuando guardas cualquier archivo .html, .css o .js,
el navegador se recarga solo. Sin hacer nada extra.

CÓMO USARLO:
  python servidor.py

Luego abre: http://localhost:5500

CÓMO DETENERLO:
  Ctrl+C en la terminal
"""

from livereload import Server

server = Server()

# Observar cambios en estos archivos y recargar el navegador automáticamente
# cuando cualquiera de ellos se modifique y guarde.
server.watch('*.html')
server.watch('assets/css/*.css')
server.watch('assets/js/*.js')

print("=" * 50)
print("  Servidor corriendo en: http://localhost:5500")
print("  Recarga automática: ACTIVA")
print("  Guarda cualquier archivo → el navegador se recarga")
print("  Para detener: Ctrl+C")
print("=" * 50)

server.serve(root='.', port=5500, open_url_delay=1)
