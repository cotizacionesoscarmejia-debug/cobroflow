# VEREDICTO revisor-visual — app-principal
Fecha: 2026-08-16 00:00
Screenshot: docs/revisiones/app-1-dashboard.png
Usabilidad: 31/40
Craft: 15/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. Avatar "CR" (esquina superior derecha) es un <span aria-hidden> sin href/onClick pero luce como botón de perfil (círculo, iniciales, alto contraste) → conviértelo en Link a /app/cuenta o quítale el tratamiento de botón si es puramente decorativo.
2. lib/app-data.ts leerDB(): si JSON.parse del localStorage falla, sobreescribe SILENCIOSAMENTE los datos reales del usuario con la semilla (guardarDB(db) al final del catch) sin ningún aviso → antes de reescribir, mostrar un mensaje ("no pudimos leer tus datos, se restauró la app") en vez de perder el historial sin decir nada.
3. Movimiento (page.tsx función entra()): el stagger de entrada (opacity/y en cada bloque) no respeta prefers-reduced-motion — no hay MotionConfig reducedMotion="user" en el layout, a diferencia de NumeroAnimado que sí usa useReducedMotion() → envolver la app en <MotionConfig reducedMotion="user"> en app/layout.tsx.
4. Eje movimiento: no hay transición visible entre tabs de BottomNav (Link plano, corte seco) y el empty state "Todo cobrado 🎉" es texto estático sin la celebración (check + micro-confeti) que promete FICHA-ARTE.md para el hito "saldo llegó a $0" → agregar transición de página y una celebración real en ese estado.
5. Dispositivo ownable "recibo perforado": la línea punteada de la hero card y de las filas es muy sutil (3px, baja opacidad) — un usuario promedio no la nota sin buscarla, solo cumple a nivel "ojo entrenado" → subir ligeramente contraste/grosor para que se perciba como firma de marca.
