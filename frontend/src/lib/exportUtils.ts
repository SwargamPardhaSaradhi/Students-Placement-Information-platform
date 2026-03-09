// Utility function to export data to CSV
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Get all unique keys from all objects
    const allKeys = Array.from(
        new Set(data.flatMap(item => Object.keys(item)))
    );

    // Create CSV header
    const headers = allKeys.join(',');

    // Create CSV rows
    const rows = data.map(item => {
        return allKeys.map(key => {
            const value = item[key];
            // Handle values with commas, quotes, or newlines
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }).join(',');
    });

    // Combine header and rows
    const csv = [headers, ...rows].join('\n');

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to Excel-compatible format
export function exportToExcel(data: Record<string, unknown>[], filename: string) {
    exportToCSV(data, filename);
}
