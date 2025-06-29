// Global variables
let currentUser = null;

// Show login form
function showLoginForm() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (data.success) {
                currentUser = data.user;
                document.getElementById('loginButton').innerHTML = `
                    <a class="nav-link" href="#" onclick="logout()">${currentUser.email} (Logout)</a>
                `;
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            } else {
                alert('Login failed: ' + data.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });
}

// Logout function
function logout() {
    currentUser = null;
    document.getElementById('loginButton').innerHTML = `
        <a class="nav-link" href="#" onclick="showLoginForm()">Login</a>
    `;
    loadModule('home');
}

// Initialize Google API when the page loads
document.addEventListener('DOMContentLoaded', () => {
    gapi.load('client:auth2', initGoogleAPI);
    loadModule('home');
});

async function initGoogleAPI() {
    try {
        await sheetsAPI.init();
    } catch (error) {
        console.error('Failed to initialize Google API:', error);
        alert('Failed to initialize application. Please check your internet connection and try again.');
    }
}

// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize module loading
    loadModule('home');

    // Add event listeners for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const module = e.target.getAttribute('onclick');
            if (module) {
                const moduleName = module.match(/loadModule\('(.+)'\)/)[1];
                loadModule(moduleName);
            }
        });
    });
});

// Function to load module content
async function loadModule(moduleName) {
    const mainContent = document.getElementById('mainContent');
    const loadingSpinner = document.getElementById('loadingSpinner');

    try {
        // Check if authentication is required for non-home modules
        if (moduleName !== 'home' && !accessToken) {
            showError('Please sign in to access this feature.');
            return;
        }

        loadingSpinner.classList.remove('d-none');
        
        // Load the module content
        const response = await fetch(`modules/${moduleName}.html`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        
        // Extract script content before updating the DOM
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
        let scriptContent = '';
        if (scriptMatch) {
            scriptContent = scriptMatch[1];
        }
        
        // Update the main content area (without script tags)
        const contentWithoutScript = content.replace(/<script>[\s\S]*?<\/script>/g, '');
        mainContent.innerHTML = contentWithoutScript;

        // Execute the script content to make functions globally available
        if (scriptContent) {
            console.log('Executing module script content...');
            try {
                // Create a function from the script content and execute it
                const scriptFunction = new Function(scriptContent);
                scriptFunction();
                console.log('Module script executed successfully');
            } catch (scriptError) {
                console.error('Error executing module script:', scriptError);
            }
        }

        // Initialize any module-specific functionality
        console.log('Looking for init function for module:', moduleName);
        const initFunctionName = `init${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}`;
        console.log('Init function name:', initFunctionName);
        
        if (typeof window[initFunctionName] === 'function') {
            console.log('Calling init function:', initFunctionName);
            window[initFunctionName]();
        } else {
            console.log('Init function not found:', initFunctionName);
            // Try alternative naming
            const altInitFunctionName = `init${moduleName}`;
            if (typeof window[altInitFunctionName] === 'function') {
                console.log('Calling alternative init function:', altInitFunctionName);
                window[altInitFunctionName]();
            } else {
                console.log('Alternative init function also not found:', altInitFunctionName);
            }
        }

    } catch (error) {
        console.error('Error loading module:', error);
        mainContent.innerHTML = '<div class="alert alert-danger">Error loading content. Please try again later.</div>';
    } finally {
        loadingSpinner.classList.add('d-none');
    }
}

// Helper function to show loading spinner
function showLoading() {
    document.getElementById('loadingSpinner').classList.remove('d-none');
}

// Helper function to hide loading spinner
function hideLoading() {
    document.getElementById('loadingSpinner').classList.add('d-none');
}

// Helper function to show error message
function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.getElementById('mainContent').prepend(alertDiv);
}

// Load data for specific modules
async function loadModuleData(moduleName) {
    try {
        console.log(`=== loadModuleData called for ${moduleName} ===`);
        
        // Use readUserDataFromSheet to get user-specific data in the correct format
        const data = await readUserDataFromSheet(moduleName);
        console.log(`Data received for ${moduleName}:`, data);
        
        const tableBody = document.getElementById(`${moduleName}TableBody`);
        console.log(`Table body element for ${moduleName}:`, tableBody);
        
        if (!tableBody) {
            console.log(`Table body not found for ${moduleName}`);
            return;
        }

        tableBody.innerHTML = '';
        if (data && data.length > 0) {
            console.log(`Processing ${data.length} records for ${moduleName}`);
            data.forEach((row, index) => {
                console.log(`Processing row ${index} for ${moduleName}:`, row);
                const tr = document.createElement('tr');
                switch (moduleName) {
                    case 'identitas':
                        tr.innerHTML = createIdentitasRow(row);
                        break;
                    case 'pemeriksaan':
                        tr.innerHTML = createPemeriksaanRow(row);
                        break;
                    case 'laboratorium':
                        tr.innerHTML = createLaboratoriumRow(row);
                        break;
                    case 'persalinan':
                        tr.innerHTML = createPersalinanRow(row);
                        break;
                    case 'nifas':
                        tr.innerHTML = createNifasRow(row);
                        break;
                    case 'anc':
                        console.log(`Creating ANC row with data:`, row);
                        tr.innerHTML = createANCRow(row);
                        console.log(`ANC row HTML:`, tr.innerHTML);
                        break;
                }
                tableBody.appendChild(tr);
            });
            console.log(`Loaded ${data.length} records for ${moduleName}`);
        } else {
            console.log(`No data found for ${moduleName}`);
            // Add a "no data" row
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="10" class="text-center">Belum ada data ${moduleName}</td>`;
            tableBody.appendChild(tr);
        }
    } catch (error) {
        console.error(`Error loading data for ${moduleName}:`, error);
        // Don't show alert for data loading errors, just log them
        console.log('Data loading failed, but this is not critical');
    }
}

// Row creation functions for each module
function createIdentitasRow(data) {
    return `
        <td>${data.id}</td>
        <td>${data.nik}</td>
        <td>${data.nama_ibu}</td>
        <td>${data.alamat}</td>
        <td>
            <button class="btn btn-sm btn-info" onclick="viewData('identitas', '${data.id}')">View</button>
            <button class="btn btn-sm btn-warning" onclick="editData('identitas', '${data.id}')">Edit</button>
        </td>
    `;
}

function createPemeriksaanRow(data) {
    return `
        <td>${data[0] || ''}</td>
        <td>${data[1] || ''}</td>
        <td>${data[2] || ''}</td>
        <td>${data[3] || ''}</td>
        <td>${data[4] || ''}</td>
        <td>${data[5] || ''}</td>
        <td>${data[6] || ''}</td>
        <td>${data[7] || ''}</td>
        <td>${data[8] || ''}</td>
        <td>${data[9] || ''}</td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="deletePemeriksaan('${data[data.length - 1] || ''}')">
                Hapus
            </button>
        </td>
    `;
}

function createLaboratoriumRow(data) {
    return `
        <td>${data[0] || ''}</td>
        <td>${data[1] || ''}</td>
        <td>${data[2] || ''}</td>
        <td>${data[3] || ''}</td>
        <td>${data[4] || ''}</td>
        <td>${data[5] || ''}</td>
        <td>${data[6] || ''}</td>
        <td>${data[7] || ''}</td>
        <td>${data[8] || ''}</td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="deleteLaboratorium('${data[9] || ''}')">
                Hapus
            </button>
        </td>
    `;
}

function createPersalinanRow(data) {
    return `
        <td>${data[0] || ''}</td>
        <td>${data[1] || ''}</td>
        <td>${data[2] || ''}</td>
        <td>${data[3] || ''}</td>
        <td>${data[4] || ''}</td>
        <td>${data[5] || ''}</td>
        <td>${data[6] || ''}</td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="deletePersalinan('${data[7] || ''}')">
                Hapus
            </button>
        </td>
    `;
}

function createNifasRow(data) {
    return `
        <td>${data[0] || ''}</td>
        <td>${data[1] || ''}</td>
        <td>${data[2] || ''}</td>
        <td>${data[3] || ''}</td>
        <td>${data[4] || ''}</td>
        <td>${data[5] || ''}</td>
        <td>${data[6] || ''}</td>
        <td>${data[7] || ''}</td>
        <td>${data[8] || ''}</td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="deleteNifas('${data[9] || ''}')">
                Hapus
            </button>
        </td>
    `;
}

function createANCRow(data) {
    return `
        <td>${data[1] || ''}</td>
        <td>${data[2] || ''}</td>
        <td>${data[3] || ''}</td>
        <td>${data[4] || ''}</td>
        <td>${data[5] || ''}</td>
        <td>${data[6] || ''}</td>
        <td>${data[7] || ''}</td>
        <td>${data[8] || ''}</td>
        <td>${data[9] || ''}</td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="deleteAnc('${data[0] || ''}')">
                Hapus
            </button>
        </td>
    `;
}

// Generic save function for all modules
async function saveData(moduleName, formData) {
    try {
        // Generate ID if it's a new record
        if (!formData.id && !formData.id_trx) {
            const prefix = moduleName === 'identitas' ? 'ID' : 'TRX';
            formData[moduleName === 'identitas' ? 'id' : 'id_trx'] = sheetsAPI.generateId(prefix);
        }

        const success = await sheetsAPI.appendRow(moduleName, formData);
        if (success) {
            alert('Data saved successfully');
            loadModuleData(moduleName);
            return true;
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save data. Please try again.');
    }
    return false;
}

// View and edit functions
async function viewData(moduleName, id) {
    try {
        const data = await sheetsAPI.findRows(moduleName, moduleName === 'identitas' ? 'id' : 'id_trx', id);
        if (data && data.length > 0) {
            populateForm(moduleName, data[0], true); // true for view mode (readonly)
        }
    } catch (error) {
        console.error('Error viewing data:', error);
        alert('Failed to load data for viewing');
    }
}

async function editData(moduleName, id) {
    try {
        const data = await sheetsAPI.findRows(moduleName, moduleName === 'identitas' ? 'id' : 'id_trx', id);
        if (data && data.length > 0) {
            populateForm(moduleName, data[0], false); // false for edit mode
        }
    } catch (error) {
        console.error('Error editing data:', error);
        alert('Failed to load data for editing');
    }
}

// Helper function to populate form fields
function populateForm(moduleName, data, readonly = false) {
    const form = document.getElementById(`${moduleName}Form`);
    if (!form) return;

    for (const [key, value] of Object.entries(data)) {
        const input = form.elements[key];
        if (input) {
            input.value = value;
            input.readOnly = readonly;
        }
    }
}

// Global test functions for admin panel
async function testDataEntry() {
    const testResults = document.getElementById('testResults');
    if (!testResults) {
        console.error('Test results element not found');
        return;
    }
    
    testResults.innerHTML = '<div class="spinner-border spinner-border-sm"></div> Testing data entry...';
    
    try {
        // Test data for identitas
        const testData = [
            '1234567890123456', // NIK
            '2024', // Tahun
            'Test Ibu', // Nama Ibu
            'Test Suami', // Nama Suami
            'Test Alamat', // Alamat
            'BPJS', // Sumber Pembiayaan
            '25', // Usia Bidan
            'Test Dusun', // Dusun
            'Test Desa', // Desa
            'Test Kecamatan', // Kecamatan
            new Date().toISOString() // Timestamp
        ];
        
        console.log('Testing data entry with:', testData);
        await appendUserDataToSheet('Identitas', testData, true);
        
        testResults.innerHTML = '<div class="alert alert-success">✅ Test data saved successfully!</div>';
        
        // Refresh admin data if function exists
        if (typeof loadAllAdminData === 'function') {
            await loadAllAdminData();
        }
        
    } catch (error) {
        console.error('Test data entry failed:', error);
        testResults.innerHTML = `<div class="alert alert-danger">❌ Test failed: ${error.message}</div>`;
    }
}

async function testReadData() {
    const testResults = document.getElementById('testResults');
    if (!testResults) {
        console.error('Test results element not found');
        return;
    }
    
    testResults.innerHTML = '<div class="spinner-border spinner-border-sm"></div> Testing data read...';
    
    try {
        const data = await readUserDataFromSheet('Identitas');
        console.log('Test read result:', data);
        
        testResults.innerHTML = `
            <div class="alert alert-info">
                ✅ Test read completed<br>
                <strong>Records found:</strong> ${data.length}<br>
                <small>Check browser console for detailed data</small>
            </div>
        `;
        
    } catch (error) {
        console.error('Test data read failed:', error);
        testResults.innerHTML = `<div class="alert alert-danger">❌ Test failed: ${error.message}</div>`;
    }
}

// Add simple test function for basic Google Sheets API
async function testSimpleAppend() {
    try {
        console.log('=== Testing simple append ===');
        console.log('Sheets initialized:', sheetsInitialized);
        console.log('GAPI available:', !!gapi);
        console.log('GAPI client available:', !!gapi?.client);
        console.log('GAPI sheets available:', !!gapi?.client?.sheets);
        
        const testData = [['Test', '123', 'Simple Test', new Date().toISOString()]];
        
        console.log('Attempting to append test data:', testData);
        const result = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: 'Identitas!A:ZZ',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: testData
            }
        });
        
        console.log('Simple append successful:', result);
        alert('Simple test successful! Check console for details.');
        
    } catch (error) {
        console.error('Simple test failed:', error);
        alert('Simple test failed: ' + error.message);
    }
}

// Manual initialization function for testing
function manualInit() {
    console.log('Manual init called from main.js');
    // Try to call the module's init function if it exists
    if (typeof initIdentitas === 'function') {
        initIdentitas();
    } else {
        console.log('initIdentitas function not found, checking if we can access the form directly');
        const form = document.getElementById('identitasForm');
        if (form) {
            console.log('Form found, attaching event listener');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                alert('Form submitted! Starting save process...');
                console.log('Form submit event triggered');
                await saveIdentitasData();
            });
            console.log('Event listener attached');
        } else {
            console.error('Form element not found');
        }
    }
}

// Direct test function to save form data
async function testFormSave() {
    console.log('=== testFormSave called ===');
    
    try {
        // Get form data manually with correct field names
        const formData = [
            document.getElementById('nik').value,
            document.getElementById('tahun').value,
            document.getElementById('nama_ibu').value,
            document.getElementById('nama_suami').value,
            document.getElementById('alamat').value,
            document.getElementById('sumber_pembiayaan').value,
            document.getElementById('no_pembiayaan').value,
            document.getElementById('usia_ibu').value,
            document.getElementById('dusun').value,
            document.getElementById('kabupaten').value,
            document.getElementById('kecamatan').value,
            document.getElementById('desa').value,
            new Date().toISOString()
        ];
        
        console.log('Form data collected:', formData);
        
        // Allow empty fields - just log which ones are empty for information
        const requiredFields = formData.slice(0, -1);
        const emptyFields = [];
        requiredFields.forEach((value, index) => {
            if (!value || value.trim() === '') {
                const fieldNames = ['NIK', 'Tahun', 'Nama Ibu', 'Nama Suami', 'Alamat', 'Sumber Pembiayaan', 'Nomor Pembiayaan', 'Usia Ibu', 'Dusun', 'Kabupaten', 'Kecamatan', 'Desa'];
                emptyFields.push(fieldNames[index]);
            }
        });
        
        if (emptyFields.length > 0) {
            console.log('Empty fields (allowed):', emptyFields.join(', '));
        }
        
        // Check for duplicate data before saving
        const tahun = formData[1];
        const nama_ibu = formData[2];
        const nama_suami = formData[3];
        const desa = formData[11];
        const kecamatan = formData[10];
        
        console.log('=== DUPLICATE CHECK CALL ===');
        console.log('Checking for duplicates with fields:', { tahun, nama_ibu, nama_suami, desa, kecamatan });
        console.log('Form data array:', formData);
        console.log('Field indices - tahun[1]:', formData[1], 'nama_ibu[2]:', formData[2], 'nama_suami[3]:', formData[3], 'desa[11]:', formData[11], 'kecamatan[10]:', formData[10]);
        
        console.log('About to call checkIdentitasDuplicate...');
        console.log('Function exists:', typeof checkIdentitasDuplicate);
        
        if (typeof checkIdentitasDuplicate !== 'function') {
            console.error('checkIdentitasDuplicate function not found!');
            throw new Error('Duplicate checking function not available. Please refresh the page.');
        }
        
        const isDuplicate = await checkIdentitasDuplicate(tahun, nama_ibu, nama_suami, desa, kecamatan);
        console.log('checkIdentitasDuplicate returned:', isDuplicate);
        
        if (isDuplicate) {
            console.log('DUPLICATE DETECTED - throwing error');
            const errorMessage = 'Data dengan kombinasi Tahun, Nama Ibu, Nama Suami, Desa, dan Kecamatan yang sama sudah ada. Silakan cek data yang sudah tersimpan.';
            console.log('Throwing error with message:', errorMessage);
            throw new Error(errorMessage);
        }
        
        console.log('No duplicates found, proceeding with save...');
        
        console.log('Calling appendUserDataToSheet...');
        await appendUserDataToSheet('Identitas', formData, true);
        console.log('Data saved successfully!');
        alert('Data saved successfully!');
        
    } catch (error) {
        console.error('=== ERROR IN testFormSave ===');
        console.error('Error type:', typeof error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Global save function for Pemeriksaan
async function savePemeriksaanData() {
    console.log('=== savePemeriksaanData called ===');
    
    try {
        // Ensure user is properly initialized
        if (!currentUserId) {
            console.log('User ID not set, initializing user...');
            if (userProfile && userProfile.email) {
                await createOrGetUser(userProfile.email);
            } else {
                throw new Error('User not signed in properly. Please refresh and sign in again.');
            }
        }
        
        const formData = [
            document.getElementById('status_gpa').value,
            document.getElementById('jarak_kehamilan').value,
            document.getElementById('hpht').value,
            document.getElementById('taksiran_persalinan').value,
            document.getElementById('tb').value,
            document.getElementById('lila').value,
            document.getElementById('status_imunisasi_td').value,
            document.getElementById('injeksi_td').value,
            document.getElementById('skrining_tbc').value,
            document.getElementById('skrining_jiwa').value,
            document.getElementById('konseling').value,
            document.getElementById('komplikasi').value,
            document.getElementById('tata_laksana_kasus_bumil').value,
            new Date().toISOString()
        ];
        
        console.log('Pemeriksaan form data collected:', formData);
        
        // Check if all required fields are filled
        const requiredFields = formData.slice(0, -1);
        if (requiredFields.some(field => !field || field.trim() === '')) {
            alert('Please fill in all required fields.');
            return;
        }
        
        console.log('Calling appendUserDataToSheet for Pemeriksaan...');
        await appendUserDataToSheet('Pemeriksaan', formData, false);
        console.log('Pemeriksaan data saved successfully!');
        alert('Data pemeriksaan berhasil disimpan!');
        
        // Clear form and reload data
        if (typeof clearPemeriksaanForm === 'function') {
            clearPemeriksaanForm();
        }
        if (typeof loadPemeriksaanData === 'function') {
            loadPemeriksaanData();
        }
        
    } catch (error) {
        console.error('Error in savePemeriksaanData:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Global clear function for Pemeriksaan
function clearPemeriksaanForm() {
    document.getElementById('pemeriksaanForm').reset();
    // Reset mother selection to first option
    const motherSelect = document.getElementById('selected_mother');
    if (motherSelect) {
        motherSelect.selectedIndex = 0;
    }
}

// Global save function for Laboratorium
async function saveLaboratoriumData() {
    console.log('=== saveLaboratoriumData called ===');
    
    try {
        if (!currentUserId) {
            if (userProfile && userProfile.email) {
                await createOrGetUser(userProfile.email);
            } else {
                throw new Error('User not signed in properly. Please refresh and sign in again.');
            }
        }
        
        const formData = [
            document.getElementById('lab_hb').value,
            document.getElementById('golda').value,
            document.getElementById('protein_urin').value,
            document.getElementById('glukosa_urin').value,
            document.getElementById('hiv').value,
            document.getElementById('sifilis').value,
            document.getElementById('hbsag').value,
            document.getElementById('tbc_mikroskopis').value,
            document.getElementById('malaria').value,
            document.getElementById('lain_lain').value,
            new Date().toISOString()
        ];
        
        console.log('Laboratorium form data collected:', formData);
        
        const requiredFields = formData.slice(0, -1);
        if (requiredFields.some(field => !field || field.trim() === '')) {
            alert('Please fill in all required fields.');
            return;
        }
        
        await appendUserDataToSheet('Laboratorium', formData, false);
        alert('Data laboratorium berhasil disimpan!');
        
        if (typeof clearLabForm === 'function') {
            clearLabForm();
        }
        if (typeof loadLaboratoriumData === 'function') {
            loadLaboratoriumData();
        }
        
    } catch (error) {
        console.error('Error in saveLaboratoriumData:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Global save function for Persalinan
async function savePersalinanData() {
    console.log('=== savePersalinanData called ===');
    
    try {
        if (!currentUserId) {
            if (userProfile && userProfile.email) {
                await createOrGetUser(userProfile.email);
            } else {
                throw new Error('User not signed in properly. Please refresh and sign in again.');
            }
        }
        
        const formData = [
            document.getElementById('tgl_persalinan').value,
            document.getElementById('tempat_persalinan').value,
            document.getElementById('cara_persalinan').value,
            document.getElementById('penolong_persalinan').value,
            document.getElementById('berat_bayi_lebih_2500').value,
            document.getElementById('berat_bayi_kurang_2500').value,
            document.getElementById('penyulit_persalinan').value,
            new Date().toISOString()
        ];
        
        console.log('Persalinan form data collected:', formData);
        
        const requiredFields = formData.slice(0, -1);
        if (requiredFields.some(field => !field || field.trim() === '')) {
            alert('Please fill in all required fields.');
            return;
        }
        
        await appendUserDataToSheet('Persalinan', formData, false);
        alert('Data persalinan berhasil disimpan!');
        
        if (typeof clearPersalinanForm === 'function') {
            clearPersalinanForm();
        }
        if (typeof loadPersalinanData === 'function') {
            loadPersalinanData();
        }
        
    } catch (error) {
        console.error('Error in savePersalinanData:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Global save function for Nifas
async function saveNifasData() {
    console.log('=== saveNifasData called ===');
    
    try {
        if (!currentUserId) {
            if (userProfile && userProfile.email) {
                await createOrGetUser(userProfile.email);
            } else {
                throw new Error('User not signed in properly. Please refresh and sign in again.');
            }
        }
        
        const formData = [
            document.getElementById('tanggal_nifas').value,
            document.getElementById('hari_ke').value,
            document.getElementById('tinggi_fundus_nifas').value,
            document.getElementById('tekanan_darah_nifas').value,
            document.getElementById('suhu_badan').value,
            document.getElementById('lochea').value,
            document.getElementById('asi').value,
            document.getElementById('kondisi_perineum').value,
            document.getElementById('eliminasi').value,
            document.getElementById('keluhan_nifas').value,
            document.getElementById('penatalaksanaan').value,
            new Date().toISOString()
        ];
        
        console.log('Nifas form data collected:', formData);
        
        const requiredFields = formData.slice(0, -1);
        if (requiredFields.some(field => !field || field.trim() === '')) {
            alert('Please fill in all required fields.');
            return;
        }
        
        await appendUserDataToSheet('Nifas', formData, false);
        alert('Data nifas berhasil disimpan!');
        
        if (typeof clearNifasForm === 'function') {
            clearNifasForm();
        }
        if (typeof loadNifasData === 'function') {
            loadNifasData();
        }
        
    } catch (error) {
        console.error('Error in saveNifasData:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Global save function for ANC
async function saveAncData() {
    console.log('=== saveAncData called ===');
    
    try {
        // Ensure user is properly initialized
        if (!currentUserId) {
            if (userProfile && userProfile.email) {
                await createOrGetUser(userProfile.email);
            } else {
                throw new Error('User not signed in properly. Please refresh and sign in again.');
            }
        }
        
        // Get selected mother's relasi record
        const motherRelasiRecord = await getSelectedMotherRelasiRecordAnc();
        if (!motherRelasiRecord) {
            throw new Error('Silakan pilih nama ibu terlebih dahulu');
        }
        
        console.log('Using existing relasi record for ANC:', motherRelasiRecord);
        
        // Helper function to safely get element value
        const getElementValue = (elementId) => {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn(`Element with ID '${elementId}' not found`);
                return '';
            }
            return element.value || '';
        };
        
        const formData = [
            motherRelasiRecord.id_trx, // id_trx (first column) - use existing id_trx
            getElementValue('tgl_anc'), // tgl_anc
            getElementValue('bb'), // bb (berat badan)
            getElementValue('tb'), // tb (tinggi badan)
            getElementValue('td'), // td (tekanan darah)
            getElementValue('uk'), // uk (usia kehamilan)
            getElementValue('djj'), // djj (denyut jantung janin)
            getElementValue('tfu'), // tfu (tinggi fundus uteri)
            getElementValue('fetal_station'), // fetal_station
            getElementValue('kunjungan'), // kunjungan
            motherRelasiRecord.id_trx // Add id_trx at the end for user filtering
        ];
        
        console.log('ANC form data collected:', formData);
        
        // Save directly to ANC sheet without creating new relasi record
        // Since we're using existing id_trx, we don't need appendUserDataToSheet
        await appendToSheet('ANC!A:ZZ', [formData]);
        alert('Data ANC berhasil disimpan!');
        
        if (typeof clearAncForm === 'function') {
            clearAncForm();
        }
        if (typeof loadAncData === 'function') {
            loadAncData();
        }
        
    } catch (error) {
        console.error('Error in saveAncData:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Global clear functions for all modules
function clearLabForm() {
    const form = document.getElementById('laboratoriumForm');
    if (form) {
        form.reset();
        console.log('Laboratorium form cleared');
    } else {
        console.error('Laboratorium form not found');
    }
}

function clearPersalinanForm() {
    const form = document.getElementById('persalinanForm');
    if (form) {
        form.reset();
        console.log('Persalinan form cleared');
    } else {
        console.error('Persalinan form not found');
    }
}

function clearNifasForm() {
    const form = document.getElementById('nifasForm');
    if (form) {
        form.reset();
        console.log('Nifas form cleared');
    } else {
        console.error('Nifas form not found');
    }
}

function clearAncForm() {
    const form = document.getElementById('ancForm');
    if (form) {
        form.reset();
        // Reset mother selection to first option
        const motherSelect = document.getElementById('selected_mother_anc');
        if (motherSelect) {
            motherSelect.selectedIndex = 0;
        }
        console.log('ANC form cleared');
    } else {
        console.error('ANC form not found');
    }
}

// Navigation functions for pemeriksaan module
function nextToLaboratorium() {
    // Save current form data to session storage
    saveFormDataToSession('pemeriksaan');
    // Switch to laboratorium tab
    const laboratoriumTab = document.getElementById('laboratorium-tab');
    const laboratoriumTabInstance = new bootstrap.Tab(laboratoriumTab);
    laboratoriumTabInstance.show();
}

function nextToPersalinan() {
    // Save current form data to session storage
    saveFormDataToSession('laboratorium');
    // Switch to persalinan tab
    const persalinanTab = document.getElementById('persalinan-tab');
    const persalinanTabInstance = new bootstrap.Tab(persalinanTab);
    persalinanTabInstance.show();
}

function nextToNifas() {
    // Save current form data to session storage
    saveFormDataToSession('persalinan');
    // Switch to nifas tab
    const nifasTab = document.getElementById('nifas-tab');
    const nifasTabInstance = new bootstrap.Tab(nifasTab);
    nifasTabInstance.show();
}

// Function to save form data to session storage
function saveFormDataToSession(formType) {
    const formData = {};
    
    switch(formType) {
        case 'pemeriksaan':
            formData.selected_mother = document.getElementById('selected_mother').value;
            formData.status_gpa = document.getElementById('status_gpa').value;
            formData.jarak_kehamilan = document.getElementById('jarak_kehamilan').value;
            formData.hpht = document.getElementById('hpht').value;
            formData.taksiran_persalinan = document.getElementById('taksiran_persalinan').value;
            formData.tb = document.getElementById('tb').value;
            formData.lila = document.getElementById('lila').value;
            formData.status_imunisasi_td = document.getElementById('status_imunisasi_td').value;
            formData.injeksi_td = document.getElementById('injeksi_td').value;
            formData.skrining_tbc = document.getElementById('skrining_tbc').value;
            formData.skrining_jiwa = document.getElementById('skrining_jiwa').value;
            formData.konseling = document.getElementById('konseling').value;
            formData.komplikasi = document.getElementById('komplikasi').value;
            formData.tata_laksana_kasus_bumil = document.getElementById('tata_laksana_kasus_bumil').value;
            break;
            
        case 'laboratorium':
            formData.lab_hb = document.getElementById('lab_hb').value;
            formData.golda = document.getElementById('golda').value;
            formData.protein_urin = document.getElementById('protein_urin').value;
            formData.glukosa_urin = document.getElementById('glukosa_urin').value;
            formData.hiv = document.getElementById('hiv').value;
            formData.sifilis = document.getElementById('sifilis').value;
            formData.hbsag = document.getElementById('hbsag').value;
            formData.tbc_mikroskopis = document.getElementById('tbc_mikroskopis').value;
            formData.malaria = document.getElementById('malaria').value;
            formData.lain_lain = document.getElementById('lain_lain').value;
            break;
            
        case 'persalinan':
            formData.tgl_persalinan = document.getElementById('tgl_persalinan').value;
            formData.tempat_persalinan = document.getElementById('tempat_persalinan').value;
            formData.cara_persalinan = document.getElementById('cara_persalinan').value;
            formData.penolong_persalinan = document.getElementById('penolong_persalinan').value;
            formData.berat_bayi_lebih_2500 = document.getElementById('berat_bayi_lebih_2500').value;
            formData.berat_bayi_kurang_2500 = document.getElementById('berat_bayi_kurang_2500').value;
            formData.penyulit_persalinan = document.getElementById('penyulit_persalinan').value;
            break;
            
        case 'nifas':
            formData.kf1 = document.getElementById('kf1').value;
            formData.kf2 = document.getElementById('kf2').value;
            formData.kf3 = document.getElementById('kf3').value;
            formData.kf4 = document.getElementById('kf4').value;
            formData.tgl_kb = document.getElementById('tgl_kb').value;
            formData.metode_kb = document.getElementById('metode_kb').value;
            formData.tgl_kasus_nifas = document.getElementById('tgl_kasus_nifas').value;
            formData.jenis_tindakan = document.getElementById('jenis_tindakan').value;
            formData.keterangan = document.getElementById('keterangan').value;
            break;
    }
    
    sessionStorage.setItem(`formData_${formType}`, JSON.stringify(formData));
    console.log(`Saved ${formType} form data to session storage`);
}

// Function to load form data from session storage
function loadFormDataFromSession(formType) {
    const savedData = sessionStorage.getItem(`formData_${formType}`);
    if (savedData) {
        const formData = JSON.parse(savedData);
        
        switch(formType) {
            case 'pemeriksaan':
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = formData[key];
                        // If this is the selected_mother field, trigger change event to update any dependent fields
                        if (key === 'selected_mother') {
                            element.dispatchEvent(new Event('change'));
                        }
                    }
                });
                break;
                
            case 'laboratorium':
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) element.value = formData[key];
                });
                break;
                
            case 'persalinan':
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) element.value = formData[key];
                });
                break;
                
            case 'nifas':
                Object.keys(formData).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) element.value = formData[key];
                });
                break;
        }
        
        console.log(`Loaded ${formType} form data from session storage`);
    }
}

// Modified save function to save all data at once with existing mother relationship
async function saveAllPemeriksaanData() {
    console.log('=== saveAllPemeriksaanData called ===');
    
    try {
        // Ensure user is properly initialized
        if (!currentUserId) {
            if (userProfile && userProfile.email) {
                await createOrGetUser(userProfile.email);
            } else {
                throw new Error('User not signed in properly. Please refresh and sign in again.');
            }
        }
        
        // Save current nifas form data to session storage
        saveFormDataToSession('nifas');
        
        // Get selected mother's relasi record
        const motherRelasiRecord = await getSelectedMotherRelasiRecord();
        if (!motherRelasiRecord) {
            throw new Error('Silakan pilih nama ibu terlebih dahulu');
        }
        
        console.log('Using existing relasi record for pemeriksaan:', motherRelasiRecord);
        
        // Get all saved form data
        const pemeriksaanData = JSON.parse(sessionStorage.getItem('formData_pemeriksaan') || '{}');
        const laboratoriumData = JSON.parse(sessionStorage.getItem('formData_laboratorium') || '{}');
        const persalinanData = JSON.parse(sessionStorage.getItem('formData_persalinan') || '{}');
        const nifasData = JSON.parse(sessionStorage.getItem('formData_nifas') || '{}');
        
        // Helper to get value or empty string
        const getVal = (obj, key) => obj && obj[key] ? obj[key] : '';
        
        // Prepare data arrays for each sheet using the existing id_trx
        const pemeriksaanArray = [
            getVal(pemeriksaanData, 'status_gpa'),
            getVal(pemeriksaanData, 'jarak_kehamilan'),
            getVal(pemeriksaanData, 'hpht'),
            getVal(pemeriksaanData, 'taksiran_persalinan'),
            getVal(pemeriksaanData, 'tb'),
            getVal(pemeriksaanData, 'lila'),
            getVal(pemeriksaanData, 'status_imunisasi_td'),
            getVal(pemeriksaanData, 'injeksi_td'),
            getVal(pemeriksaanData, 'skrining_tbc'),
            getVal(pemeriksaanData, 'skrining_jiwa'),
            getVal(pemeriksaanData, 'konseling'),
            getVal(pemeriksaanData, 'komplikasi'),
            getVal(pemeriksaanData, 'tata_laksana_kasus_bumil'),
            motherRelasiRecord.id_trx // Use the existing id_trx
        ];
        
        const laboratoriumArray = [
            getVal(laboratoriumData, 'lab_hb'),
            getVal(laboratoriumData, 'golda'),
            getVal(laboratoriumData, 'protein_urin'),
            getVal(laboratoriumData, 'glukosa_urin'),
            getVal(laboratoriumData, 'hiv'),
            getVal(laboratoriumData, 'sifilis'),
            getVal(laboratoriumData, 'hbsag'),
            getVal(laboratoriumData, 'tbc_mikroskopis'),
            getVal(laboratoriumData, 'malaria'),
            getVal(laboratoriumData, 'lain_lain'),
            motherRelasiRecord.id_trx // Use the same existing id_trx
        ];
        
        const persalinanArray = [
            getVal(persalinanData, 'tgl_persalinan'),
            getVal(persalinanData, 'tempat_persalinan'),
            getVal(persalinanData, 'cara_persalinan'),
            getVal(persalinanData, 'penolong_persalinan'),
            getVal(persalinanData, 'berat_bayi_lebih_2500'),
            getVal(persalinanData, 'berat_bayi_kurang_2500'),
            getVal(persalinanData, 'penyulit_persalinan'),
            motherRelasiRecord.id_trx // Use the same existing id_trx
        ];
        
        const nifasArray = [
            getVal(nifasData, 'kf1'),
            getVal(nifasData, 'kf2'),
            getVal(nifasData, 'kf3'),
            getVal(nifasData, 'kf4'),
            getVal(nifasData, 'tgl_kb'),
            getVal(nifasData, 'metode_kb'),
            getVal(nifasData, 'tgl_kasus_nifas'),
            getVal(nifasData, 'jenis_tindakan'),
            getVal(nifasData, 'keterangan'),
            motherRelasiRecord.id_trx // Use the same existing id_trx
        ];
        
        // Save all data to respective sheets (always save, even if all fields are empty except id_trx)
        console.log('Saving all data to sheets using existing id_trx:', motherRelasiRecord.id_trx);
        await appendToSheet('Pemeriksaan!A:ZZ', [pemeriksaanArray]);
        await appendToSheet('Laboratorium!A:ZZ', [laboratoriumArray]);
        await appendToSheet('Persalinan!A:ZZ', [persalinanArray]);
        await appendToSheet('Nifas!A:ZZ', [nifasArray]);
        
        // Clear session storage
        sessionStorage.removeItem('formData_pemeriksaan');
        sessionStorage.removeItem('formData_laboratorium');
        sessionStorage.removeItem('formData_persalinan');
        sessionStorage.removeItem('formData_nifas');
        
        // Clear all forms
        clearPemeriksaanForm();
        clearLabForm();
        clearPersalinanForm();
        clearNifasForm();
        
        // Reload all data tables
        loadPemeriksaanData();
        loadLaboratoriumData();
        loadPersalinanData();
        loadNifasData();
        
        alert('Semua data berhasil disimpan!');
        
    } catch (error) {
        console.error('Error in saveAllPemeriksaanData:', error);
        alert('Error saving data: ' + error.message);
    }
}

// Data loading functions for each module
async function loadPemeriksaanData() {
    try {
        await loadModuleData('pemeriksaan');
    } catch (error) {
        console.error('Error loading pemeriksaan data:', error);
    }
}

async function loadLaboratoriumData() {
    try {
        await loadModuleData('laboratorium');
    } catch (error) {
        console.error('Error loading laboratorium data:', error);
    }
}

async function loadPersalinanData() {
    try {
        await loadModuleData('persalinan');
    } catch (error) {
        console.error('Error loading persalinan data:', error);
    }
}

async function loadNifasData() {
    try {
        await loadModuleData('nifas');
    } catch (error) {
        console.error('Error loading nifas data:', error);
    }
}

async function loadAncData() {
    try {
        console.log('=== loadAncData called ===');
        
        // First, try to read raw data from ANC sheet
        console.log('1. Reading raw ANC data...');
        const rawData = await readFromSheet('ANC!A:ZZ');
        console.log('2. Raw ANC data:', rawData);
        console.log('3. Raw data length:', rawData ? rawData.length : 'null');
        
        if (rawData && rawData.length > 1) {
            console.log('4. First data row:', rawData[1]);
            console.log('5. Last column (id_trx for filtering):', rawData[1][rawData[1].length - 1]);
        }
        
        // Get user's relasi records to filter ANC data
        console.log('6. Getting user relasi records...');
        const userRelasi = await getUserRelasiRecords();
        console.log('7. User relasi records:', userRelasi);
        
        const userIdTrxList = userRelasi.map(record => record[1]); // Get all id_trx values
        console.log('8. User id_trx list:', userIdTrxList);
        
        // Filter ANC data manually
        console.log('9. Filtering ANC data...');
        let filteredAncData = [];
        
        if (rawData && rawData.length > 1) {
            filteredAncData = rawData.slice(1).filter(row => {
                // Check if row is not empty
                const hasData = row.some(cell => cell && cell.toString().trim() !== '');
                if (!hasData) {
                    console.log('Skipping empty row:', row);
                    return false;
                }
                
                // For ANC, check both first column (id_trx) and last column (id_trx for filtering)
                const firstColumnIdTrx = row[0];
                const lastColumnIdTrx = row[row.length - 1];
                
                console.log(`ANC row - First column id_trx: ${firstColumnIdTrx}, Last column id_trx: ${lastColumnIdTrx}`);
                console.log(`Checking against user id_trx list: ${userIdTrxList}`);
                
                // Check if either the first or last column matches user's id_trx
                const matches = userIdTrxList.includes(firstColumnIdTrx) || userIdTrxList.includes(lastColumnIdTrx);
                console.log(`Row matches user: ${matches}`);
                
                return matches;
            });
        }
        
        console.log('10. Filtered ANC data:', filteredAncData);
        console.log('11. Filtered data length:', filteredAncData.length);
        
        // Load the filtered data into the table
        console.log('12. Loading filtered data into table...');
        const tableBody = document.getElementById('ancTableBody');
        
        if (tableBody) {
            tableBody.innerHTML = '';
            
            if (filteredAncData.length > 0) {
                filteredAncData.forEach((row, index) => {
                    console.log(`Processing filtered ANC row ${index}:`, row);
                    const tr = document.createElement('tr');
                    tr.innerHTML = createANCRow(row);
                    tableBody.appendChild(tr);
                });
                console.log(`Loaded ${filteredAncData.length} filtered ANC records`);
            } else {
                // Add a "no data" row
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="10" class="text-center">Belum ada data ANC</td>`;
                tableBody.appendChild(tr);
                console.log('No filtered ANC data found, showing "no data" message');
            }
        } else {
            console.error('ANC table body not found');
        }
        
        console.log('=== loadAncData completed ===');
    } catch (error) {
        console.error('Error loading anc data:', error);
    }
}

// Test function to verify navigation functions are available
function testNavigationFunctions() {
    console.log('Testing navigation functions...');
    console.log('nextToLaboratorium available:', typeof nextToLaboratorium);
    console.log('nextToPersalinan available:', typeof nextToPersalinan);
    console.log('nextToNifas available:', typeof nextToNifas);
    console.log('saveFormDataToSession available:', typeof saveFormDataToSession);
    console.log('loadFormDataFromSession available:', typeof loadFormDataFromSession);
    console.log('saveAllPemeriksaanData available:', typeof saveAllPemeriksaanData);
    console.log('loadPemeriksaanData available:', typeof loadPemeriksaanData);
    console.log('loadLaboratoriumData available:', typeof loadLaboratoriumData);
    console.log('loadPersalinanData available:', typeof loadPersalinanData);
    console.log('loadNifasData available:', typeof loadNifasData);
    console.log('loadMotherNames available:', typeof loadMotherNames);
    console.log('getSelectedMotherRelasiId available:', typeof getSelectedMotherRelasiId);
    console.log('getSelectedMotherRelasiRecord available:', typeof getSelectedMotherRelasiRecord);
    console.log('refreshMotherNames available:', typeof refreshMotherNames);
    console.log('loadMotherNamesAnc available:', typeof loadMotherNamesAnc);
    console.log('getSelectedMotherRelasiRecordAnc available:', typeof getSelectedMotherRelasiRecordAnc);
    console.log('refreshMotherNamesAnc available:', typeof refreshMotherNamesAnc);
    console.log('loadWilayahData available:', typeof loadWilayahData);
    console.log('loadKabupatenDropdown available:', typeof loadKabupatenDropdown);
    console.log('loadKecamatanDropdown available:', typeof loadKecamatanDropdown);
    console.log('loadDesaDropdown available:', typeof loadDesaDropdown);
    console.log('initWilayahDropdowns available:', typeof initWilayahDropdowns);
    console.log('getWilayahNameByCode available:', typeof getWilayahNameByCode);
    console.log('populateWilayahDropdowns available:', typeof populateWilayahDropdowns);
}

// Call test function when main.js loads
testNavigationFunctions();

// Function to load mother names from identitas data
async function loadMotherNames() {
    try {
        console.log('Loading mother names from identitas data...');
        const identitasData = await readUserDataFromSheet('Identitas');
        const motherSelect = document.getElementById('selected_mother');
        
        if (!motherSelect) {
            console.log('Mother select element not found');
            return;
        }
        
        // Clear existing options except the first one
        motherSelect.innerHTML = '<option value="">Pilih Nama Ibu dari Data Identitas</option>';
        
        if (identitasData && identitasData.length > 0) {
            // Get user's relasi records to map identitas to id_trx
            const userRelasi = await getUserRelasiRecords();
            console.log('User relasi records for mapping:', userRelasi);
            
            // Prevent duplicate id_trx in dropdown
            const addedIdTrx = new Set();
            identitasData.forEach((row, index) => {
                const motherName = row[2]; // nama_ibu is at index 2
                const nik = row[0]; // NIK is at index 0
                const identitasRelasiId = row[row.length - 1]; // relasi ID is at the last index
                
                // Find the corresponding relasi record to get the id_trx
                const relasiRecord = userRelasi.find(relasi => relasi[0] === identitasRelasiId);
                
                if (relasiRecord) {
                    const idTrx = relasiRecord[1]; // id_trx is at index 1
                    if (!addedIdTrx.has(idTrx)) {
                        const option = document.createElement('option');
                        option.value = idTrx; // Use id_trx as value
                        option.textContent = `${motherName} (NIK: ${nik})`; // Show name and NIK
                        option.setAttribute('data-relasi-id', identitasRelasiId);
                        option.setAttribute('data-id-trx', idTrx);
                        motherSelect.appendChild(option);
                        addedIdTrx.add(idTrx);
                        console.log(`Added mother option: ${motherName} with id_trx: ${idTrx}`);
                    } else {
                        console.log(`Skipped duplicate mother option: ${motherName} with id_trx: ${idTrx}`);
                    }
                } else {
                    console.warn(`No relasi record found for identitas relasi ID: ${identitasRelasiId}`);
                }
            });
            console.log(`Loaded ${addedIdTrx.size} unique mother names`);
        } else {
            console.log('No identitas data found');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Tidak ada data identitas tersedia';
            option.disabled = true;
            motherSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading mother names:', error);
    }
}

// Function to get relasi record from selected mother
async function getSelectedMotherRelasiRecord() {
    const motherSelect = document.getElementById('selected_mother');
    if (motherSelect && motherSelect.value) {
        const selectedIdTrx = motherSelect.value;
        
        try {
            // Get the relasi record for the selected mother using id_trx
            const relasiData = await readFromSheet('Relasi!A:E');
            if (relasiData && relasiData.length > 1) {
                // Find the relasi record that matches the selected id_trx
                const relasiRecord = relasiData.slice(1).find(row => row[1] === selectedIdTrx);
                if (relasiRecord) {
                    return {
                        id: relasiRecord[0], // relasi ID
                        id_trx: relasiRecord[1], // id_trx
                        user_id: relasiRecord[2], // user_id
                        identitas_relasi_id: relasiRecord[3], // identitas_relasi_id (if exists)
                        timestamp: relasiRecord[4] // timestamp
                    };
                }
            }
        } catch (error) {
            console.error('Error getting relasi record:', error);
        }
    }
    return null;
}

// Function to get relasi ID from selected mother (for backward compatibility)
function getSelectedMotherRelasiId() {
    const motherSelect = document.getElementById('selected_mother');
    if (motherSelect && motherSelect.value) {
        return motherSelect.value;
    }
    return null;
}

// Function to refresh mother names (useful when new identitas data is added)
async function refreshMotherNames() {
    await loadMotherNames();
    console.log('Mother names refreshed');
}

// Function to load mother names for ANC form
async function loadMotherNamesAnc() {
    try {
        console.log('Loading mother names for ANC form...');
        const identitasData = await readUserDataFromSheet('Identitas');
        const motherSelect = document.getElementById('selected_mother_anc');
        
        if (!motherSelect) {
            console.log('ANC mother select element not found');
            return;
        }
        
        // Clear existing options except the first one
        motherSelect.innerHTML = '<option value="">Pilih Nama Ibu dari Data Identitas</option>';
        
        if (identitasData && identitasData.length > 0) {
            // Get user's relasi records to map identitas to id_trx
            const userRelasi = await getUserRelasiRecords();
            console.log('User relasi records for ANC mapping:', userRelasi);
            
            // Prevent duplicate id_trx in dropdown
            const addedIdTrx = new Set();
            identitasData.forEach((row, index) => {
                const motherName = row[2]; // nama_ibu is at index 2
                const nik = row[0]; // NIK is at index 0
                const identitasRelasiId = row[row.length - 1]; // relasi ID is at the last index
                
                // Find the corresponding relasi record to get the id_trx
                const relasiRecord = userRelasi.find(relasi => relasi[0] === identitasRelasiId);
                
                if (relasiRecord) {
                    const idTrx = relasiRecord[1]; // id_trx is at index 1
                    if (!addedIdTrx.has(idTrx)) {
                        const option = document.createElement('option');
                        option.value = idTrx; // Use id_trx as value
                        option.textContent = `${motherName} (NIK: ${nik})`; // Show name and NIK
                        option.setAttribute('data-relasi-id', identitasRelasiId);
                        option.setAttribute('data-id-trx', idTrx);
                        motherSelect.appendChild(option);
                        addedIdTrx.add(idTrx);
                        console.log(`Added mother option for ANC: ${motherName} with id_trx: ${idTrx}`);
                    } else {
                        console.log(`Skipped duplicate mother option for ANC: ${motherName} with id_trx: ${idTrx}`);
                    }
                } else {
                    console.warn(`No relasi record found for identitas relasi ID: ${identitasRelasiId}`);
                }
            });
            console.log(`Loaded ${addedIdTrx.size} unique mother names for ANC`);
        } else {
            console.log('No identitas data found for ANC');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Tidak ada data identitas tersedia';
            option.disabled = true;
            motherSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading mother names for ANC:', error);
    }
}

// Function to get relasi record from selected mother for ANC
async function getSelectedMotherRelasiRecordAnc() {
    const motherSelect = document.getElementById('selected_mother_anc');
    if (motherSelect && motherSelect.value) {
        const selectedIdTrx = motherSelect.value;
        
        try {
            // Get the relasi record for the selected mother using id_trx
            const relasiData = await readFromSheet('Relasi!A:E');
            if (relasiData && relasiData.length > 1) {
                // Find the relasi record that matches the selected id_trx
                const relasiRecord = relasiData.slice(1).find(row => row[1] === selectedIdTrx);
                if (relasiRecord) {
                    return {
                        id: relasiRecord[0], // relasi ID
                        id_trx: relasiRecord[1], // id_trx
                        user_id: relasiRecord[2], // user_id
                        identitas_relasi_id: relasiRecord[3], // identitas_relasi_id (if exists)
                        timestamp: relasiRecord[4] // timestamp
                    };
                }
            }
        } catch (error) {
            console.error('Error getting relasi record for ANC:', error);
        }
    }
    return null;
}

// Function to refresh mother names for ANC
async function refreshMotherNamesAnc() {
    await loadMotherNamesAnc();
    console.log('Mother names refreshed for ANC');
}

// Function to load wilayah data from Google Sheets
async function loadWilayahData() {
    try {
        console.log('=== Loading wilayah data ===');
        console.log('Sheets initialized:', sheetsInitialized);
        console.log('GAPI available:', !!gapi);
        console.log('GAPI client available:', !!gapi?.client);
        console.log('GAPI sheets available:', !!gapi?.client?.sheets);
        
        const wilayahData = await readFromSheet('Wilayah!A:G');
        console.log('Raw wilayah data:', wilayahData);
        
        if (!wilayahData || wilayahData.length <= 1) {
            console.log('No wilayah data found or only header row exists');
            console.log('Data length:', wilayahData ? wilayahData.length : 'null');
            return [];
        }
        
        // Skip header row and return data
        const dataWithoutHeader = wilayahData.slice(1);
        console.log('Wilayah data without header:', dataWithoutHeader);
        console.log('Number of wilayah records:', dataWithoutHeader.length);
        
        return dataWithoutHeader;
    } catch (error) {
        console.error('=== Error loading wilayah data ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return [];
    }
}

// Function to load kabupaten dropdown
async function loadKabupatenDropdown() {
    try {
        console.log('=== Loading kabupaten dropdown ===');
        const wilayahData = await loadWilayahData();
        console.log('Wilayah data received:', wilayahData);
        
        const kabupatenSelect = document.getElementById('kabupaten');
        console.log('Kabupaten select element found:', !!kabupatenSelect);
        
        if (!kabupatenSelect) {
            console.log('Kabupaten select element not found');
            return;
        }
        
        // Clear existing options except the first one
        kabupatenSelect.innerHTML = '<option value="">Pilih Kabupaten</option>';
        console.log('Cleared kabupaten dropdown');
        
        if (wilayahData.length > 0) {
            console.log('Processing wilayah data for kabupaten...');
            
            // Get unique kabupaten
            const uniqueKabupaten = [];
            wilayahData.forEach((row, index) => {
                console.log(`Processing row ${index}:`, row);
                const kabupatenKode = row[0]; // BPS Kode Kabupaten
                const kabupatenNama = row[1]; // BPS Nama Kabupaten
                
                console.log(`Row ${index} - Kode: ${kabupatenKode}, Nama: ${kabupatenNama}`);
                
                if (!uniqueKabupaten.find(k => k.kode === kabupatenKode)) {
                    uniqueKabupaten.push({
                        kode: kabupatenKode,
                        nama: kabupatenNama
                    });
                    console.log(`Added unique kabupaten: ${kabupatenNama} (${kabupatenKode})`);
                } else {
                    console.log(`Skipped duplicate kabupaten: ${kabupatenNama} (${kabupatenKode})`);
                }
            });
            
            console.log('Unique kabupaten found:', uniqueKabupaten);
            
            // Sort by nama
            uniqueKabupaten.sort((a, b) => a.nama.localeCompare(b.nama));
            console.log('Sorted kabupaten:', uniqueKabupaten);
            
            // Add options
            uniqueKabupaten.forEach(kabupaten => {
                const option = document.createElement('option');
                option.value = kabupaten.kode; // Save BPS kode
                option.textContent = kabupaten.nama; // Show nama
                kabupatenSelect.appendChild(option);
                console.log(`Added option: ${kabupaten.nama} (${kabupaten.kode})`);
            });
            
            console.log(`Loaded ${uniqueKabupaten.length} kabupaten options`);
            console.log('Final kabupaten dropdown HTML:', kabupatenSelect.innerHTML);
        } else {
            console.log('No wilayah data to process for kabupaten');
        }
    } catch (error) {
        console.error('=== Error loading kabupaten dropdown ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
}

// Function to load kecamatan dropdown based on selected kabupaten
async function loadKecamatanDropdown(selectedKabupatenKode) {
    try {
        const wilayahData = await loadWilayahData();
        const kecamatanSelect = document.getElementById('kecamatan');
        
        if (!kecamatanSelect) {
            console.log('Kecamatan select element not found');
            return;
        }
        
        // Clear existing options except the first one
        kecamatanSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
        
        if (wilayahData.length > 0 && selectedKabupatenKode) {
            // Filter by selected kabupaten
            const filteredData = wilayahData.filter(row => row[0] === selectedKabupatenKode);
            
            // Get unique kecamatan for selected kabupaten
            const uniqueKecamatan = [];
            filteredData.forEach(row => {
                const kecamatanKode = row[2]; // BPS Kode Kecamatan
                const kecamatanNama = row[3]; // BPS Nama Kecamatan
                
                if (!uniqueKecamatan.find(k => k.kode === kecamatanKode)) {
                    uniqueKecamatan.push({
                        kode: kecamatanKode,
                        nama: kecamatanNama
                    });
                }
            });
            
            // Sort by nama
            uniqueKecamatan.sort((a, b) => a.nama.localeCompare(b.nama));
            
            // Add options
            uniqueKecamatan.forEach(kecamatan => {
                const option = document.createElement('option');
                option.value = kecamatan.kode; // Save BPS kode
                option.textContent = kecamatan.nama; // Show nama
                kecamatanSelect.appendChild(option);
            });
            
            console.log(`Loaded ${uniqueKecamatan.length} kecamatan options for kabupaten ${selectedKabupatenKode}`);
        }
    } catch (error) {
        console.error('Error loading kecamatan dropdown:', error);
    }
}

// Function to load desa dropdown based on selected kecamatan
async function loadDesaDropdown(selectedKecamatanKode) {
    try {
        const wilayahData = await loadWilayahData();
        const desaSelect = document.getElementById('desa');
        
        if (!desaSelect) {
            console.log('Desa select element not found');
            return;
        }
        
        // Clear existing options except the first one
        desaSelect.innerHTML = '<option value="">Pilih Desa/Kelurahan</option>';
        
        if (wilayahData.length > 0 && selectedKecamatanKode) {
            // Filter by selected kecamatan
            const filteredData = wilayahData.filter(row => row[2] === selectedKecamatanKode);
            
            // Get unique desa for selected kecamatan
            const uniqueDesa = [];
            filteredData.forEach(row => {
                const desaKode = row[4]; // BPS Kode Desa Kelurahan
                const desaNama = row[5]; // BPS Nama Desa Kelurahan
                
                if (!uniqueDesa.find(d => d.kode === desaKode)) {
                    uniqueDesa.push({
                        kode: desaKode,
                        nama: desaNama
                    });
                }
            });
            
            // Sort by nama
            uniqueDesa.sort((a, b) => a.nama.localeCompare(b.nama));
            
            // Add options
            uniqueDesa.forEach(desa => {
                const option = document.createElement('option');
                option.value = desa.kode; // Save BPS kode
                option.textContent = desa.nama; // Show nama
                desaSelect.appendChild(option);
            });
            
            console.log(`Loaded ${uniqueDesa.length} desa options for kecamatan ${selectedKecamatanKode}`);
        }
    } catch (error) {
        console.error('Error loading desa dropdown:', error);
    }
}

// Function to initialize wilayah dropdowns
async function initWilayahDropdowns() {
    console.log('=== Initializing wilayah dropdowns ===');
    console.log('Sheets initialized:', sheetsInitialized);
    console.log('GAPI available:', !!gapi);
    console.log('GAPI client available:', !!gapi?.client);
    console.log('GAPI sheets available:', !!gapi?.client?.sheets);
    
    // Check if Google Sheets API is ready
    if (!sheetsInitialized || !gapi?.client?.sheets) {
        console.log('Google Sheets API not ready, waiting...');
        // Wait a bit more and try again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!sheetsInitialized || !gapi?.client?.sheets) {
            console.error('Google Sheets API still not ready after waiting');
            return;
        }
    }
    
    // Load kabupaten dropdown
    await loadKabupatenDropdown();
    
    // Add event listeners for cascading dropdowns
    const kabupatenSelect = document.getElementById('kabupaten');
    const kecamatanSelect = document.getElementById('kecamatan');
    
    if (kabupatenSelect) {
        kabupatenSelect.addEventListener('change', async (e) => {
            const selectedKabupatenKode = e.target.value;
            console.log('Kabupaten selected:', selectedKabupatenKode);
            
            // Clear dependent dropdowns
            kecamatanSelect.innerHTML = '<option value="">Pilih Kecamatan</option>';
            document.getElementById('desa').innerHTML = '<option value="">Pilih Desa/Kelurahan</option>';
            
            if (selectedKabupatenKode) {
                await loadKecamatanDropdown(selectedKabupatenKode);
            }
        });
    }
    
    if (kecamatanSelect) {
        kecamatanSelect.addEventListener('change', async (e) => {
            const selectedKecamatanKode = e.target.value;
            console.log('Kecamatan selected:', selectedKecamatanKode);
            
            // Clear dependent dropdown
            document.getElementById('desa').innerHTML = '<option value="">Pilih Desa/Kelurahan</option>';
            
            if (selectedKecamatanKode) {
                await loadDesaDropdown(selectedKecamatanKode);
            }
        });
    }
    
    console.log('Wilayah dropdowns initialized');
}

// Function to get wilayah name by code
async function getWilayahNameByCode(kode, type) {
    try {
        const wilayahData = await loadWilayahData();
        
        if (!wilayahData || wilayahData.length === 0) {
            return kode; // Return original code if no data
        }
        
        let foundRow = null;
        
        switch (type) {
            case 'kabupaten':
                foundRow = wilayahData.find(row => row[0] === kode);
                return foundRow ? foundRow[1] : kode;
            case 'kecamatan':
                foundRow = wilayahData.find(row => row[2] === kode);
                return foundRow ? foundRow[3] : kode;
            case 'desa':
                foundRow = wilayahData.find(row => row[4] === kode);
                return foundRow ? foundRow[5] : kode;
            default:
                return kode;
        }
    } catch (error) {
        console.error('Error getting wilayah name by code:', error);
        return kode;
    }
}

// Function to populate wilayah dropdowns with saved values
async function populateWilayahDropdowns(kabupatenKode, kecamatanKode, desaKode) {
    try {
        console.log('Populating wilayah dropdowns with saved values:', { kabupatenKode, kecamatanKode, desaKode });
        
        // First load kabupaten dropdown
        await loadKabupatenDropdown();
        
        // Set kabupaten value if provided
        if (kabupatenKode) {
            const kabupatenSelect = document.getElementById('kabupaten');
            if (kabupatenSelect) {
                kabupatenSelect.value = kabupatenKode;
                
                // Trigger change event to load kecamatan
                const event = new Event('change');
                kabupatenSelect.dispatchEvent(event);
                
                // Wait a bit for kecamatan to load, then set value
                setTimeout(async () => {
                    await loadKecamatanDropdown(kabupatenKode);
                    
                    if (kecamatanKode) {
                        const kecamatanSelect = document.getElementById('kecamatan');
                        if (kecamatanSelect) {
                            kecamatanSelect.value = kecamatanKode;
                            
                            // Trigger change event to load desa
                            const kecamatanEvent = new Event('change');
                            kecamatanSelect.dispatchEvent(kecamatanEvent);
                            
                            // Wait a bit for desa to load, then set value
                            setTimeout(async () => {
                                await loadDesaDropdown(kecamatanKode);
                                
                                if (desaKode) {
                                    const desaSelect = document.getElementById('desa');
                                    if (desaSelect) {
                                        desaSelect.value = desaKode;
                                    }
                                }
                            }, 500);
                        }
                    }
                }, 500);
            }
        }
    } catch (error) {
        console.error('Error populating wilayah dropdowns:', error);
    }
}

// Test function to manually trigger wilayah loading
async function testWilayahLoading() {
    console.log('=== Testing wilayah loading ===');
    try {
        console.log('Testing loadWilayahData...');
        const wilayahData = await loadWilayahData();
        console.log('Wilayah data result:', wilayahData);
        
        console.log('Testing loadKabupatenDropdown...');
        await loadKabupatenDropdown();
        console.log('Kabupaten dropdown loaded');
        
        const kabupatenSelect = document.getElementById('kabupaten');
        if (kabupatenSelect) {
            console.log('Kabupaten dropdown options count:', kabupatenSelect.options.length);
            console.log('Kabupaten dropdown HTML:', kabupatenSelect.innerHTML);
        }
        
    } catch (error) {
        console.error('Error in testWilayahLoading:', error);
    }
}

// Function to manually trigger wilayah initialization
async function manualInitWilayah() {
    console.log('=== Manual wilayah initialization triggered ===');
    try {
        await initWilayahDropdowns();
        console.log('Manual wilayah initialization completed');
    } catch (error) {
        console.error('Error in manual wilayah initialization:', error);
    }
}

// Function to delete pemeriksaan record
async function deletePemeriksaan(idTrx) {
    // Call the unified delete function that deletes from all tables
    await deleteAllPemeriksaanData(idTrx);
}

// Function to delete persalinan record
async function deletePersalinan(idTrx) {
    // Call the unified delete function that deletes from all tables
    await deleteAllPemeriksaanData(idTrx);
}

// Function to delete nifas record
async function deleteNifas(idTrx) {
    // Call the unified delete function that deletes from all tables
    await deleteAllPemeriksaanData(idTrx);
}

// Function to delete laboratorium record
async function deleteLaboratorium(idTrx) {
    // Call the unified delete function that deletes from all tables
    await deleteAllPemeriksaanData(idTrx);
}

// Function to delete all pemeriksaan data across all tables for a given id_trx
async function deleteAllPemeriksaanData(idTrx) {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data pemeriksaan, laboratorium, persalinan, dan nifas untuk ibu ini? Tindakan ini tidak dapat dibatalkan.')) {
        try {
            showLoading();
            console.log('=== deleteAllPemeriksaanData called ===');
            console.log('ID TRX to delete from all tables:', idTrx);
            
            // Ensure user is authenticated
            if (!currentUserId) {
                throw new Error('User not authenticated. Please sign in first.');
            }
            
            const tables = ['Pemeriksaan', 'Laboratorium', 'Persalinan', 'Nifas'];
            let deletedCount = 0;
            
            // Delete from all tables
            for (const tableName of tables) {
                try {
                    console.log(`Deleting from ${tableName} table...`);
                    
                    // Read all data from the table
                    const allData = await readFromSheet(`${tableName}!A:ZZ`);
                    console.log(`All data from ${tableName} sheet:`, allData);
                    
                    if (!allData || allData.length <= 1) {
                        console.log(`No data found in ${tableName} sheet`);
                        continue;
                    }
                    
                    // Find all rows that contain the id_trx
                    const rowsToDelete = [];
                    for (let i = 1; i < allData.length; i++) { // Start from 1 to skip header
                        const row = allData[i];
                        const rowIdTrx = row[row.length - 1]; // id_trx is in the last column
                        console.log(`${tableName} Row ${i} id_trx:`, rowIdTrx);
                        
                        if (rowIdTrx === idTrx) {
                            rowsToDelete.push(i + 1); // Google Sheets is 1-indexed
                            console.log(`Found row to delete in ${tableName} at index:`, i + 1);
                        }
                    }
                    
                    // Clear all matching rows (in reverse order to maintain indices)
                    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
                        const rowIndex = rowsToDelete[i];
                        console.log(`Clearing ${tableName} row at index:`, rowIndex);
                        const range = `${tableName}!A${rowIndex}:ZZ${rowIndex}`;
                        
                        const response = await gapi.client.sheets.spreadsheets.values.clear({
                            spreadsheetId: CONFIG.spreadsheetId,
                            range: range
                        });
                        
                        console.log(`${tableName} clear response:`, response.result);
                        deletedCount++;
                    }
                    
                } catch (error) {
                    console.error(`Error deleting from ${tableName}:`, error);
                    // Continue with other tables even if one fails
                }
            }
            
            // Also clear the corresponding relasi record
            await clearRelasiRecordByIdTrx(idTrx);
            
            alert(`Berhasil menghapus ${deletedCount} data dari semua tabel pemeriksaan!`);
            
            // Reload all data tables
            await loadPemeriksaanData();
            await loadLaboratoriumData();
            await loadPersalinanData();
            await loadNifasData();
            
        } catch (error) {
            console.error('=== Error in deleteAllPemeriksaanData ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            alert('Gagal menghapus data: ' + error.message);
        } finally {
            hideLoading();
        }
    }
}

// Helper function to clear relasi record by id_trx
async function clearRelasiRecordByIdTrx(idTrx) {
    try {
        const relasiData = await readFromSheet('Relasi!A:E');
        if (relasiData && relasiData.length > 1) {
            // Find the relasi record that matches the id_trx
            const relasiRecord = relasiData.slice(1).find(row => row[1] === idTrx);
            if (relasiRecord) {
                // Clear the relasi record
                const range = `Relasi!A${relasiRecord[0]}:E${relasiRecord[0]}`;
                const response = await gapi.client.sheets.spreadsheets.values.clear({
                    spreadsheetId: CONFIG.spreadsheetId,
                    range: range
                });
                console.log('Relasi record cleared:', response.result);
            }
        }
    } catch (error) {
        console.error('Error clearing relasi record:', error);
    }
}

// Function to delete ANC record
async function deleteAnc(idTrx) {
    if (confirm('Apakah Anda yakin ingin menghapus data ANC ini?')) {
        try {
            showLoading();
            console.log('=== deleteAnc called ===');
            console.log('ID TRX to delete:', idTrx);
            
            // Ensure user is authenticated
            if (!currentUserId) {
                throw new Error('User not authenticated. Please sign in first.');
            }
            
            // Read all data from the ANC sheet
            const allData = await readFromSheet('ANC!A:ZZ');
            console.log('All data from ANC sheet:', allData);
            
            if (!allData || allData.length <= 1) {
                throw new Error('No data found in ANC sheet');
            }
            
            // Find the row index that contains the id_trx
            let rowIndexToDelete = -1;
            for (let i = 1; i < allData.length; i++) { // Start from 1 to skip header
                const row = allData[i];
                const rowIdTrx = row[0]; // id_trx is at index 0 for ANC
                console.log(`Row ${i} id_trx:`, rowIdTrx);
                
                if (rowIdTrx === idTrx) {
                    rowIndexToDelete = i + 1; // Google Sheets is 1-indexed
                    console.log('Found row to delete at index:', rowIndexToDelete);
                    break;
                }
            }
            
            if (rowIndexToDelete === -1) {
                throw new Error('Data tidak ditemukan atau Anda tidak memiliki izin untuk menghapus data ini');
            }
            
            // Clear the row content
            console.log('Clearing row at index:', rowIndexToDelete);
            const range = `ANC!A${rowIndexToDelete}:ZZ${rowIndexToDelete}`;
            
            const response = await gapi.client.sheets.spreadsheets.values.clear({
                spreadsheetId: CONFIG.spreadsheetId,
                range: range
            });
            
            console.log('Clear response:', response.result);
            
            alert('Data ANC berhasil dihapus!');
            
            // Reload the data table
            await loadAncData();
            
        } catch (error) {
            console.error('=== Error in deleteAnc ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            alert('Gagal menghapus data: ' + error.message);
        } finally {
            hideLoading();
        }
    }
} 