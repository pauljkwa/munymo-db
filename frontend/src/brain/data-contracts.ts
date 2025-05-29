/**
 * APIResponse
 * Standard API response model
 */
export interface APIResponse {
  /**
   * Success
   * Whether the operation was successful
   */
  success: boolean;
  /**
   * Message
   * A message describing the result
   */
  message: string;
  /**
   * Data
   * Additional data returned
   */
  data?: Record<string, any>;
}

/**
 * AdminNotificationRequest
 * Request model for sending a notification to multiple users by admin
 */
export interface AdminNotificationRequest {
  /**
   * User Ids
   * List of user IDs to send notification to
   */
  user_ids: string[];
  /**
   * Title
   * Notification title
   */
  title: string;
  /**
   * Body
   * Notification body
   */
  body: string;
  /**
   * Category
   * Notification category
   */
  category: string;
  /**
   * Data
   * Additional data to send with notification
   */
  data?: Record<string, any>;
}

/**
 * AdminRoleListResponse
 * Response model for listing admin roles.
 */
export interface AdminRoleListResponse {
  /** Roles */
  roles: Record<string, string>[];
}

/**
 * AdminRoleRequest
 * Request model for assigning admin roles.
 */
export interface AdminRoleRequest {
  /**
   * Role
   * Admin role to assign (super_admin, admin, moderator)
   */
  role: string;
}

/**
 * AdminRoleResponse
 * Response model for admin role operations.
 */
export interface AdminRoleResponse {
  /** User Id */
  user_id: string;
  /** Role */
  role: string;
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/**
 * BatchNotificationRequest
 * Request model for sending a batch notification to users with a specific subscription tier
 */
export interface BatchNotificationRequest {
  /**
   * Subscription Tier
   * Subscription tier to filter users
   */
  subscription_tier: string;
  /**
   * Title
   * Notification title
   */
  title: string;
  /**
   * Body
   * Notification body
   */
  body: string;
  /**
   * Category
   * Notification category
   */
  category: string;
  /**
   * Data
   * Additional data to send with notification
   */
  data?: Record<string, any>;
}

/** BetaSignupRequest */
export interface BetaSignupRequest {
  /**
   * Email
   * @format email
   */
  email: string;
  /**
   * Name
   * @default ""
   */
  name?: string;
  /**
   * Referral Source
   * @default ""
   */
  referral_source?: string;
}

/** BetaSignupResponse */
export interface BetaSignupResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** Body_upload_game_data_csv */
export interface BodyUploadGameDataCsv {
  /**
   * File
   * @format binary
   */
  file: File;
  /** Target Table */
  target_table: string;
}

/**
 * CompanyInfo
 * Basic information about a company.
 */
export interface CompanyInfo {
  /** Name */
  name: string;
  /** Ticker */
  ticker: string;
}

/** Component */
export interface Component {
  /**
   * Name
   * Component name
   */
  name: string;
  /**
   * Description
   * Component description
   */
  description: string;
  /**
   * Features
   * Features in this component
   * @default []
   */
  features?: string[];
}

/** ComponentCoverage */
export interface ComponentCoverage {
  /**
   * Name
   * Component name
   */
  name: string;
  /**
   * Test Count
   * Number of tests for this component
   */
  test_count: number;
  /**
   * Covered Features
   * Features that are covered by tests
   */
  covered_features: string[];
  /**
   * Total Features
   * All features in this component
   */
  total_features: string[];
  /**
   * Coverage Percentage
   * Coverage percentage
   */
  coverage_percentage: number;
}

/** CoverageReport */
export interface CoverageReport {
  /**
   * Timestamp
   * Timestamp of the report
   */
  timestamp: string;
  /**
   * Overall Coverage
   * Overall test coverage percentage
   */
  overall_coverage: number;
  /**
   * Components
   * Coverage by component
   */
  components: ComponentCoverage[];
  /**
   * Meets Target
   * Whether the overall coverage meets the target (80%)
   */
  meets_target: boolean;
  /**
   * Target Percentage
   * Target coverage percentage
   * @default 80
   */
  target_percentage?: number;
}

/** CoverageReportRequest */
export interface CoverageReportRequest {
  /**
   * Report Id
   * Optional ID for the report
   */
  report_id?: string | null;
  /**
   * Target Percentage
   * Target coverage percentage
   * @default 80
   */
  target_percentage?: number;
}

/** CoverageSummary */
export interface CoverageSummary {
  /**
   * Report Id
   * Report ID
   */
  report_id: string;
  /**
   * Timestamp
   * Timestamp of the report
   */
  timestamp: string;
  /**
   * Overall Coverage
   * Overall test coverage percentage
   */
  overall_coverage: number;
  /**
   * Meets Target
   * Whether the coverage meets the target
   */
  meets_target: boolean;
  /**
   * Target Percentage
   * Target coverage percentage
   */
  target_percentage: number;
}

/** CreateCheckoutSessionRequest */
export interface CreateCheckoutSessionRequest {
  /** Price Id */
  price_id: string;
  /** User Id */
  user_id: string;
  /** User Email */
  user_email: string;
  /** Discount Code */
  discount_code?: string | null;
}

/** CreateCheckoutSessionResponse */
export interface CreateCheckoutSessionResponse {
  /** Checkout Url */
  checkout_url: string;
}

/** CronStatusResponse */
export interface CronStatusResponse {
  /** Is Enabled */
  is_enabled: boolean;
  /** Interval Minutes */
  interval_minutes: number;
  /** Last Run */
  last_run?: string | null;
  /** Next Run */
  next_run?: string | null;
  /** Current Time */
  current_time: string;
}

/**
 * DailyPredictionPairResponse
 * Response model for the daily prediction pair.
 */
export interface DailyPredictionPairResponse {
  /** Pair Id */
  pair_id: string;
  /** Basic information about a company. */
  company_a: CompanyInfo;
  /** Basic information about a company. */
  company_b: CompanyInfo;
  /**
   * Prediction Date
   * @format date
   */
  prediction_date: string;
}

/** DocumentationResponse */
export interface DocumentationResponse {
  /** Title */
  title: string;
  /** Sections */
  sections: Record<string, any>[];
  /** Last Updated */
  last_updated: string;
}

/** DocumentationSection */
export interface DocumentationSection {
  /**
   * Section Id
   * Section identifier
   */
  section_id: string;
  /**
   * Title
   * Section title
   */
  title: string;
  /**
   * Content
   * Section content in markdown format
   */
  content: string;
  /**
   * Order
   * Display order of the section
   * @default 0
   */
  order?: number;
}

/** FcmTokenRequest */
export interface FcmTokenRequest {
  /** Token */
  token: string;
}

/** Feature */
export interface Feature {
  /**
   * Name
   * Feature name
   */
  name: string;
  /**
   * Description
   * Feature description
   */
  description: string;
  /**
   * Component
   * Component this feature belongs to
   */
  component: string;
}

/**
 * GameCreateRequest
 * Model for creating a new game
 */
export interface GameCreateRequest {
  /** Pair Id */
  pair_id?: string | null;
  /** Company A */
  company_a: Record<string, string>;
  /** Company B */
  company_b: Record<string, string>;
  /** Prediction Date */
  prediction_date: string;
  /**
   * Status
   * @default "scheduled"
   */
  status?: string | null;
}

/**
 * GameGenerationRequest
 * Request model for generating a new game
 */
export interface GameGenerationRequest {
  /**
   * Exchange
   * Stock exchange code (e.g., ASX, NYSE)
   */
  exchange: string;
  /**
   * Target Date
   * Target date for the game (YYYY-MM-DD)
   */
  target_date: string;
  /**
   * Sector
   * Target sector (optional)
   */
  sector?: string | null;
  /**
   * Force Refresh
   * Force refresh of company data
   * @default false
   */
  force_refresh?: boolean;
}

/**
 * GameGenerationResponse
 * Response model for game generation
 */
export interface GameGenerationResponse {
  /** Exchange */
  exchange: string;
  /** Game Date */
  game_date: string;
  /** Company A Ticker */
  company_a_ticker: string;
  /** Company A Name */
  company_a_name: string;
  /** Company B Ticker */
  company_b_ticker: string;
  /** Company B Name */
  company_b_name: string;
  /** Sector */
  sector: string;
  /** Reasoning */
  reasoning: string;
  /** Next Day Clue */
  next_day_clue?: string | null;
  /**
   * Status
   * @default "scheduled"
   */
  status?: string;
  /**
   * Is Saved
   * @default false
   */
  is_saved?: boolean;
}

/**
 * GameResponse
 * Model for game responses
 */
export interface GameResponse {
  /** Pair Id */
  pair_id: string;
  /** Company A */
  company_a: Record<string, string>;
  /** Company B */
  company_b: Record<string, string>;
  /** Prediction Date */
  prediction_date: string;
  /**
   * Status
   * @default "scheduled"
   */
  status?: string | null;
}

/**
 * GameSubmissionListResponse
 * Model for list of game submissions
 */
export interface GameSubmissionListResponse {
  /** Submissions */
  submissions: SubmissionResponse[];
}

/**
 * GameUpdateRequest
 * Model for updating an existing game
 */
export interface GameUpdateRequest {
  /** Pair Id */
  pair_id?: string | null;
  /** Company A */
  company_a: Record<string, string>;
  /** Company B */
  company_b: Record<string, string>;
  /** Prediction Date */
  prediction_date: string;
  /**
   * Status
   * @default "scheduled"
   */
  status?: string | null;
}

/** GenericResponse */
export interface GenericResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** LeaderboardEntry */
export interface LeaderboardEntry {
  /** Rank */
  rank: number;
  /** Player Id */
  player_id: string;
  /**
   * Username
   * Display name of the user
   */
  username: string;
  /**
   * Accuracy Percent
   * Overall prediction accuracy percentage
   */
  accuracy_percent: number;
  /**
   * Games Played
   * Total number of games played
   */
  games_played: number;
  /**
   * Avg Speed Ms
   * Average submission speed for correct answers in milliseconds
   */
  avg_speed_ms?: number | null;
  /**
   * Avg Score
   * Average points scored per game based on calculate_game_score
   */
  avg_score?: number | null;
}

/** LeaderboardResponse */
export interface LeaderboardResponse {
  /** Leaderboard */
  leaderboard: LeaderboardEntry[];
  /**
   * Total Players
   * Total number of eligible players on this leaderboard (played >= 1 game)
   */
  total_players: number;
}

/** MigrationDocResponse */
export interface MigrationDocResponse {
  /** Sql */
  sql: string;
  /** Tables Exist */
  tables_exist: boolean;
  /** Scheduler Migrated */
  scheduler_migrated: boolean;
  /** Cron Migrated */
  cron_migrated: boolean;
  /** Company Cache Sql */
  company_cache_sql: string;
  /** Instructions */
  instructions: string;
}

/** MigrationResult */
export interface MigrationResult {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/**
 * MunyIQHistoryEntry
 * Historical MunyIQ score entry
 */
export interface MunyIQHistoryEntry {
  /** Calculation Date */
  calculation_date: string;
  /** Munyiq Score */
  munyiq_score: number;
}

/**
 * MunyIQScoreDetail
 * Detailed breakdown of MunyIQ score components
 */
export interface MunyIQScoreDetail {
  /** Munyiq Id */
  munyiq_id: string;
  /** User Id */
  user_id: string;
  /** Munyiq Score */
  munyiq_score: number;
  /** Total Games */
  total_games: number;
  /** Correct Games */
  correct_games: number;
  /** Accuracy Score */
  accuracy_score: number;
  /** Consistency Score */
  consistency_score: number;
  /** Speed Score */
  speed_score: number;
  /** Participation Score */
  participation_score: number;
  /** Improvement Score */
  improvement_score?: number | null;
  /** Calculation Date */
  calculation_date: string;
  /** Improved Since Last */
  improved_since_last?: boolean | null;
}

/**
 * MunyIQScoreResponse
 * Response for current MunyIQ score
 */
export interface MunyIQScoreResponse {
  /** Detailed breakdown of MunyIQ score components */
  current_score: MunyIQScoreDetail;
  /** Previous Scores */
  previous_scores: MunyIQHistoryEntry[];
  /** Subscribed Since */
  subscribed_since: string;
  /** Games Until Next Calculation */
  games_until_next_calculation?: number | null;
}

/**
 * MunyIQStatsResponse
 * Response for MunyIQ distribution statistics
 */
export interface MunyIQStatsResponse {
  /** Average Score */
  average_score: number;
  /** Median Score */
  median_score: number;
  /** Percentile Rank */
  percentile_rank: number;
  /** Total Users With Scores */
  total_users_with_scores: number;
  /** Global Distribution */
  global_distribution: Record<string, number>;
}

/**
 * NextClueResponse
 * Response model for the next game clue.
 */
export interface NextClueResponse {
  /** Next Day Clue */
  next_day_clue?: string | null;
}

/**
 * NotificationEventRequest
 * Request model for tracking notification events
 */
export interface NotificationEventRequest {
  /**
   * Event Type
   * Type of event (delivered, clicked, dismissed)
   */
  event_type: string;
  /**
   * Notification Id
   * Notification ID
   */
  notification_id: string;
  /**
   * Category
   * Notification category
   */
  category?: string;
  /**
   * Timestamp
   * Timestamp of the event
   */
  timestamp?: string;
}

/**
 * NotificationRequest
 * Request model for sending a notification
 */
export interface NotificationRequest {
  /**
   * User Id
   * User ID to send notification to
   */
  user_id: string;
  /**
   * Title
   * Notification title
   */
  title: string;
  /**
   * Body
   * Notification body
   */
  body: string;
  /**
   * Category
   * Notification category
   */
  category: string;
  /**
   * Data
   * Additional data to send with notification
   */
  data?: Record<string, any>;
}

/** PredictionRequest */
export interface PredictionRequest {
  /**
   * Pair Id
   * The unique ID of the prediction pair for the day.
   */
  pair_id: string;
  /**
   * Predicted Ticker
   * The ticker symbol of the company predicted to perform better.
   */
  predicted_ticker: string;
}

/** PredictionResponse */
export interface PredictionResponse {
  /** Prediction Id */
  prediction_id: string;
  /** Message */
  message: string;
  /**
   * Submitted At
   * @format date-time
   */
  submitted_at: string;
}

/** ProcessResultsRequest */
export interface ProcessResultsRequest {
  /**
   * Game Date Str
   * Date of the game to process in YYYY-MM-DD format.
   */
  game_date_str: string;
  /**
   * Exchange
   * Exchange the game belongs to (e.g., 'ASX', 'NYSE').
   */
  exchange: string;
  /**
   * Manual Results
   * Optional manual results data when automated API fails
   */
  manual_results?: Record<string, any> | null;
}

/**
 * ProcessResultsResponse
 * Response model for the results processing endpoint.
 */
export interface ProcessResultsResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Pair Id */
  pair_id: string;
}

/** SandboxStatusResponse */
export interface SandboxStatusResponse {
  /**
   * Is Sandbox Mode
   * Indicates if the application is running in sandbox (DEV) mode.
   */
  is_sandbox_mode: boolean;
  /**
   * Current Sandbox Game Id
   * The game ID currently set for sandbox testing, if any.
   */
  current_sandbox_game_id?: string | null;
}

/**
 * SchedulerStatusResponse
 * Status response for the scheduler
 */
export interface SchedulerStatusResponse {
  /** Is Enabled */
  is_enabled: boolean;
  /** Is Initialized */
  is_initialized: boolean;
  /** Sandbox Mode Enabled */
  sandbox_mode_enabled: boolean;
  /** Sandbox Mode Active */
  sandbox_mode_active: boolean;
  /** Tasks */
  tasks: SchedulerTask[];
  /** Current Time Utc */
  current_time_utc: string;
  /** Recent Errors */
  recent_errors?: Record<string, any>[] | null;
}

/**
 * SchedulerTask
 * Defines a scheduled task that should run at specific times
 */
export interface SchedulerTask {
  /** Task Id */
  task_id: string;
  /** Task Type */
  task_type: string;
  /** Exchange */
  exchange: string;
  /** Hour Utc */
  hour_utc: number;
  /** Minute Utc */
  minute_utc: number;
  /**
   * Is Active
   * @default true
   */
  is_active?: boolean;
  /** Last Run */
  last_run?: string | null;
  /** Next Run */
  next_run?: string | null;
  /** Custom Params */
  custom_params?: Record<string, any> | null;
}

/** SetGameRequest */
export interface SetGameRequest {
  /**
   * Game Id
   * The game ID to set for sandbox testing, or null to clear.
   */
  game_id?: string | null;
}

/** SetGameResponse */
export interface SetGameResponse {
  /** Message */
  message: string;
  /** Set Game Id */
  set_game_id: string | null;
}

/** SimpleDocumentationResponse */
export interface SimpleDocumentationResponse {
  /** Title */
  title: string;
  /** Content */
  content: string;
}

/** SimulateCheckoutRequest */
export interface SimulateCheckoutRequest {
  /** User Id */
  user_id: string;
  /**
   * Tier
   * @default "pro"
   */
  tier?: string;
  /**
   * Frequency
   * @default "monthly"
   */
  frequency?: string;
}

/** SimulateCheckoutResponse */
export interface SimulateCheckoutResponse {
  /** Status */
  status: string;
  /** User Id */
  user_id: string;
  /** Customer Id */
  customer_id?: string | null;
  /** Subscription Id */
  subscription_id?: string | null;
  /** Price Id */
  price_id?: string | null;
  /** Tier */
  tier: string;
  /** Event Id */
  event_id?: string | null;
  /** Message */
  message: string;
  /**
   * Test Mode
   * @default true
   */
  test_mode?: boolean;
}

/**
 * SubmissionCreateRequest
 * Model for creating a new submission
 */
export interface SubmissionCreateRequest {
  /** Submission Id */
  submission_id?: string | null;
  /** User Id */
  user_id: string;
  /** Pair Id */
  pair_id: string;
  /** Prediction */
  prediction: string;
  /** Timestamp */
  timestamp: string;
  /**
   * Score
   * @default 0
   */
  score?: number | null;
}

/**
 * SubmissionResponse
 * Model for submission responses
 */
export interface SubmissionResponse {
  /** Submission Id */
  submission_id: string;
  /** User Id */
  user_id: string;
  /** Pair Id */
  pair_id: string;
  /** Prediction */
  prediction: string;
  /** Timestamp */
  timestamp: string;
  /**
   * Score
   * @default 0
   */
  score?: number | null;
}

/**
 * SubmissionUpdateRequest
 * Model for updating an existing submission
 */
export interface SubmissionUpdateRequest {
  /** Submission Id */
  submission_id?: string | null;
  /** User Id */
  user_id: string;
  /** Pair Id */
  pair_id: string;
  /** Prediction */
  prediction: string;
  /** Timestamp */
  timestamp: string;
  /**
   * Score
   * @default 0
   */
  score?: number | null;
}

/**
 * TaskResponse
 * Response for task-related operations
 */
export interface TaskResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Task Id */
  task_id?: string | null;
}

/** TestAuthRequest */
export interface TestAuthRequest {
  /** User Id */
  user_id?: string;
  /**
   * Role
   * @default "user"
   */
  role?: string;
  /**
   * Tier
   * @default "free"
   */
  tier?: string;
}

/** TestAuthResponse */
export interface TestAuthResponse {
  /** Access Token */
  access_token: string;
  /**
   * Token Type
   * @default "Bearer"
   */
  token_type?: string;
  /** User Id */
  user_id: string;
  /** Role */
  role: string;
  /** Tier */
  tier: string;
}

/** TestCase */
export interface TestCaseInput {
  /**
   * Test Id
   * Unique identifier for the test
   */
  test_id?: string;
  /**
   * Name
   * Name of the test
   */
  name: string;
  /**
   * Description
   * Description of what the test verifies
   */
  description: string;
  /**
   * Component
   * Component that the test belongs to
   */
  component: string;
  /**
   * Features
   * Features that this test verifies
   */
  features: string[];
  /**
   * Expected Input
   * Expected input values
   */
  expected_input?: Record<string, any> | null;
  /**
   * Expected Output
   * Expected output values
   */
  expected_output?: Record<string, any> | null;
}

/** TestCaseResult */
export interface TestCaseResult {
  /**
   * Test Id
   * ID of the test case
   */
  test_id: string;
  /**
   * Name
   * Name of the test case
   */
  name: string;
  /**
   * Component
   * Component the test belongs to
   */
  component: string;
  /**
   * Features
   * Features the test verifies
   */
  features: string[];
  /**
   * Status
   * Status of the test case (passed, failed, skipped, error)
   */
  status: string;
  /**
   * Duration
   * Duration of the test in seconds
   */
  duration: number;
  /**
   * Error Message
   * Error message if the test failed
   */
  error_message?: string | null;
  /**
   * Details
   * Additional test details
   */
  details?: Record<string, any> | null;
}

/** TestDocumentation */
export interface TestDocumentation {
  /**
   * Title
   * Documentation title
   */
  title: string;
  /**
   * Overview
   * Overview of the testing system
   */
  overview: string;
  /**
   * Sections
   * Documentation sections
   * @default []
   */
  sections?: DocumentationSection[];
  /**
   * Last Updated
   * Last update timestamp
   */
  last_updated?: string;
}

/** TestEvent */
export interface TestEvent {
  /** Event Type */
  event_type: string;
  /** Customer Id */
  customer_id?: string | null;
  /** Subscription Id */
  subscription_id?: string | null;
  /** Checkout Session Id */
  checkout_session_id?: string | null;
  /** User Id */
  user_id?: string | null;
  /** Price Id */
  price_id?: string | null;
}

/** TestExecutionPlan */
export interface TestExecutionPlan {
  /**
   * Plan Id
   * Unique identifier for the execution plan
   */
  plan_id?: string;
  /**
   * Components
   * Components to test
   */
  components: string[];
  /**
   * Features
   * Specific features to test
   */
  features?: string[] | null;
  /**
   * Test Ids
   * Specific tests to run
   */
  test_ids?: string[] | null;
  /**
   * Environment
   * Environment to run tests in
   * @default "test"
   */
  environment?: string;
}

/** TestIssue */
export interface TestIssue {
  /** Id */
  id: string;
  /** Severity */
  severity: string;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Affected Components */
  affected_components: string[];
  /** Steps To Reproduce */
  steps_to_reproduce: string[];
  /** Recommended Fix */
  recommended_fix: string;
  /** Status */
  status: string;
}

/** TestMultiDeviceRequest */
export interface TestMultiDeviceRequest {
  /**
   * User Id
   * User ID to test with
   */
  user_id: string;
  /**
   * Device Count
   * Number of devices to simulate
   * @default 3
   */
  device_count?: number;
}

/** TestNotificationRequest */
export interface TestNotificationRequest {
  /**
   * User Id
   * User ID to test notifications for
   */
  user_id: string;
  /**
   * Browser
   * Browser to simulate (chrome, firefox, safari, edge)
   */
  browser?: string | null;
  /**
   * Category
   * Notification category to test
   */
  category?: string | null;
}

/** TestPlan */
export interface TestPlan {
  /**
   * Title
   * Test plan title
   */
  title: string;
  /**
   * Description
   * Test plan description
   */
  description: string;
  /**
   * Components
   * Components covered in this test plan
   */
  components: string[];
  /**
   * Test Cases
   * Test cases in this plan
   */
  test_cases: AppApisTestDocumentationTestCase[];
  /**
   * Environment Setup
   * Environment setup requirements
   */
  environment_setup?: string | null;
  /**
   * Prerequisites
   * Prerequisites for executing this test plan
   */
  prerequisites?: string[] | null;
}

/**
 * TestReport
 * Response model for retrieving the test report
 */
export interface TestReport {
  /** Report Name */
  report_name: string;
  /** Version */
  version: string;
  /** Test Date */
  test_date: string;
  /** Summary */
  summary: string;
  /** Issues */
  issues: TestIssue[];
  /** Recommendations */
  recommendations: string[];
}

/** TestResults */
export interface TestResults {
  /**
   * Test Id
   * Test ID that was executed
   */
  test_id: string;
  /**
   * Success
   * Whether the test passed
   */
  success: boolean;
  /**
   * Execution Time
   * Time taken to execute the test in seconds
   */
  execution_time: number;
  /**
   * Errors
   * List of errors if test failed
   */
  errors?: string[] | null;
  /**
   * Timestamp
   * When the test was executed
   */
  timestamp?: string;
}

/**
 * TestRunConfig
 * Configuration for a test run
 */
export interface TestRunConfig {
  /**
   * Test Suites
   * Test suites to run (e.g., 'core', 'user', 'game', 'payment', 'all')
   * @default ["all"]
   */
  test_suites?: string[];
  /**
   * Parallel
   * Whether to run tests in parallel
   * @default false
   */
  parallel?: boolean;
  /**
   * Timeout
   * Timeout in seconds for the entire test run
   * @default 300
   */
  timeout?: number;
  /**
   * Ci Build Id
   * CI build ID for tracking
   */
  ci_build_id?: string | null;
  /**
   * Environment
   * Environment to test against (test, dev, prod)
   * @default "test"
   */
  environment?: string;
  /**
   * Notification Email
   * Email to notify when tests complete
   */
  notification_email?: string | null;
}

/** TestRunResults */
export interface TestRunResults {
  /**
   * Run Id
   * Unique ID for this test run
   */
  run_id: string;
  /** Summary of the test run */
  summary: AppApisTestRunnerCliTestRunStatus;
  /**
   * Results
   * Results of individual test cases
   */
  results: TestCaseResult[];
}

/** TestSetupRequest */
export interface TestSetupRequest {
  /**
   * Create Test User
   * @default true
   */
  create_test_user?: boolean;
  /**
   * Create Test Game
   * @default false
   */
  create_test_game?: boolean;
  /**
   * Create Test Submission
   * @default false
   */
  create_test_submission?: boolean;
  /**
   * Tier
   * @default "premium"
   */
  tier?: string;
}

/** TestSignupRequest */
export interface TestSignupRequest {
  /**
   * Email
   * Email to use for testing signup
   */
  email: string;
  /**
   * Password
   * Password to use for testing signup
   */
  password: string;
  /**
   * Username
   * Username to use for testing signup
   */
  username: string;
  /**
   * Plan
   * Plan to test (free, pro, premium)
   * @default "free"
   */
  plan?: string;
}

/** TestUserRequest */
export interface TestUserRequest {
  /** User Id */
  user_id?: string | null;
  /**
   * Role
   * @default "user"
   */
  role?: string;
  /**
   * Tier
   * @default "free"
   */
  tier?: string;
}

/** TestUserResponse */
export interface TestUserResponse {
  /** User Id */
  user_id: string;
  /** Auth Token */
  auth_token: string;
  /** Auth Header */
  auth_header: string;
  /** Role */
  role: string;
  /** Tier */
  tier: string;
  /** Message */
  message: string;
}

/** TestValidationRequest */
export interface TestValidationRequest {
  /**
   * Run Auth Test
   * @default true
   */
  run_auth_test?: boolean;
  /**
   * Run Database Test
   * @default true
   */
  run_database_test?: boolean;
  /**
   * Run Stripe Test
   * @default false
   */
  run_stripe_test?: boolean;
}

/** TestValidationResponse */
export interface TestValidationResponse {
  /** Overall Success */
  overall_success: boolean;
  /** Results */
  results: AppApisTestValidationTestResult[];
  /** Timestamp */
  timestamp: string;
  /** Environment */
  environment: string;
  /** Message */
  message: string;
}

/** ToggleTaskRequest */
export interface ToggleTaskRequest {
  /** Task Id */
  task_id: string;
  /** Is Active */
  is_active: boolean;
}

/** ToggleTaskResponse */
export interface ToggleTaskResponse {
  /** Success */
  success: boolean;
  /** Message */
  message: string;
  /** Task Id */
  task_id: string;
  /** Is Active */
  is_active: boolean;
}

/** TriggerResponse */
export interface TriggerResponse {
  /** Message */
  message: string;
  /** Details */
  details?: Record<string, any> | null;
}

/** TroubleshootingItem */
export interface TroubleshootingItem {
  /**
   * Item Id
   * Unique identifier for the troubleshooting item
   */
  item_id: string;
  /**
   * Title
   * Title of the troubleshooting item
   */
  title: string;
  /**
   * Description
   * Description of the issue
   */
  description: string;
  /**
   * Symptoms
   * Common symptoms of the issue
   */
  symptoms: string[];
  /**
   * Solutions
   * Suggested solutions
   */
  solutions: string[];
  /**
   * Component
   * Which component this issue affects
   */
  component: string;
  /**
   * Severity
   * Severity of the issue
   * @default "medium"
   */
  severity?: string;
}

/**
 * UploadResponse
 * Response model for the CSV upload endpoint.
 */
export interface UploadResponse {
  /** Processed Rows */
  processed_rows: number;
  /** Successful Uploads */
  successful_uploads: number;
  /** Failed Rows */
  failed_rows: number;
  /** Errors */
  errors: string[];
}

/**
 * UserListResponse
 * Model for list of users
 */
export interface UserListResponse {
  /** Users */
  users: Record<string, any>[];
}

/**
 * UserStatusUpdateRequest
 * Model for updating a user's status
 */
export interface UserStatusUpdateRequest {
  /** Status */
  status: string;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/** ValidationRequest */
export interface ValidationRequest {
  /**
   * Components
   * Specific components to validate
   */
  components?: string[] | null;
  /**
   * Ci Build Id
   * CI build ID for tracking
   */
  ci_build_id?: string | null;
}

/** ValidationResult */
export interface ValidationResult {
  /**
   * Component
   * Component being validated
   */
  component: string;
  /**
   * Status
   * Status of the validation
   */
  status: string;
  /**
   * Details
   * Validation details
   */
  details?: Record<string, any>;
  /**
   * Timestamp
   * Time of validation
   */
  timestamp: string;
}

/** ValidationSummary */
export interface ValidationSummary {
  /**
   * Success
   * Overall validation success
   */
  success: boolean;
  /**
   * Message
   * Validation summary message
   */
  message: string;
  /**
   * Results
   * Individual validation results
   */
  results: ValidationResult[];
  /**
   * Timestamp
   * Time of validation
   */
  timestamp: string;
  /**
   * Ci Build Id
   * CI build ID if run in CI environment
   */
  ci_build_id?: string | null;
}

/** TestCase */
export interface AppApisTestDocumentationTestCase {
  /**
   * Test Id
   * Unique identifier for the test
   */
  test_id: string;
  /**
   * Name
   * Name of the test
   */
  name: string;
  /**
   * Description
   * Description of what the test verifies
   */
  description: string;
  /**
   * Component
   * Component that the test belongs to
   */
  component: string;
  /**
   * Features
   * Features that this test verifies
   */
  features: string[];
  /**
   * Expected Input
   * Expected input values
   */
  expected_input?: Record<string, any> | null;
  /**
   * Expected Output
   * Expected output values
   */
  expected_output?: Record<string, any> | null;
  /**
   * Setup Instructions
   * Instructions for setting up the test
   */
  setup_instructions?: string | null;
  /**
   * Cleanup Instructions
   * Instructions for cleaning up after the test
   */
  cleanup_instructions?: string | null;
}

/** TestCase */
export interface AppApisTestFeatureMapTestCase {
  /**
   * Test Id
   * Unique identifier for the test
   */
  test_id?: string;
  /**
   * Name
   * Name of the test
   */
  name: string;
  /**
   * Description
   * Description of what the test verifies
   */
  description: string;
  /**
   * Component
   * Component that the test belongs to
   */
  component: string;
  /**
   * Features
   * Features that this test verifies
   */
  features: string[];
  /**
   * Expected Input
   * Expected input values
   */
  expected_input?: Record<string, any> | null;
  /**
   * Expected Output
   * Expected output values
   */
  expected_output?: Record<string, any> | null;
}

/**
 * TestRunRequest
 * Request to start a test run
 */
export interface AppApisTestRunnerTestRunRequest {
  /** Test run configuration */
  config: TestRunConfig;
}

/**
 * TestRunStatus
 * Status of a test run
 */
export interface AppApisTestRunnerTestRunStatus {
  /**
   * Run Id
   * Unique ID for this test run
   */
  run_id: string;
  /**
   * Status
   * Status of the test run (queued, running, completed, failed)
   */
  status: string;
  /**
   * Start Time
   * When the test run started
   */
  start_time?: string | null;
  /**
   * End Time
   * When the test run completed
   */
  end_time?: string | null;
  /**
   * Progress
   * Progress percentage (0-100)
   * @default 0
   */
  progress?: number;
  /**
   * Results Key
   * Storage key for full results
   */
  results_key?: string | null;
  /**
   * Summary
   * Summary of test results
   */
  summary?: Record<string, any> | null;
}

/** TestRunRequest */
export interface AppApisTestRunnerCliTestRunRequest {
  /**
   * Components
   * Components to test (all if not specified)
   */
  components?: string[] | null;
  /**
   * Features
   * Features to test (all if not specified)
   */
  features?: string[] | null;
  /**
   * Tests
   * Specific tests to run (all if not specified)
   */
  tests?: string[] | null;
  /**
   * Environment
   * Environment to run tests in
   * @default "test"
   */
  environment?: string;
  /**
   * Reporter
   * Test result reporter to use
   * @default "default"
   */
  reporter?: string;
}

/** TestRunStatus */
export interface AppApisTestRunnerCliTestRunStatus {
  /**
   * Run Id
   * Unique ID for this test run
   */
  run_id: string;
  /**
   * Status
   * Current status of the test run
   */
  status: string;
  /**
   * Start Time
   * When the test run started
   */
  start_time: string;
  /**
   * End Time
   * When the test run finished
   */
  end_time?: string | null;
  /**
   * Total Tests
   * Total number of tests in the run
   */
  total_tests: number;
  /**
   * Completed Tests
   * Number of completed tests
   */
  completed_tests: number;
  /**
   * Passed Tests
   * Number of passed tests
   */
  passed_tests: number;
  /**
   * Failed Tests
   * Number of failed tests
   */
  failed_tests: number;
  /**
   * Error Message
   * Error message if the run failed
   */
  error_message?: string | null;
}

/** TestResult */
export interface AppApisTestValidationTestResult {
  /** Name */
  name: string;
  /** Success */
  success: boolean;
  /** Details */
  details: Record<string, any>;
  /** Error */
  error?: string | null;
}

/** TestResult */
export interface AppApisTestingTestResult {
  /**
   * Success
   * Whether the test was successful
   */
  success: boolean;
  /**
   * Message
   * Message describing the test result
   */
  message: string;
  /**
   * Details
   * Additional test details
   */
  details?: Record<string, any> | null;
}

export type CheckHealthData = HealthResponse;

export interface GetLeaderboardParams {
  /**
   * Limit
   * Number of results to return (max 50)
   * @min 1
   * @max 50
   * @default 10
   */
  limit?: number;
  /**
   * Offset
   * Offset for pagination
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Exchange
   * The exchange identifier (e.g., 'asx', 'nyse') for the leaderboard
   */
  exchange: string;
}

export type GetLeaderboardData = LeaderboardResponse;

export type GetLeaderboardError = HTTPValidationError;

export interface FinalizeGameResultsParams {
  /**
   * Pair Id
   * The ID of the prediction pair to process results for
   */
  pairId: string;
}

export type FinalizeGameResultsData = ProcessResultsResponse;

export type FinalizeGameResultsError = HTTPValidationError;

export type GetDeviceAnalyticsData = APIResponse;

export type GetDeviceAnalyticsError = HTTPValidationError;

export type TrackNotificationEventData = APIResponse;

export type TrackNotificationEventError = HTTPValidationError;

export interface GetFinancialDataParams {
  /**
   * Days
   * @min 1
   * @max 365
   * @default 30
   */
  days?: number;
  /**
   * Forcemock
   * @default false
   */
  forceMock?: boolean;
  /** Ticker */
  ticker: string;
}

export type GetFinancialDataData = any;

export type GetFinancialDataError = HTTPValidationError;

export type GenerateGameEndpointData = GameGenerationResponse;

export type GenerateGameEndpointError = HTTPValidationError;

export interface GenerateUpcomingGamesEndpointParams {
  /**
   * Days Ahead
   * Number of days ahead to generate games for
   * @default 1
   */
  days_ahead?: number;
}

export type GenerateUpcomingGamesEndpointData = any;

export type GenerateUpcomingGamesEndpointError = HTTPValidationError;

export interface GenerateMockGameEndpointParams {
  /**
   * Exchange
   * Stock exchange code (e.g., ASX, NYSE)
   * @default "ASX"
   */
  exchange?: string;
  /**
   * Target Date
   * Target date (ISO format, defaults to next trading day)
   */
  target_date?: string | null;
}

export type GenerateMockGameEndpointData = any;

export type GenerateMockGameEndpointError = HTTPValidationError;

export type TestAiReasoningData = any;

export interface GetMunyiqScoreParams {
  /**
   * User Id
   * User ID to get score for (admin only)
   */
  user_id?: string | null;
}

export type GetMunyiqScoreData = MunyIQScoreResponse;

export type GetMunyiqScoreError = HTTPValidationError;

export type GetMunyiqStatsData = MunyIQStatsResponse;

export type GetMunyiqStatsError = HTTPValidationError;

export interface RecalculateMunyiqScoresParams {
  /**
   * Admin Only
   * Admin only operation flag
   * @default true
   */
  admin_only?: boolean;
}

/** Response Recalculate Munyiq Scores */
export type RecalculateMunyiqScoresData = Record<string, any>;

export type RecalculateMunyiqScoresError = HTTPValidationError;

export type GetTestReportData = TestReport;

export type GetTestAuthTokenData = TestAuthResponse;

export type GetTestAuthTokenError = HTTPValidationError;

export type VerifyTestTokenData = any;

export type GetTestPlanData = any;

export type GetDatabaseTestPlanData = any;

export type GetPaymentTestPlanData = any;

export type GetDetailedPaymentTestPlanData = any;

export type GetDetailedDatabaseTestPlanData = any;

export type GetComprehensiveE2ETestPlanData = any;

export type GetAuthHeadersData = any;

export type SimulateCheckoutData = SimulateCheckoutResponse;

export type SimulateCheckoutError = HTTPValidationError;

export type SimulateSubscriptionEventData = any;

export type SimulateSubscriptionEventError = HTTPValidationError;

export type GetStripeTestConfigData = any;

export type GetTestFrameworkDocumentationData = any;

export type SetupTestEnvironmentData = any;

export type SetupTestEnvironmentError = HTTPValidationError;

export type CreateTestUserData = TestUserResponse;

export type CreateTestUserError = HTTPValidationError;

export type GetTestModeData = any;

export type GetAuthBypassExampleData = any;

/** Response Get Components */
export type GetComponentsData = Component[];

export interface GetFeaturesForComponentParams {
  /** Component Name */
  componentName: string;
}

/** Response Get Features For Component */
export type GetFeaturesForComponentData = Feature[];

export type GetFeaturesForComponentError = HTTPValidationError;

export interface GetTestsForFeatureParams {
  /** Feature Name */
  featureName: string;
}

/** Response Get Tests For Feature */
export type GetTestsForFeatureData = AppApisTestFeatureMapTestCase[];

export type GetTestsForFeatureError = HTTPValidationError;

export interface GetTestCaseParams {
  /** Test Id */
  testId: string;
}

export type GetTestCaseData = AppApisTestFeatureMapTestCase;

export type GetTestCaseError = HTTPValidationError;

export interface UpdateTestCaseParams {
  /** Test Id */
  testId: string;
}

export type UpdateTestCaseData = AppApisTestFeatureMapTestCase;

export type UpdateTestCaseError = HTTPValidationError;

export interface DeleteTestCaseParams {
  /** Test Id */
  testId: string;
}

/** Response Delete Test Case */
export type DeleteTestCaseData = Record<string, any>;

export type DeleteTestCaseError = HTTPValidationError;

/** Response Get All Test Cases */
export type GetAllTestCasesData = AppApisTestFeatureMapTestCase[];

export type CreateTestCaseData = AppApisTestFeatureMapTestCase;

export type CreateTestCaseError = HTTPValidationError;

export type RecordTestResultsData = TestResults;

export type RecordTestResultsError = HTTPValidationError;

export type CreateTestExecutionPlanData = TestExecutionPlan;

export type CreateTestExecutionPlanError = HTTPValidationError;

/** Response Get Test Coverage */
export type GetTestCoverageData = Record<string, Record<string, string[]>>;

/** Response Get Map Summary */
export type GetMapSummaryData = Record<string, Record<string, any>>;

/** Response Get Troubleshooting Guide2 */
export type GetTroubleshootingGuide2Data = TroubleshootingItem[];

export interface GetTroubleshootingItem2Params {
  /** Item Id */
  itemId: string;
}

export type GetTroubleshootingItem2Data = TroubleshootingItem;

export type GetTroubleshootingItem2Error = HTTPValidationError;

export type RunTestsData = AppApisTestRunnerCliTestRunStatus;

export type RunTestsError = HTTPValidationError;

export interface GetTestRunStatusParams {
  /** Run Id */
  runId: string;
}

export type GetTestRunStatusData = AppApisTestRunnerCliTestRunStatus;

export type GetTestRunStatusError = HTTPValidationError;

export interface GetTestRunResultsParams {
  /** Run Id */
  runId: string;
}

export type GetTestRunResultsData = TestRunResults;

export type GetTestRunResultsError = HTTPValidationError;

export interface ListTestRunsParams {
  /**
   * Limit
   * @min 1
   * @max 100
   * @default 10
   */
  limit?: number;
}

/** Response List Test Runs */
export type ListTestRunsData = AppApisTestRunnerCliTestRunStatus[];

export type ListTestRunsError = HTTPValidationError;

export type ValidateFixes2Data = TestValidationResponse;

export type ValidateFixes2Error = HTTPValidationError;

export type GetTestDocumentationData = TestDocumentation;

/** Response Get Troubleshooting Guide */
export type GetTroubleshootingGuideData = TroubleshootingItem[];

export interface GetTroubleshootingItemParams {
  /** Item Id */
  itemId: string;
}

export type GetTroubleshootingItemData = TroubleshootingItem;

export type GetTroubleshootingItemError = HTTPValidationError;

/** Response Get Environment Setup Guide */
export type GetEnvironmentSetupGuideData = string;

/** Response Get Extension Guide */
export type GetExtensionGuideData = string;

export type GetComprehensiveE2ETestPlan2Data = TestPlan;

export type TestSignupData = AppApisTestingTestResult;

export type TestSignupError = HTTPValidationError;

export type TestNotificationDeliveryData = AppApisTestingTestResult;

export type TestNotificationDeliveryError = HTTPValidationError;

export type TestMultiDeviceData = AppApisTestingTestResult;

export type TestMultiDeviceError = HTTPValidationError;

export type TestEdgeCasesData = AppApisTestingTestResult;

export type TestEdgeCasesError = HTTPValidationError;

export type GenerateTestReportData = AppApisTestingTestResult;

/** Body */
export type ValidateComponentsPayload = ValidationRequest | null;

export type ValidateComponentsData = ValidationSummary;

export type ValidateComponentsError = HTTPValidationError;

export type GetProductionChecklistData = any;

export type CreateBetaSignupData = BetaSignupResponse;

export type CreateBetaSignupError = HTTPValidationError;

export type GetDailyPredictionPairData = DailyPredictionPairResponse;

export type ProcessGameResultsData = any;

export type ProcessGameResultsError = HTTPValidationError;

export type SubmitPredictionData = PredictionResponse;

export type SubmitPredictionError = HTTPValidationError;

export type GetNextGameClueData = NextClueResponse;

export type SendNotificationData = APIResponse;

export type SendNotificationError = HTTPValidationError;

export type AdminSendNotificationData = APIResponse;

export type AdminSendNotificationError = HTTPValidationError;

export type TestNotificationData = APIResponse;

export type TestNotificationError = HTTPValidationError;

export type AdminBatchNotificationData = APIResponse;

export type AdminBatchNotificationError = HTTPValidationError;

export type RegisterDeviceFcmTokenData = any;

export type RegisterDeviceFcmTokenError = HTTPValidationError;

export type ListAdminRoles2Data = any;

export type ListAdminRoles2Error = HTTPValidationError;

export interface AssignAdminRole2Params {
  /** Role */
  role: string;
  /** User Id */
  userId: string;
}

export type AssignAdminRole2Data = any;

export type AssignAdminRole2Error = HTTPValidationError;

export interface RemoveAdminRole2Params {
  /** User Id */
  userId: string;
}

export type RemoveAdminRole2Data = any;

export type RemoveAdminRole2Error = HTTPValidationError;

export type MigrateRoles2Data = any;

export type MigrateRoles2Error = HTTPValidationError;

export type UploadGameDataCsvData = UploadResponse;

export type UploadGameDataCsvError = HTTPValidationError;

export type CreateGameData = GameResponse;

export type CreateGameError = HTTPValidationError;

export interface ListGamesParams {
  /**
   * Exchange
   * Filter by exchange
   */
  exchange?: string | null;
  /**
   * From Date
   * Filter games from this date (inclusive, YYYY-MM-DD)
   */
  from_date?: string | null;
  /**
   * To Date
   * Filter games to this date (inclusive, YYYY-MM-DD)
   */
  to_date?: string | null;
  /**
   * Status
   * Filter by status
   */
  status?: string | null;
}

/** Response List Games */
export type ListGamesData = GameResponse[];

export type ListGamesError = HTTPValidationError;

export interface GetGameParams {
  /**
   * Pair Id
   * The unique ID of the game
   */
  pairId: string;
}

export type GetGameData = GameResponse;

export type GetGameError = HTTPValidationError;

export interface UpdateGameParams {
  /**
   * Pair Id
   * The unique ID of the game
   */
  pairId: string;
}

export type UpdateGameData = GameResponse;

export type UpdateGameError = HTTPValidationError;

export interface DeleteGameParams {
  /**
   * Pair Id
   * The unique ID of the game
   */
  pairId: string;
}

export type DeleteGameData = any;

export type DeleteGameError = HTTPValidationError;

export type CreateGameSubmissionData = SubmissionResponse;

export type CreateGameSubmissionError = HTTPValidationError;

export interface ListGameSubmissionsParams {
  /**
   * Status
   * Filter by status: pending_review, approved, rejected
   */
  status?: string | null;
}

export type ListGameSubmissionsData = GameSubmissionListResponse;

export type ListGameSubmissionsError = HTTPValidationError;

export interface UpdateGameSubmissionParams {
  /**
   * Submission Id
   * The unique ID of the submission
   */
  submissionId: string;
}

export type UpdateGameSubmissionData = GameResponse;

export type UpdateGameSubmissionError = HTTPValidationError;

export type ListAdminRolesData = AdminRoleListResponse;

export type ListAdminRolesError = HTTPValidationError;

export interface AssignAdminRoleParams {
  /** User Id */
  userId: string;
}

export type AssignAdminRoleData = AdminRoleResponse;

export type AssignAdminRoleError = HTTPValidationError;

export interface RemoveAdminRoleParams {
  /** User Id */
  userId: string;
}

export type RemoveAdminRoleData = AdminRoleResponse;

export type RemoveAdminRoleError = HTTPValidationError;

/** Response Migrate Roles */
export type MigrateRolesData = Record<string, any>;

export type MigrateRolesError = HTTPValidationError;

export interface ListUsersParams {
  /**
   * Is Admin
   * Filter by admin status
   */
  is_admin?: boolean | null;
  /**
   * Is Active
   * Filter by active status
   */
  is_active?: boolean | null;
}

export type ListUsersData = UserListResponse;

export type ListUsersError = HTTPValidationError;

export interface UpdateUserStatusParams {
  /** User Id */
  userId: string;
}

export type UpdateUserStatusData = any;

export type UpdateUserStatusError = HTTPValidationError;

/** Response Migrate Sandbox Settings */
export type MigrateSandboxSettingsData = Record<string, any>;

export type MigrateSandboxSettingsError = HTTPValidationError;

export type GetSandboxStatusData = SandboxStatusResponse;

export type GetSandboxStatusError = HTTPValidationError;

export type SetSandboxGameData = SetGameResponse;

export type SetSandboxGameError = HTTPValidationError;

export type TriggerClosePredictionsData = TriggerResponse;

export type TriggerClosePredictionsError = HTTPValidationError;

export type TriggerProcessResultsData = TriggerResponse;

export type TriggerProcessResultsError = HTTPValidationError;

export type TriggerLeaderboardUpdateData = TriggerResponse;

export type TriggerLeaderboardUpdateError = HTTPValidationError;

export type GetCronStatusData = CronStatusResponse;

export type GetCronStatusError = HTTPValidationError;

export type EnableCronData = any;

export type EnableCronError = HTTPValidationError;

export type DisableCronData = any;

export type DisableCronError = HTTPValidationError;

export interface SetCronIntervalParams {
  /** Interval Minutes */
  interval_minutes: number;
}

export type SetCronIntervalData = any;

export type SetCronIntervalError = HTTPValidationError;

export interface TriggerCronParams {
  /**
   * Run Now
   * @default false
   */
  run_now?: boolean;
}

export type TriggerCronData = any;

export type TriggerCronError = HTTPValidationError;

export type RunCronNowData = any;

export type RunCronNowError = HTTPValidationError;

export type MigrateCronToSupabaseData = any;

export type MigrateCronToSupabaseError = HTTPValidationError;

export type ToggleTaskActive2Data = ToggleTaskResponse;

export type ToggleTaskActive2Error = HTTPValidationError;

export type ToggleTaskActiveData = ToggleTaskResponse;

export type ToggleTaskActiveError = HTTPValidationError;

export type MigrateSchedulerToSupabaseData = GenericResponse;

export type MigrateSchedulerToSupabaseError = HTTPValidationError;

export type MigrateSchedulerErrorsToSupabaseData = GenericResponse;

export type MigrateSchedulerErrorsToSupabaseError = HTTPValidationError;

export type MigrateCronToSupabase2Data = GenericResponse;

export type MigrateCronToSupabase2Error = HTTPValidationError;

export type GetDocumentation2Data = any;

export type GetDocumentation2Error = HTTPValidationError;

export type GetSchedulerStatusData = SchedulerStatusResponse;

export type GetSchedulerStatusError = HTTPValidationError;

export type InitializeSchedulerEndpointData = SchedulerStatusResponse;

export type InitializeSchedulerEndpointError = HTTPValidationError;

export type EnableSchedulerData = any;

export type EnableSchedulerError = HTTPValidationError;

export type DisableSchedulerData = any;

export type DisableSchedulerError = HTTPValidationError;

export interface RunTaskParams {
  /** Task Id */
  taskId: string;
}

export type RunTaskData = TaskResponse;

export type RunTaskError = HTTPValidationError;

/** Response Run All Tasks */
export type RunAllTasksData = TaskResponse[];

export type RunAllTasksError = HTTPValidationError;

export type ToggleSandboxModeData = any;

export type ToggleSandboxModeError = HTTPValidationError;

export type TriggerScheduledTasksCheckData = any;

export type GetSchedulerErrorsData = any;

export type GetSchedulerErrorsError = HTTPValidationError;

export type ClearSchedulerErrorsData = any;

export type ClearSchedulerErrorsError = HTTPValidationError;

export type MigrateSchedulerToSupabase2Data = any;

export type MigrateSchedulerToSupabase2Error = HTTPValidationError;

export interface TestProcessResultsParams {
  /** Exchange */
  exchange: string;
  /** Target Date */
  target_date?: string;
}

export type TestProcessResultsData = any;

export type TestProcessResultsError = HTTPValidationError;

export interface TestGenerateGamesParams {
  /** Exchange */
  exchange: string;
  /**
   * Days Ahead
   * @default 1
   */
  days_ahead?: number;
}

export type TestGenerateGamesData = any;

export type TestGenerateGamesError = HTTPValidationError;

export interface TestUpdateClueParams {
  /** Exchange */
  exchange: string;
  /** Target Date */
  target_date?: string;
}

export type TestUpdateClueData = any;

export type TestUpdateClueError = HTTPValidationError;

export interface TestFullSchedulerCycleParams {
  /** Exchange */
  exchange: string;
}

export type TestFullSchedulerCycleData = any;

export type TestFullSchedulerCycleError = HTTPValidationError;

export interface CleanupSandboxTestDataParams {
  /**
   * Days To Keep
   * @default 2
   */
  days_to_keep?: number;
}

export type CleanupSandboxTestDataData = any;

export type CleanupSandboxTestDataError = HTTPValidationError;

export type GetMigrationDocsData = MigrationDocResponse;

export type GetMigrationDocsError = HTTPValidationError;

export interface DiscoverCompaniesEndpointParams {
  /**
   * Exchange
   * Stock exchange code (e.g., ASX, NYSE)
   * @default "ASX"
   */
  exchange?: string;
  /**
   * Sector
   * Filter by sector
   */
  sector?: string | null;
  /**
   * Min Market Cap
   * Minimum market capitalization
   */
  min_market_cap?: number | null;
  /**
   * Force Refresh
   * Force refresh of company data
   * @default false
   */
  force_refresh?: boolean;
  /**
   * Only Active
   * Only include actively traded companies
   * @default true
   */
  only_active?: boolean;
  /**
   * Mock Data
   * Use mock data for testing
   * @default false
   */
  mock_data?: boolean;
}

export type DiscoverCompaniesEndpointData = any;

export type DiscoverCompaniesEndpointError = HTTPValidationError;

export interface GenerateCompanyPairEndpointParams {
  /**
   * Exchange
   * Stock exchange code (e.g., ASX, NYSE)
   * @default "ASX"
   */
  exchange?: string;
  /**
   * Target Sector
   * Target sector for the pair
   */
  target_sector?: string | null;
  /**
   * Force Refresh
   * Force refresh of company data
   * @default false
   */
  force_refresh?: boolean;
  /**
   * Mock Data
   * Use mock data for testing
   * @default false
   */
  mock_data?: boolean;
}

export type GenerateCompanyPairEndpointData = any;

export type GenerateCompanyPairEndpointError = HTTPValidationError;

export interface GetExchangeCalendarEndpointParams {
  /**
   * Exchange
   * Stock exchange code (e.g., ASX, NYSE)
   * @default "ASX"
   */
  exchange?: string;
  /**
   * Force Refresh
   * Force refresh of calendar data
   * @default false
   */
  force_refresh?: boolean;
}

export type GetExchangeCalendarEndpointData = any;

export type GetExchangeCalendarEndpointError = HTTPValidationError;

export interface GetNextTradingDayEndpointParams {
  /**
   * Exchange
   * Stock exchange code (e.g., ASX, NYSE)
   * @default "ASX"
   */
  exchange?: string;
  /**
   * Start Date
   * Start date (ISO format, e.g., 2023-04-15)
   */
  start_date?: string | null;
}

export type GetNextTradingDayEndpointData = any;

export type GetNextTradingDayEndpointError = HTTPValidationError;

export type TestCompanyDiscoveryData = any;

export type MigrateCompanyCacheToSupabaseData = any;

export type MigrateCompanyCacheToSupabaseError = HTTPValidationError;

export type TestMigrateCompanyCacheToSupabaseData = any;

export type MigrateTestStorageTablesData = MigrationResult;

export type MigrateTestResultsData = MigrationResult;

export type MigrateValidationResultsData = MigrationResult;

export type MigrateCoverageReportsData = MigrationResult;

/** Response Get Migration Docs2 */
export type GetMigrationDocs2Data = Record<string, any>;

export type MigrateTestStorageTablesEndpointData = MigrationResult;

export type MigrateTestResultsEndpointData = MigrationResult;

export type MigrateValidationResultsEndpointData = MigrationResult;

export type MigrateCoverageReportsEndpointData = MigrationResult;

export type StartTestRunData = AppApisTestRunnerTestRunStatus;

export type StartTestRunError = HTTPValidationError;

export interface GetTestStatusParams {
  /** Run Id */
  runId: string;
}

export type GetTestStatusData = AppApisTestRunnerTestRunStatus;

export type GetTestStatusError = HTTPValidationError;

export interface GetTestResultsParams {
  /** Run Id */
  runId: string;
}

export type GetTestResultsData = any;

export type GetTestResultsError = HTTPValidationError;

export interface DeleteTestRunParams {
  /** Run Id */
  runId: string;
}

export type DeleteTestRunData = any;

export type DeleteTestRunError = HTTPValidationError;

export type HealthCheckData = any;

export type GenerateCoverageReportData = CoverageSummary;

export type GenerateCoverageReportError = HTTPValidationError;

export interface GetCoverageReportParams {
  /** Report Id */
  reportId: string;
}

export type GetCoverageReportData = CoverageReport;

export type GetCoverageReportError = HTTPValidationError;

export type GetLatestCoverageData = CoverageReport;

/** Response Get Missing Features */
export type GetMissingFeaturesData = Record<string, string[]>;

export interface MarkFeatureCoveredParams {
  /** Component */
  component: string;
  /** Feature */
  feature: string;
}

export type MarkFeatureCoveredData = any;

export type MarkFeatureCoveredError = HTTPValidationError;

export type GetCoverageSummaryData = any;

/** Body */
export type ValidateFixesPayload = ValidationRequest | null;

export type ValidateFixesData = ValidationSummary;

export type ValidateFixesError = HTTPValidationError;

export type GetDevelopmentRulesData = SimpleDocumentationResponse;

export type GetTechnicalConstraintsData = SimpleDocumentationResponse;

export type GetMigrationDocs22Data = SimpleDocumentationResponse;

export type GetSubscriptionDocumentationData = DocumentationResponse;

export type CreateCheckoutSessionData = CreateCheckoutSessionResponse;

export type CreateCheckoutSessionError = HTTPValidationError;

export type StripeWebhookData = any;

export type StripeWebhookError = HTTPValidationError;

export interface AdminFixSubscriptionParams {
  /** User Id */
  user_id: string;
  /** Tier */
  tier: string;
}

export type AdminFixSubscriptionData = any;

export type AdminFixSubscriptionError = HTTPValidationError;
