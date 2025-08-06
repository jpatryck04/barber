# Sistema de Citas para Barbería

Este documento describe la arquitectura, características y funcionamiento de un sistema web para la gestión de citas en una barbería.

## 1. Descripción General

El objetivo de este proyecto es desarrollar una aplicación web simple que permita a los clientes de una barbería ver los horarios disponibles y agendar una cita. A su vez, proporcionará una vista de administrador para que el personal de la barbería pueda ver todas las citas programadas.

El sistema está diseñado para ser intuitivo y auto-suficiente: una vez que un horario es reservado, se marcará como no disponible en tiempo real para evitar reservas duplicadas.

## 2. Características Principales

*   **Vista de Cliente:**
    *   Visualización de los horarios de citas disponibles para un día específico.
    *   Formulario para que el cliente ingrese su nombre y seleccione un horario.
    *   Capacidad de enviar la solicitud de cita.
    *   Actualización automática de la lista de horarios después de agendar.

*   **Vista de Administrador:**
    *   Visualización de todas las citas agendadas, incluyendo el nombre del cliente y la hora.
    *   La vista se actualiza para reflejar nuevas citas en tiempo real.

*   **Lógica de Negocio:**
    *   Un horario reservado no puede ser seleccionado por otro cliente.
    *   Los datos de las citas son persistentes (no se borran si se recarga la página o se cierra el navegador).

## 3. Arquitectura Técnica

Para cumplir con los requisitos de persistencia de datos y las dos vistas (cliente y administrador), no es suficiente usar solo HTML, CSS y JavaScript. Necesitamos un componente en el servidor (backend) que gestione los datos.

La arquitectura se divide en dos partes:

### Frontend (Lo que el usuario ve en el navegador)

*   **HTML (`index.html`, `admin.html`):** Define la estructura de la página de clientes y la de administrador.
*   **CSS (`style.css`):** Proporciona los estilos visuales para dar una apariencia profesional a la aplicación.
*   **JavaScript (`main.js`, `admin.js`):** Se encarga de toda la lógica interactiva:
    *   Realiza peticiones al backend para obtener los horarios.
    *   Envía la información de una nueva cita al backend.
    *   Actualiza dinámicamente la página para reflejar los cambios (ej. marcar un horario como "ocupado").

### Backend (El servidor que gestiona los datos)

Para mantener la simplicidad y alinearnos con el stack tecnológico de JavaScript, se propone un servidor ligero usando **Node.js** con el framework **Express.js**.

*   **Node.js / Express.js (`server.js`):** Será un único archivo que actuará como nuestro servidor. Sus responsabilidades son:
    *   Exponer "endpoints" (URLs) para que el frontend pueda solicitar o enviar datos.
    *   Leer y escribir en un archivo `db.json` que actuará como nuestra base de datos simple.

*   **Base de Datos (`db.json`):** Un archivo de texto en formato JSON que almacenará la lista de citas. Es una solución simple y efectiva para este tipo de proyecto.

### Diagrama de Flujo

```
Cliente/Admin (Navegador)      <-- Peticiones HTTP -->      Servidor (Node.js)      <-- Lee/Escribe -->      Base de Datos (db.json)
[HTML, CSS, JS]                                            [Express.js]
```

## 4. Definición de la API

La comunicación entre el frontend y el backend se realizará a través de los siguientes endpoints:

*   **`GET /api/appointments`**
    *   **Descripción:** Obtiene la lista de todas las citas agendadas. El frontend usará esta información para determinar qué horarios ya están ocupados.
    *   **Respuesta Exitosa (JSON):**
        ```json
        [
          {"time": "09:00", "name": "Juan Perez"},
          {"time": "11:30", "name": "Carlos Gomez"}
        ]
        ```

*   **`POST /api/appointments`**
    *   **Descripción:** Crea una nueva cita. El frontend enviará los datos del formulario a este endpoint. El servidor validará que el horario no esté ya ocupado antes de guardar la cita.
    *   **Cuerpo de la Petición (JSON):**
        ```json
        {"time": "10:00", "name": "Ana Lopez"}
        ```
    *   **Respuesta Exitosa:** Código `201 Created` con el objeto de la cita creada.
    *   **Respuesta de Error:** Código `409 Conflict` si el horario ya está ocupado.

## 5. Estructura de Archivos

El proyecto se organizará de la siguiente manera para mantener el código ordenado:

```
barbershop-app/
├── public/
│   ├── index.html         # Página para los clientes
│   ├── admin.html         # Página para el administrador
│   ├── style.css          # Hoja de estilos
│   ├── js/
│   │   ├── main.js        # Lógica para la página del cliente
│   │   └── admin.js       # Lógica para la página del administrador
│
├── data/
│   └── db.json            # Archivo que funciona como base de datos
│
├── server.js              # Lógica del servidor (backend)
├── package.json           # Dependencias y scripts del proyecto
└── README.md              # Este archivo de documentación
```

## 6. Instrucciones de Puesta en Marcha

Para ejecutar este proyecto en un entorno local, se necesitará tener instalado [Node.js](https://nodejs.org/).

1.  **Clonar el repositorio (o descargar los archivos) y navegar a la carpeta `barbershop-app`.**

2.  **Instalar dependencias:**
    Abrir una terminal en la carpeta del proyecto y ejecutar:
    ```bash
    npm install
    ```
    Esto instalará Express.js y otras dependencias necesarias definidas en `package.json`.

3.  **Iniciar el servidor:**
    En la misma terminal, ejecutar:
    ```bash
    node server.js
    ```
    El servidor comenzará a funcionar y mostrará un mensaje como `Servidor escuchando en el puerto 3000`.

4.  **Acceder a la aplicación:**
    *   **Vista de Cliente:** Abrir un navegador web y visitar `http://localhost:3000`.
    *   **Vista de Administrador:** Abrir otra pestaña y visitar `http://localhost:3000/admin.html`.

## 7. Cómo Funciona la Lógica Clave

La lógica para evitar que se agenden dos citas en el mismo turno se maneja principalmente en el **backend**, lo que garantiza que sea segura y consistente.

1.  **Petición de Cita:** El cliente llena el formulario en `index.html` y presiona "Agendar". El archivo `main.js` envía una petición `POST /api/appointments` al `server.js` con el nombre y la hora.
2.  **Verificación en el Servidor:** Antes de guardar nada, el `server.js` lee el archivo `db.json` y comprueba si ya existe una cita para la hora solicitada.
3.  **Respuesta del Servidor:**
    *   Si el horario está libre, el servidor añade la nueva cita a `db.json`, guarda el archivo y responde al frontend con un código de éxito.
    *   Si el horario está ocupado, el servidor no modifica `db.json` y responde con un error `409 Conflict`.
4.  **Actualización del Frontend:** Al recibir una respuesta exitosa, `main.js` actualiza la interfaz, marcando el horario como "Ocupado" y mostrando un mensaje de confirmación. Si recibe un error, muestra una alerta al usuario.
