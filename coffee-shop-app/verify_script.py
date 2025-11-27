from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        # Disable web security to allow file:// to fetch http://localhost
        browser = p.chromium.launch(headless=True, args=["--disable-web-security"])
        page = browser.new_page()

        # Inject Mock API
        page.add_init_script("""
            window.api = {
                baseUrl: 'http://localhost:5000/api',
                async request(method, endpoint, data = null) {
                    const options = {
                        method: method,
                        headers: { 'Content-Type': 'application/json' }
                    };
                    if (data) options.body = JSON.stringify(data);

                    const res = await fetch(this.baseUrl + endpoint, options);
                    return res.json();
                },
                get: (endpoint) => window.api.request('GET', endpoint),
                post: (endpoint, data) => window.api.request('POST', endpoint, data),
                put: (endpoint, data) => window.api.request('PUT', endpoint, data),
                delete: (endpoint) => window.api.request('DELETE', endpoint)
            };
        """)

        import os
        cwd = os.getcwd()
        frontend_path = f"file://{cwd}/coffee-shop-app/frontend/index.html"

        print(f"Navigating to {frontend_path}")
        page.goto(frontend_path)

        # 1. Login
        print("Attempting login...")
        page.fill("#username", "Kasir")
        page.fill("#password", "kasir")
        page.click("button[type='submit']")

        # Wait for POS view
        page.wait_for_selector(".menu-layout", timeout=10000)
        print("Logged in, POS view loaded.")

        # 2. Add Item to Cart
        # First product card
        # Wait for grid
        page.wait_for_selector(".product-card", timeout=5000)

        # Click first card
        page.click(".product-card:first-child")

        # Wait for item in cart
        page.wait_for_selector("#cart-items div", timeout=2000)
        print("Item added to cart.")

        # 3. Open Payment Modal
        page.click("button:has-text('Bayar Sekarang')")
        page.wait_for_selector("#modal-container", timeout=2000)
        print("Payment modal opened.")

        # 4. Verify Payment Modal Elements
        # Check for Cancel button
        cancel_btn = page.locator("button:has-text('Cancel')")
        if cancel_btn.is_visible():
            print("Cancel button verified.")
        else:
            print("Cancel button NOT found.")

        # Check Inline Validation
        # Enter amount less than total
        input_amount = page.locator("#payment-amount")
        # current_val = input_amount.input_value() # Might need to wait
        page.fill("#payment-amount", "100") # Very low amount

        # Trigger change event
        input_amount.press("Enter")
        page.wait_for_timeout(500) # wait for js

        err_msg = page.locator("#error-display")
        if err_msg.is_visible() and "Kurang" in err_msg.text_content():
            print("Inline validation verified (Error shown).")
        else:
            txt = err_msg.text_content() if err_msg.is_visible() else 'Hidden'
            print(f"Inline validation FAILED. Text: {txt}")

        # Screenshot 1: Payment Modal with Error
        page.screenshot(path="/home/jules/verification/pos_payment_error.png")
        print("Screenshot saved: pos_payment_error.png")

        # Close modal to allow logout
        cancel_btn.click()
        page.wait_for_timeout(500)

        # 5. Inventory Verification (Need to switch to Admin)
        # Reload/Logout
        page.evaluate("localStorage.clear()")
        page.reload()

        print("Logging in as Admin...")
        page.fill("#username", "Admin")
        page.fill("#password", "admin")
        page.click("button[type='submit']")

        page.wait_for_selector(".inventory-container", timeout=5000)
        print("Inventory view loaded.")

        # Open Add Modal
        page.click("button:has-text('Add Product')")
        page.wait_for_selector("#modal-container", timeout=2000)

        # Toggle Retail vs Kitchen
        # Check Retail (default) -> Stock input visible
        stock_input = page.locator("#prod-stock")
        if stock_input.is_visible():
             print("Retail mode: Stock input visible.")

        # Click Kitchen
        # Need to find radio button.
        # locator input[value='kitchen']
        page.click("input[value='kitchen']")
        page.wait_for_timeout(500)

        # Check if hidden. Note: style.display='none' means it might still be in DOM but not visible
        if not stock_input.is_visible():
            print("Kitchen mode: Stock input hidden.")
        else:
            print("Kitchen mode: Stock input STILL visible (Fail).")

        # Screenshot 2: Inventory Modal Kitchen Mode
        page.screenshot(path="/home/jules/verification/inventory_modal.png")
        print("Screenshot saved: inventory_modal.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
