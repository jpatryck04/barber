document.addEventListener('DOMContentLoaded', () => {
    const appointmentsListContainer = document.getElementById('appointments-list');

    const fetchAndRenderAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            if (!response.ok) {
                throw new Error('Error al cargar las citas.');
            }
            const appointments = await response.json();

            appointmentsListContainer.innerHTML = ''; // Limpiar la lista

            if (appointments.length === 0) {
                appointmentsListContainer.innerHTML = '<p>No hay citas agendadas por el momento.</p>';
                return;
            }

            // Ordenar citas por hora
            appointments.sort((a, b) => a.time.localeCompare(b.time));

            const ul = document.createElement('ul');
            appointments.forEach(appt => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="time">${appt.time}</span> - ${appt.name}`;
                ul.appendChild(li);
            });

            appointmentsListContainer.appendChild(ul);

        } catch (error) {
            appointmentsListContainer.innerHTML = `<p class="message error">${error.message}</p>`;
        }
    };

    // Carga inicial
    fetchAndRenderAppointments();

    // Actualizar la lista cada 10 segundos para ver nuevas citas en tiempo real
    setInterval(fetchAndRenderAppointments, 10000);
});
