let timeSpent = {};
let currentTabId = null;
let startTime = Date.now();
let currentDomain = null;
let systemId = null;



function generateSystemId() {
    return 'sys_' + Math.random().toString(36).substr(2, 9);
}


function updateTimeForCurrentDomain() {
    if (currentDomain) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        timeSpent[currentDomain] = (timeSpent[currentDomain] || 0) + elapsed;
        startTime = Date.now();
    }
}

chrome.tabs.onActivated.addListener(activeInfo => {

    updateTimeForCurrentDomain();
    
    chrome.tabs.get(activeInfo.tabId, tab => {
        if (tab.url) {
            const url = new URL(tab.url);
            currentDomain = url.hostname;
            timeSpent[currentDomain] = timeSpent[currentDomain] || 0;
            console.log(`Switched to ${currentDomain}`);
        }
    });
    
    currentTabId = activeInfo.tabId;
    startTime = Date.now();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {

        updateTimeForCurrentDomain();
        
        const url = new URL(tab.url);
        currentDomain = url.hostname;
        timeSpent[currentDomain] = timeSpent[currentDomain] || 0;
        startTime = Date.now();
        console.log(`Tracking time for ${currentDomain}`);
    }
});


chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['systemId'], (result) => {
        if (!result.systemId) {
            systemId = generateSystemId();
            chrome.storage.local.set({ systemId: systemId });
        } else {
            systemId = result.systemId;
        }
    });
});


setInterval(() => {
    updateTimeForCurrentDomain();
    if (currentDomain && systemId) {
        // Send data to backend
        fetch('http://localhost:5000/api/time', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: systemId,
                domain: currentDomain,
                timeSpent: timeSpent[currentDomain]
            })
        }).catch(error => console.error('Error sending data:', error));
    }
}, 60000); // Changed to 60000 (1 minute) to avoid too frequent updates




chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimeSpent") {
        // Update time before sending response
        updateTimeForCurrentDomain();
        console.log("Sending time spent data:", timeSpent);
        sendResponse(timeSpent);
    } else if (request.action === "resetData") {
        timeSpent = {};
        currentDomain = null;
        startTime = Date.now();
        
        // Clear data from backend
        if (systemId) {
            fetch(`http://localhost:5000/api/reset/${systemId}`, {
                method: 'DELETE'
            }).catch(error => console.error('Error clearing backend data:', error));
        }
        
        console.log("Data reset successfully");
        sendResponse({ success: true });
    }
    return true; 
});


