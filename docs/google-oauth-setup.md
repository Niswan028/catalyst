# Google OAuth Setup Guide

To enable Google Sign-In/Sign-Up in CareConnect:

## 1. Configure Google OAuth in Supabase
1. Open your Supabase Dashboard -> **Authentication** -> **Providers**.
2. Locate **Google** and toggle "Enable Sign in with Google" to **ON**.
3. Copy the **Callback URL** provided by Supabase (e.g. `https://<your-project>.supabase.co/auth/v1/callback`).

## 2. Create Google Cloud Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `CareConnect`.
3. In **APIs & Services** -> **OAuth consent screen**:
   - Choose External.
   - Set App name to `CareConnect` and enter developer contact email.
4. In **Credentials** -> **Create Credentials** -> **OAuth client ID**:
   - Application type: **Web application**.
   - Authorized JavaScript origins: `http://localhost:3000` (and production domain).
   - Authorized redirect URIs: Enter the Supabase Callback URL from Step 1.
5. Copy the generated **Client ID** and **Client Secret**.

## 3. Save to Supabase
1. Paste Client ID and Client Secret into Supabase Google provider settings.
2. Click **Save**.
