document.getElementById('getReport').addEventListener('click', () => {
    document.getElementById('report').innerHTML = 'Loading time data...';
    
    // First get current data from background script
    chrome.runtime.sendMessage({ action: "getTimeSpent" }, (localData) => {
        chrome.storage.local.get(['systemId'], (result) => {
            if (!result.systemId) {
                document.getElementById('report').innerHTML = 'System ID not found';
                return;
            }

            // Fetch data from backend and combine with local data
            fetch(`http://localhost:5000/api/report/${result.systemId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(serverData => {
                    const reportDiv = document.getElementById('report');
                    reportDiv.innerHTML = '';
                    
                    // Combine server data with local data
                    const domainTotals = {};
                    
                    // Add server data
                    serverData.forEach(entry => {
                        if (!domainTotals[entry.domain]) {
                            domainTotals[entry.domain] = 0;
                        }
                        domainTotals[entry.domain] += entry.timeSpent;
                    });

                    // Add local data
                    for (const [domain, time] of Object.entries(localData)) {
                        if (!domainTotals[domain]) {
                            domainTotals[domain] = 0;
                        }
                        domainTotals[domain] += time;
                    }

                    // Display results
                    const sortedDomains = Object.entries(domainTotals)
                        .sort(([,a], [,b]) => b - a); // Sort by time spent (descending)

                    for (const [domain, time] of sortedDomains) {
                        const p = document.createElement('p');
                        const minutes = Math.floor(time / 60);
                        const seconds = Math.floor(time % 60);
                        p.textContent = `${domain}: ${minutes}m ${seconds}s`;
                        reportDiv.appendChild(p);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    // If server error, just show local data
                    const reportDiv = document.getElementById('report');
                    reportDiv.innerHTML = '';
                    
                    const sortedLocalData = Object.entries(localData)
                        .sort(([,a], [,b]) => b - a); // Sort by time spent (descending)
                    
                    for (const [domain, time] of sortedLocalData) {
                        const p = document.createElement('p');
                        const minutes = Math.floor(time / 60);
                        const seconds = Math.floor(time % 60);
                        p.textContent = `${domain}: ${minutes}m ${seconds}s`;
                        reportDiv.appendChild(p);
                    }
                    
                    document.getElementById('status').innerHTML = 
                        '<div class="error">Note: Could not fetch server data. Showing local data only.</div>';
                });
        });
    });
});

// Add reset button functionality
document.getElementById('resetData').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all tracking data?')) {
        chrome.runtime.sendMessage({ action: "resetData" }, (response) => {
            if (response.success) {
                document.getElementById('report').innerHTML = 'Data has been reset successfully';
                document.getElementById('status').innerHTML = 
                    '<div class="success">Tracking data reset successfully!</div>';
            }
        });
    }
});