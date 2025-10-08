
<img width="474" height="286" alt="image" src="https://github.com/user-attachments/assets/6976891d-589f-49f2-98d9-b4d395d06766" />



## Features

* **On-the-Fly Password Generation:** Passwords are never stored — they are generated instantly when needed.  
* **Strong Cryptography:** Uses **Argon2d** for key derivation and **HMAC-SHA256** for site-specific key generation.  
* **Multiple Password Templates:** Provides predefined password templates (e.g., Maximum Security, Long, PIN) to meet different security and site requirements.  
* **Dynamic Template Selection:** Deterministically selects a template from the chosen password type based on the generated site-specific key (`siteKey`).  
* **Browser Extension:** Works as an extension for Google Chrome (and other Chromium-based browsers).  
* **Session Management:** The master password is securely stored during the extension session and cleared once the session ends.  
* **Saved Sites:** Frequently used sites and their preferred password types can be saved within the extension (using the browser’s local storage).  
* **Automatic URL Detection:** Automatically detects the active tab’s URL for convenience.  
* **User-Friendly Interface:** Tab-based structure allows easy password generation and retrieval from saved sites.  
* **Password Copying:** Copy the generated password to your clipboard with a single click.  

---

## Usage

### 1. Installing the Extension (Development Mode)

This project is not officially published yet, so it needs to be installed in **developer mode**:

1. Clone this GitHub repository or download it as a ZIP file.  
2. Open the terminal in the project directory and install dependencies:  
    ```bash
    npm install
    # or
    yarn install
    ```
3. Build the project:  
    ```bash
    npm run build
    # or
    yarn build
    ```
    This will generate a `dist` folder containing the extension files.  
4. Open your browser (e.g., Google Chrome):  
    * Type `chrome://extensions` in the address bar.  
    * Enable **Developer mode** from the top-right corner.  
    * Click **Load unpacked**.  
    * Select the `dist` folder inside your project directory.  
5. The extension will be loaded, and its icon will appear in your browser’s extensions bar.  

---

### 2. Using the Extension

#### **Set Master Password (Start Session)**
* Click the extension icon — you’ll be asked to enter your **Master Password**.  
* This password serves as the foundation for generating all site passwords.  
* Choose a **very strong** master password and **never forget it!**  
* Click **Set Master Password** to start your session.  

#### **Generate a Password for a New Site**
1. Ensure you’re in the **“Generate New Password”** tab.  
2. Enter the site’s URL or name (e.g., `example.com`). The extension will try to auto-detect it from the active tab.  
3. Select your preferred password type (e.g., Maximum Security, Long, PIN).  
4. Click **Generate & Save**.  
5. The generated password will appear below — click **Copy** to copy it to your clipboard.  
6. The site and its selected password type will be saved to the **Saved Sites** list.  

#### **Generate Password from Saved Sites**
1. Switch to the **“Saved Sites”** tab.  
2. You’ll see a list of previously used sites.  
3. Click on a site or the **Generate** button next to it.  
4. (If your session has expired, the extension will ask for your Master Password again.)  
5. The password will be generated using the stored password type for that site.  

#### **End Session**
* Click the **Logout** button at the top of the extension interface.  
* This clears the Master Password from memory.  
* To use the extension again, you’ll need to re-enter your Master Password.  



