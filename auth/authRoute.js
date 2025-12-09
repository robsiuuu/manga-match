import express from "express";
import passport from "passport";
import { getUserByGoogleId } from "../models/userModel.js";

const router = express.Router();
const CLIENT_BASE_URL = process.env.CLIENT_BASE_URL || "http://localhost:5173";

// Middleware to save return URL in session
const saveReturnTo = (req, res, next) => {
  const returnTo = req.query.returnTo || "/";
  req.session.returnTo = returnTo;
  next();
};

// Initiate Google OAuth
router.get(
  "/google",
  saveReturnTo,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// In your authRoute.js Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_BASE_URL}/login?error=auth_failed`,
    failureMessage: true,
  }),
  async (req, res) => {
    try {
      const returnTo = req.session.returnTo || "/";
      delete req.session.returnTo;

      console.log("✅ Google callback success!");
      console.log("User authenticated:", req.user?.name);

      // Send HTML that communicates with the opener
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: rgba(255, 255, 255, 0.1);
              padding: 40px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              max-width: 500px;
              width: 90%;
            }
            h1 { 
              margin-bottom: 20px;
              font-size: 24px;
            }
            p { 
              margin-bottom: 30px;
              line-height: 1.5;
            }
            button {
              background: white;
              color: #667eea;
              border: none;
              padding: 12px 30px;
              font-size: 16px;
              font-weight: bold;
              border-radius: 25px;
              cursor: pointer;
              transition: transform 0.2s;
            }
            button:hover {
              transform: scale(1.05);
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✅</div>
            <h1>Successfully Signed In!</h1>
            <p>Welcome back, <strong>${req.user.name}</strong>!</p>
            <p>You are now signed in. This window will close automatically.</p>
            <button onclick="closeAndNotify()">Close Window</button>
            
            <script>
              // Function to send message to opener and close
              function closeAndNotify() {
                try {
                  // Send message to parent window
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'AUTH_SUCCESS',
                      message: 'User authenticated successfully',
                      timestamp: Date.now()
                    }, '*');
                    
                    console.log('✅ Sent auth success message to opener');
                  } else {
                    console.log('⚠️ No opener found or opener closed');
                  }
                  
                  // Close this window
                  window.close();
                } catch (error) {
                  console.error('Error closing window:', error);
                  document.body.innerHTML = '<h1>✅ Signed In!</h1><p>You can now close this tab.</p>';
                }
              }
              
              // Auto-send message and close after 2 seconds
              setTimeout(() => {
                closeAndNotify();
              }, 2000);
              
              // Also send message immediately
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                  type: 'AUTH_SUCCESS',
                  message: 'User authenticated successfully',
                  timestamp: Date.now()
                }, '*');
              }
            </script>
          </div>
        </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error("❌ Auth callback error:", error);
      res.redirect(`${CLIENT_BASE_URL}/login?error=callback_error`);
    }
  }
);

// Get current authenticated user
router.get("/me", async (req, res) => {
  try {
    console.log("🔍 /auth/me called - Session check:");
    console.log("  Session ID:", req.sessionID);
    console.log("  Is authenticated:", req.isAuthenticated());
    console.log("  User in session:", req.user);

    if (req.isAuthenticated() && req.user) {
      const user = await getUserByGoogleId(req.user.googleid);
      if (user) {
        // Fix picture URL if needed
        let picture = user.picture;
        if (picture) {
          if (picture.startsWith("//")) {
            picture = "https:" + picture;
          }
          if (!picture.includes("=s")) {
            picture = picture + "=s96-c";
          }
        } else if (user.googleid) {
          picture = `https://lh3.googleusercontent.com/a/${user.googleid}=s96-c`;
        }

        res.json({
          id: user.googleid,
          name: user.name,
          email: user.email,
          picture: picture,
          createdAt: user.created_at,
          isAuthenticated: true,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "User not found in database",
          isAuthenticated: false,
        });
      }
    } else {
      console.log("❌ User not authenticated in /auth/me");
      res.status(401).json({
        success: false,
        message: "Not authenticated",
        isAuthenticated: false,
      });
    }
  } catch (error) {
    console.error("❌ Error in /me:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      isAuthenticated: false,
    });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({
        success: false,
        message: "Error logging out",
      });
    }

    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error("Session destroy error:", sessionErr);
        return res.status(500).json({
          success: false,
          message: "Error destroying session",
        });
      }

      res.clearCookie("connect.sid");
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    });
  });
});

export default router;
