// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item'); // Enlaces del menú
    const contentSections = document.querySelectorAll('.main-container .content-section'); // Todas las secciones de contenido

    // Nuevas referencias a los selectores de bitácoras
    const selectBitacoraForActivity = document.getElementById('selectBitacoraForActivity');
    const selectBitacoraForPdf = document.getElementById('selectBitacoraForPdf');

    // --- Sidebar Toggle Logic ---
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('active'); // Usa 'active'
            sidebarOverlay.classList.add('active'); // Usa 'active'
            document.body.classList.add('sidebar-open');
        });
    }

    if (closeSidebar && sidebar && sidebarOverlay) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active'); // Usa 'active'
            sidebarOverlay.classList.remove('active'); // Usa 'active'
            document.body.classList.remove('sidebar-open');
        });
    }

    if (sidebarOverlay && sidebar && sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active'); // Usa 'active'
            sidebarOverlay.classList.remove('active'); // Usa 'active'
            document.body.classList.remove('sidebar-open');
        });
    }

    // --- Lógica de Navegación de Secciones (Mostrar/Ocultar Contenido) ---
    function showSection(targetId) {
        // Oculta todas las secciones de contenido
        contentSections.forEach(section => {
            section.style.display = 'none'; // Usa style.display para control dinámico
        });

        // Muestra la sección deseada
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block'; // Muestra la sección
        }

        // Cierra el sidebar después de seleccionar una opción en móvil/tablet
        if (window.innerWidth <= 991) { // Asume que 991px es el breakpoint para ocultar el sidebar
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    }

    // Maneja los clics en los elementos del menú
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Previene el comportamiento por defecto del enlace
            const targetId = item.getAttribute('data-target');

            // Quita la clase 'active' de todos los nav-items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Añade la clase 'active' al nav-item clicado
            item.classList.add('active');

            showSection(targetId);

            // Lógica específica para cargar datos o inicializar tablas si es necesario
            if (targetId === 'bitacoras-section') {
                loadBitacorasPeriods(); // Asegúrate de tener esta función
                // Posiblemente también necesites ocultar la sección de actividad diaria si estaba visible
                document.getElementById('daily-activity-section').style.display = 'none';
            } else if (targetId === 'daily-activity-section') {
                // Al entrar a la sección de actividad diaria, poblamos el selector
                populateBitacoraSelectors();
                // Si ya hay una bitácora seleccionada previamente, cargar sus actividades
                const selectedBitacoraId = localStorage.getItem('selectedBitacoraId');
                if (selectedBitacoraId && selectBitacoraForActivity) {
                    selectBitacoraForActivity.value = selectedBitacoraId;
                    loadDailyActivities(selectedBitacoraId);
                    const selectedBitacoraInfo = JSON.parse(localStorage.getItem('selectedBitacoraInfo'));
                    if (selectedBitacoraInfo) {
                         document.getElementById('currentBitacoraInfo').textContent = `${selectedBitacoraInfo.apprenticeName} - ${selectedBitacoraInfo.companyName}`;
                    }
                } else {
                    document.getElementById('currentBitacoraInfo').textContent = 'Ninguna seleccionada';
                    // Limpiar la tabla de actividades si no hay bitácora seleccionada
                    currentBitacoraActivities = [];
                    renderDailyActivitiesTable();
                }

            } else if (targetId === 'pdf-section') {
                // Al entrar a la sección de PDF, poblamos el selector y limpiamos la previsualización
                populateBitacoraSelectors();
                document.getElementById('pdfContentPreview').innerHTML = '<p class="no-data-message">Selecciona una bitácora para previsualizar el PDF.</p>';
                document.getElementById('generatePdfBtn').style.display = 'none';
                if (selectBitacoraForPdf) selectBitacoraForPdf.value = ""; // Reset selector
            }
            // Agrega más lógica para otras secciones si es necesario
        });
    });

    // --- Lógica Inicial al cargar la página ---
    // Muestra la sección de Bitácoras por defecto al cargar
    showSection('bitacoras-section');
    // Activa el elemento del menú 'Bitácoras' visualmente
    document.querySelector('.sidebar-nav .nav-item[data-target="bitacoras-section"]').classList.add('active');

    // --- Funciones para manejar Bitácoras y Actividades ---
    let bitacoras = []; // Almacenar bitácoras
    let activities = {}; // Almacenar actividades por ID de bitácora

    // Función para cargar bitácoras (ejemplo, puedes cargar desde LocalStorage o API)
    function loadBitacorasPeriods() {
        const storedBitacoras = JSON.parse(localStorage.getItem('bitacoras')) || [];
        bitacoras = storedBitacoras;
        renderBitacorasTable();
        updateOverallProgress();
        populateBitacoraSelectors(); // Asegurarse de que los selectores se actualicen al cargar bitácoras
    }

    // Función para poblar los selectores de bitácoras
    function populateBitacoraSelectors() {
        [selectBitacoraForActivity, selectBitacoraForPdf].forEach(selector => {
            if (selector) {
                selector.innerHTML = '<option value="">-- Seleccione una bitácora --</option>';
                if (bitacoras.length === 0) {
                    selector.innerHTML += '<option value="" disabled>No hay bitácoras disponibles</option>';
                    selector.disabled = true;
                } else {
                    selector.disabled = false;
                    bitacoras.forEach(bitacora => {
                        const option = document.createElement('option');
                        option.value = bitacora.id;
                        option.textContent = `${bitacora.id} - ${bitacora.apprenticeName} (${bitacora.startDate} a ${bitacora.endDate})`;
                        selector.appendChild(option);
                    });
                }
            }
        });
    }

    // Listeners para los nuevos selectores de bitácoras
    if (selectBitacoraForActivity) {
        selectBitacoraForActivity.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            if (selectedId) {
                const selectedBitacora = bitacoras.find(b => b.id == selectedId);
                localStorage.setItem('selectedBitacoraId', selectedId);
                localStorage.setItem('selectedBitacoraInfo', JSON.stringify(selectedBitacora));
                document.getElementById('currentBitacoraInfo').textContent = `${selectedBitacora.apprenticeName} - ${selectedBitacora.companyName}`;
                loadDailyActivities(selectedId);
            } else {
                localStorage.removeItem('selectedBitacoraId');
                localStorage.removeItem('selectedBitacoraInfo');
                document.getElementById('currentBitacoraInfo').textContent = 'Ninguna seleccionada';
                currentBitacoraActivities = [];
                renderDailyActivitiesTable();
            }
        });
    }

    if (selectBitacoraForPdf) {
        selectBitacoraForPdf.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            if (selectedId) {
                window.previewPdfContent(selectedId); // Llama a la función de previsualización
            } else {
                document.getElementById('pdfContentPreview').innerHTML = '<p class="no-data-message">Selecciona una bitácora para previsualizar el PDF.</p>';
                document.getElementById('generatePdfBtn').style.display = 'none';
            }
        });
    }

    // Función para renderizar la tabla de bitácoras
    function renderBitacorasTable() {
        const tbody = document.querySelector('#bitacorasPeriodTable tbody');
        tbody.innerHTML = ''; // Limpiar tabla
        if (bitacoras.length === 0) {
            document.getElementById('noBitacorasMessage').style.display = 'block';
            document.getElementById('bitacorasPeriodTable').style.display = 'none';
            document.getElementById('bitacorasPagination').style.display = 'none';
            return;
        }

        document.getElementById('noBitacorasMessage').style.display = 'none';
        document.getElementById('bitacorasPeriodTable').style.display = 'table';
        document.getElementById('bitacorasPagination').style.display = 'flex';

        bitacoras.forEach((bitacora, index) => {
            const row = tbody.insertRow();
            row.setAttribute('data-bitacora-id', bitacora.id); // Asegura que cada fila tenga un ID
            row.innerHTML = `
                <td data-label="N° Bitácora">${bitacora.id}</td>
                <td data-label="Fecha Inicio">${bitacora.startDate}</td>
                <td data-label="Fecha Fin">${bitacora.endDate}</td>
                <td data-label="Empresa">${bitacora.companyName}</td>
                <td data-label="Jefe">${bitacora.bossName}</td>
                <td data-label="Tel. Jefe">${bitacora.bossPhone}</td>
                <td data-label="Correo Jefe">${bitacora.bossEmail}</td>
                <td data-label="Tipo Vínculo">${bitacora.vinculationType}</td>
                <td data-label="Aprendiz">${bitacora.apprenticeName}</td>
                <td data-label="Tel. Aprendiz">${bitacora.apprenticePhone}</td>
                <td data-label="Correo Aprendiz">${bitacora.apprenticeEmail}</td>
                <td data-label="Acciones" class="action-buttons">
                    <button class="btn-primary view-activities-btn" data-bitacora-id="${bitacora.id}"><i class="fas fa-eye"></i> Ver Actividades</button>
                    <button class="btn-warning edit-btn" data-bitacora-id="${bitacora.id}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-danger delete-btn" data-bitacora-id="${bitacora.id}"><i class="fas fa-trash-alt"></i> Eliminar</button>
                </td>
            `;
        });

        addBitacoraTableEventListeners(); // Agrega listeners a los botones de la tabla
    }

    // Función para actualizar el progreso general
    function updateOverallProgress() {
        const totalBitacoras = bitacoras.length;
        // Aquí puedes calcular un progreso más significativo si tienes un campo de "estado" en bitácora
        // Por ahora, solo un porcentaje ficticio o basado en el número de bitácoras
        const progressPercentage = totalBitacoras > 0 ? (totalBitacoras % 5) * 20 : 0; // Ejemplo simple
        document.getElementById('overallProgress').textContent = `${progressPercentage}%`;
        document.getElementById('overallProgressBar').style.width = `${progressPercentage}%`;
    }

    // Función para manejar el envío del formulario de Bitácora
    document.getElementById('bitacoraPeriodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newBitacora = {
            id: Date.now(), // ID único simple
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            companyName: document.getElementById('companyName').value,
            bossName: document.getElementById('bossName').value,
            bossPhone: document.getElementById('bossPhone').value,
            bossEmail: document.getElementById('bossEmail').value,
            vinculationType: document.getElementById('vinculationType').value,
            apprenticeName: document.getElementById('apprenticeName').value,
            apprenticePhone: document.getElementById('apprenticePhone').value,
            apprenticeEmail: document.getElementById('apprenticeEmail').value
        };
        bitacoras.push(newBitacora);
        localStorage.setItem('bitacoras', JSON.stringify(bitacoras));
        renderBitacorasTable();
        populateBitacoraSelectors(); // Actualizar los selectores al guardar una nueva bitácora
        document.getElementById('bitacoraPeriodForm').reset();
        alert('Bitácora guardada con éxito!');
    });


    // --- Event Listeners para la tabla de Bitácoras ---
    function addBitacoraTableEventListeners() {
        document.querySelectorAll('.view-activities-btn').forEach(button => {
            button.onclick = (e) => {
                const bitacoraId = e.currentTarget.dataset.bitacoraId;
                const selectedBitacora = bitacoras.find(b => b.id == bitacoraId);

                if (selectedBitacora) {
                    // Guarda la bitácora seleccionada en localStorage para usarla en la sección de actividades
                    localStorage.setItem('selectedBitacoraId', bitacoraId);
                    localStorage.setItem('selectedBitacoraInfo', JSON.stringify(selectedBitacora));

                    // Muestra la sección de Actividad Diaria
                    showSection('daily-activity-section');
                    // Actualiza el título en la sección de Actividad Diaria
                    document.getElementById('currentBitacoraInfo').textContent = `${selectedBitacora.apprenticeName} - ${selectedBitacora.companyName}`;
                    loadDailyActivities(bitacoraId); // Carga las actividades para esta bitácora

                    // Ajusta el estado activo del menú
                    navItems.forEach(nav => nav.classList.remove('active'));
                    document.querySelector('.sidebar-nav .nav-item[data-target="daily-activity-section"]').classList.add('active');

                    // Asegura que el selector de actividades refleje la bitácora seleccionada
                    if (selectBitacoraForActivity) {
                        selectBitacoraForActivity.value = bitacoraId;
                    }

                } else {
                    alert('Error: Bitácora no encontrada.');
                }
            };
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
            button.onclick = (e) => {
                const bitacoraId = e.currentTarget.dataset.bitacoraId;
                alert(`Editar bitácora con ID: ${bitacoraId}`);
                // Implementa aquí la lógica para cargar los datos de la bitácora en el formulario de edición
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                const bitacoraId = e.currentTarget.dataset.bitacoraId;
                if (confirm('¿Está seguro de que desea eliminar esta bitácora?')) {
                    bitacoras = bitacoras.filter(b => b.id != bitacoraId);
                    localStorage.setItem('bitacoras', JSON.stringify(bitacoras));
                    // También elimina las actividades asociadas si es necesario
                    delete activities[bitacoraId]; // Eliminar actividades asociadas
                    localStorage.setItem('activities', JSON.stringify(activities));

                    renderBitacorasTable();
                    populateBitacoraSelectors(); // Actualizar los selectores al eliminar una bitácora
                    alert('Bitácora eliminada.');
                }
            };
        });
    }

    // --- Funciones para Actividad Diaria ---
    let currentBitacoraActivities = []; // Actividades de la bitácora actualmente seleccionada

    function loadDailyActivities(bitacoraId) {
        activities = JSON.parse(localStorage.getItem('activities')) || {}; // Cargar todas las actividades
        currentBitacoraActivities = activities[bitacoraId] || [];
        renderDailyActivitiesTable();
    }

    function renderDailyActivitiesTable() {
        const tbody = document.querySelector('#dailyActivitiesTable tbody');
        tbody.innerHTML = '';
        if (currentBitacoraActivities.length === 0) {
            document.getElementById('noActivitiesMessage').style.display = 'block';
            document.getElementById('dailyActivitiesTable').style.display = 'none';
            document.getElementById('activitiesPagination').style.display = 'none';
            return;
        }

        document.getElementById('noActivitiesMessage').style.display = 'none';
        document.getElementById('dailyActivitiesTable').style.display = 'table';
        document.getElementById('activitiesPagination').style.display = 'flex';


        currentBitacoraActivities.forEach((activity, index) => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td data-label="Fecha">${activity.date}</td>
                <td data-label="Descripción">${activity.description}</td>
                <td data-label="Acciones" class="action-buttons">
                    <button class="btn-warning edit-activity-btn" data-activity-index="${index}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn-danger delete-activity-btn" data-activity-index="${index}"><i class="fas fa-trash-alt"></i> Eliminar</button>
                </td>
            `;
        });
        addActivityTableEventListeners();
    }

    // Maneja el envío del formulario de Actividad Diaria
    document.getElementById('dailyActivityForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedBitacoraId = selectBitacoraForActivity ? selectBitacoraForActivity.value : localStorage.getItem('selectedBitacoraId'); // Prioriza el selector, sino el localStorage

        if (!selectedBitacoraId) {
            alert('Por favor, seleccione una bitácora primero para registrar actividades.');
            return;
        }

        const newActivity = {
            date: document.getElementById('activityDate').value,
            description: document.getElementById('activityDescription').value
        };

        activities = JSON.parse(localStorage.getItem('activities')) || {}; // Asegurarse de cargar el objeto completo
        if (!activities[selectedBitacoraId]) {
            activities[selectedBitacoraId] = [];
        }
        activities[selectedBitacoraId].push(newActivity);
        localStorage.setItem('activities', JSON.stringify(activities));

        loadDailyActivities(selectedBitacoraId); // Recargar actividades para la bitácora actual
        document.getElementById('dailyActivityForm').reset();
        alert('Actividad diaria agregada con éxito!');
    });

    // Event Listeners para la tabla de Actividades Diarias
    function addActivityTableEventListeners() {
        document.querySelectorAll('.edit-activity-btn').forEach(button => {
            button.onclick = (e) => {
                const index = e.currentTarget.dataset.activityIndex;
                alert(`Editar actividad en índice: ${index}`);
                // Lógica para cargar actividad en el formulario de edición
            };
        });

        document.querySelectorAll('.delete-activity-btn').forEach(button => {
            button.onclick = (e) => {
                const index = e.currentTarget.dataset.activityIndex;
                if (confirm('¿Está seguro de que desea eliminar esta actividad?')) {
                    const selectedBitacoraId = selectBitacoraForActivity ? selectBitacoraForActivity.value : localStorage.getItem('selectedBitacoraId');
                    if (selectedBitacoraId) {
                        activities = JSON.parse(localStorage.getItem('activities')) || {};
                        if (activities[selectedBitacoraId]) {
                             activities[selectedBitacoraId].splice(index, 1);
                             localStorage.setItem('activities', JSON.stringify(activities));
                             loadDailyActivities(selectedBitacoraId);
                             alert('Actividad eliminada.');
                        }
                    }
                }
            };
        });
    }

    // --- Lógica para Generar PDF (jspdf, html2canvas) ---
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', async () => {
            const pdfContent = document.getElementById('pdfContentPreview');
            const selectedPdfBitacoraId = selectBitacoraForPdf ? selectBitacoraForPdf.value : null;

            if (!selectedPdfBitacoraId || pdfContent.innerHTML.includes('Selecciona una bitácora para previsualizar el PDF.')) {
                alert('Por favor, selecciona una bitácora para generar el PDF.');
                return;
            }

            // Muestra un mensaje de carga
            generatePdfBtn.textContent = 'Generando PDF...';
            generatePdfBtn.disabled = true;

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' size

                // Calculate width and height of the page
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 10; // mm

                // Temporarily hide elements not meant for PDF (like buttons in the preview)
                const buttons = pdfContent.querySelectorAll('.action-buttons, #generatePdfBtn');
                buttons.forEach(btn => btn.style.display = 'none');

                const canvas = await html2canvas(pdfContent, {
                    scale: 2, // Increase scale for better quality
                    useCORS: true, // If images are from another origin
                    logging: true, // Enable logging for debugging
                    allowTaint: true // Allow images from other origins (if any)
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 190; // A4 width minus margins (210mm - 2*10mm)
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let position = margin;
                if (imgHeight < pageHeight - margin) {
                    doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                } else {
                    let heightLeft = imgHeight;
                    let currentY = 0;

                    while (heightLeft >= 0) {
                        if (currentY > 0) {
                            doc.addPage();
                        }
                        const sX = 0;
                        const sY = currentY * (canvas.height / imgHeight);
                        const sWidth = canvas.width;
                        const sHeight = Math.min(canvas.height - sY, (pageHeight - margin) * (canvas.height / imgHeight));

                        const imgSection = canvas.getContext('2d').getImageData(sX, sY, sWidth, sHeight);
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = sWidth;
                        tempCanvas.height = sHeight;
                        tempCanvas.getContext('2d').putImageData(imgSection, 0, 0);

                        doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, (sHeight * imgWidth) / sWidth);

                        currentY += (pageHeight - margin) * (canvas.height / imgHeight);
                        heightLeft -= (pageHeight - margin);
                    }
                }

                doc.save('bitacora.pdf');

            } catch (error) {
                console.error('Error al generar el PDF:', error);
                alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
            } finally {
                generatePdfBtn.textContent = 'Generar y Descargar PDF';
                generatePdfBtn.disabled = false;
                // Restore hidden elements
                const buttons = pdfContent.querySelectorAll('.action-buttons, #generatePdfBtn');
                buttons.forEach(btn => btn.style.display = ''); // Restore default display
            }
        });
    }


    // Función para previsualizar el contenido del PDF
    // Esta función debería ser llamada cuando se selecciona una bitácora en la sección de PDF
    window.previewPdfContent = function(bitacoraId) {
        const selectedBitacora = bitacoras.find(b => b.id == bitacoraId);
        if (!selectedBitacora) {
            document.getElementById('pdfContentPreview').innerHTML = '<p class="no-data-message">Bitácora no encontrada.</p>';
            generatePdfBtn.style.display = 'none';
            return;
        }

        const activitiesForPdf = (activities[bitacoraId] || []); // Acceder directamente al objeto activities

        let activitiesHtml = '';
        if (activitiesForPdf.length > 0) {
            activitiesHtml = `
                <table class="pdf-preview-table">
                    <thead>
                        <tr class="activity-header-row">
                            <th>Fecha</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${activitiesForPdf.map(activity => `
                            <tr class="activity-detail-row">
                                <td>${activity.date}</td>
                                <td>${activity.description}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            activitiesHtml = `
                <table class="pdf-preview-table">
                    <tbody>
                        <tr class="no-activity-message-row">
                            <td colspan="2">No hay actividades registradas para esta bitácora.</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }


        document.getElementById('pdfContentPreview').innerHTML = `
            <div class="pdf-header-info">
                <h2>Bitácora de Seguimiento de Etapa Productiva</h2>
                <p><strong>Aprendiz:</strong> ${selectedBitacora.apprenticeName}</p>
                <p><strong>Empresa:</strong> ${selectedBitacora.companyName}</p>
                <p><strong>Período:</strong> ${selectedBitacora.startDate} - ${selectedBitacora.endDate}</p>
                <p><strong>Jefe Inmediato:</strong> ${selectedBitacora.bossName} - ${selectedBitacora.bossPhone} - ${selectedBitacora.bossEmail}</p>
                <p><strong>Tipo de Vínculo:</strong> ${selectedBitacora.vinculationType}</p>
            </div>
            <h3>Actividades Diarias</h3>
            ${activitiesHtml}
            <div class="pdf-signatures">
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <p class="signature-name">${selectedBitacora.apprenticeName}</p>
                    <p class="signature-role">Firma del Aprendiz</p>
                </div>
                <div class="signature-block">
                    <div class="signature-line"></div>
                    <p class="signature-name">${selectedBitacora.bossName}</p>
                    <p class="signature-role">Firma del Jefe Inmediato</p>
                </div>
            </div>
        `;
        generatePdfBtn.style.display = 'block'; // Muestra el botón de generar PDF
    };

    // --- Lógica para mostrar la tabla de bitácoras al cargar la página ---
    loadBitacorasPeriods();
});