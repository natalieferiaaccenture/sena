// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item'); // Enlaces del menú
    const contentSections = document.querySelectorAll('.main-container .content-section'); // Todas las secciones de contenido

    // Selectores de bitácoras
    const selectBitacoraForActivity = document.getElementById('selectBitacoraForActivity');
    const selectBitacoraForPdf = document.getElementById('selectBitacoraForPdf');

    // Botones de generación de reportes
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const generateExcelBtn = document.getElementById('generateExcelBtn');

    // Elementos de la tabla y formularios
    const bitacorasPeriodForm = document.getElementById('bitacoraPeriodForm');
    const bitacorasTableTbody = document.querySelector('#bitacorasPeriodTable tbody');
    const noBitacorasMessage = document.getElementById('noBitacorasMessage');
    const bitacorasPeriodTable = document.getElementById('bitacorasPeriodTable');
    const bitacorasPagination = document.getElementById('bitacorasPagination');

    const dailyActivityForm = document.getElementById('dailyActivityForm');
    const dailyActivitiesTableTbody = document.querySelector('#dailyActivitiesTable tbody');
    const noActivitiesMessage = document.getElementById('noActivitiesMessage');
    const dailyActivitiesTable = document.getElementById('dailyActivitiesTable');
    const activitiesPagination = document.getElementById('activitiesPagination');
    const currentBitacoraInfo = document.getElementById('currentBitacoraInfo');
    const pdfContentPreview = document.getElementById('pdfContentPreview');


    // --- Variables de Estado Globales ---
    let bitacoras = []; // Almacenar bitácoras
    let activities = {}; // Almacenar actividades por ID de bitácora (ej. { 'bitacoraId1': [], 'bitacoraId2': [] })
    let currentBitacoraActivities = []; // Actividades de la bitácora actualmente seleccionada en la sección de actividades

    // --- Sidebar Toggle Logic ---
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.classList.add('sidebar-open');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
    });

    // --- Lógica de Navegación de Secciones (Mostrar/Ocultar Contenido) ---
    function showSection(targetId) {
        // Oculta todas las secciones de contenido
        contentSections.forEach(section => {
            section.style.display = 'none';
        });

        // Muestra la sección deseada
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Cierra el sidebar después de seleccionar una opción en móvil/tablet
        if (window.innerWidth <= 991) {
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

            // Quita la clase 'active' de todos los nav-items y añade al clicado
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            showSection(targetId);

            // Lógica específica para cargar datos o inicializar tablas si es necesario
            switch (targetId) {
                case 'bitacoras-section':
                    loadBitacorasPeriods();
                    document.getElementById('daily-activity-section').style.display = 'none'; // Asegurarse de ocultar si venimos de ahí
                    break;
                case 'daily-activity-section':
                    populateBitacoraSelectors(); // Poblamos el selector
                    const selectedBitacoraId = localStorage.getItem('selectedBitacoraId');
                    if (selectedBitacoraId && selectBitacoraForActivity) {
                        selectBitacoraForActivity.value = selectedBitacoraId;
                        loadDailyActivities(selectedBitacoraId);
                        const selectedBitacoraInfo = JSON.parse(localStorage.getItem('selectedBitacoraInfo'));
                        if (selectedBitacoraInfo) {
                            currentBitacoraInfo.textContent = `${selectedBitacoraInfo.apprenticeName} - ${selectedBitacoraInfo.companyName}`;
                        }
                    } else {
                        currentBitacoraInfo.textContent = 'Ninguna seleccionada';
                        currentBitacoraActivities = [];
                        renderDailyActivitiesTable(); // Limpiar la tabla de actividades si no hay bitácora seleccionada
                    }
                    break;
                case 'pdf-section':
                    populateBitacoraSelectors(); // Poblamos el selector
                    pdfContentPreview.innerHTML = '<p class="no-data-message">Selecciona una bitácora para previsualizar el PDF.</p>';
                    generatePdfBtn.style.display = 'none';
                    if (selectBitacoraForPdf) selectBitacoraForPdf.value = ""; // Reset selector
                    break;
                default:
                    // Manejar otras secciones o no hacer nada
                    break;
            }
        });
    });

    // --- Funciones para manejar Bitácoras ---
    function loadBitacorasPeriods() {
        const storedBitacoras = JSON.parse(localStorage.getItem('bitacoras')) || [];
        bitacoras = storedBitacoras;
        renderBitacorasTable();
        updateOverallProgress();
        populateBitacoraSelectors(); // Asegurarse de que los selectores se actualicen al cargar bitácoras
    }

    function renderBitacorasTable() {
        bitacorasTableTbody.innerHTML = ''; // Limpiar tabla

        if (bitacoras.length === 0) {
            noBitacorasMessage.style.display = 'block';
            bitacorasPeriodTable.style.display = 'none';
            bitacorasPagination.style.display = 'none';
            return;
        }

        noBitacorasMessage.style.display = 'none';
        bitacorasPeriodTable.style.display = 'table';
        bitacorasPagination.style.display = 'flex';

        bitacoras.forEach((bitacora) => {
            const row = bitacorasTableTbody.insertRow();
            row.setAttribute('data-bitacora-id', bitacora.id);
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

    function updateOverallProgress() {
        const totalBitacoras = bitacoras.length;
        const progressPercentage = totalBitacoras > 0 ? (totalBitacoras % 5) * 20 : 0; // Ejemplo simple
        document.getElementById('overallProgress').textContent = `${progressPercentage}%`;
        document.getElementById('overallProgressBar').style.width = `${progressPercentage}%`;
    }

    // Maneja el envío del formulario de Bitácora
    bitacorasPeriodForm.addEventListener('submit', (e) => {
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
        bitacorasPeriodForm.reset();
        alert('Bitácora guardada con éxito!');
    });

    // Event Listeners para los botones de la tabla de Bitácoras
    function addBitacoraTableEventListeners() {
        document.querySelectorAll('.view-activities-btn').forEach(button => {
            button.onclick = (e) => {
                const bitacoraId = e.currentTarget.dataset.bitacoraId;
                const selectedBitacora = bitacoras.find(b => b.id == bitacoraId);

                if (selectedBitacora) {
                    localStorage.setItem('selectedBitacoraId', bitacoraId);
                    localStorage.setItem('selectedBitacoraInfo', JSON.stringify(selectedBitacora));

                    showSection('daily-activity-section');
                    currentBitacoraInfo.textContent = `${selectedBitacora.apprenticeName} - ${selectedBitacora.companyName}`;
                    loadDailyActivities(bitacoraId);

                    navItems.forEach(nav => nav.classList.remove('active'));
                    document.querySelector('.sidebar-nav .nav-item[data-target="daily-activity-section"]').classList.add('active');

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
                // TODO: Implementar aquí la lógica para cargar los datos de la bitácora en el formulario de edición
            };
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.onclick = (e) => {
                const bitacoraId = e.currentTarget.dataset.bitacoraId;
                if (confirm('¿Está seguro de que desea eliminar esta bitácora?')) {
                    bitacoras = bitacoras.filter(b => b.id != bitacoraId);
                    localStorage.setItem('bitacoras', JSON.stringify(bitacoras));

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
    function loadDailyActivities(bitacoraId) {
        activities = JSON.parse(localStorage.getItem('activities')) || {}; // Cargar todas las actividades
        currentBitacoraActivities = activities[bitacoraId] || [];
        renderDailyActivitiesTable();
    }

    function renderDailyActivitiesTable() {
        dailyActivitiesTableTbody.innerHTML = '';

        if (currentBitacoraActivities.length === 0) {
            noActivitiesMessage.style.display = 'block';
            dailyActivitiesTable.style.display = 'none';
            activitiesPagination.style.display = 'none';
            return;
        }

        noActivitiesMessage.style.display = 'none';
        dailyActivitiesTable.style.display = 'table';
        activitiesPagination.style.display = 'flex';

        currentBitacoraActivities.forEach((activity, index) => {
            const row = dailyActivitiesTableTbody.insertRow();
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
    dailyActivityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedBitacoraId = selectBitacoraForActivity ? selectBitacoraForActivity.value : localStorage.getItem('selectedBitacoraId');

        if (!selectedBitacoraId) {
            alert('Por favor, seleccione una bitácora primero para registrar actividades.');
            return;
        }

        const newActivity = {
            date: document.getElementById('activityDate').value,
            description: document.getElementById('activityDescription').value
        };

        activities = JSON.parse(localStorage.getItem('activities')) || {};
        if (!activities[selectedBitacoraId]) {
            activities[selectedBitacoraId] = [];
        }
        activities[selectedBitacoraId].push(newActivity);
        localStorage.setItem('activities', JSON.stringify(activities));

        loadDailyActivities(selectedBitacoraId); // Recargar actividades para la bitácora actual
        dailyActivityForm.reset();
        alert('Actividad diaria agregada con éxito!');
    });

    // Event Listeners para los botones de la tabla de Actividades Diarias
    function addActivityTableEventListeners() {
        document.querySelectorAll('.edit-activity-btn').forEach(button => {
            button.onclick = (e) => {
                const index = e.currentTarget.dataset.activityIndex;
                alert(`Editar actividad en índice: ${index}`);
                // TODO: Lógica para cargar actividad en el formulario de edición
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

    // --- Funciones para manejar los selectores de Bitácoras ---
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

    // Listeners para los selectores de bitácoras
    if (selectBitacoraForActivity) {
        selectBitacoraForActivity.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            if (selectedId) {
                const selectedBitacora = bitacoras.find(b => b.id == selectedId);
                localStorage.setItem('selectedBitacoraId', selectedId);
                localStorage.setItem('selectedBitacoraInfo', JSON.stringify(selectedBitacora));
                currentBitacoraInfo.textContent = `${selectedBitacora.apprenticeName} - ${selectedBitacora.companyName}`;
                loadDailyActivities(selectedId);
            } else {
                localStorage.removeItem('selectedBitacoraId');
                localStorage.removeItem('selectedBitacoraInfo');
                currentBitacoraInfo.textContent = 'Ninguna seleccionada';
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
                pdfContentPreview.innerHTML = '<p class="no-data-message">Selecciona una bitácora para previsualizar el PDF.</p>';
                generatePdfBtn.style.display = 'none';
                generateExcelBtn.style.display = 'none'; // También oculta el botón de Excel si no hay bitácora
            }
        });
    }

    // --- Lógica para Generar PDF (jspdf, html2canvas) ---
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

                const margin = 10; // mm

                // Temporarily hide elements not meant for PDF (like action buttons in tables)
                const buttonsToHide = pdfContent.querySelectorAll('.action-buttons, .btn'); // Selecciona cualquier botón o elemento de acción
                buttonsToHide.forEach(btn => btn.style.display = 'none');

                const canvas = await html2canvas(pdfContent, {
                    scale: 2, // Increase scale for better quality
                    useCORS: true, // If images are from another origin
                    logging: false, // Set to true for debugging html2canvas issues
                    allowTaint: true // Allow images from other origins (if any)
                });

                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 190; // A4 width minus margins (210mm - 2*10mm)
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let position = margin;
                const pageHeight = doc.internal.pageSize.getHeight();

                if (imgHeight < pageHeight - margin) {
                    doc.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
                } else {
                    let heightLeft = imgHeight;
                    let currentY = 0;

                    while (heightLeft > 0) {
                        if (currentY > 0) {
                            doc.addPage();
                        }
                        const sX = 0;
                        // Calculate the source Y position on the canvas
                        const sY = (currentY / imgHeight) * canvas.height;
                        const sWidth = canvas.width;
                        // Calculate the source height to fit one PDF page
                        const sHeight = Math.min(canvas.height - sY, ((pageHeight - margin) / imgHeight) * canvas.height);

                        // Create a temporary canvas for the current section
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = sWidth;
                        tempCanvas.height = sHeight;
                        tempCanvas.getContext('2d').drawImage(canvas, sX, sY, sWidth, sHeight, 0, 0, sWidth, sHeight);

                        doc.addImage(tempCanvas.toDataURL('image/png'), 'PNG', margin, margin, imgWidth, (sHeight * imgWidth) / sWidth);

                        // Update height left and current Y position
                        heightLeft -= (pageHeight - margin);
                        currentY += (pageHeight - margin);
                    }
                }

                const selectedBitacora = bitacoras.find(b => b.id == selectedPdfBitacoraId);
                const fileName = `Bitacora_${selectedBitacora ? selectedBitacora.apprenticeName : 'Desconocido'}_${selectedPdfBitacoraId}.pdf`;
                doc.save(fileName);

            } catch (error) {
                console.error('Error al generar el PDF:', error);
                alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
            } finally {
                generatePdfBtn.textContent = 'Generar y Descargar PDF';
                generatePdfBtn.disabled = false;
                // Restore hidden elements
                const buttonsToHide = pdfContent.querySelectorAll('.action-buttons, .btn');
                buttonsToHide.forEach(btn => btn.style.display = ''); // Restore default display
            }
        });
    }

    // --- Lógica para Generar Excel (xlsx.full.min.js, FileSaver.js) ---
    if (generateExcelBtn) {
        generateExcelBtn.addEventListener('click', () => {
            const selectedExcelBitacoraId = selectBitacoraForPdf ? selectBitacoraForPdf.value : null;

            if (!selectedExcelBitacoraId) {
                alert('Por favor, selecciona una bitácora para generar el Excel.');
                return;
            }

            generateExcelFile(selectedExcelBitacoraId); // Renombrado para evitar conflicto con la función interna
        });
    }

    function generateExcelFile(bitacoraId) { // Renombrado a generateExcelFile
        const selectedBitacora = bitacoras.find(b => b.id == bitacoraId);
        if (!selectedBitacora) {
            alert('Bitácora no encontrada para generar Excel.');
            return;
        }

        const activitiesForExcel = (activities[bitacoraId] || []);

        // Preparar los datos para la primera hoja (Información de la Bitácora)
        const bitacoraData = [
            ["Campo", "Valor"],
            ["N° Bitácora", selectedBitacora.id],
            ["Fecha Inicio", selectedBitacora.startDate],
            ["Fecha Fin", selectedBitacora.endDate],
            ["Empresa", selectedBitacora.companyName],
            ["Jefe Inmediato", selectedBitacora.bossName],
            ["Teléfono Jefe", selectedBitacora.bossPhone],
            ["Correo Jefe", selectedBitacora.bossEmail],
            ["Tipo de Vínculo", selectedBitacora.vinculationType],
            ["Aprendiz", selectedBitacora.apprenticeName],
            ["Teléfono Aprendiz", selectedBitacora.apprenticePhone],
            ["Correo Aprendiz", selectedBitacora.apprenticeEmail]
        ];

        // Preparar los datos para la segunda hoja (Actividades Diarias)
        const activityHeaders = ["Fecha", "Descripción"];
        const activityRows = activitiesForExcel.map(activity => [activity.date, activity.description]);
        const activitiesSheetData = [activityHeaders, ...activityRows];

        // Crear un nuevo libro de trabajo
        const wb = XLSX.utils.book_new();

        // Añadir la hoja de información de la Bitácora
        const ws1 = XLSX.utils.aoa_to_sheet(bitacoraData);
        XLSX.utils.book_append_sheet(wb, ws1, "Información Bitácora");

        // Añadir la hoja de Actividades Diarias
        const ws2 = XLSX.utils.aoa_to_sheet(activitiesSheetData);
        XLSX.utils.book_append_sheet(wb, ws2, "Actividades Diarias");

        // Generar el archivo binario
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        try {
            // Usar FileSaver.js para descargar el archivo
            saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `Bitacora_${selectedBitacora.apprenticeName}_${selectedBitacora.id}.xlsx`);
            alert('Excel generado y descargado con éxito!');
        } catch (e) {
            console.error("Error al guardar el archivo Excel:", e);
            alert('Hubo un error al generar o descargar el archivo Excel.');
        }
    }

    // --- Función Global para Previsualizar el Contenido del PDF ---
    // Esta función debe ser global (o estar en window) para que el evento 'change' del selector pueda llamarla.
    window.previewPdfContent = function(bitacoraId) {
        const selectedBitacora = bitacoras.find(b => b.id == bitacoraId);
        if (!selectedBitacora) {
            pdfContentPreview.innerHTML = '<p class="no-data-message">Bitácora no encontrada.</p>';
            generatePdfBtn.style.display = 'none';
            generateExcelBtn.style.display = 'none'; // Oculta también el botón de Excel
            return;
        }

        const activitiesForPdf = (activities[bitacoraId] || []);

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

        pdfContentPreview.innerHTML = `
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
        generateExcelBtn.style.display = 'block'; // Muestra el botón de generar Excel
    };

    // --- Lógica Inicial al cargar la página ---
    // Muestra la sección de Bitácoras por defecto al cargar
    showSection('bitacoras-section');
    // Activa el elemento del menú 'Bitácoras' visualmente
    document.querySelector('.sidebar-nav .nav-item[data-target="bitacoras-section"]').classList.add('active');
    loadBitacorasPeriods(); // Carga y renderiza los datos iniciales
});

// js/script.js

// --- Funciones para manejo de datos (asegúrate de que existan o adapta) ---
// Estas funciones simulan la obtención de datos, reemplázalas con tu lógica real
const getBitacorasPeriodos = () => {
    return JSON.parse(localStorage.getItem('bitacorasPeriodos')) || [];
};

const getDailyActivities = () => {
    return JSON.parse(localStorage.getItem('dailyActivities')) || [];
};


// --- Gráficos de Dashboard ---
let bitacorasProgressChart;
let activityTypeChart;
let bitacoraStatusChart;
let hoursPerWeekChart;

// Función para actualizar el progreso de la barra y el texto (ya existente, la revisamos)
const updateBitacoraProgress = () => {
    const bitacoras = getBitacorasPeriodos();
    const totalBitacorasEsperadas = 12; // Define tu total esperado aquí
    const bitacorasCompletadas = bitacoras.length;

    const percentage = (bitacorasCompletadas / totalBitacorasEsperadas) * 100;

    const progressBar = document.getElementById('bitacoras-progress-bar');
    const completedText = document.getElementById('bitacoras-completed-text');
    const totalText = document.getElementById('bitacoras-total-text');

    if (progressBar) {
        progressBar.style.width = `${Math.min(percentage, 100)}%`; // No más del 100% visualmente
    }
    if (completedText) {
        completedText.textContent = bitacorasCompletadas;
    }
    if (totalText) {
        totalText.textContent = totalBitacorasEsperadas;
    }

    // Llama a la función de actualización de los gráficos cada vez que el progreso cambie
    updateDashboardCharts();
};


// Función principal para dibujar y actualizar todos los gráficos
const updateDashboardCharts = () => {
    const bitacoras = getBitacorasPeriodos();
    const activities = getDailyActivities();

    // --- 1. Gráfico de Progreso de Bitácoras (Dona/Anillo) ---
    const totalBitacorasEsperadas = 12; // Ajusta según tu lógica real
    const bitacorasCreadas = bitacoras.length;
    const bitacorasPendientes = Math.max(0, totalBitacorasEsperadas - bitacorasCreadas);
    const bitacorasExcedentes = Math.max(0, bitacorasCreadas - totalBitacorasEsperadas);

    const bitacorasData = {
        labels: ['Bitácoras Creadas', 'Bitácoras Pendientes', 'Bitácoras Excedentes'],
        datasets: [{
            data: [bitacorasCreadas, bitacorasPendientes, bitacorasExcedentes],
            backgroundColor: [
                'var(--color-primary-green)', // Verde para creadas
                'var(--color-medium-gray)',   // Gris para pendientes
                'var(--color-warning)'        // Amarillo/naranja para excedentes
            ],
            hoverOffset: 4
        }]
    };

    const bitacorasConfig = {
        type: 'doughnut', // Gráfico de dona
        data: bitacorasData,
        options: {
            responsive: true,
            maintainAspectRatio: false, // Permite que el tamaño del canvas sea flexible
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false, // El título ya está en el HTML
                }
            }
        }
    };

    const bitacorasProgressCtx = document.getElementById('bitacorasProgressChart');
    if (bitacorasProgressCtx) {
        if (bitacorasProgressChart) {
            bitacorasProgressChart.destroy(); // Destruye el gráfico existente antes de crear uno nuevo
        }
        bitacorasProgressChart = new Chart(bitacorasProgressCtx, bitacorasConfig);
    }


    // --- 2. Gráfico de Distribución de Actividades por Tipo (Barras) ---
    const activityTypes = {};
    activities.forEach(activity => {
        // Asumiendo que cada actividad tiene una propiedad 'tipo'
        // Puedes ajustar esto según la estructura de tus datos
        const tipo = activity.tipoActividad || 'Sin Tipo'; // Ejemplo: 'tipoActividad' o 'category'
        activityTypes[tipo] = (activityTypes[tipo] || 0) + 1;
    });

    const activityTypeLabels = Object.keys(activityTypes);
    const activityTypeCounts = Object.values(activityTypes);

    const activityTypeData = {
        labels: activityTypeLabels,
        datasets: [{
            label: 'Número de Actividades',
            data: activityTypeCounts,
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(201, 203, 207, 0.6)'
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(201, 203, 207, 1)'
            ],
            borderWidth: 1
        }]
    };

    const activityTypeConfig = {
        type: 'bar', // Gráfico de barras
        data: activityTypeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (Number.isInteger(value)) {
                                return value;
                            }
                        }
                    }
                }
            }
        }
    };

    const activityTypeCtx = document.getElementById('activityTypeChart');
    if (activityTypeCtx) {
        if (activityTypeChart) {
            activityTypeChart.destroy();
        }
        activityTypeChart = new Chart(activityTypeCtx, activityTypeConfig);
    }

    // --- 3. Gráfico de Estado de Bitácoras (Dona/Anillo) - OPCIONAL ---
    // Si tus bitácoras tienen un campo 'estado' (e.g., 'Aprobada', 'Pendiente', 'Rechazada')
    const bitacoraStatuses = {};
    bitacoras.forEach(bitacora => {
        const estado = bitacora.estado || 'Desconocido'; // Asume un campo 'estado'
        bitacoraStatuses[estado] = (bitacoraStatuses[estado] || 0) + 1;
    });

    const bitacoraStatusLabels = Object.keys(bitacoraStatuses);
    const bitacoraStatusCounts = Object.values(bitacoraStatuses);

    const bitacoraStatusData = {
        labels: bitacoraStatusLabels,
        datasets: [{
            data: bitacoraStatusCounts,
            backgroundColor: [
                'var(--color-success)', // Aprobada
                'var(--color-warning)', // Pendiente
                'var(--color-danger)',  // Rechazada
                'var(--color-medium-gray)' // Otros
            ],
            hoverOffset: 4
        }]
    };

    const bitacoraStatusConfig = {
        type: 'doughnut',
        data: bitacoraStatusData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: false,
                }
            }
        }
    };

    const bitacoraStatusCtx = document.getElementById('bitacoraStatusChart');
    if (bitacoraStatusCtx) {
        if (bitacoraStatusChart) {
            bitacoraStatusChart.destroy();
        }
        bitacoraStatusChart = new Chart(bitacoraStatusCtx, bitacoraStatusConfig);
    }


    // --- 4. Gráfico de Horas Registradas por Semana (Líneas) - OPCIONAL ---
    // Esto es más complejo y requiere agrupar actividades por semana
    // Para simplificar, aquí un ejemplo básico que puedes expandir
    const hoursByWeek = {};
    activities.forEach(activity => {
        if (activity.fecha && activity.horas) { // Asume 'fecha' y 'horas'
            const date = new Date(activity.fecha);
            // Esto es una simplificación, una lógica de semana real sería más compleja
            // Para propósitos de ejemplo, agrupemos por mes.
            const month = date.toLocaleString('es', { month: 'short', year: 'numeric' });
            hoursByWeek[month] = (hoursByWeek[month] || 0) + parseFloat(activity.horas);
        }
    });

    const hoursLabels = Object.keys(hoursByWeek);
    const hoursCounts = Object.values(hoursByWeek);

    const hoursPerWeekData = {
        labels: hoursLabels,
        datasets: [{
            label: 'Horas Registradas',
            data: hoursCounts,
            borderColor: 'var(--color-dark-purple)',
            backgroundColor: 'rgba(0, 255, 38, 0.2)', // Color con opacidad
            tension: 0.3, // Suaviza la línea
            fill: true,
            pointBackgroundColor: 'var(--color-primary-green)'
        }]
    };

    const hoursPerWeekConfig = {
        type: 'line',
        data: hoursPerWeekData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Horas'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Período'
                    }
                }
            }
        }
    };

    const hoursPerWeekCtx = document.getElementById('hoursPerWeekChart');
    if (hoursPerWeekCtx) {
        if (hoursPerWeekChart) {
            hoursPerWeekChart.destroy();
        }
        hoursPerWeekChart = new Chart(hoursPerWeekCtx, hoursPerWeekConfig);
    }
};

// Llama a la función para actualizar los gráficos cuando la página se carga
// y también cuando se navega al dashboard.
document.addEventListener('DOMContentLoaded', updateDashboardCharts);

// Asegúrate de llamar updateDashboardCharts cuando el dashboard se hace visible
// Esto debería estar en tu función de manejo de navegación (ej. showSection)
// Ejemplo:
// const showSection = (sectionId) => {
//     document.querySelectorAll('main > section').forEach(section => {
//         section.style.display = 'none';
//     });
//     const targetSection = document.getElementById(sectionId);
//     if (targetSection) {
//         targetSection.style.display = 'block';
//         if (sectionId === 'dashboard-section') {
//             updateDashboardCharts(); // <-- Llama la función cuando el dashboard es visible
//             updateBitacoraProgress(); // Asegura que la barra de progreso también se actualice
//         }
//     }
//     closeSidebar();
// };

// Asegúrate de que tu `DOMContentLoaded` o tu lógica de carga inicial llame a `updateBitacoraProgress`
// y a `updateDashboardCharts` para que los gráficos se carguen cuando la página esté lista.
document.addEventListener('DOMContentLoaded', () => {
    // ... tu lógica de carga existente ...
    updateBitacoraProgress(); // Para que la barra de progreso y los gráficos se carguen al inicio
    // Asegúrate de que esta línea esté después de que tus datos de localStorage estén cargados o mockeados.
});