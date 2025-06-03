// api.js - Functions for interacting with backend APIs

const GENERATE_API_URL = "http://128.140.37.194:5000/generate-letter";
const ARCHIVE_API_URL = "http://128.140.37.194:5000/archive-letter";

/**
 * Calls the generate-letter API.
 * @param {object} payload - The data to send to the API.
 * @returns {Promise<object>} - The API response.
 */
async function generateLetter(payload) {
    console.log("Sending payload to generate API:", payload);
    try {
        const response = await fetch(GENERATE_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Generate API Error Response:", errorData);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }

        const data = await response.json();
        console.log("Received response from generate API:", data);
        // Assuming the API returns the generated letter in a specific field, e.g., "generated_text"
        // Adjust the return based on the actual API response structure
        if (!data || !data.generated_text) {
             console.warn("API response structure might be different. Expected 'generated_text'. Received:", data);
             // Attempt to return the whole data object if specific field is missing
             // return data;
        }
        // Assuming the API also returns an ID for the generated letter, e.g., "letter_id"
        if (!data.letter_id) {
            console.warn("API response structure might be missing 'letter_id'. Received:", data);
        }
        return data;
    } catch (error) {
        console.error("Error calling generateLetter API:", error);
        throw error; // Re-throw the error to be caught by the caller
    }
}

/**
 * Calls the archive-letter API using FormData.
 * @param {FormData} formData - The FormData object containing letter details and potentially a file.
 * @returns {Promise<object>} - The API response.
 */
async function archiveLetter(formData) {
    console.log("Sending FormData to archive API:");
    // Log FormData entries for debugging
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    try {
        const response = await fetch(ARCHIVE_API_URL, {
            method: "POST",
            body: formData, // Pass FormData directly, browser sets Content-Type automatically
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Archive API Error Response:", errorData);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }

        const data = await response.json();
        console.log("Received response from archive API:", data);
        return data;
    } catch (error) {
        console.error("Error calling archiveLetter API:", error);
        throw error; // Re-throw the error to be caught by the caller
    }
}

