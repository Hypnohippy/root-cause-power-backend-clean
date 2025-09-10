/**
 * UI/UX Improvements for Root Cause Power
 * Enhanced interactions, better visual feedback, improved accessibility
 */

class UIImprovements {
    constructor() {
        this.init();
    }

    init() {
        console.log('🎨 Initializing UI improvements...');
        this.forceHorizontalStatusLayout();
        this.enhanceAssessmentOptions();
        this.fixNavigationOverlap();
        this.improveButtonFeedback();
        this.addKeyboardNavigation();
        this.enhanceAccessibility();
        console.log('✅ UI improvements loaded');
    }

    /**
     * Enhanced Assessment Option Selection
     */
    enhanceAssessmentOptions() {
        // Better click handlers for assessment options
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('assessment-option') || 
                e.target.closest('.assessment-option')) {
                
                const option = e.target.classList.contains('assessment-option') ? 
                              e.target : e.target.closest('.assessment-option');
                
                // Clear previous selections in this group
                const container = option.closest('.assessment-container, .question-container, .step-content');
                if (container) {
                    container.querySelectorAll('.assessment-option').forEach(opt => {
                        opt.classList.remove('selected');
                        opt.setAttribute('aria-checked', 'false');
                    });
                }
                
                // Add selection to clicked option
                option.classList.add('selected');
                option.setAttribute('aria-checked', 'true');
                
                // Add visual feedback animation
                this.addSelectionAnimation(option);
                
                // Store selection value
                const value = option.getAttribute('data-value') || option.textContent.trim();
                option.setAttribute('data-selected', value);
                
                console.log('Option selected:', value);
            }
        });

        // Add hover effects
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('assessment-option')) {
                e.target.style.transform = 'translateY(-2px)';
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('assessment-option') && 
                !e.target.classList.contains('selected')) {
                e.target.style.transform = 'translateY(0)';
            }
        });
    }

    /**
     * Add selection animation
     */
    addSelectionAnimation(element) {
        // Create success checkmark animation
        const checkmark = document.createElement('div');
        checkmark.innerHTML = '✓';
        checkmark.style.cssText = `
            position: absolute;
            right: 1.5rem;
            top: 50%;
            transform: translateY(-50%) scale(0);
            background: #10b981;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            animation: checkmarkPop 0.4s ease-out forwards;
            z-index: 10;
        `;
        
        // Remove existing checkmarks
        const existing = element.querySelector('.selection-checkmark');
        if (existing) existing.remove();
        
        checkmark.className = 'selection-checkmark';
        element.appendChild(checkmark);

        // Add CSS animation if not exists
        if (!document.querySelector('#checkmark-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'checkmark-animation-styles';
            style.textContent = `
                @keyframes checkmarkPop {
                    0% { transform: translateY(-50%) scale(0); opacity: 0; }
                    60% { transform: translateY(-50%) scale(1.2); opacity: 1; }
                    100% { transform: translateY(-50%) scale(1); opacity: 1; }
                }
                
                @keyframes selectionGlow {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                
                .assessment-option.selected {
                    animation: selectionGlow 0.6s ease-out;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Fix Navigation Button Overlap
     */
    fixNavigationOverlap() {
        // Find navigation containers and improve spacing
        const navContainers = document.querySelectorAll(
            '.nav-container, .header-nav, .top-nav, .navigation'
        );
        
        navContainers.forEach(nav => {
            // Apply flexbox with proper spacing
            nav.style.cssText += `
                display: flex !important;
                flex-wrap: wrap !important;
                gap: 0.75rem !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 1rem !important;
                margin: 0.5rem 0 !important;
            `;
            
            // Fix individual buttons
            const buttons = nav.querySelectorAll('button, .btn, .nav-item, .nav-button');
            buttons.forEach(btn => {
                btn.style.cssText += `
                    margin: 0.25rem !important;
                    white-space: nowrap !important;
                    flex-shrink: 0 !important;
                    min-width: fit-content !important;
                    z-index: 1 !important;
                    position: relative !important;
                `;
            });
        });

        // Special handling for overlapping elements
        this.fixOverlappingElements();
    }

    /**
     * Fix specific overlapping elements
     */
    fixOverlappingElements() {
        // Check for elements that might overlap
        const checkOverlap = () => {
            const elements = document.querySelectorAll('button, .btn, .nav-item');
            const overlaps = [];
            
            for (let i = 0; i < elements.length; i++) {
                for (let j = i + 1; j < elements.length; j++) {
                    const rect1 = elements[i].getBoundingClientRect();
                    const rect2 = elements[j].getBoundingClientRect();
                    
                    if (rect1.right > rect2.left && 
                        rect1.left < rect2.right && 
                        rect1.bottom > rect2.top && 
                        rect1.top < rect2.bottom) {
                        overlaps.push([elements[i], elements[j]]);
                    }
                }
            }
            
            // Fix overlapping elements
            overlaps.forEach(([el1, el2]) => {
                const parent = el1.parentElement;
                if (parent && !parent.classList.contains('flex')) {
                    parent.style.cssText += `
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 1rem !important;
                    `;
                }
            });
        };
        
        // Check immediately and after DOM changes
        setTimeout(checkOverlap, 100);
        setTimeout(checkOverlap, 500);
    }

    /**
     * Improve Button Feedback
     */
    improveButtonFeedback() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn, .cta-button, .nav-button')) {
                this.addButtonClickFeedback(e.target);
            }
        });
    }

    /**
     * Add button click animation
     */
    addButtonClickFeedback(button) {
        // Add ripple effect
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            width: ${size}px;
            height: ${size}px;
            left: 50%;
            top: 50%;
            margin-left: -${size/2}px;
            margin-top: -${size/2}px;
            pointer-events: none;
        `;
        
        // Ensure button has relative positioning
        if (getComputedStyle(button).position === 'static') {
            button.style.position = 'relative';
        }
        button.style.overflow = 'hidden';
        
        button.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);

        // Add ripple animation CSS if not exists
        if (!document.querySelector('#ripple-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-animation-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Add Keyboard Navigation Support
     */
    addKeyboardNavigation() {
        // Make assessment options keyboard accessible
        document.addEventListener('keydown', (e) => {
            if (e.target.classList.contains('assessment-option')) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.click();
                }
            }
            
            // Arrow key navigation for assessment options
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                const current = document.activeElement;
                if (current && current.classList.contains('assessment-option')) {
                    e.preventDefault();
                    
                    const container = current.closest('.assessment-container, .question-container, .step-content');
                    if (container) {
                        const options = Array.from(container.querySelectorAll('.assessment-option'));
                        const currentIndex = options.indexOf(current);
                        
                        let nextIndex;
                        if (e.key === 'ArrowUp') {
                            nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                        } else {
                            nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                        }
                        
                        options[nextIndex].focus();
                    }
                }
            }
        });

        // Make assessment options focusable
        const assessmentOptions = document.querySelectorAll('.assessment-option');
        assessmentOptions.forEach(option => {
            option.setAttribute('tabindex', '0');
            option.setAttribute('role', 'radio');
            option.setAttribute('aria-checked', 'false');
        });
    }

    /**
     * Enhanced Accessibility Features
     */
    enhanceAccessibility() {
        // Add ARIA labels to interactive elements
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(btn => {
            if (!btn.getAttribute('aria-label')) {
                const text = btn.textContent.trim() || btn.getAttribute('title') || 'Button';
                btn.setAttribute('aria-label', text);
            }
        });

        // Add focus management
        document.addEventListener('focusin', (e) => {
            if (e.target.classList.contains('assessment-option')) {
                // Highlight focused option
                e.target.style.outline = '3px solid #8b5cf6';
                e.target.style.outlineOffset = '2px';
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.classList.contains('assessment-option')) {
                // Remove focus highlight
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
            }
        });

        // Add screen reader announcements
        this.addScreenReaderSupport();
    }

    /**
     * Screen Reader Support
     */
    addScreenReaderSupport() {
        // Create announcement area
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'sr-only';
        announcer.id = 'screen-reader-announcer';
        document.body.appendChild(announcer);

        // Announce option selections
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('assessment-option')) {
                const text = e.target.textContent.trim();
                this.announceToScreenReader(`Selected: ${text}`);
            }
        });
    }

    /**
     * Announce text to screen readers
     */
    announceToScreenReader(text) {
        const announcer = document.getElementById('screen-reader-announcer');
        if (announcer) {
            announcer.textContent = text;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }

    /**
     * Fix Mobile Touch Interactions
     */
    fixMobileInteractions() {
        // Improve touch targets on mobile
        if ('ontouchstart' in window) {
            const touchElements = document.querySelectorAll('.assessment-option, button, .btn');
            touchElements.forEach(el => {
                el.style.minHeight = '44px'; // iOS recommended minimum
                el.style.minWidth = '44px';
            });

            // Add touch feedback
            document.addEventListener('touchstart', (e) => {
                if (e.target.matches('.assessment-option, button, .btn')) {
                    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }
            });

            document.addEventListener('touchend', (e) => {
                if (e.target.matches('.assessment-option, button, .btn')) {
                    setTimeout(() => {
                        e.target.style.backgroundColor = '';
                    }, 150);
                }
            });
        }
    }

    /**
     * Responsive Layout Improvements
     */
    improveResponsiveness() {
        const checkLayout = () => {
            const width = window.innerWidth;
            
            // Mobile adjustments
            if (width <= 768) {
                document.querySelectorAll('.assessment-option').forEach(option => {
                    option.style.fontSize = '1rem';
                    option.style.padding = '1.25rem';
                });
                
                document.querySelectorAll('.btn, .cta-button').forEach(btn => {
                    btn.style.width = '100%';
                    btn.style.marginBottom = '0.5rem';
                });
            } else {
                // Desktop adjustments
                document.querySelectorAll('.btn, .cta-button').forEach(btn => {
                    btn.style.width = 'auto';
                });
            }
        };
        
        window.addEventListener('resize', checkLayout);
        checkLayout(); // Initial check
    }

    /**
     * CRITICAL FIX: Force horizontal layout of status indicators
     * Fixes the issue where status buttons stack vertically down the page
     */
    forceHorizontalStatusLayout() {
        console.log('🔧 Forcing horizontal status layout...');
        
        // Wait for DOM to be ready
        setTimeout(() => {
            const statusElements = [
                { id: 'api-status', right: '20rem' },
                { id: 'stop-audio-btn', right: '15rem' },
                { id: 'credit-counter', right: '10rem' },
                { id: 'voice-credit-counter', right: '5rem' }
            ];

            statusElements.forEach(({ id, right }) => {
                const element = document.getElementById(id);
                if (element) {
                    // Force horizontal positioning
                    element.style.position = 'fixed';
                    element.style.top = '1rem';
                    element.style.right = right;
                    element.style.zIndex = '9999';
                    element.style.display = 'inline-block';
                    
                    console.log(`✅ Repositioned ${id} to horizontal layout`);
                } else {
                    console.log(`⚠️ Status element ${id} not found`);
                }
            });

            // Add responsive adjustment for mobile
            if (window.innerWidth <= 768) {
                const mobilePositions = [
                    { id: 'api-status', right: '16rem' },
                    { id: 'stop-audio-btn', right: '12rem' },
                    { id: 'credit-counter', right: '8rem' },
                    { id: 'voice-credit-counter', right: '4rem' }
                ];

                mobilePositions.forEach(({ id, right }) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.style.right = right;
                        element.style.fontSize = '0.75rem';
                    }
                });
            }
        }, 100);
        
        // Reapply on window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.forceHorizontalStatusLayout(), 100);
        });
    }
}

// Initialize UI improvements when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.uiImprovements = new UIImprovements();
    });
} else {
    window.uiImprovements = new UIImprovements();
}

// Export for manual initialization
window.UIImprovements = UIImprovements;