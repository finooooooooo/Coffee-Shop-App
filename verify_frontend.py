
from playwright.sync_api import Page, expect, sync_playwright

def verify_coffee_shop_ui(page: Page):
    # 1. Navigate to the frontend (served by python http.server)
    page.goto("http://localhost:8000/index.html")

    # 2. Mock the electron requirements because they don't exist in browser
    # We inject a script to define window.require and a mock ipcRenderer
    page.evaluate("""
        window.require = function(module) {
            if (module === 'electron') {
                return {
                    ipcRenderer: {
                        send: (channel, data) => console.log('IPC send:', channel, data),
                        on: (channel, func) => console.log('IPC on:', channel)
                    }
                };
            }
            return {};
        };
    """)

    # 3. Wait for the menu to load (fetched from backend)
    # The backend is running on port 5000, frontend on 8000.
    # CORS might be an issue if not handled in backend, but flask-cors is installed.

    # Expect to see "Cappuccino" which is in our seed data
    expect(page.get_by_text("Cappuccino")).to_be_visible(timeout=10000)

    # 4. Verify Theme Elements
    # Check for the brown header
    header = page.locator("header")
    expect(header).to_have_css("background-color", "rgb(78, 52, 46)") # #4E342E

    # 5. Interact: Add an item
    # Click "Tambah" on Cappuccino
    # Note: In our new HTML/CSS, the button says "+ Tambah" and has class "add-btn"

    # We need to reload the page or re-inject the script *before* the DOMContentLoaded fires?
    # Actually, the script tags in index.html execute immediately.
    # Our injection above happens after goto, but before we interact.
    # However, renderer.js runs on DOMContentLoaded.
    # If renderer.js fails because require is missing, it won't fetch data.

    # Strategy: Intercept the request to renderer.js and prepend the mock.
    # Or simpler: Just screenshot the initial load if it works.
    # But renderer.js fails instantly in browser if require is undefined.
    pass

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Pre-inject the mock before any script runs
        page.add_init_script("""
            window.require = function(module) {
                if (module === 'electron') {
                    return {
                        ipcRenderer: {
                            send: (channel, data) => console.log('IPC send:', channel, data),
                            on: (channel, func) => console.log('IPC on:', channel)
                        }
                    };
                }
                throw new Error('Unknown module: ' + module);
            };
        """)

        try:
            verify_coffee_shop_ui(page)
            page.screenshot(path="/home/jules/verification/coffee-shop.png", full_page=True)
            print("Screenshot taken")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            browser.close()
