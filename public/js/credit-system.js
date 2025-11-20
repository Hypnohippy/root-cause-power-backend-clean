class CreditSystem {
    constructor() {
        this.isVip = false; // Start with VIP status as false
        this.dailyCredits = { count: 0, maxDaily: 5, lastReset: "" }; // Default values
        this.voiceCredits = 0; // Default values
        this.stripe = null;
        this.user_id = null; // Store the user ID

        // Fetch user from Supabase to get VIP status and credits
        this.fetchUserFromSupabase();

        this.initStripe();
        this.updateCreditDisplays();
        this.startDailyReset();
    }

    // Fetch user data (including credits) from Supabase
    async fetchUserFromSupabase() {
        try {
            const user = await this.getUserFromSupabase(); // Fetch user info from Supabase
            if (user) {
                this.user_id = user.id; // Set user ID
                this.isVip = user.isVip; // Set VIP status

                // Fetch and set credits
                await this.loadCreditsFromSupabase();

                // If VIP, set unlimited credits
                if (this.isVip) {
                    this.dailyCredits.count = 999999;
                    this.voiceCredits = 999999;
                }
            }
        } catch (error) {
            console.error("Error fetching user or credits from Supabase:", error);
        }
    }

    // Get user from Supabase
    async getUserFromSupabase() {
        const { data, error } = await supabase.auth.getUser(); // Supabase authentication
        if (error) {
            console.error('Error fetching user from Supabase:', error.message);
            return null;
        }
        return data;
    }

    // Load credits from Supabase
    async loadCreditsFromSupabase() {
        const { data, error } = await supabase
            .from('user_credits')
            .select('credits_remaining, last_reset_at')
            .eq('user_id', this.user_id)
            .single(); // Fetch credits for the logged-in user

        if (error) {
            console.error('Error fetching credits from Supabase:', error.message);
            return;
        }

        if (data) {
            this.dailyCredits.count = data.credits_remaining;
            this.dailyCredits.lastReset = data.last_reset_at;
            this.voiceCredits = data.voice_credits || 0; // Optional if you have voice credits
            this.updateCreditDisplays();
        }
    }

    // Update credits in Supabase (after using or updating them)
    async updateCreditsInSupabase() {
        try {
            const { error } = await supabase
                .from('user_credits')
                .upsert({
                    user_id: this.user_id,
                    credits_remaining: this.dailyCredits.count,
                    last_reset_at: new Date().toISOString(), // Update reset time
                    voice_credits: this.voiceCredits // Update voice credits if needed
                });

            if (error) {
                console.error('Error updating credits in Supabase:', error.message);
            }
        } catch (error) {
            console.error('Error updating credits in Supabase:', error.message);
        }
    }

    // Use daily credit (decreases credits and updates in Supabase)
    useDailyCredit(purpose = 'AI interaction') {
        if (this.isVip) {
            console.log(`👑 VIP: daily credit request for ${purpose} – no deduction applied`);
            return true;  // VIP users always have infinite credits
        }

        if (this.dailyCredits.count <= 0) {
            this.showCreditWarning('daily');
            return false;
        }

        this.dailyCredits.count--;
        this.updateCreditsInSupabase(); // Update credits in Supabase
        console.log(`💰 Daily credit used for: ${purpose}. Remaining: ${this.dailyCredits.count}`);
        return true;
    }

    // Save daily credits (if needed)
    saveDailyCredits(credits) {
        this.dailyCredits = credits;
        this.updateCreditsInSupabase(); // Sync credits with Supabase
    }

    // Display credits in the UI
    updateCreditDisplays() {
        const dailyCounter = document.getElementById('daily-credit-count');
        if (dailyCounter) {
            const displayText = this.isVip
                ? '∞'  // VIP users get infinite credits
                : `${this.dailyCredits.count}/${this.dailyCredits.maxDaily}`;
            dailyCounter.textContent = displayText;
        }

        const voiceCounter = document.getElementById('voice-credit-count');
        if (voiceCounter) {
            voiceCounter.textContent = this.isVip ? '∞' : this.voiceCredits;
        }
    }

    // Start daily reset timer
    startDailyReset() {
        setInterval(() => {
            const today = new Date().toDateString();
            if (!this.isVip && this.dailyCredits.lastReset !== today) {
                this.dailyCredits.count = this.dailyCredits.maxDaily;
                this.dailyCredits.lastReset = today;
                this.updateCreditsInSupabase();
                console.log('🔄 Daily credits reset!');
            }
        }, 60000 * 60); // Check every hour
    }
}

// Initialize the CreditSystem when the page loads
window.creditSystem = new CreditSystem();
