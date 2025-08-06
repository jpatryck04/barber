document.addEventListener('DOMContentLoaded', () => {
    const appointmentsListContainer = document.getElementById('appointments-list');

    const fetchAndRenderAppointments = async () => {
        try {
            const response = await fetch('/api/admin/appointments');
            if (response.status === 401) {
                // Si no está autorizado, redirigir al login
                window.location.href = '/login.html';
                return;
            }
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

                const text = document.createElement('span');
                text.innerHTML = `<span class="time">${appt.time}</span> - ${appt.name} (${appt.phone})`;

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.classList.add('delete-btn');
                deleteButton.dataset.time = appt.time;

                li.appendChild(text);
                li.appendChild(deleteButton);
                ul.appendChild(li);
            });

            appointmentsListContainer.appendChild(ul);

            // Añadir event listeners a los botones de eliminar
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', handleDelete);
            });

        } catch (error) {
            appointmentsListContainer.innerHTML = `<p class="message error">${error.message}</p>`;
        }
    };

    const handleDelete = async (event) => {
        const time = event.target.dataset.time;

        if (!confirm(`¿Estás seguro de que quieres eliminar la cita de las ${time}?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/appointments/${time}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('No se pudo eliminar la cita.');
            }

            // Refrescar la lista de citas
            fetchAndRenderAppointments();

        } catch (error) {
            alert(error.message);
        }
    };

    // Carga inicial
    fetchAndRenderAppointments();

    // Actualizar la lista cada 10 segundos para ver nuevas citas en tiempo real
    setInterval(fetchAndRenderAppointments, 10000);
});
