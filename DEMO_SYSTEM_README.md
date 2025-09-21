# Demo System Implementation (Improved Schema)

This implementation adds a complete demo system to your voice AI application, allowing authenticated users to practice with a limit of 2 scenarios before being prompted to sign up for full access.

## 🗄️ Database Tables Created

### 1. `demo_system_scenarios`
Contains scenarios available for demo practice (separate from organization-specific scenarios).
- **Fields**: id (bigint), name, description, detailed_description, goals, tags, difficulty, agent_id_male, agent_id_female, agent_name_male, agent_name_female, voice_id_male, voice_id_female, agent_avatar_male, agent_avatar_female, designation, rubric, report_system_prompt, is_active, default_gender, created_at, updated_at
- **Access**: Publicly accessible to all users (read-only)
- **ID Type**: Uses `bigint` with `GENERATED ALWAYS AS IDENTITY` for better performance

### 2. `demo_system_runs`
Tracks demo user practice sessions.
- **Fields**: id (bigint), user_profile_id (references profiles.id), scenario_id, status, selected_gender, agent_id_used, voice_id_used, started_at, ended_at, created_at, metrics, error_msg
- **Ownership**: Linked to authenticated users via `profiles.id`

### 3. `demo_system_transcripts`
Stores conversation transcripts for demo runs.
- **Fields**: id (bigint), run_id, language, finalized, content, created_at

### 4. `demo_system_reports`
Stores AI-generated performance reports for demo runs.
- **Fields**: id (bigint), run_id, schema_version, payload, score_overall, model_used, created_at

### 5. Enhanced `profiles` table
Practice limit tracking is stored directly in the existing profiles table:
- **New Fields**: demo_practice_count, demo_max_practices, demo_last_practice_at
- **Practice Limit**: Each user can practice up to 2 scenarios (configurable via `demo_max_practices`)

## 🚀 Setup Instructions

### 1. Run Database Migration
Execute the SQL migration file in your Supabase SQL editor:
```sql
-- Run the contents of demo-system-migration.sql
```

### 2. Update Your Application Code

#### Authentication Integration
Since the new system uses authenticated users, ensure users are signed in before accessing demo features:

```typescript
import { getCurrentUser } from '@/lib/supabase'
import { canUserPracticeDemo } from '@/lib/database'

const checkDemoAccess = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      // Redirect to sign in
      router.push('/auth/signin')
      return
    }

    const canPractice = await canUserPracticeDemo(user.id)
    if (!canPractice) {
      // Show upgrade prompt
      showUpgradeModal()
      return
    }

    // User can practice, redirect to demo scenarios
    router.push('/demo/scenarios')
  } catch (error) {
    console.error('Error checking demo access:', error)
  }
}
```

#### Demo Scenario Selection
Load available demo system scenarios:

```typescript
import { getDemoSystemScenarios, canUserPracticeDemo } from '@/lib/database'
import { getCurrentUser } from '@/lib/supabase'

const DemoScenariosPage = () => {
  const [scenarios, setScenarios] = useState<DemoSystemScenario[]>([])
  const [canPractice, setCanPractice] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const [scenariosData, practiceAllowed] = await Promise.all([
        getDemoSystemScenarios(),
        canUserPracticeDemo(user.id)
      ])

      setScenarios(scenariosData)
      setCanPractice(practiceAllowed)

      if (!practiceAllowed) {
        // Show upgrade prompt
        showUpgradeModal()
      }
    }

    loadData()
  }, [])

  // ... rest of component
}
```

#### Practice Session Management
Before starting a practice session, check if the user can practice:

```typescript
import { 
  createDemoSystemRun, 
  incrementDemoPracticeCount,
  canUserPracticeDemo 
} from '@/lib/database'
import { getCurrentUser } from '@/lib/supabase'

const startPracticeSession = async (scenarioId: number) => {
  const user = await getCurrentUser()
  
  if (!user) {
    router.push('/auth/signin')
    return
  }

  // Check if user can still practice
  const canPractice = await canUserPracticeDemo(user.id)
  if (!canPractice) {
    showUpgradeModal()
    return
  }

  try {
    // Create demo run
    const demoRun = await createDemoSystemRun({
      user_profile_id: user.id,
      scenario_id: scenarioId,
      status: 'created'
    })

    // Increment practice count
    await incrementDemoPracticeCount(user.id)

    // Start the conversation
    startConversation(demoRun.id)
  } catch (error) {
    console.error('Error starting practice session:', error)
  }
}
```

#### Report Generation
After completing a practice session, generate and store the report:

```typescript
import { createDemoSystemReport, updateDemoSystemRun, canUserPracticeDemo } from '@/lib/database'
import { getCurrentUser } from '@/lib/supabase'

const completePracticeSession = async (runId: number, reportData: any) => {
  try {
    // Update run status
    await updateDemoSystemRun(runId, {
      status: 'completed',
      ended_at: new Date().toISOString()
    })

    // Create report
    await createDemoSystemReport({
      run_id: runId,
      schema_version: '1.0',
      payload: reportData,
      score_overall: reportData.overall_score,
      model_used: 'gpt-4'
    })

    // Check if user has reached practice limit
    const user = await getCurrentUser()
    if (user) {
      const canPractice = await canUserPracticeDemo(user.id)
      
      if (!canPractice) {
        showUpgradeModal()
      }
    }
  } catch (error) {
    console.error('Error completing practice session:', error)
  }
}
```

## 🔧 Key Functions Available

### Demo System Scenarios
- `getDemoSystemScenarios()` - Get all active demo system scenarios
- `getDemoSystemScenario(id)` - Get specific demo system scenario

### Practice Limit Management
- `getDemoPracticeLimit(userId)` - Get user's practice limit data
- `canUserPracticeDemo(userId)` - Check if user can practice more
- `incrementDemoPracticeCount(userId)` - Increment practice count

### Demo System Runs
- `createDemoSystemRun()` - Create new demo system run
- `updateDemoSystemRun()` - Update demo system run
- `getDemoSystemRun(id)` - Get demo system run with details
- `getUserDemoSystemRuns(userId)` - Get all runs for a user

### Demo System Reports & Transcripts
- `createDemoSystemReport()` - Create demo system report
- `getDemoSystemReportByRunId()` - Get report by run ID
- `createDemoSystemTranscript()` - Create demo system transcript
- `getDemoSystemTranscriptByRunId()` - Get transcript by run ID

## 🎯 User Flow

1. **Authentication**: User signs in to access demo features
2. **Scenario Selection**: User sees available demo system scenarios
3. **Practice Check**: System checks if user can practice (limit: 2)
4. **Practice Session**: User completes scenario → Report generated
5. **Limit Reached**: After 2 practices, upgrade modal shown

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all demo system tables
- **Public access** to scenarios (read-only)
- **User isolation** - users can only access their own data via `auth.uid()`
- **Practice limits** enforced at database level
- **Authentication required** - all demo features require signed-in users

## 📊 Analytics & Monitoring

You can track demo user engagement by querying:
- Total authenticated users with demo practice data
- Practice completion rates
- Most popular demo system scenarios
- Conversion from demo to full users

## 🎨 UI Components Needed

1. **Authentication Flow** - Sign in/sign up for demo access
2. **Demo Scenarios List** - Show available demo system scenarios
3. **Practice Limit Warning** - Show when approaching limit
4. **Upgrade Modal** - Prompt for full access after limit reached
5. **Demo Report View** - Show practice results

## 🔄 Migration from Existing System

The demo system is completely separate from your existing organization-based system:
- Uses different tables (`demo_system_*` vs regular tables)
- No impact on existing functionality
- Can be deployed alongside current system
- Easy to remove if needed
- Integrates with existing `profiles` table for practice tracking

## 📝 Next Steps

1. Run the database migration
2. Update your authentication flow to support demo access
3. Create demo scenario selection page
4. Implement practice limit checking
5. Add upgrade prompts and modals
6. Test the complete flow

The system is now ready to provide a seamless demo experience with proper practice limits and conversion opportunities! 🎯

## 💡 Usage Example (Updated)

```typescript
import { DemoSystemManager } from '@/lib/demo-utils'
import { getCurrentUser } from '@/lib/supabase'

// In your demo scenarios page
const demoManager = new DemoSystemManager()

const handleStartPractice = async (scenarioId: number) => {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check practice limit
    const canPractice = await demoManager.canPractice()
    if (!canPractice) {
      showUpgradeModal()
      return
    }

    // Start practice session
    const demoRun = await demoManager.startPracticeSession(scenarioId)
    startConversation(demoRun.id)
  } catch (error) {
    console.error('Error starting practice:', error)
  }
}
```
