# Anonymous Demo System Implementation

## ✅ **Updated for Anonymous Access**

The demo system has been completely updated to work with **anonymous users** - no authentication required! Here's what changed:

### 🗄️ **Database Schema Changes**

1. **`demo_system_runs`** - Now uses `session_id` instead of `user_profile_id`
2. **`demo_system_sessions`** - New table to track anonymous session practice limits
3. **RLS Policies** - Updated to use `TO anon` instead of `TO authenticated`
4. **Grants** - Only grants permissions to `anon` role

### 🔧 **Code Updates**

#### **Types** (`lib/types.ts`)
- `DemoSystemRun` now uses `session_id: string` instead of `user_profile_id: string`
- Added `DemoSystemSession` interface for anonymous session tracking
- Removed `DemoPracticeLimit` (replaced with `DemoSystemSession`)

#### **Database Functions** (`lib/database.ts`)
- `canSessionPracticeDemo(sessionId)` - Check if anonymous session can practice
- `getDemoSystemSession(sessionId)` - Get session data
- `createDemoSystemSession(sessionId)` - Create new session
- `getSessionDemoSystemRuns(sessionId)` - Get runs for session
- Removed all user-based functions

#### **API Routes** (`app/api/demo/`)
- All routes now require `session_id` parameter instead of authentication
- `GET /api/demo/users?session_id=xxx` - Get session info
- `GET /api/demo/practice/check?session_id=xxx` - Check practice limits
- `POST /api/demo/runs` - Create run with `session_id` in body
- `GET /api/demo/runs?session_id=xxx` - Get session runs

#### **Demo Utils** (`lib/demo-utils.ts`)
- `DemoSystemManager` now works with session IDs instead of user IDs
- `generateSessionId()` - Creates unique session identifiers
- `DemoStorage` - Manages session ID in localStorage
- `useDemoSystem()` - React hook for anonymous demo system

## 🎯 **How It Works**

### **Session Management**
1. **Generate Session ID**: `demo_${timestamp}_${random}`
2. **Store in localStorage**: Persists across browser sessions
3. **Track Practice Count**: Each session limited to 2 practices
4. **Anonymous Access**: No sign-up or authentication required

### **Practice Flow**
1. User visits demo page
2. System generates/retrieves session ID
3. User selects scenario and practices
4. System tracks practice count per session
5. After 2 practices, upgrade modal shown

## 💡 **Usage Example**

```typescript
import { DemoSystemManager, DemoStorage } from '@/lib/demo-utils'

// Initialize demo system
const demoManager = new DemoSystemManager()

// Get or create session ID
let sessionId = DemoStorage.getSessionId()
if (!sessionId) {
  sessionId = demoManager.generateSessionId()
  DemoStorage.setSessionId(sessionId)
  demoManager.setSessionId(sessionId)
}

// Check if can practice
const canPractice = await demoManager.canPractice()
if (!canPractice) {
  showUpgradeModal()
  return
}

// Start practice session
const demoRun = await demoManager.startPracticeSession(scenarioId)
startConversation(demoRun.id)
```

## 🔒 **Security Model**

- **Public Scenarios**: `TO anon` - Anyone can read active scenarios
- **Demo Runs/Transcripts/Reports**: `TO anon` - Anonymous users can manage their own data
- **Session Isolation**: Each session ID is unique and isolated
- **Practice Limits**: Enforced at database level (2 practices per session)

## 📋 **API Endpoints**

### **Get Session Info**
```bash
GET /api/demo/users?session_id=demo_1234567890_abc123
```

### **Check Practice Limit**
```bash
GET /api/demo/practice/check?session_id=demo_1234567890_abc123
```

### **Create Demo Run**
```bash
POST /api/demo/runs
{
  "session_id": "demo_1234567890_abc123",
  "scenario_id": 1,
  "selected_gender": "female"
}
```

### **Get Session Runs**
```bash
GET /api/demo/runs?session_id=demo_1234567890_abc123
```

## 🚀 **Ready to Use**

The system is now completely anonymous and ready for public demo access:

1. **Run the migration** - Execute `demo-system-migration.sql`
2. **No authentication required** - Users can start practicing immediately
3. **Session-based tracking** - Practice limits enforced per browser session
4. **Upgrade prompts** - Show after 2 practices to encourage sign-up

The demo system now provides a seamless anonymous experience with proper practice limits! 🎉
