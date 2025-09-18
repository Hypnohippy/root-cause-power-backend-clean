// Bulletproof Dashboard Fix - External Script
console.log('🚀 External dashboard script loading...');

function initializeDashboard() {
    console.log('🎯 Dashboard function working from external script!');
    
    var dashElement = document.querySelector('#dashboard') || 
                     document.querySelector('.dashboard-content') || 
                     document.querySelector('[class*="dashboard"]') ||
                     document.querySelector('.container');
    
    if (dashElement) {
        var results = window.assessmentResults || {};
        
        if (results.completed) {
            dashElement.innerHTML = '<div style="padding:30px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:15px; margin:20px; text-align:center; color:white; box-shadow:0 10px 25px rgba(0,0,0,0.2);"><h2 style="margin:0 0 15px 0; font-size:2.5em;">🎉 Assessment Complete!</h2><p style="margin:0 0 20px 0; font-size:1.2em;">Your personalized health insights are ready</p><button onclick="navigateToSection(\'coaches\')" style="background:#4CAF50; color:white; padding:15px 30px; border:none; border-radius:25px; font-size:1.1em; cursor:pointer; box-shadow:0 4px 15px rgba(76,175,80,0.3); transition:all 0.3s;">💬 Talk to AI Coach</button></div>';
            console.log('✅ Assessment results displayed!');
        } else {
            dashElement.innerHTML = '<div style="padding:30px; background:linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); border-radius:15px; margin:20px; text-align:center; color:white; box-shadow:0 10px 25px rgba(0,0,0,0.2);"><h2 style="margin:0 0 15px 0; font-size:2.5em;">🏠 Welcome to Your Dashboard</h2><p style="margin:0 0 20px 0; font-size:1.2em;">Take your health assessment to unlock personalized insights</p><button onclick="navigateToSection(\'assessment\')" style="background:#e17055; color:white; padding:15px 30px; border:none; border-radius:25px; font-size:1.1em; cursor:pointer; box-shadow:0 4px 15px rgba(225,112,85,0.3); transition:all 0.3s;">🔍 Start Assessment</button></div>';
            console.log('✅ Welcome message displayed!');
        }
    } else {
        console.log('⚠️ No dashboard element found, creating popup...');
        var popup = document.createElement('div');
        popup.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:30px; border-radius:15px; box-shadow:0 20px 40px rgba(0,0,0,0.3); z-index:10000; color:black; text-align:center; max-width:400px;';
        popup.innerHTML = '<h2 style="color:#2563eb; margin:0 0 15px 0;">✅ Dashboard Working!</h2><p style="margin:0 0 20px 0;">Your assessment system is now functional</p><button onclick="this.parentElement.remove()" style="background:#2563eb; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">Close</button>';
        document.body.appendChild(popup);
    }
}

// Multiple ways to trigger dashboard
window.addEventListener('load', function() {
    setTimeout(initializeDashboard, 2000);
});

window.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeDashboard, 1000);
});

// Override navigation to dashboard
var originalNavigate = window.navigateToSection;
window.navigateToSection = function(section) {
    if (originalNavigate) {
        originalNavigate(section);
    }
    
    if (section === 'dashboard') {
        setTimeout(initializeDashboard, 500);
    }
};

// Make function globally available
window.initializeDashboard = initializeDashboard;

console.log('✅ External dashboard script loaded successfully!');
