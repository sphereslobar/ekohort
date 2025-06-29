// Configuration for Google Sheets API
// This file will be populated by GitHub Actions with environment variables
// For local development, you can set these values directly

// Google API configuration
const CONFIG = {
    // Get these values from Google Cloud Console
    apiKey: 'AIzaSyBlRbGRov5KneEy_nWmffDdRKaWQBuG0-w', // From APIs & Services > Credentials > API Keys
    clientId: '1040492034608-klt6crk38lpo8vt9hpqauer57tsn78sb.apps.googleusercontent.com', // From APIs & Services > Credentials > OAuth 2.0 Client IDs
    
    // Your Google Sheet ID (from the sheet's URL)
    // Example URL: https://docs.google.com/spreadsheets/d/1234567890abcdef/edit
    // The ID would be: 1234567890abcdef
    spreadsheetId: '11daJpEK69zVxm7HBxr23spqUTGhm2qqBLYGfr0mSBsg',
    
    // Don't change these values
    apiScope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    
    // Sheet names and ranges
    sheets: {
        identitas: 'Identitas!A:K',
        pemeriksaan: 'Pemeriksaan!A:O',
        laboratorium: 'Laboratorium!A:L',
        persalinan: 'Persalinan!A:I',
        nifas: 'Nifas!A:J',
        anc: 'ANC!A:H',
        relation: 'Relation!A:D',
        users: 'Users!A:C'
    },
    
    // Column mappings for each sheet
    columns: {
        identitas: [
            'id', 'nik', 'tahun', 'nama_ibu', 'nama_suami', 
            'alamat', 'sumber_pembiayaan', 'usia_bidan', 
            'dusun', 'desa', 'kecamatan'
        ],
        pemeriksaan: [
            'id_trx', 'status_gpa', 'jarak_kehamilan', 'hpht', 
            'taksiran_persalinan', 'tb', 'lila', 'status_imunisasi_td',
            'injeksi_td', 'skrining_tbc', 'skrining_jiwa', 'konseling',
            'komplikasi', 'tata_laksana_kasus_bumil'
        ],
        laboratorium: [
            'id_trx', 'lab_hb', 'golda', 'protein_urin', 'glukosa_urin',
            'hiv', 'sifilis', 'hbsag', 'tbc_mikroskopis', 'malaria',
            'lain_lain'
        ],
        persalinan: [
            'id_trx', 'tgl_persalinan', 'berat_bayi_lebih_2500',
            'berat_bayi_kurang_2500', 'cara_persalinan', 'tempat_persalinan',
            'penolong_persalinan', 'penyulit_persalinan'
        ],
        nifas: [
            'id_trx', 'kf1', 'kf2', 'kf3', 'kf4', 'tgl_kb',
            'metode_kb', 'tgl_kasus_nifas', 'jenis_tindakan', 'keterangan'
        ],
        anc: [
            'id_trx', 'tgl_anc', 'bb', 'tb', 'td', 'uk', 'djj', 'tfu'
        ]
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.appConfig = CONFIG;
} 