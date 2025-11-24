from playwright.sync_api import sync_playwright, expect
import time

def verify_flow(page):
    # Mock window.api
    page.add_init_script("""
        window.api = {
            get: async (url) => {
                const res = await fetch('http://localhost:5000/api' + url);
                return res.json();
            },
            post: async (url, data) => {
                const res = await fetch('http://localhost:5000/api' + url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                return res.json();
            }
        };
    """)

    # Handle dialogs (alerts)
    page.on("dialog", lambda d: (print(f"Dialog: {d.message}"), d.accept()))

    # 1. Login
    print("Navigating to login...")
    page.goto("http://localhost:8081/index.html")
    page.wait_for_selector(".login-container")

    # Login as Cashier
    page.fill("#username", "Kasir")
    page.fill("#password", "kasir")
    page.click("button[type=submit]")

    # 2. Verify POS (No Splash)
    print("Verifying POS...")
    page.wait_for_selector(".menu-layout", timeout=5000)

    # 3. Add to Cart and Checkout
    print("Adding to cart...")
    page.locator(".product-card").first.click()

    # Click Pay (Open Modal)
    print("Clicking payment...")
    page.click("#cart-totals + button")

    # Verify Customer Name Input exists
    page.wait_for_selector("#customer-name")
    page.fill("#customer-name", "Test Customer")

    # Process Payment
    print("Processing payment...")
    page.click("text=QRIS / Cash")
    page.click("#modal-container button.btn-primary")

    # Verify Success Modal
    print("Waiting for success message...")
    try:
        page.wait_for_selector("text=Pembayaran Berhasil", timeout=5000)
        print("Success message found!")
        page.screenshot(path="/home/jules/verification/4_success.png")
    except Exception as e:
        print("Success message NOT found. Taking screenshot.")
        page.screenshot(path="/home/jules/verification/debug_payment_fail.png")
        raise e

    # Reload to clear (click Done)
    page.click("button:has-text('Selesai')")

    # 4. History Flow
    print("Checking History...")
    page.click("text=History")
    page.wait_for_selector("table")

    # Verify order is there
    expect(page.locator("table")).to_contain_text("Test Customer")
    page.screenshot(path="/home/jules/verification/5_history_before.png")

    # Clear History
    print("Clearing History...")
    page.click("button:has-text('Clear History & Send to Reports')")

    # Wait for reload
    time.sleep(2)
    page.screenshot(path="/home/jules/verification/6_history_after.png")

    print("Verification Complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_flow(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
