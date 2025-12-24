// import { type HRMParams, type TVState } from "@/types/hrm-api";

// Base URL for the HRM backend
const API_BASE_URL = 'https://hrm.exequte.cn';

/**
 * Helper function to handle fetch requests
 */
const request = async <T>(endpoint: string, method: string = 'GET', body: any = null): Promise<T> => {
    try {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

        // Handle image responses for download endpoints
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('image/png')) {
            // Return raw blob/buffer for images if needed
            // Casting to unknown then T to satisfy TS, though caller should expect Blob/Response
            return response as unknown as T;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error requesting ${endpoint}:`, error);
        throw error;
    }
};

// --- Types ---

export interface CalcCaloriesParams {
    startTimestamp: number | string;
    endTimestamp: number | string;
    bandId: string;
    weight: number;
    age: number;
    gender: 'male' | 'female' | string;
}

export interface BandInfo {
    bandId: string;
    weight: number;
    age: number;
    gender: 'male' | 'female' | string;
}

// --- Core Calculation APIs ---

/**
 * Calculate calories and stats based on heart rate data
 */
export const calcCalories = (params: CalcCaloriesParams) => {
    return request<any>('/calccalories', 'POST', params);
};

/**
 * Get raw HRM data for a specific device and time
 */
export const getHrmData = (params: CalcCaloriesParams) => {
    return request<any>('/gethrmdata', 'POST', params);
};

/**
 * Get detailed HRM data including raw data and summaries
 */
export const getHrmDataRaw = (params: CalcCaloriesParams) => {
    return request<any>('/get_hrm_data', 'POST', params);
};

// --- Graph APIs ---

/**
 * Get HRM graph data (base64)
 */
export const getHrmGraph = (params: CalcCaloriesParams) => {
    return request<any>('/gethrmgraph', 'POST', params);
};

/**
 * Get all graph types (raw, zones, combined)
 */
export const getHrmDataGraph = (params: CalcCaloriesParams) => {
    return request<any>('/gethrmdatagraph', 'POST', params);
};

/**
 * Generate a complete workout summary picture (calls external generator)
 */
export const getHrmPic = (params: any) => {
    return request<any>('/gethrmpic', 'POST', params);
};

// --- Device APIs ---

export const getHrmDevices = () => {
    return request<any>('/gethrmdevices', 'GET');
};

export const getHrmByModel = (modelName: string) => {
    return request<any>(`/gethrm/${modelName}`, 'GET');
};

/**
 * Get the very last heart rate entry for all devices
 */
export const getHrmLast = () => {
    return request<any>('/gethrmlast', 'GET');
};

/**
 * Get last HRM data with calorie calculations for a list of bands
 */
export const getHrmLastWithCalorie = (
    bands: BandInfo[],
    startTimestamp: number | string,
    endTimestamp: number | string
) => {
    return request<any>('/gethrmlastwithcalorie', 'POST', {
        bands,
        startTimestamp,
        endTimestamp
    });
};

// --- TV State APIs ---

export const setTvState = (tvId: string, state: any) => {
    return request<any>('/set-tv-state', 'POST', { tvId, state });
};

export const getTvState = (tvId: string) => {
    return request<any>(`/get-tv-state/${tvId}`, 'GET');
};
