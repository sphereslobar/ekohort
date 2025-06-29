// Google Sheets API wrapper functions
let sheetsInitialized = false;
let currentUserId = null;
let currentRelasiId = null;
let currentIdTrx = null;

// Wait for GAPI to be loaded
document.addEventListener('gapiLoaded', () => {
    sheetsInitialized = true;
    console.log('Sheets API ready to use');
});

// Function to check if sheets API is initialized
function checkSheetsInitialized() {
    if (!sheetsInitialized || !gapi || !gapi.client || !gapi.client.sheets) {
        throw new Error('Google Sheets API not initialized. Please sign in first.');
    }
}

// Function to generate unique ID
function generateUniqueId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Function to create or get user
async function createOrGetUser(email) {
    checkSheetsInitialized();
    
    try {
        console.log('Creating/getting user for email:', email);
        
        // Check if user exists
        const userData = await readFromSheet('User!A:B');
        
        if (userData && userData.length > 1) {
            // Look for existing user
            for (let i = 1; i < userData.length; i++) {
                if (userData[i][1] === email) {
                    currentUserId = userData[i][0];
                    console.log('Existing user found:', currentUserId);
                    return currentUserId;
                }
            }
        }
        
        // Create new user if not exists
        currentUserId = generateUniqueId();
        await appendToSheet('User!A:B', [[currentUserId, email]]);
        console.log('New user created:', currentUserId);
        return currentUserId;
        
    } catch (error) {
        console.error('Error creating/getting user:', error);
        throw error;
    }
}

// Function to create relasi record
async function createRelasiRecord() {
    console.log('=== createRelasiRecord called ===');
    console.log('Current user ID:', currentUserId);
    
    checkSheetsInitialized();
    
    if (!currentUserId) {
        throw new Error('User ID not set. Please sign in first.');
    }
    
    try {
        // Simple id and id_trx: use timestamp and a short random string
        const simpleId = 'ID' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3);
        const simpleTrx = 'TRX' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3);
        currentRelasiId = simpleId;
        currentIdTrx = simpleTrx;
        
        const relasiData = [
            currentRelasiId,
            currentIdTrx,
            currentUserId,
            new Date().toISOString()
        ];
        
        console.log('Creating relasi record:', relasiData);
        console.log('About to call appendToSheet for Relasi...');
        
        const result = await appendToSheet('Relasi!A:D', [relasiData]);
        console.log('Relasi append result:', result);
        console.log('Relasi record created successfully:', { id: currentRelasiId, id_trx: currentIdTrx });
        
        return { id: currentRelasiId, id_trx: currentIdTrx };
        
    } catch (error) {
        console.error('=== Error in createRelasiRecord ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Current user ID:', currentUserId);
        console.error('Generated relasi ID:', currentRelasiId);
        console.error('Generated id_trx:', currentIdTrx);
        throw error;
    }
}

// Function to get user's relasi records
async function getUserRelasiRecords() {
    checkSheetsInitialized();
    
    if (!currentUserId) {
        throw new Error('User ID not set. Please sign in first.');
    }
    
    try {
        const relasiData = await readFromSheet('Relasi!A:E');
        
        if (relasiData && relasiData.length > 1) {
            // Filter records for current user
            return relasiData.slice(1).filter(row => row[2] === currentUserId);
        }
        
        return [];
        
    } catch (error) {
        console.error('Error getting user relasi records:', error);
        throw error;
    }
}

// Function to read data from Google Sheets
async function readFromSheet(range) {
    checkSheetsInitialized();

    try {
        console.log('Reading from sheet range:', range);
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.spreadsheetId,
            range: range
        });
        console.log('Read response:', response.result);
        return response.result.values;
    } catch (error) {
        console.error('Error reading from sheet:', error);
        console.error('Range:', range);
        throw error;
    }
}

// Function to write data to Google Sheets
async function writeToSheet(range, values) {
    checkSheetsInitialized();

    try {
        console.log('Writing to sheet range:', range, 'values:', values);
        const response = await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: CONFIG.spreadsheetId,
            range: range,
            valueInputOption: 'RAW',
            resource: {
                values: values
            }
        });
        console.log('Write response:', response.result);
        return response.result;
    } catch (error) {
        console.error('Error writing to sheet:', error);
        console.error('Range:', range, 'Values:', values);
        throw error;
    }
}

// Function to append data to Google Sheets
async function appendToSheet(range, values) {
    console.log('=== appendToSheet called ===');
    console.log('Range:', range);
    console.log('Values:', values);
    console.log('Spreadsheet ID:', CONFIG.spreadsheetId);
    console.log('GAPI client available:', !!gapi.client);
    console.log('Sheets API loaded:', !!gapi.client.sheets);
    
    checkSheetsInitialized();

    try {
        console.log('Appending to sheet range:', range, 'values:', values);
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CONFIG.spreadsheetId,
            range: range,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: values
            }
        });
        console.log('Append response:', response.result);
        return response.result;
    } catch (error) {
        console.error('=== Error in appendToSheet ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        console.error('Error body:', error.body);
        console.error('Range:', range, 'Values:', values);
        throw error;
    }
}

// Function to read user-specific data from any table using id_trx
async function readUserDataFromSheet(sheetName) {
    checkSheetsInitialized();
    
    if (!currentUserId) {
        throw new Error('User ID not set. Please sign in first.');
    }
    
    try {
        console.log(`Reading user data from ${sheetName} for user:`, currentUserId);
        
        // Get user's relasi records to get id_trx values
        const userRelasi = await getUserRelasiRecords();
        console.log('User relasi records:', userRelasi);
        
        if (userRelasi.length === 0) {
            console.log('No relasi records found for user');
            return [];
        }
        
        const userIdTrxList = userRelasi.map(record => record[1]); // Get all id_trx values
        const userRelasiIds = userRelasi.map(record => record[0]); // Get all relasi ids
        
        console.log('User id_trx list:', userIdTrxList);
        console.log('User relasi ids:', userRelasiIds);
        
        // Read all data from the sheet
        const allData = await readFromSheet(`${sheetName}!A:ZZ`);
        console.log(`All data from ${sheetName}:`, allData);
        
        if (!allData || allData.length <= 1) {
            console.log(`No data found in ${sheetName}`);
            return [];
        }
        
        // Filter data by id_trx (assuming it's in the last column for tracking)
        // For Identitas, filter by id (relasi id)
        let filteredData;
        if (sheetName === 'Identitas') {
            filteredData = allData.slice(1).filter(row => {
                // Check if row is not empty (has at least one non-empty cell)
                const hasData = row.some(cell => cell && cell.toString().trim() !== '');
                if (!hasData) {
                    console.log('Skipping empty row:', row);
                    return false;
                }
                
                const relasiId = row[row.length - 1];
                console.log('Checking identitas row relasi_id:', relasiId, 'against user relasi ids:', userRelasiIds);
                return userRelasiIds.includes(relasiId);
            });
        } else {
            // For other tables, filter by id_trx
            // First, get all id_trx values from user's relasi records
            const userRelasiIdTrxList = userRelasi.map(record => record[1]); // Get all id_trx values
            
            filteredData = allData.slice(1).filter(row => {
                // Check if row is not empty (has at least one non-empty cell)
                const hasData = row.some(cell => cell && cell.toString().trim() !== '');
                if (!hasData) {
                    console.log('Skipping empty row:', row);
                    return false;
                }
                
                const idTrx = row[row.length - 1];
                console.log(`Checking ${sheetName} row id_trx:`, idTrx, 'against user id_trx list:', userRelasiIdTrxList);
                return userRelasiIdTrxList.includes(idTrx);
            });
        }
        
        console.log(`Filtered data for ${sheetName}:`, filteredData);
        return filteredData;
        
    } catch (error) {
        console.error('Error reading user-specific data:', error);
        throw error;
    }
}

// Function to append data with proper relasi tracking
async function appendUserDataToSheet(sheetName, formData, isIdentitas = false) {
    console.log('=== appendUserDataToSheet called ===');
    console.log('Sheet name:', sheetName);
    console.log('Form data:', formData);
    console.log('Is identitas:', isIdentitas);
    console.log('Current user ID:', currentUserId);
    console.log('Access token available:', !!accessToken);
    
    checkSheetsInitialized();
    
    if (!currentUserId) {
        throw new Error('User ID not set. Please sign in first.');
    }
    
    try {
        console.log(`Appending user data to ${sheetName}:`, formData);
        console.log('Current user ID:', currentUserId);
        console.log('Is identitas?', isIdentitas);
        
        // Create new relasi record for each new data entry
        const relasiInfo = await createRelasiRecord();
        console.log('Created relasi info:', relasiInfo);
        
        // Add the appropriate relasi reference to the data
        let dataWithRelasi;
        if (isIdentitas) {
            // For Identitas, add relasi id
            dataWithRelasi = [...formData, relasiInfo.id];
            console.log('Data with relasi ID for identitas:', dataWithRelasi);
        } else {
            // For other tables, add id_trx
            dataWithRelasi = [...formData, relasiInfo.id_trx];
            console.log('Data with id_trx for other tables:', dataWithRelasi);
        }
        
        const result = await appendToSheet(`${sheetName}!A:ZZ`, [dataWithRelasi]);
        console.log(`Successfully appended to ${sheetName}:`, result);
        
        // Reset relasi IDs after use (so new record gets new relasi)
        currentRelasiId = null;
        currentIdTrx = null;
        
        return true;
        
    } catch (error) {
        console.error('Error appending user data:', error);
        console.error('Sheet name:', sheetName);
        console.error('Form data:', formData);
        console.error('Is identitas:', isIdentitas);
        throw error;
    }
}

class GoogleSheetsAPI {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Wait for gapi to be ready
            await new Promise((resolve, reject) => {
                let checkCount = 0;
                const checkGapi = () => {
                    if (gapi && gapi.client) {
                        resolve();
                    } else if (checkCount < 20) { // Wait up to 10 seconds
                        checkCount++;
                        setTimeout(checkGapi, 500);
                    } else {
                        reject(new Error('Failed to load Google API'));
                    }
                };
                checkGapi();
            });

            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing Google Sheets API:', error);
            throw error;
        }
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('d-none');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('d-none');
    }

    async readSheet(sheetName) {
        if (!this.isInitialized) await this.init();
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            throw new Error('User not authenticated');
        }

        try {
            this.showLoading();
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.spreadsheetId,
                range: CONFIG.sheets[sheetName]
            });

            const rows = response.result.values || [];
            if (rows.length === 0) return [];

            // Convert rows to objects using column mappings
            const headers = CONFIG.columns[sheetName];
            return rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
        } catch (error) {
            console.error('Error reading sheet:', error);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async appendRow(sheetName, data) {
        if (!this.isInitialized) await this.init();
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            throw new Error('User not authenticated');
        }

        try {
            this.showLoading();
            const headers = CONFIG.columns[sheetName];
            const values = [headers.map(header => data[header] || '')];

            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: CONFIG.spreadsheetId,
                range: CONFIG.sheets[sheetName],
                valueInputOption: 'RAW',
                resource: { values }
            });

            return true;
        } catch (error) {
            console.error('Error appending row:', error);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async updateRow(sheetName, rowIndex, data) {
        if (!this.isInitialized) await this.init();
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            throw new Error('User not authenticated');
        }

        try {
            this.showLoading();
            const headers = CONFIG.columns[sheetName];
            const values = [headers.map(header => data[header] || '')];
            const range = `${CONFIG.sheets[sheetName].split('!')[0]}!A${rowIndex + 1}`;

            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: CONFIG.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: { values }
            });

            return true;
        } catch (error) {
            console.error('Error updating row:', error);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async findRows(sheetName, columnName, value) {
        const data = await this.readSheet(sheetName);
        return data.filter(row => row[columnName] === value);
    }

    generateId(prefix = 'ID') {
        // Simple id: prefix + timestamp + short random string
        return prefix + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3);
    }
}

// Initialize the API
const sheetsAPI = new GoogleSheetsAPI();

// Function to get all sheet names in the spreadsheet
async function getSheetNames() {
    checkSheetsInitialized();
    
    try {
        const response = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: CONFIG.spreadsheetId
        });
        
        const sheetNames = response.result.sheets.map(sheet => sheet.properties.title);
        console.log('Existing sheet names:', sheetNames);
        return sheetNames;
        
    } catch (error) {
        console.error('Error getting sheet names:', error);
        throw error;
    }
}

// Function to create a new sheet tab
async function createSheet(sheetName) {
    checkSheetsInitialized();
    
    try {
        console.log('Creating sheet:', sheetName);
        
        const response = await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: CONFIG.spreadsheetId,
            resource: {
                requests: [{
                    addSheet: {
                        properties: {
                            title: sheetName
                        }
                    }
                }]
            }
        });
        
        console.log('Sheet created successfully:', sheetName);
        return response.result;
        
    } catch (error) {
        console.error('Error creating sheet:', error);
        throw error;
    }
}

// Function to setup required sheets
async function setupRequiredSheets() {
    checkSheetsInitialized();
    
    const requiredSheets = [
        'User',
        'Relasi', 
        'Identitas',
        'Pemeriksaan',
        'Laboratorium',
        'Persalinan',
        'Nifas',
        'ANC'
    ];
    
    try {
        console.log('Setting up required sheets...');
        const existingSheets = await getSheetNames();
        
        for (const sheetName of requiredSheets) {
            if (!existingSheets.includes(sheetName)) {
                console.log(`Sheet '${sheetName}' doesn't exist, creating...`);
                await createSheet(sheetName);
                
                // Add headers for specific sheets
                if (sheetName === 'User') {
                    await appendToSheet('User!A1:B1', [['user_id', 'email_address']]);
                } else if (sheetName === 'Relasi') {
                    await appendToSheet('Relasi!A1:E1', [['id', 'id_trx', 'user_id', 'identitas_relasi_id', 'timestamp']]);
                }
                
                console.log(`Sheet '${sheetName}' created and headers added`);
            } else {
                console.log(`Sheet '${sheetName}' already exists`);
            }
        }
        
        console.log('All required sheets are ready');
        return true;
        
    } catch (error) {
        console.error('Error setting up required sheets:', error);
        throw error;
    }
}

// Add authentication check function
function checkAuthenticationState() {
    console.log('=== Authentication State Check ===');
    console.log('Access token:', accessToken ? 'Available' : 'Missing');
    console.log('User profile:', userProfile);
    console.log('Current user ID:', currentUserId);
    console.log('GAPI available:', !!gapi);
    console.log('GAPI client available:', !!gapi?.client);
    console.log('GAPI sheets available:', !!gapi?.client?.sheets);
    
    // Check if token is valid by making a simple API call
    if (gapi?.client?.sheets) {
        gapi.client.sheets.spreadsheets.get({
            spreadsheetId: CONFIG.spreadsheetId
        }).then(response => {
            console.log('Auth check successful - can access spreadsheet');
        }).catch(error => {
            console.error('Auth check failed:', error);
            if (error.status === 401) {
                console.error('Token expired or invalid - need to re-authenticate');
            }
        });
    }
}

// Function to check for duplicate identitas records
async function checkIdentitasDuplicate(tahun, nama_ibu, nama_suami, desa, kecamatan) {
    checkSheetsInitialized();
    
    if (!currentUserId) {
        throw new Error('User ID not set. Please sign in first.');
    }
    
    try {
        console.log('=== DUPLICATE CHECK START ===');
        console.log('Checking for duplicate identitas record...');
        console.log('Input fields:', { tahun, nama_ibu, nama_suami, desa, kecamatan });
        console.log('Current user ID:', currentUserId);
        
        // Get user's relasi records to get relasi ids
        const userRelasi = await getUserRelasiRecords();
        console.log('User relasi records:', userRelasi);
        
        if (userRelasi.length === 0) {
            console.log('No relasi records found for user, no duplicates possible');
            return false;
        }
        
        const userRelasiIds = userRelasi.map(record => record[0]); // Get all relasi ids
        console.log('User relasi IDs to check against:', userRelasiIds);
        
        // Read all data from Identitas sheet
        const allData = await readFromSheet('Identitas!A:ZZ');
        console.log('All identitas data (raw):', allData);
        
        if (!allData || allData.length <= 1) {
            console.log('No identitas data found, no duplicates possible');
            return false;
        }
        
        console.log('Checking', allData.length - 1, 'rows for duplicates...');
        
        // Check for duplicates in user's data
        const duplicateFound = allData.slice(1).some((row, index) => {
            console.log(`Checking row ${index + 1}:`, row);
            
            // Check if this row belongs to current user
            const relasiId = row[row.length - 1];
            console.log(`Row ${index + 1} relasi ID:`, relasiId);
            console.log(`User relasi IDs:`, userRelasiIds);
            
            const belongsToUser = userRelasiIds.includes(relasiId);
            console.log(`Row ${index + 1} belongs to user:`, belongsToUser);
            
            if (!belongsToUser) {
                console.log(`Row ${index + 1} skipped - not user's data`);
                return false; // Skip rows that don't belong to current user
            }
            
            // Check if the combination matches
            const rowTahun = row[1] || ''; // tahun is at index 1
            const rowNamaIbu = row[2] || ''; // nama_ibu is at index 2
            const rowNamaSuami = row[3] || ''; // nama_suami is at index 3
            const rowDesa = row[11] || ''; // desa is at index 11
            const rowKecamatan = row[10] || ''; // kecamatan is at index 10
            
            console.log(`Row ${index + 1} fields:`, {
                tahun: rowTahun,
                nama_ibu: rowNamaIbu,
                nama_suami: rowNamaSuami,
                desa: rowDesa,
                kecamatan: rowKecamatan
            });
            
            const isDuplicate = 
                rowTahun.toLowerCase().trim() === tahun.toLowerCase().trim() &&
                rowNamaIbu.toLowerCase().trim() === nama_ibu.toLowerCase().trim() &&
                rowNamaSuami.toLowerCase().trim() === nama_suami.toLowerCase().trim() &&
                rowDesa.toLowerCase().trim() === desa.toLowerCase().trim() &&
                rowKecamatan.toLowerCase().trim() === kecamatan.toLowerCase().trim();
            
            console.log(`Row ${index + 1} is duplicate:`, isDuplicate);
            
            if (isDuplicate) {
                console.log('=== DUPLICATE FOUND ===');
                console.log('Duplicate found in row:', index + 1);
                console.log('Duplicate data:', {
                    tahun: rowTahun,
                    nama_ibu: rowNamaIbu,
                    nama_suami: rowNamaSuami,
                    desa: rowDesa,
                    kecamatan: rowKecamatan
                });
            }
            
            return isDuplicate;
        });
        
        console.log('=== DUPLICATE CHECK RESULT ===');
        console.log('Final duplicate check result:', duplicateFound);
        return duplicateFound;
        
    } catch (error) {
        console.error('=== ERROR IN DUPLICATE CHECK ===');
        console.error('Error checking for duplicate:', error);
        throw error;
    }
} 