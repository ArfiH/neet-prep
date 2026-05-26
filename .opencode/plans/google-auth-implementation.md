# Google Sign-In Implementation Plan

## Status: Ready to implement

Firebase is **not required** — you can use Google Cloud Console directly:
1. Go to https://console.cloud.google.com
2. Create a project (or select existing)
3. Go to APIs & Services → OAuth consent screen → Configure (External)
4. Add your app name, user support email, developer contact
5. Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`
6. Add test users (your email)
7. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs:
   - **Web application**: for backend verification
   - **Android**: needs SHA-1 fingerprint from your keystore
   - **iOS**: needs bundle ID `com.ahmad.neetzyme`

---

## Step 1: Backend — Controller + Route + Env

### `backend/.env` — Add GOOGLE_CLIENT_ID
```diff
+# Google OAuth (Web client ID from Google Cloud Console)
+GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### `backend/controllers/auth.js` — Append before `module.exports`

```js
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'ID token is required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ error: 'Google account has no email' });
    }

    const [existing] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR email = ?',
      [googleId, email]
    );

    let user;
    if (existing.length > 0) {
      user = existing[0];
      const updates = [];
      const values = [];
      if (!user.google_id) {
        updates.push('google_id = ?');
        values.push(googleId);
      }
      if (!user.email_verified) {
        updates.push('email_verified = TRUE');
      }
      if (updates.length > 0) {
        values.push(user.id);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
      }
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (email, name, google_id, email_verified) VALUES (?, ?, ?, TRUE)',
        [email, name || null, googleId]
      );
      user = { id: result.insertId, email, name: name || null, email_verified: true };
    }

    const { accessToken, refreshToken } = issueTokens(user.id, user.email);

    await pool.query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || null,
      neet_rank: user.neet_rank || null,
      category: user.category || null,
      email_verified: true,
    };

    res.json({
      message: 'Google sign-in successful',
      token: accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};
```

Update `module.exports`:
```diff
-module.exports = { register, login, getProfile, updateProfile, refresh, verifyEmail, resendVerification };
+module.exports = { register, login, googleAuth, getProfile, updateProfile, refresh, verifyEmail, resendVerification };
```

### `backend/routes/auth.js` — Add route

```diff
 const { register, login, getProfile, updateProfile, refresh, verifyEmail, resendVerification } = require('../controllers/auth');
+const { register, login, googleAuth, getProfile, updateProfile, refresh, verifyEmail, resendVerification } = require('../controllers/auth');
```

```diff
 router.post('/register', register);
 router.post('/login', login);
+router.post('/google', googleAuth);
 router.post('/refresh', refresh);
```

---

## Step 2: Database — Add google_id column

```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD UNIQUE INDEX idx_google_id (google_id);
```

---

## Step 3: Frontend — app.json config plugin

Add to `plugins` array in `app.json`:
```json
"@react-native-google-signin/google-signin": {
  "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
}
```

---

## Step 4: Create `lib/googleAuth.ts`

```ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
  });
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const idToken = (userInfo as any).data?.idToken || (userInfo as any).idToken;
  if (!idToken) throw new Error('No ID token received from Google');
  return { idToken };
}
```

---

## Step 5: Add `googleLogin` to `lib/api.ts`

```diff
   async login(email: string, password: string) {
     ...
   }

+  async googleLogin(idToken: string) {
+    const data = await this.request<{ token: string; user: any }>('/auth/google', {
+      method: 'POST',
+      body: JSON.stringify({ idToken }),
+    });
+    this.token = data.token;
+    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
+    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
+    return data;
+  }
+
   async logout() {
```

---

## Step 6: Add `loginWithGoogle` to `lib/authContext.tsx`

Add import at top:
```diff
 import { api } from '@/lib/api';
+import { configureGoogleSignIn, signInWithGoogle } from '@/lib/googleAuth';
```

Add method to context type:
```diff
 type AuthContextType = {
   login: (email: string, password: string) => Promise<void>;
+  loginWithGoogle: () => Promise<void>;
   register: ...
```

Add to provider value:
```diff
+  async function loginWithGoogle() {
+    try {
+      const { idToken } = await signInWithGoogle();
+      const data = await api.googleLogin(idToken);
+      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
+      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
+      setUser(data.user);
+      await api.init();
+    } catch (error: any) {
+      if (error?.code === 'SIGN_IN_CANCELLED') return;
+      throw error;
+    }
+  }
```

Add to the `useEffect` on mount:
```diff
   useEffect(() => {
     loadStoredAuth();
+    configureGoogleSignIn();
   }, []);
```

Add to context provider value:
```diff
   <AuthContext.Provider value={{ user, loading, initialized, isLoggedIn, login, register, loginWithGoogle, logout, forgotPassword, resetPassword, refreshUser, verifyEmail, resendVerification }}>
```

---

## Step 7: Google Sign-In button component

Create `components/GoogleSignInButton.tsx`:

```tsx
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

type Props = {
  onPress: () => void;
  loading?: boolean;
  label?: string;
};

export default function GoogleSignInButton({ onPress, loading, label = 'Continue with Google' }: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.muted} />
      ) : (
        <>
          <FontAwesome name="google" size={18} color="#EA4335" />
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.fg,
  },
});
```

---

## Step 8: Update `app/login.tsx`

Import the button:
```diff
 import { useAuth } from '@/lib/authContext';
+import GoogleSignInButton from '@/components/GoogleSignInButton';
```

Add state:
```diff
   const [error, setError] = useState('');
+  const [googleLoading, setGoogleLoading] = useState(false);
```

Add handler:
```ts
  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  }
```

Add button after the form and before the footer. Insert a divider row:
```tsx
{/* Divider */}
<View style={styles.dividerRow}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>or</Text>
  <View style={styles.dividerLine} />
</View>

{/* Google Sign-In */}
<GoogleSignInButton
  onPress={handleGoogleSignIn}
  loading={googleLoading}
  label="Continue with Google"
/>
```

Add styles:
```ts
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: COLORS.muted, fontWeight: '500' },
```

---

## Step 9: Update `app/register.tsx`

Same pattern as login — import `GoogleSignInButton`, add handler calling `loginWithGoogle()`, add the button + divider between the header and the form.

```diff
 import { useAuth } from '@/lib/authContext';
+import GoogleSignInButton from '@/components/GoogleSignInButton';
+import { loginWithGoogle } from ... // but wait — loginWithGoogle is in authContext, the hook exposes it.
```

Actually, `loginWithGoogle` is used in login and register. Both screens call the same `loginWithGoogle()` from `useAuth()`. The difference is just the label text: "Sign up with Google" vs "Continue with Google".

For register.tsx, add the button between subtitle and form with label "Sign up with Google".

---

## Env variables to add

**Frontend** (`.env` or `.env.local` at project root):
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```
