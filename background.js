let timeSpent = {};
let currentTabId = null;
let startTime = Date.now();
let currentDomain = null;


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


setInterval(() => {
    updateTimeForCurrentDomain();
}, 1000);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTimeSpent") {
        // Update time before sending response
        updateTimeForCurrentDomain();
        console.log("Sending time spent data:", timeSpent);
        sendResponse(timeSpent);
    }
    return true; 
});

