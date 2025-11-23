from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            # 1. Go to App
            page.goto("http://localhost:8000/coffee-shop-app/frontend/index.html")

            # 2. Login as Kasir
            page.fill('#username', 'Kasir')
            page.fill('#password', 'kasir')
            page.click('button[type="submit"]')

            # Wait for Lobby
            print("Waiting for Lobby...")
            page.wait_for_selector('button:has-text("New Order")')
            page.screenshot(path="verification/0_lobby.png")

            # Click New Order
            page.click('button:has-text("New Order")')

            # Wait for POS to load products
            print("Waiting for Products...")
            page.wait_for_selector('.pos-card', timeout=5000)

            page.screenshot(path="verification/1_pos_view.png")

            # 3. Add items to cart (Mixed Food and Drink)
            cards = page.locator('.pos-card')
            cards.nth(0).click()
            cards.nth(1).click()

            page.wait_for_timeout(500)
            page.screenshot(path="verification/2_cart_added.png")

            # 4. Checkout
            page.click('button:has-text("Process Payment")')
            page.wait_for_timeout(500)

            # Select Cash
            page.click('.payment-method-card:has-text("Cash")')

            # Enter amount
            page.fill('#cash-input', '200000')
            page.click('button:has-text("Complete Order")')

            page.wait_for_timeout(1000)
            page.screenshot(path="verification/3_success.png")

            # 5. Check History/Kitchen
            print("Navigating to Kitchen...")
            page.evaluate("app.navigate('kitchen')")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/4_kitchen_view.png")

            print("Navigating to Bar...")
            page.evaluate("app.navigate('bar')")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/5_bar_view.png")

            # 6. Check History
            print("Navigating to History...")
            page.evaluate("app.navigate('history')")
            page.wait_for_timeout(2000)
            page.screenshot(path="verification/6_history_view.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/debug_error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
