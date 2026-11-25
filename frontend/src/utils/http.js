// Turns an error from axios into a sentence we can show to the user
export function getErrorMessage(err) {
    const data = err?.response?.data;
  
    // Our API sends { message, details: [{ field, message }] } for invalid data
    if (Array.isArray(data?.details) && data.details.length) {
      return data.details.map((d) => d.message).join('. ');
    }
    if (data?.message) return data.message;
    if (err?.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the API running?';
    return err?.message || 'Something went wrong';
  }