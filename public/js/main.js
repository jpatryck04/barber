document.addEventListener('DOMContentLoaded', () => {
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const bookingForm = document.getElementById('booking-form');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const messageContainer = document.getElementById('message-container');

    let selectedTime = null;

    // Horarios predefinidos para la barbería
    const availableTimes = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    // Función para obtener las citas y renderizar los horarios
    const fetchAndRenderTimes = async () => {
        try {
            const response = await fetch('/api/appointments');
            if (!response.ok) {
                throw new Error('Error al cargar los horarios.');
            }
            const bookedTimes = await response.json();

            timeSlotsContainer.innerHTML = ''; // Limpiar contenedor

            availableTimes.forEach(time => {
                const timeSlot = document.createElement('div');
                timeSlot.classList.add('time-slot');
                timeSlot.textContent = time;

                if (bookedTimes.includes(time)) {
                    timeSlot.classList.add('booked');
                } else {
                    // Permitir selección solo si no está reservado
                    timeSlot.addEventListener('click', () => {
                        // Deseleccionar el anterior si existe
                        if (document.querySelector('.time-slot.selected')) {
                            document.querySelector('.time-slot.selected').classList.remove('selected');
                        }
                        // Seleccionar el nuevo
                        timeSlot.classList.add('selected');
                        selectedTime = time;
                    });
                }
                timeSlotsContainer.appendChild(timeSlot);
            });

        } catch (error) {
            timeSlotsContainer.innerHTML = `<p class="message error">${error.message}</p>`;
        }
    };

    // Manejar el envío del formulario
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name || !phone || !selectedTime) {
            showMessage('Por favor, completa todos los campos y selecciona un horario.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, time: selectedTime })
            });

            if (response.status === 409) {
                showMessage('Lo sentimos, ese horario acaba de ser reservado. Por favor, elige otro.', 'error');
            } else if (!response.ok) {
                throw new Error('Ocurrió un error al agendar la cita.');
            } else {
                const newAppointment = await response.json();
                showMessage(`¡Cita agendada con éxito para ${newAppointment.name} a las ${newAppointment.time}!`, 'success');
                nameInput.value = '';
                phoneInput.value = '';
                selectedTime = null;
            }

            // Actualizar la vista de horarios
            fetchAndRenderTimes();

        } catch (error) {
            showMessage(error.message, 'error');
        }
    });

    // Función para mostrar mensajes
    function showMessage(msg, type) {
        messageContainer.textContent = msg;
        messageContainer.className = `message ${type}`;
    }

    // Carga inicial
    fetchAndRenderTimes();
});
