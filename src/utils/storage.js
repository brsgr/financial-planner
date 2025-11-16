const STORAGE_KEY = "financial-planner-state";

export const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return null;
  }
};

export const clearState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing state from localStorage:", err);
  }
};

export const encodeStateToURL = (state) => {
  try {
    const jsonString = JSON.stringify(state);
    // Use base64 encoding and make it URL-safe
    const base64 = btoa(jsonString);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  } catch (err) {
    console.error("Error encoding state to URL:", err);
    return null;
  }
};

export const decodeStateFromURL = (encodedState) => {
  try {
    // Restore base64 padding and special characters
    let base64 = encodedState.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const jsonString = atob(base64);
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Error decoding state from URL:", err);
    return null;
  }
};
