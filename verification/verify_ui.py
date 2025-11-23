from playwright.sync_api import sync_playwright

def verify_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Verify POS Window
        page_pos = browser.new_page(viewport={'width': 1024, 'height': 768})
        # Use file protocol to access the HTML file directly
        # Note: In a real Electron app, main.js loads the file. Here we mock it by opening index.html.
        # We need to simulate the environment or at least check the static UI.
        # Ideally, we would run the electron app, but Playwright interacts with web content.
        # Since we can't easily drive the Electron main process from here without a specific driver,
        # we will load index.html as a file, which allows us to verify HTML/CSS structure.
        # Limitations: 'require' (Node integration) won't work in standard browser,
        # so we expect some JS errors, but CSS and Layout should render.

        # NOTE: Because 'require' is used in main.js/renderer.js, loading this in a standard browser
        # might fail to render the full JS logic (App init).
        # However, we can inject a mock script to simulate App initialization if needed,
        # or just verify the CSS/HTML static structure if the JS fails.

        # Let's try to load it and see if the HTML structure renders with the CSS.
        import os
        cwd = os.getcwd()
        file_url = f"file://{cwd}/coffee-shop-app/frontend/index.html"

        # We need to mock the 'window.api' and 'require' to prevent white screens if JS crashes
        page_pos.add_init_script("""
            window.require = () => { return { ipcRenderer: { on: ()=>{}, send: ()=>{} } } };
            window.api = {
                get: async () => [],
                post: async () => {}
            };
            // Mock localStorage to simulate logged in state
            localStorage.setItem('user', JSON.stringify({role: 'cashier', name: 'TestUser'}));
            localStorage.setItem('userRole', 'cashier');
        """)

        try:
            page_pos.goto(file_url)
            page_pos.wait_for_timeout(2000) # Wait for potential JS execution

            # Capture POS View
            page_pos.screenshot(path="verification/pos_screenshot.png")
            print("POS Screenshot captured.")
        except Exception as e:
            print(f"POS Screenshot failed: {e}")

        # 2. Verify Kitchen Window (by hash)
        page_kitchen = browser.new_page(viewport={'width': 800, 'height': 600})
        page_kitchen.add_init_script("""
            window.require = () => { return { ipcRenderer: { on: ()=>{}, send: ()=>{} } } };
            window.api = {
                get: async (url) => {
                    if(url.includes('kitchen')) return [
                        {id: 1, daily_order_number: 101, table_number: 5, created_at: new Date().toISOString(), kitchen_status: 'pending', items: [{quantity: 2, product_name: 'Burger'}]},
                        {id: 2, daily_order_number: 102, table_number: 6, created_at: new Date(Date.now() - 600000).toISOString(), kitchen_status: 'preparing', items: [{quantity: 1, product_name: 'Fries'}]}
                    ];
                    return [];
                },
                post: async () => {}
            };
        """)

        try:
            page_kitchen.goto(file_url + "#kitchen")
            page_kitchen.wait_for_timeout(2000)
            page_kitchen.screenshot(path="verification/kitchen_screenshot.png")
            print("Kitchen Screenshot captured.")
        except Exception as e:
            print(f"Kitchen Screenshot failed: {e}")

        # 3. Verify Bar Window (by hash)
        page_bar = browser.new_page(viewport={'width': 800, 'height': 600})
        page_bar.add_init_script("""
            window.require = () => { return { ipcRenderer: { on: ()=>{}, send: ()=>{} } } };
            window.api = {
                get: async (url) => {
                    if(url.includes('bar')) return [
                        {id: 3, daily_order_number: 103, table_number: 2, created_at: new Date().toISOString(), bar_status: 'preparing', items: [{quantity: 1, product_name: 'Latte'}]}
                    ];
                    return [];
                },
                post: async () => {}
            };
        """)

        try:
            page_bar.goto(file_url + "#bar")
            page_bar.wait_for_timeout(2000)
            page_bar.screenshot(path="verification/bar_screenshot.png")
            print("Bar Screenshot captured.")
        except Exception as e:
            print(f"Bar Screenshot failed: {e}")

        browser.close()

if __name__ == "__main__":
    verify_ui()
