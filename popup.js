document.getElementById('getReport').addEventListener('click', () => {
    document.getElementById('report').innerHTML = 'Loading time data...';
    chrome.runtime.sendMessage({ action: "getTimeSpent" }, (response) => {
        console.log("Received response:", response); 
        if (Object.keys(response).length === 0) {
            document.getElementById('report').innerHTML = 'No time data available';
        } else {
            const reportDiv = document.getElementById('report');
            reportDiv.innerHTML = '';
            for (const [domain, time] of Object.entries(response)) {
                const p = document.createElement('p');
                p.textContent = `${domain}: ${time.toFixed(2)} seconds`;
                reportDiv.appendChild(p);
            }
        }
    });
});

