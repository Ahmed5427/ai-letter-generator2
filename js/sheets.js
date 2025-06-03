// sheets.js - Functions for interacting with Google Sheets API

const API_KEY = "AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A"; // User provided API Key
const SPREADSHEET_ID = "1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk"; // User provided Spreadsheet ID
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values`;

/**
 * Fetches data from a specified range in the Google Sheet.
 * @param {string} range - The A1 notation of the range to retrieve (e.g., "Settings!B2:B").
 * @returns {Promise<Array<Array<string>>>} - A promise that resolves to the sheet data as a 2D array.
 */
async function getSheetData(range) {
    const url = `${BASE_URL}/${encodeURIComponent(range)}?key=${API_KEY}`;
    console.log(`Fetching sheet data from: ${range}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Google Sheets API Error Response:", errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
        }
        const data = await response.json();
        console.log(`Successfully fetched data for range: ${range}`);
        return data.values || []; // Return empty array if no values found
    } catch (error) {
        console.error(`Error fetching Google Sheet data for range ${range}:`, error);
        // Provide a more user-friendly error or default value if needed
        // For now, re-throw to be handled by the caller
        throw error;
    }
}

/**
 * Fetches dropdown options from the 'Settings' sheet.
 * @returns {Promise<object>} - A promise that resolves to an object containing arrays for each dropdown.
 */
async function getDropdownOptions() {
    console.log("Fetching dropdown options...");
    try {
        // Fetch all required columns in one go if possible, or parallel requests
        const letterTypeRange = "Settings!B2:B"; // نوع الخطاب
        const purposeRange = "Settings!C2:C";    // الغرض من الخطاب
        const toneRange = "Settings!G2:G";       // الأسلوب

        // Using Promise.all to fetch concurrently
        const [letterTypeData, purposeData, toneData] = await Promise.all([
            getSheetData(letterTypeRange),
            getSheetData(purposeRange),
            getSheetData(toneRange)
        ]);

        // Flatten the 2D array returned by the API into a 1D array of options
        const options = {
            letterTypes: letterTypeData.flat().filter(opt => opt), // Filter out empty strings
            purposes: purposeData.flat().filter(opt => opt),
            tones: toneData.flat().filter(opt => opt)
        };
        console.log("Dropdown options fetched:", options);
        return options;
    } catch (error) {
        console.error("Error fetching dropdown options:", error);
        // Return empty options or handle error appropriately
        return { letterTypes: [], purposes: [], tones: [] };
    }
}

/**
 * Fetches all letter records from the 'Submissions' sheet.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of record objects.
 */
async function getLetterRecords() {
    // Assuming headers are in row 1: A=ID, B=Date, C=?, D=Type, E=Recipient, F=Subject, G=??, H=??, I=??, J=ReviewStatus, K=SendStatus
    // Fetching A2:K to get all relevant data
    const range = "Submissions!A2:K";
    console.log("Fetching letter records...");
    try {
        const values = await getSheetData(range);
        // Map array data to objects based on column index (adjust if columns change)
        const records = values.map(row => ({
            id: row[0] || '',          // Column A
            date: row[1] || '',        // Column B
            type: row[3] || '',        // Column D
            recipient: row[4] || '',   // Column E
            subject: row[5] || '',     // Column F
            reviewStatus: row[9] || '', // Column J
            sendStatus: row[10] || '', // Column K
            // Store the original row index (adding 2 because sheet is 1-based and data starts from row 2)
            rowIndex: values.indexOf(row) + 2
        }));
        console.log(`Fetched ${records.length} letter records.`);
        return records;
    } catch (error) {
        console.error("Error fetching letter records:", error);
        return []; // Return empty array on error
    }
}

/**
 * Updates the review status for a specific row in the 'Submissions' sheet.
 * NOTE: This requires write permissions, which usually need OAuth 2.0, not just an API key.
 * This function might fail if the API key doesn't have write access or the sheet isn't public writable.
 * @param {number} rowIndex - The row number to update (1-based index).
 * @param {string} status - The new review status.
 * @returns {Promise<object>} - The API response.
 */
async function updateReviewStatus(rowIndex, status) {
    const range = `Submissions!J${rowIndex}`; // Target cell for review status (Column J)
    const url = `${BASE_URL}/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
    console.log(`Attempting to update review status for row ${rowIndex} to '${status}' at range ${range}`);

    // !!! Authorization Warning !!!
    // Updating usually requires OAuth2.0. This fetch might fail.
    // The backend (archive API) might be responsible for sheet updates.
    console.warn("Update operation might fail due to permissions. API Key might only allow read access.");

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_OAUTH2_TOKEN' // Typically needed
            },
            body: JSON.stringify({
                values: [[status]]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Google Sheets API Update Error Response:", errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
        }

        const data = await response.json();
        console.log(`Successfully updated review status for row ${rowIndex}:`, data);
        return data;
    } catch (error) {
        console.error(`Error updating review status for row ${rowIndex}:`, error);
        throw error;
    }
}

/**
 * Deletes a specific row from the 'Submissions' sheet.
 * NOTE: This requires write permissions (OAuth 2.0 usually). Might fail with API Key.
 * @param {number} rowIndex - The row number to delete (1-based index).
 * @returns {Promise<object>} - The API response.
 */
async function deleteSheetRow(rowIndex) {
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate?key=${API_KEY}`;
    console.log(`Attempting to delete row ${rowIndex} from Submissions sheet.`);

    // !!! Authorization Warning !!!
    console.warn("Delete operation might fail due to permissions. API Key might only allow read access.");

    const requestBody = {
        requests: [
            {
                deleteDimension: {
                    range: {
                        sheetId: await getSheetIdByName("Submissions"), // Need sheetId, not name
                        dimension: "ROWS",
                        startIndex: rowIndex - 1, // API is 0-indexed
                        endIndex: rowIndex
                    }
                }
            }
        ]
    };

    try {
        // First, get the sheetId for "Submissions"
        const sheetId = await getSheetIdByName("Submissions");
        if (sheetId === null) {
            throw new Error("Could not find sheetId for 'Submissions'.");
        }
        requestBody.requests[0].deleteDimension.range.sheetId = sheetId;

        const response = await fetch(batchUpdateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer YOUR_OAUTH2_TOKEN' // Typically needed
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Google Sheets API Delete Error Response:", errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
        }

        const data = await response.json();
        console.log(`Successfully deleted row ${rowIndex}:`, data);
        return data;
    } catch (error) {
        console.error(`Error deleting row ${rowIndex}:`, error);
        throw error;
    }
}

/**
 * Helper function to get the numeric sheetId from its name.
 * @param {string} sheetName - The name of the sheet.
 * @returns {Promise<number|null>} - The numeric ID or null if not found.
 */
async function getSheetIdByName(sheetName) {
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets(properties(sheetId,title))&key=${API_KEY}`;
    console.log(`Fetching sheet metadata to find ID for '${sheetName}'...`);
    try {
        const response = await fetch(metadataUrl);
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Google Sheets API Metadata Error Response:", errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message}`);
        }
        const metadata = await response.json();
        const sheet = metadata.sheets.find(s => s.properties.title === sheetName);
        if (sheet) {
            console.log(`Found sheetId ${sheet.properties.sheetId} for sheet '${sheetName}'.`);
            return sheet.properties.sheetId;
        } else {
            console.error(`Sheet with name '${sheetName}' not found.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching sheet metadata:`, error);
        throw error;
    }
}


