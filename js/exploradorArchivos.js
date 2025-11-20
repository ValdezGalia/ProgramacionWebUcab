// Cierra todos los <details> del nav al cargar la página para evitar que estén abiertos por defecto.
document.addEventListener('DOMContentLoaded', function () {
	try {
		const details = document.querySelectorAll('main nav details');
		details.forEach(d => d.open = false);
	} catch (e) {
		// Fail silently — no queremos romper la carga si algo falla
		console.error('Error cerrando detalles:', e);
	}
});
