import {
  AdminBatchNotificationData,
  AdminFixSubscriptionData,
  AdminNotificationRequest,
  AdminRoleRequest,
  AdminSendNotificationData,
  AppApisTestRunnerCliTestRunRequest,
  AppApisTestRunnerTestRunRequest,
  AssignAdminRole2Data,
  AssignAdminRoleData,
  BatchNotificationRequest,
  BetaSignupRequest,
  BodyUploadGameDataCsv,
  CheckHealthData,
  CleanupSandboxTestDataData,
  ClearSchedulerErrorsData,
  CoverageReportRequest,
  CreateBetaSignupData,
  CreateCheckoutSessionData,
  CreateCheckoutSessionRequest,
  CreateGameData,
  CreateGameSubmissionData,
  CreateTestCaseData,
  CreateTestExecutionPlanData,
  CreateTestUserData,
  DeleteGameData,
  DeleteTestCaseData,
  DeleteTestRunData,
  DisableCronData,
  DisableSchedulerData,
  DiscoverCompaniesEndpointData,
  EnableCronData,
  EnableSchedulerData,
  FcmTokenRequest,
  FinalizeGameResultsData,
  GameCreateRequest,
  GameGenerationRequest,
  GameUpdateRequest,
  GenerateCompanyPairEndpointData,
  GenerateCoverageReportData,
  GenerateGameEndpointData,
  GenerateMockGameEndpointData,
  GenerateTestReportData,
  GenerateUpcomingGamesEndpointData,
  GetAllTestCasesData,
  GetAuthBypassExampleData,
  GetAuthHeadersData,
  GetComponentsData,
  GetComprehensiveE2ETestPlan2Data,
  GetComprehensiveE2ETestPlanData,
  GetCoverageReportData,
  GetCoverageSummaryData,
  GetCronStatusData,
  GetDailyPredictionPairData,
  GetDatabaseTestPlanData,
  GetDetailedDatabaseTestPlanData,
  GetDetailedPaymentTestPlanData,
  GetDevelopmentRulesData,
  GetDeviceAnalyticsData,
  GetDocumentation2Data,
  GetEnvironmentSetupGuideData,
  GetExchangeCalendarEndpointData,
  GetExtensionGuideData,
  GetFeaturesForComponentData,
  GetFinancialDataData,
  GetGameData,
  GetLatestCoverageData,
  GetLeaderboardData,
  GetMapSummaryData,
  GetMigrationDocs22Data,
  GetMigrationDocs2Data,
  GetMigrationDocsData,
  GetMissingFeaturesData,
  GetMunyiqScoreData,
  GetMunyiqStatsData,
  GetNextGameClueData,
  GetNextTradingDayEndpointData,
  GetPaymentTestPlanData,
  GetProductionChecklistData,
  GetSandboxStatusData,
  GetSchedulerErrorsData,
  GetSchedulerStatusData,
  GetStripeTestConfigData,
  GetSubscriptionDocumentationData,
  GetTechnicalConstraintsData,
  GetTestAuthTokenData,
  GetTestCaseData,
  GetTestCoverageData,
  GetTestDocumentationData,
  GetTestFrameworkDocumentationData,
  GetTestModeData,
  GetTestPlanData,
  GetTestReportData,
  GetTestResultsData,
  GetTestRunResultsData,
  GetTestRunStatusData,
  GetTestStatusData,
  GetTestsForFeatureData,
  GetTroubleshootingGuide2Data,
  GetTroubleshootingGuideData,
  GetTroubleshootingItem2Data,
  GetTroubleshootingItemData,
  HealthCheckData,
  InitializeSchedulerEndpointData,
  ListAdminRoles2Data,
  ListAdminRolesData,
  ListGameSubmissionsData,
  ListGamesData,
  ListTestRunsData,
  ListUsersData,
  MarkFeatureCoveredData,
  MigrateCompanyCacheToSupabaseData,
  MigrateCoverageReportsData,
  MigrateCoverageReportsEndpointData,
  MigrateCronToSupabase2Data,
  MigrateCronToSupabaseData,
  MigrateRoles2Data,
  MigrateRolesData,
  MigrateSandboxSettingsData,
  MigrateSchedulerErrorsToSupabaseData,
  MigrateSchedulerToSupabase2Data,
  MigrateSchedulerToSupabaseData,
  MigrateTestResultsData,
  MigrateTestResultsEndpointData,
  MigrateTestStorageTablesData,
  MigrateTestStorageTablesEndpointData,
  MigrateValidationResultsData,
  MigrateValidationResultsEndpointData,
  NotificationEventRequest,
  NotificationRequest,
  PredictionRequest,
  ProcessGameResultsData,
  ProcessResultsRequest,
  RecalculateMunyiqScoresData,
  RecordTestResultsData,
  RegisterDeviceFcmTokenData,
  RemoveAdminRole2Data,
  RemoveAdminRoleData,
  RunAllTasksData,
  RunCronNowData,
  RunTaskData,
  RunTestsData,
  SendNotificationData,
  SetCronIntervalData,
  SetGameRequest,
  SetSandboxGameData,
  SetupTestEnvironmentData,
  SimulateCheckoutData,
  SimulateCheckoutRequest,
  SimulateSubscriptionEventData,
  StartTestRunData,
  StripeWebhookData,
  SubmissionCreateRequest,
  SubmissionUpdateRequest,
  SubmitPredictionData,
  TestAiReasoningData,
  TestAuthRequest,
  TestCaseInput,
  TestCompanyDiscoveryData,
  TestEdgeCasesData,
  TestEvent,
  TestExecutionPlan,
  TestFullSchedulerCycleData,
  TestGenerateGamesData,
  TestMigrateCompanyCacheToSupabaseData,
  TestMultiDeviceData,
  TestMultiDeviceRequest,
  TestNotificationData,
  TestNotificationDeliveryData,
  TestNotificationRequest,
  TestProcessResultsData,
  TestResults,
  TestSetupRequest,
  TestSignupData,
  TestSignupRequest,
  TestUpdateClueData,
  TestUserRequest,
  TestValidationRequest,
  ToggleSandboxModeData,
  ToggleTaskActive2Data,
  ToggleTaskActiveData,
  ToggleTaskRequest,
  TrackNotificationEventData,
  TriggerClosePredictionsData,
  TriggerCronData,
  TriggerLeaderboardUpdateData,
  TriggerProcessResultsData,
  TriggerScheduledTasksCheckData,
  UpdateGameData,
  UpdateGameSubmissionData,
  UpdateTestCaseData,
  UpdateUserStatusData,
  UploadGameDataCsvData,
  UserStatusUpdateRequest,
  ValidateComponentsData,
  ValidateComponentsPayload,
  ValidateFixes2Data,
  ValidateFixesData,
  ValidateFixesPayload,
  VerifyTestTokenData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * @description Retrieves the ranked leaderboard for a specific exchange based on accuracy, speed, and streak.
   * @tags dbtn/module:leaderboard_api
   * @name get_leaderboard
   * @summary Get Leaderboard
   * @request GET:/routes/leaderboard/{exchange}
   */
  export namespace get_leaderboard {
    export type RequestParams = {
      /**
       * Exchange
       * The exchange identifier (e.g., 'asx', 'nyse') for the leaderboard
       */
      exchange: string;
    };
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetLeaderboardData;
  }

  /**
   * @description Processes the results for a given prediction pair. 1. Fetches pair details (tickers, date) from storage. 2. Fetches user predictions for the pair from storage. 3. Fetches actual stock performance data from Finnhub for the relevant date. 4. Determines the winning stock based on performance. 5. Compares user predictions against the actual winner. 6. Stores the results (winner, performance, user scores). 7. (Later) Triggers notifications.
   * @tags Results, dbtn/module:results_api
   * @name finalize_game_results
   * @summary Finalize Game Results
   * @request POST:/routes/results/process/{pair_id}
   */
  export namespace finalize_game_results {
    export type RequestParams = {
      /**
       * Pair Id
       * The ID of the prediction pair to process results for
       */
      pairId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = FinalizeGameResultsData;
  }

  /**
   * @description Get comprehensive device analytics
   * @tags Analytics, dbtn/module:analytics
   * @name get_device_analytics
   * @summary Get Device Analytics
   * @request GET:/routes/analytics/devices
   */
  export namespace get_device_analytics {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetDeviceAnalyticsData;
  }

  /**
   * @description Track notification delivery and interaction events
   * @tags Analytics, dbtn/module:analytics
   * @name track_notification_event
   * @summary Track Notification Event
   * @request POST:/routes/analytics/notification-events
   */
  export namespace track_notification_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NotificationEventRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TrackNotificationEventData;
  }

  /**
   * @description Get detailed financial metrics and historical data for a stock
   * @tags dbtn/module:stock_data
   * @name get_financial_data
   * @summary Get Financial Data
   * @request GET:/routes/stock/financial-data/{ticker}
   */
  export namespace get_financial_data {
    export type RequestParams = {
      /** Ticker */
      ticker: string;
    };
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFinancialDataData;
  }

  /**
   * @description Generate a new game with AI reasoning for a specific date
   * @tags dbtn/module:game_generation
   * @name generate_game_endpoint
   * @summary Generate Game Endpoint
   * @request POST:/routes/game/generate
   */
  export namespace generate_game_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GameGenerationRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GenerateGameEndpointData;
  }

  /**
   * @description Generate games for upcoming trading days
   * @tags dbtn/module:game_generation
   * @name generate_upcoming_games_endpoint
   * @summary Generate Upcoming Games Endpoint
   * @request POST:/routes/games/generate-upcoming
   */
  export namespace generate_upcoming_games_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days Ahead
       * Number of days ahead to generate games for
       * @default 1
       */
      days_ahead?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GenerateUpcomingGamesEndpointData;
  }

  /**
   * @description Generate a mock game for testing
   * @tags dbtn/module:game_generation
   * @name generate_mock_game_endpoint
   * @summary Generate Mock Game Endpoint
   * @request GET:/routes/mock/game
   */
  export namespace generate_mock_game_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateMockGameEndpointData;
  }

  /**
   * @description Test endpoint for the AI reasoning generation
   * @tags dbtn/module:game_generation
   * @name test_ai_reasoning
   * @summary Test Ai Reasoning
   * @request GET:/routes/test/ai-reasoning
   */
  export namespace test_ai_reasoning {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestAiReasoningData;
  }

  /**
   * @description Get MunyIQ score for the authenticated user or a specific user (admin only). Premium subscription required.
   * @tags dbtn/module:munyiq_api
   * @name get_munyiq_score
   * @summary Get Munyiq Score
   * @request GET:/routes/munyiq/score
   */
  export namespace get_munyiq_score {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * User Id
       * User ID to get score for (admin only)
       */
      user_id?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetMunyiqScoreData;
  }

  /**
   * @description Get statistical information about MunyIQ scores across all users. Returns percentile ranking and distribution data. Premium subscription required.
   * @tags dbtn/module:munyiq_api
   * @name get_munyiq_stats
   * @summary Get Munyiq Stats
   * @request GET:/routes/munyiq/stats
   */
  export namespace get_munyiq_stats {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetMunyiqStatsData;
  }

  /**
   * @description Admin endpoint to recalculate MunyIQ scores for all premium users
   * @tags dbtn/module:munyiq_api
   * @name recalculate_munyiq_scores
   * @summary Recalculate Munyiq Scores
   * @request POST:/routes/munyiq/recalculate
   */
  export namespace recalculate_munyiq_scores {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Admin Only
       * Admin only operation flag
       * @default true
       */
      admin_only?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = RecalculateMunyiqScoresData;
  }

  /**
   * @description Retrieve the end-to-end test report with findings and recommendations.
   * @tags Testing, dbtn/module:test_report
   * @name get_test_report
   * @summary Get Test Report
   * @request GET:/routes/test-report/
   */
  export namespace get_test_report {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestReportData;
  }

  /**
   * @description Generate a test authentication token for testing purposes This endpoint is only available in development mode and should never be exposed in production. It generates a valid JWT token that can be used for testing endpoints that require authentication.
   * @tags Testing, dbtn/module:test_auth
   * @name get_test_auth_token
   * @summary Get Test Auth Token
   * @request POST:/routes/test-auth/token
   */
  export namespace get_test_auth_token {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestAuthRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestAuthTokenData;
  }

  /**
   * @description Verify a test token from Authorization header This endpoint can be used to verify if a test token is valid and will be accepted by the authentication system. Useful for debugging auth issues.
   * @tags Testing, dbtn/module:test_auth
   * @name verify_test_token
   * @summary Verify Test Token
   * @request GET:/routes/test-auth/verify
   */
  export namespace verify_test_token {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = VerifyTestTokenData;
  }

  /**
   * @description Retrieve the comprehensive testing plan
   * @tags Testing, dbtn/module:test_plan
   * @name get_test_plan
   * @summary Get Test Plan
   * @request GET:/routes/test-plan/
   */
  export namespace get_test_plan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestPlanData;
  }

  /**
   * @description Get the specific database integration test plan
   * @tags Testing, dbtn/module:test_plan
   * @name get_database_test_plan
   * @summary Get Database Test Plan
   * @request GET:/routes/test-plan/database
   */
  export namespace get_database_test_plan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDatabaseTestPlanData;
  }

  /**
   * @description Get the specific payment processing test plan
   * @tags Testing, dbtn/module:test_plan
   * @name get_payment_test_plan
   * @summary Get Payment Test Plan
   * @request GET:/routes/test-plan/payment
   */
  export namespace get_payment_test_plan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetPaymentTestPlanData;
  }

  /**
   * @description Get a comprehensive payment processing test plan with specific payment-focused tests
   * @tags Testing, dbtn/module:test_plan
   * @name get_detailed_payment_test_plan
   * @summary Get Detailed Payment Test Plan
   * @request GET:/routes/test-plan/payment-detailed
   */
  export namespace get_detailed_payment_test_plan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDetailedPaymentTestPlanData;
  }

  /**
   * @description Get a comprehensive database integration test plan with specific database-focused tests
   * @tags Testing, dbtn/module:test_plan
   * @name get_detailed_database_test_plan
   * @summary Get Detailed Database Test Plan
   * @request GET:/routes/test-plan/database-detailed
   */
  export namespace get_detailed_database_test_plan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDetailedDatabaseTestPlanData;
  }

  /**
   * @description Get the end-to-end test plan with all test cases across areas
   * @tags Testing, dbtn/module:test_plan
   * @name get_comprehensive_e2e_test_plan
   * @summary Get Comprehensive E2E Test Plan
   * @request GET:/routes/test-plan/e2e-comprehensive
   */
  export namespace get_comprehensive_e2e_test_plan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetComprehensiveE2ETestPlanData;
  }

  /**
   * @description Generate authentication headers for testing Returns headers that can be used for testing authenticated endpoints without requiring actual authentication.
   * @tags Testing, dbtn/module:test_utilities
   * @name get_auth_headers
   * @summary Get Auth Headers
   * @request GET:/routes/test-utilities/auth-headers
   */
  export namespace get_auth_headers {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAuthHeadersData;
  }

  /**
   * @description Simulates a successful Stripe checkout without actually charging a card. This is used for testing the subscription flow in development environments. It creates a Stripe customer and subscription in TEST mode, then simulates the webhook events that would be triggered in a real checkout.
   * @tags TestingStripe, dbtn/module:test_stripe
   * @name simulate_checkout
   * @summary Simulate Checkout
   * @request POST:/routes/test-stripe/simulate-checkout
   */
  export namespace simulate_checkout {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SimulateCheckoutRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SimulateCheckoutData;
  }

  /**
   * @description Simulates a subscription event like cancellation or update. This is used for testing the webhook handling in development environments. It simulates the database updates that would happen in response to a real subscription event without needing to trigger an actual Stripe webhook.
   * @tags TestingStripe, dbtn/module:test_stripe
   * @name simulate_subscription_event
   * @summary Simulate Subscription Event
   * @request POST:/routes/test-stripe/simulate-subscription-event
   */
  export namespace simulate_subscription_event {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestEvent;
    export type RequestHeaders = {};
    export type ResponseBody = SimulateSubscriptionEventData;
  }

  /**
   * @description Get information about the current Stripe test configuration This helps test environments verify that Stripe is properly configured for testing and provides information about available test plans.
   * @tags TestingStripe, dbtn/module:test_stripe
   * @name get_stripe_test_config
   * @summary Get Stripe Test Config
   * @request GET:/routes/test-stripe/test-config
   */
  export namespace get_stripe_test_config {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetStripeTestConfigData;
  }

  /**
   * @description Get comprehensive documentation for the testing framework
   * @tags Testing, dbtn/module:test_framework
   * @name get_test_framework_documentation
   * @summary Get Test Framework Documentation
   * @request GET:/routes/test-framework/documentation
   */
  export namespace get_test_framework_documentation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestFrameworkDocumentationData;
  }

  /**
   * @description Set up a complete test environment Creates test users, games, and submissions as requested. Returns authentication headers and IDs for all created resources.
   * @tags Testing, dbtn/module:test_framework
   * @name setup_test_environment
   * @summary Setup Test Environment
   * @request POST:/routes/test-framework/setup
   */
  export namespace setup_test_environment {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestSetupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = SetupTestEnvironmentData;
  }

  /**
   * @description Create a test user with authentication token Creates a test user with the specified role and subscription tier. Returns user ID and authentication token that can be used for testing.
   * @tags Testing, dbtn/module:test_framework
   * @name create_test_user
   * @summary Create Test User
   * @request POST:/routes/test-framework/create-user
   */
  export namespace create_test_user {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestUserRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTestUserData;
  }

  /**
   * @description Check if test mode is available Returns the current mode (development or production) and whether test endpoints are available.
   * @tags Testing, dbtn/module:test_framework
   * @name get_test_mode
   * @summary Get Test Mode
   * @request GET:/routes/test-framework/test-mode
   */
  export namespace get_test_mode {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestModeData;
  }

  /**
   * @description Get example code for auth bypass in tests Returns example code snippets for bypassing authentication in tests.
   * @tags Testing, dbtn/module:test_framework
   * @name get_auth_bypass_example
   * @summary Get Auth Bypass Example
   * @request GET:/routes/test-framework/test-auth-bypass
   */
  export namespace get_auth_bypass_example {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAuthBypassExampleData;
  }

  /**
   * @description Get all components
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_components
   * @summary Get Components
   * @request GET:/routes/test-feature-map/components
   */
  export namespace get_components {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetComponentsData;
  }

  /**
   * @description Get features for a specific component
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_features_for_component
   * @summary Get Features For Component
   * @request GET:/routes/test-feature-map/features-for-component/{component_name}
   */
  export namespace get_features_for_component {
    export type RequestParams = {
      /** Component Name */
      componentName: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetFeaturesForComponentData;
  }

  /**
   * @description Get tests that verify a specific feature
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_tests_for_feature
   * @summary Get Tests For Feature
   * @request GET:/routes/test-feature-map/tests-for-feature/{feature_name}
   */
  export namespace get_tests_for_feature {
    export type RequestParams = {
      /** Feature Name */
      featureName: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestsForFeatureData;
  }

  /**
   * @description Get a specific test case
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_test_case
   * @summary Get Test Case
   * @request GET:/routes/test-feature-map/test/{test_id}
   */
  export namespace get_test_case {
    export type RequestParams = {
      /** Test Id */
      testId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestCaseData;
  }

  /**
   * @description Update an existing test case
   * @tags Testing, dbtn/module:test_feature_map
   * @name update_test_case
   * @summary Update Test Case
   * @request PUT:/routes/test-feature-map/test/{test_id}
   */
  export namespace update_test_case {
    export type RequestParams = {
      /** Test Id */
      testId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = TestCaseInput;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateTestCaseData;
  }

  /**
   * @description Delete a test case
   * @tags Testing, dbtn/module:test_feature_map
   * @name delete_test_case
   * @summary Delete Test Case
   * @request DELETE:/routes/test-feature-map/test/{test_id}
   */
  export namespace delete_test_case {
    export type RequestParams = {
      /** Test Id */
      testId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTestCaseData;
  }

  /**
   * @description Get all test cases
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_all_test_cases
   * @summary Get All Test Cases
   * @request GET:/routes/test-feature-map/tests
   */
  export namespace get_all_test_cases {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetAllTestCasesData;
  }

  /**
   * @description Create a new test case
   * @tags Testing, dbtn/module:test_feature_map
   * @name create_test_case
   * @summary Create Test Case
   * @request POST:/routes/test-feature-map/test
   */
  export namespace create_test_case {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestCaseInput;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTestCaseData;
  }

  /**
   * @description Record results from a test execution
   * @tags Testing, dbtn/module:test_feature_map
   * @name record_test_results
   * @summary Record Test Results
   * @request POST:/routes/test-feature-map/test-results
   */
  export namespace record_test_results {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestResults;
    export type RequestHeaders = {};
    export type ResponseBody = RecordTestResultsData;
  }

  /**
   * @description Create a test execution plan
   * @tags Testing, dbtn/module:test_feature_map
   * @name create_test_execution_plan
   * @summary Create Test Execution Plan
   * @request POST:/routes/test-feature-map/execution-plan
   */
  export namespace create_test_execution_plan {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestExecutionPlan;
    export type RequestHeaders = {};
    export type ResponseBody = CreateTestExecutionPlanData;
  }

  /**
   * @description Get coverage of features by tests
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_test_coverage
   * @summary Get Test Coverage
   * @request GET:/routes/test-feature-map/test-coverage
   */
  export namespace get_test_coverage {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestCoverageData;
  }

  /**
   * @description Get summary of components, features, and test coverage
   * @tags Testing, dbtn/module:test_feature_map
   * @name get_map_summary
   * @summary Get Map Summary
   * @request GET:/routes/test-feature-map/map-summary
   */
  export namespace get_map_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMapSummaryData;
  }

  /**
   * @description Get the troubleshooting guide for common test failures
   * @tags Testing, dbtn/module:test_troubleshooting
   * @name get_troubleshooting_guide2
   * @summary Get Troubleshooting Guide2
   * @request GET:/routes/test-troubleshooting/
   */
  export namespace get_troubleshooting_guide2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTroubleshootingGuide2Data;
  }

  /**
   * @description Get a specific troubleshooting guide item
   * @tags Testing, dbtn/module:test_troubleshooting
   * @name get_troubleshooting_item2
   * @summary Get Troubleshooting Item2
   * @request GET:/routes/test-troubleshooting/{item_id}
   */
  export namespace get_troubleshooting_item2 {
    export type RequestParams = {
      /** Item Id */
      itemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTroubleshootingItem2Data;
  }

  /**
   * @description Start a test run
   * @tags Testing, dbtn/module:test_runner_cli
   * @name run_tests
   * @summary Run Tests
   * @request POST:/routes/test-runner-cli/run
   */
  export namespace run_tests {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisTestRunnerCliTestRunRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RunTestsData;
  }

  /**
   * @description Get the status of a test run
   * @tags Testing, dbtn/module:test_runner_cli
   * @name get_test_run_status
   * @summary Get Test Run Status
   * @request GET:/routes/test-runner-cli/status/{run_id}
   */
  export namespace get_test_run_status {
    export type RequestParams = {
      /** Run Id */
      runId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestRunStatusData;
  }

  /**
   * @description Get the results of a test run
   * @tags Testing, dbtn/module:test_runner_cli
   * @name get_test_run_results
   * @summary Get Test Run Results
   * @request GET:/routes/test-runner-cli/results/{run_id}
   */
  export namespace get_test_run_results {
    export type RequestParams = {
      /** Run Id */
      runId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestRunResultsData;
  }

  /**
   * @description List recent test runs
   * @tags Testing, dbtn/module:test_runner_cli
   * @name list_test_runs
   * @summary List Test Runs
   * @request GET:/routes/test-runner-cli/runs
   */
  export namespace list_test_runs {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Limit
       * @min 1
       * @max 100
       * @default 10
       */
      limit?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ListTestRunsData;
  }

  /**
   * @description Run validation tests on critical fixes for MYA-83 Tests that the database fix, authentication improvements, and Stripe testing enhancements are working correctly.
   * @tags Testing, dbtn/module:test_validation
   * @name validate_fixes2
   * @summary Validate Fixes2
   * @request POST:/routes/test-validation/validate-fixes
   */
  export namespace validate_fixes2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestValidationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateFixes2Data;
  }

  /**
   * @description Get the main test documentation
   * @tags Testing, dbtn/module:test_documentation
   * @name get_test_documentation
   * @summary Get Test Documentation
   * @request GET:/routes/test-documentation/
   */
  export namespace get_test_documentation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestDocumentationData;
  }

  /**
   * @description Get the troubleshooting guide for common test failures
   * @tags Testing, dbtn/module:test_documentation
   * @name get_troubleshooting_guide
   * @summary Get Troubleshooting Guide
   * @request GET:/routes/test-documentation/troubleshooting
   */
  export namespace get_troubleshooting_guide {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTroubleshootingGuideData;
  }

  /**
   * @description Get a specific troubleshooting guide item
   * @tags Testing, dbtn/module:test_documentation
   * @name get_troubleshooting_item
   * @summary Get Troubleshooting Item
   * @request GET:/routes/test-documentation/troubleshooting/{item_id}
   */
  export namespace get_troubleshooting_item {
    export type RequestParams = {
      /** Item Id */
      itemId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTroubleshootingItemData;
  }

  /**
   * @description Get the guide for setting up the test environment
   * @tags Testing, dbtn/module:test_documentation
   * @name get_environment_setup_guide
   * @summary Get Environment Setup Guide
   * @request GET:/routes/test-documentation/environment-setup
   */
  export namespace get_environment_setup_guide {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetEnvironmentSetupGuideData;
  }

  /**
   * @description Get the guide for extending the test suite
   * @tags Testing, dbtn/module:test_documentation
   * @name get_extension_guide
   * @summary Get Extension Guide
   * @request GET:/routes/test-documentation/extension-guide
   */
  export namespace get_extension_guide {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetExtensionGuideData;
  }

  /**
   * @description Get a comprehensive end-to-end test plan
   * @tags Testing, dbtn/module:test_documentation
   * @name get_comprehensive_e2e_test_plan2
   * @summary Get Comprehensive E2E Test Plan2
   * @request GET:/routes/test-documentation/comprehensive-plan
   */
  export namespace get_comprehensive_e2e_test_plan2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetComprehensiveE2ETestPlan2Data;
  }

  /**
   * @description Test the signup process flow
   * @tags Testing, dbtn/module:testing
   * @name test_signup
   * @summary Test Signup
   * @request POST:/routes/testing/signup
   */
  export namespace test_signup {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestSignupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestSignupData;
  }

  /**
   * @description Test sending notifications to a user
   * @tags Testing, dbtn/module:testing
   * @name test_notification_delivery
   * @summary Test Notification Delivery
   * @request POST:/routes/testing/notification
   */
  export namespace test_notification_delivery {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestNotificationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestNotificationDeliveryData;
  }

  /**
   * @description Test multi-device support for a user
   * @tags Testing, dbtn/module:testing
   * @name test_multi_device
   * @summary Test Multi Device
   * @request POST:/routes/testing/multi-device
   */
  export namespace test_multi_device {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestMultiDeviceRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestMultiDeviceData;
  }

  /**
   * @description Test edge cases for notifications
   * @tags Testing, dbtn/module:testing
   * @name test_edge_cases
   * @summary Test Edge Cases
   * @request POST:/routes/testing/edge-cases
   */
  export namespace test_edge_cases {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = TestNotificationRequest;
    export type RequestHeaders = {};
    export type ResponseBody = TestEdgeCasesData;
  }

  /**
   * @description Generate a comprehensive test report
   * @tags Testing, dbtn/module:testing
   * @name generate_test_report
   * @summary Generate Test Report
   * @request GET:/routes/testing/generate-report
   */
  export namespace generate_test_report {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateTestReportData;
  }

  /**
   * @description Validate that all system components are properly configured and working
   * @tags Testing, dbtn/module:testing
   * @name validate_components
   * @summary Validate Components
   * @request POST:/routes/testing/validation
   */
  export namespace validate_components {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidateComponentsPayload;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateComponentsData;
  }

  /**
   * @description Get the production configuration checklist
   * @tags Admin, dbtn/module:production_checklist
   * @name get_production_checklist
   * @summary Get Production Checklist
   * @request GET:/routes/production-checklist/
   */
  export namespace get_production_checklist {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProductionChecklistData;
  }

  /**
   * @description Register a new beta tester with their email address
   * @tags dbtn/module:beta_signup
   * @name create_beta_signup
   * @summary Create Beta Signup
   * @request POST:/routes/beta-signup
   */
  export namespace create_beta_signup {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BetaSignupRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateBetaSignupData;
  }

  /**
   * @description Retrieves the pair of companies for the game. - In Sandbox mode (DEV) with a specific game ID set, fetches that game. - Otherwise, fetches today's scheduled game. Raises a 404 error if the required game data is not found.
   * @tags dbtn/module:predictions_api
   * @name get_daily_prediction_pair
   * @summary Get Daily Prediction Pair
   * @request GET:/routes/predictions/daily-pair
   */
  export namespace get_daily_prediction_pair {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDailyPredictionPairData;
  }

  /**
   * @description Processes the results for a given game date and exchange. 1. Fetches game details. 2. Uses yfinance to determine the winner. 3. Updates the game table with the winner. 4. Calculates market timings and prediction time taken. 5. Updates associated predictions with correctness and time. 6. Placeholder for triggering leaderboard update.
   * @tags dbtn/module:predictions_api
   * @name process_game_results
   * @summary Process Game Results
   * @request POST:/routes/predictions/process-results
   */
  export namespace process_game_results {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProcessResultsRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ProcessGameResultsData;
  }

  /**
   * @description Submits a user's prediction for the daily pair. Stores the prediction in Supabase 'predictions' table. Includes check for duplicate predictions.
   * @tags dbtn/module:predictions_api
   * @name submit_prediction
   * @summary Submit Prediction
   * @request POST:/routes/predictions/submit
   */
  export namespace submit_prediction {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = PredictionRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = SubmitPredictionData;
  }

  /**
   * @description Retrieves the next_day_clue from the most recent game record on or before today. Returns the clue if found, otherwise null.
   * @tags dbtn/module:predictions_api
   * @name get_next_game_clue
   * @summary Get Next Game Clue
   * @request GET:/routes/predictions/next-clue
   */
  export namespace get_next_game_clue {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetNextGameClueData;
  }

  /**
   * @description Send a notification to a specific user
   * @tags FCM, dbtn/module:fcm
   * @name send_notification
   * @summary Send Notification
   * @request POST:/routes/fcm/send
   */
  export namespace send_notification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = NotificationRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = SendNotificationData;
  }

  /**
   * @description Send a notification to multiple users (admin only)
   * @tags FCM, dbtn/module:fcm
   * @name admin_send_notification
   * @summary Admin Send Notification
   * @request POST:/routes/fcm/admin/send
   */
  export namespace admin_send_notification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AdminNotificationRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = AdminSendNotificationData;
  }

  /**
   * @description Send a test notification to the current user
   * @tags FCM, dbtn/module:fcm
   * @name test_notification
   * @summary Test Notification
   * @request POST:/routes/fcm/test
   */
  export namespace test_notification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TestNotificationData;
  }

  /**
   * @description Send a notification to all users with a specific subscription tier (admin only)
   * @tags FCM, dbtn/module:fcm
   * @name admin_batch_notification
   * @summary Admin Batch Notification
   * @request POST:/routes/fcm/admin/batch
   */
  export namespace admin_batch_notification {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BatchNotificationRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = AdminBatchNotificationData;
  }

  /**
   * @description Store a Firebase Cloud Messaging token for push notifications
   * @tags dbtn/module:fcm_api
   * @name register_device_fcm_token
   * @summary Register Device Fcm Token
   * @request POST:/routes/device-fcm-token
   */
  export namespace register_device_fcm_token {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = FcmTokenRequest;
    export type RequestHeaders = {};
    export type ResponseBody = RegisterDeviceFcmTokenData;
  }

  /**
   * @description List all admin role assignments Returns a list of all users with admin roles. Requires MANAGE_USERS permission.
   * @tags admin, dbtn/module:admin_permissions_api
   * @name list_admin_roles2
   * @summary List Admin Roles2
   * @request GET:/routes/admin-roles/list
   */
  export namespace list_admin_roles2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ListAdminRoles2Data;
  }

  /**
   * @description Assign an admin role to a user Args: user_id: ID of the user to assign the role to role: Role to assign ("admin" or "super_admin") Returns: Success message Requires MANAGE_USERS permission.
   * @tags admin, dbtn/module:admin_permissions_api
   * @name assign_admin_role2
   * @summary Assign Admin Role2
   * @request POST:/routes/admin-roles/assign/{user_id}
   */
  export namespace assign_admin_role2 {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {
      /** Role */
      role: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = AssignAdminRole2Data;
  }

  /**
   * @description Remove admin role from a user Args: user_id: ID of the user to remove the role from Returns: Success message Requires MANAGE_USERS permission.
   * @tags admin, dbtn/module:admin_permissions_api
   * @name remove_admin_role2
   * @summary Remove Admin Role2
   * @request DELETE:/routes/admin-roles/remove/{user_id}
   */
  export namespace remove_admin_role2 {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = RemoveAdminRole2Data;
  }

  /**
   * @description Migrate admin roles from Databutton storage to Supabase One-time migration endpoint to transfer existing role assignments. Returns: Migration results Requires MANAGE_SYSTEM permission.
   * @tags admin, dbtn/module:admin_permissions_api
   * @name migrate_roles2
   * @summary Migrate Roles2
   * @request POST:/routes/admin-roles/migrate
   */
  export namespace migrate_roles2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateRoles2Data;
  }

  /**
   * @description Accepts a CSV file upload containing daily game matchup data and a target table name. Parses the CSV, validates each row against the GameData model, and upserts valid records into the specified Supabase table (ASX_GAMES or NYSE_GAMES). Expected CSV Columns (matching GameData fields, using alias 'date'): - exchange - date (YYYY-MM-DD) - company_a_ticker - company_a_name - company_b_ticker - company_b_name - sector - reasoning - submitted_by_player_id (optional, UUID) - next_day_clue (optional) - status (optional, defaults to 'scheduled')
   * @tags Admin, dbtn/module:admin_api
   * @name upload_game_data_csv
   * @summary Upload Game Data Csv
   * @request POST:/routes/admin/upload-game-data
   */
  export namespace upload_game_data_csv {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = BodyUploadGameDataCsv;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = UploadGameDataCsvData;
  }

  /**
   * @description Create a new game manually with the provided data.
   * @tags Admin, dbtn/module:admin_api
   * @name create_game
   * @summary Create Game
   * @request POST:/routes/admin/games
   */
  export namespace create_game {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = GameCreateRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = CreateGameData;
  }

  /**
   * @description List games with optional filtering by exchange, date range, and status.
   * @tags Admin, dbtn/module:admin_api
   * @name list_games
   * @summary List Games
   * @request GET:/routes/admin/games
   */
  export namespace list_games {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ListGamesData;
  }

  /**
   * @description Get a specific game by its pair_id.
   * @tags Admin, dbtn/module:admin_api
   * @name get_game
   * @summary Get Game
   * @request GET:/routes/admin/games/{pair_id}
   */
  export namespace get_game {
    export type RequestParams = {
      /**
       * Pair Id
       * The unique ID of the game
       */
      pairId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetGameData;
  }

  /**
   * @description Update a specific game by its pair_id.
   * @tags Admin, dbtn/module:admin_api
   * @name update_game
   * @summary Update Game
   * @request PUT:/routes/admin/games/{pair_id}
   */
  export namespace update_game {
    export type RequestParams = {
      /**
       * Pair Id
       * The unique ID of the game
       */
      pairId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = GameUpdateRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = UpdateGameData;
  }

  /**
   * @description Delete a specific game by its pair_id.
   * @tags Admin, dbtn/module:admin_api
   * @name delete_game
   * @summary Delete Game
   * @request DELETE:/routes/admin/games/{pair_id}
   */
  export namespace delete_game {
    export type RequestParams = {
      /**
       * Pair Id
       * The unique ID of the game
       */
      pairId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = DeleteGameData;
  }

  /**
   * @description Allow users to submit game ideas for admin review.
   * @tags Admin, dbtn/module:admin_api
   * @name create_game_submission
   * @summary Create Game Submission
   * @request POST:/routes/admin/submissions
   */
  export namespace create_game_submission {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SubmissionCreateRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = CreateGameSubmissionData;
  }

  /**
   * @description List all game submissions with optional filtering by status.
   * @tags Admin, dbtn/module:admin_api
   * @name list_game_submissions
   * @summary List Game Submissions
   * @request GET:/routes/admin/submissions
   */
  export namespace list_game_submissions {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Status
       * Filter by status: pending_review, approved, rejected
       */
      status?: string | null;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ListGameSubmissionsData;
  }

  /**
   * @description Update a game submission status (approve/reject) and optionally schedule it.
   * @tags Admin, dbtn/module:admin_api
   * @name update_game_submission
   * @summary Update Game Submission
   * @request PUT:/routes/admin/submissions/{submission_id}
   */
  export namespace update_game_submission {
    export type RequestParams = {
      /**
       * Submission Id
       * The unique ID of the submission
       */
      submissionId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = SubmissionUpdateRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = UpdateGameSubmissionData;
  }

  /**
   * @description List all users with administrative roles. DEPRECATED: Use /admin-roles/list instead.
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name list_admin_roles
   * @summary List Admin Roles
   * @request GET:/routes/admin/roles
   * @deprecated
   */
  export namespace list_admin_roles {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ListAdminRolesData;
  }

  /**
   * @description Assign an administrative role to a user. DEPRECATED: Use /admin-roles/assign/{user_id} instead.
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name assign_admin_role
   * @summary Assign Admin Role
   * @request POST:/routes/admin/roles/{user_id}
   * @deprecated
   */
  export namespace assign_admin_role {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = AdminRoleRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = AssignAdminRoleData;
  }

  /**
   * @description Remove administrative role from a user. DEPRECATED: Use /admin-roles/remove/{user_id} instead.
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name remove_admin_role
   * @summary Remove Admin Role
   * @request DELETE:/routes/admin/roles/{user_id}
   * @deprecated
   */
  export namespace remove_admin_role {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = RemoveAdminRoleData;
  }

  /**
   * @description Migrate admin roles from Databutton storage to Supabase. This endpoint triggers the one-time migration of admin roles from Databutton storage to the Supabase admin_roles table.
   * @tags Admin, Admin, dbtn/module:admin_api
   * @name migrate_roles
   * @summary Migrate Roles
   * @request POST:/routes/admin/migrate-roles
   */
  export namespace migrate_roles {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateRolesData;
  }

  /**
   * @description List all users with optional filtering.
   * @tags Admin, dbtn/module:admin_api
   * @name list_users
   * @summary List Users
   * @request GET:/routes/admin/users
   */
  export namespace list_users {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ListUsersData;
  }

  /**
   * @description Update a user's admin status or active status.
   * @tags Admin, dbtn/module:admin_api
   * @name update_user_status
   * @summary Update User Status
   * @request PUT:/routes/admin/users/{user_id}
   */
  export namespace update_user_status {
    export type RequestParams = {
      /** User Id */
      userId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = UserStatusUpdateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = UpdateUserStatusData;
  }

  /**
   * @description Migrates sandbox settings from Databutton storage to Supabase.
   * @tags dbtn/module:sandbox_control_api
   * @name migrate_sandbox_settings
   * @summary Migrate Sandbox Settings
   * @request POST:/routes/admin/migrate-sandbox-settings
   */
  export namespace migrate_sandbox_settings {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateSandboxSettingsData;
  }

  /**
   * @description Returns the current sandbox mode status and the configured game ID.
   * @tags dbtn/module:sandbox_control_api
   * @name get_sandbox_status
   * @summary Get Sandbox Status
   * @request GET:/routes/sandbox/status
   */
  export namespace get_sandbox_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetSandboxStatusData;
  }

  /**
   * @description Sets or clears the game ID to be used for sandbox testing.
   * @tags dbtn/module:sandbox_control_api
   * @name set_sandbox_game
   * @summary Set Sandbox Game
   * @request POST:/routes/sandbox/set-game
   */
  export namespace set_sandbox_game {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = SetGameRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = SetSandboxGameData;
  }

  /**
   * @description Manually sets the status of the current sandbox game to 'closed'. Only works in DEV mode.
   * @tags dbtn/module:sandbox_control_api
   * @name trigger_close_predictions
   * @summary Trigger Close Predictions
   * @request POST:/routes/sandbox/trigger-close-predictions
   */
  export namespace trigger_close_predictions {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TriggerClosePredictionsData;
  }

  /**
   * @description Manually triggers the process_game_results logic for the current sandbox game. Only works in DEV mode.
   * @tags dbtn/module:sandbox_control_api
   * @name trigger_process_results
   * @summary Trigger Process Results
   * @request POST:/routes/sandbox/trigger-process-results
   */
  export namespace trigger_process_results {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TriggerProcessResultsData;
  }

  /**
   * @description (Simulated) Manually triggers the leaderboard update logic. Only works in DEV mode.
   * @tags dbtn/module:sandbox_control_api
   * @name trigger_leaderboard_update
   * @summary Trigger Leaderboard Update
   * @request POST:/routes/sandbox/trigger-leaderboard-update
   */
  export namespace trigger_leaderboard_update {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TriggerLeaderboardUpdateData;
  }

  /**
   * @description Get the current status of the cron job
   * @tags cron, dbtn/module:cron
   * @name get_cron_status
   * @summary Get Cron Status
   * @request GET:/routes/cron/status
   */
  export namespace get_cron_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetCronStatusData;
  }

  /**
   * @description Enable the cron job
   * @tags cron, dbtn/module:cron
   * @name enable_cron
   * @summary Enable Cron
   * @request POST:/routes/cron/enable
   */
  export namespace enable_cron {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = EnableCronData;
  }

  /**
   * @description Disable the cron job
   * @tags cron, dbtn/module:cron
   * @name disable_cron
   * @summary Disable Cron
   * @request POST:/routes/cron/disable
   */
  export namespace disable_cron {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = DisableCronData;
  }

  /**
   * @description Set the interval for the cron job
   * @tags cron, dbtn/module:cron
   * @name set_cron_interval
   * @summary Set Cron Interval
   * @request POST:/routes/cron/set-interval
   */
  export namespace set_cron_interval {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Interval Minutes */
      interval_minutes: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = SetCronIntervalData;
  }

  /**
   * @description Trigger the cron job to run all scheduled tasks
   * @tags cron, dbtn/module:cron
   * @name trigger_cron
   * @summary Trigger Cron
   * @request POST:/routes/cron/trigger
   */
  export namespace trigger_cron {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Run Now
       * @default false
       */
      run_now?: boolean;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TriggerCronData;
  }

  /**
   * @description Manually trigger the cron job to run immediately
   * @tags cron, dbtn/module:cron
   * @name run_cron_now
   * @summary Run Cron Now
   * @request POST:/routes/cron/run-now
   */
  export namespace run_cron_now {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = RunCronNowData;
  }

  /**
   * @description Migrate cron configuration from Databutton to Supabase
   * @tags cron, dbtn/module:cron
   * @name migrate_cron_to_supabase
   * @summary Migrate Cron To Supabase
   * @request POST:/routes/cron/migrate-to-supabase
   */
  export namespace migrate_cron_to_supabase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateCronToSupabaseData;
  }

  /**
   * @description Toggle a task's active status
   * @tags dbtn/module:toggle_task_active
   * @name toggle_task_active2
   * @summary Toggle Task Active2
   * @request POST:/routes/toggle-task-active2
   */
  export namespace toggle_task_active2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ToggleTaskRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ToggleTaskActive2Data;
  }

  /**
   * @description Toggle a task's active status (Main scheduler version)
   * @tags scheduler, dbtn/module:scheduler
   * @name toggle_task_active
   * @summary Toggle Task Active
   * @request POST:/routes/scheduler/toggle-task-active
   */
  export namespace toggle_task_active {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ToggleTaskRequest;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ToggleTaskActiveData;
  }

  /**
   * @description Migrate scheduler config from Databutton to Supabase
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_scheduler_to_supabase
   * @summary Migrate Scheduler To Supabase
   * @request POST:/routes/scheduler/migrate-to-supabase
   */
  export namespace migrate_scheduler_to_supabase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateSchedulerToSupabaseData;
  }

  /**
   * @description Migrate scheduler errors from Databutton to Supabase
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_scheduler_errors_to_supabase
   * @summary Migrate Scheduler Errors To Supabase
   * @request POST:/routes/scheduler/migrate-errors-to-supabase
   */
  export namespace migrate_scheduler_errors_to_supabase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateSchedulerErrorsToSupabaseData;
  }

  /**
   * @description Migrate cron config from Databutton to Supabase (migrated to cron module)
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_cron_to_supabase2
   * @summary Migrate Cron To Supabase2
   * @request POST:/routes/scheduler/migrate-cron-to-supabase2
   */
  export namespace migrate_cron_to_supabase2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateCronToSupabase2Data;
  }

  /**
   * @description Get comprehensive documentation for the scheduler system
   * @tags scheduler, dbtn/module:scheduler
   * @name get_documentation2
   * @summary Get Documentation2
   * @request GET:/routes/scheduler/documentation2
   */
  export namespace get_documentation2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetDocumentation2Data;
  }

  /**
   * @description Get the current status of the scheduler
   * @tags scheduler, dbtn/module:scheduler
   * @name get_scheduler_status
   * @summary Get Scheduler Status
   * @request GET:/routes/scheduler/status
   */
  export namespace get_scheduler_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetSchedulerStatusData;
  }

  /**
   * @description Initialize the scheduler with default tasks
   * @tags scheduler, dbtn/module:scheduler
   * @name initialize_scheduler_endpoint
   * @summary Initialize Scheduler Endpoint
   * @request POST:/routes/scheduler/initialize
   */
  export namespace initialize_scheduler_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = InitializeSchedulerEndpointData;
  }

  /**
   * @description Enable the scheduler
   * @tags scheduler, dbtn/module:scheduler
   * @name enable_scheduler
   * @summary Enable Scheduler
   * @request POST:/routes/scheduler/enable
   */
  export namespace enable_scheduler {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = EnableSchedulerData;
  }

  /**
   * @description Disable the scheduler
   * @tags scheduler, dbtn/module:scheduler
   * @name disable_scheduler
   * @summary Disable Scheduler
   * @request POST:/routes/scheduler/disable
   */
  export namespace disable_scheduler {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = DisableSchedulerData;
  }

  /**
   * @description Manually run a specific scheduled task
   * @tags scheduler, dbtn/module:scheduler
   * @name run_task
   * @summary Run Task
   * @request POST:/routes/scheduler/run-task/{task_id}
   */
  export namespace run_task {
    export type RequestParams = {
      /** Task Id */
      taskId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = RunTaskData;
  }

  /**
   * @description Manually run all active scheduled tasks
   * @tags scheduler, dbtn/module:scheduler
   * @name run_all_tasks
   * @summary Run All Tasks
   * @request POST:/routes/scheduler/run-all
   */
  export namespace run_all_tasks {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = RunAllTasksData;
  }

  /**
   * @description Toggle whether the scheduler respects sandbox mode
   * @tags scheduler, dbtn/module:scheduler
   * @name toggle_sandbox_mode
   * @summary Toggle Sandbox Mode
   * @request POST:/routes/scheduler/toggle-sandbox-mode
   */
  export namespace toggle_sandbox_mode {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ToggleSandboxModeData;
  }

  /**
   * @description Trigger a check of scheduled tasks
   * @tags scheduler, dbtn/module:scheduler
   * @name trigger_scheduled_tasks_check
   * @summary Trigger Scheduled Tasks Check
   * @request POST:/routes/scheduler/check-scheduled-tasks
   */
  export namespace trigger_scheduled_tasks_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TriggerScheduledTasksCheckData;
  }

  /**
   * @description Get all scheduler error logs from Supabase
   * @tags scheduler, dbtn/module:scheduler
   * @name get_scheduler_errors
   * @summary Get Scheduler Errors
   * @request GET:/routes/scheduler/errors
   */
  export namespace get_scheduler_errors {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetSchedulerErrorsData;
  }

  /**
   * @description Mark all scheduler error logs as resolved in Supabase
   * @tags scheduler, dbtn/module:scheduler
   * @name clear_scheduler_errors
   * @summary Clear Scheduler Errors
   * @request POST:/routes/scheduler/clear-errors
   */
  export namespace clear_scheduler_errors {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = ClearSchedulerErrorsData;
  }

  /**
   * @description Migrate scheduler configuration and errors from Databutton to Supabase
   * @tags scheduler, dbtn/module:scheduler
   * @name migrate_scheduler_to_supabase2
   * @summary Migrate Scheduler To Supabase2
   * @request POST:/routes/scheduler/migrate-scheduler-to-supabase
   */
  export namespace migrate_scheduler_to_supabase2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateSchedulerToSupabase2Data;
  }

  /**
   * @description Test the process_results functionality with a specific date
   * @tags scheduler, dbtn/module:scheduler
   * @name test_process_results
   * @summary Test Process Results
   * @request POST:/routes/scheduler/test/process-results
   */
  export namespace test_process_results {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Exchange */
      exchange: string;
      /** Target Date */
      target_date?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TestProcessResultsData;
  }

  /**
   * @description Test the generate_games functionality
   * @tags scheduler, dbtn/module:scheduler
   * @name test_generate_games
   * @summary Test Generate Games
   * @request POST:/routes/scheduler/test/generate-games
   */
  export namespace test_generate_games {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Exchange */
      exchange: string;
      /**
       * Days Ahead
       * @default 1
       */
      days_ahead?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TestGenerateGamesData;
  }

  /**
   * @description Test the update_clue functionality with a specific date
   * @tags scheduler, dbtn/module:scheduler
   * @name test_update_clue
   * @summary Test Update Clue
   * @request POST:/routes/scheduler/test/update-clue
   */
  export namespace test_update_clue {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Exchange */
      exchange: string;
      /** Target Date */
      target_date?: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TestUpdateClueData;
  }

  /**
   * @description Test the full scheduler cycle (process results, generate games, update clue)
   * @tags scheduler, dbtn/module:scheduler
   * @name test_full_scheduler_cycle
   * @summary Test Full Scheduler Cycle
   * @request POST:/routes/scheduler/test/full-cycle
   */
  export namespace test_full_scheduler_cycle {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Exchange */
      exchange: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = TestFullSchedulerCycleData;
  }

  /**
   * @description Clean up old sandbox test data while preserving recent entries
   * @tags scheduler, dbtn/module:scheduler
   * @name cleanup_sandbox_test_data
   * @summary Cleanup Sandbox Test Data
   * @request POST:/routes/scheduler/test/cleanup-sandbox-data
   */
  export namespace cleanup_sandbox_test_data {
    export type RequestParams = {};
    export type RequestQuery = {
      /**
       * Days To Keep
       * @default 2
       */
      days_to_keep?: number;
    };
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = CleanupSandboxTestDataData;
  }

  /**
   * @description Get SQL and instructions for migrating scheduler and cron to Supabase
   * @tags dbtn/module:migration_docs
   * @name get_migration_docs
   * @summary Get Migration Docs
   * @request GET:/routes/get-migration-docs
   */
  export namespace get_migration_docs {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = GetMigrationDocsData;
  }

  /**
   * @description Discover companies from specified exchange with optional filtering
   * @tags dbtn/module:company_discovery
   * @name discover_companies_endpoint
   * @summary Discover Companies Endpoint
   * @request GET:/routes/companies/discover
   */
  export namespace discover_companies_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DiscoverCompaniesEndpointData;
  }

  /**
   * @description Generate a pair of companies from the same sector for comparison
   * @tags dbtn/module:company_discovery
   * @name generate_company_pair_endpoint
   * @summary Generate Company Pair Endpoint
   * @request GET:/routes/companies/pair/generate
   */
  export namespace generate_company_pair_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateCompanyPairEndpointData;
  }

  /**
   * @description Get the trading calendar for a specific exchange
   * @tags dbtn/module:company_discovery
   * @name get_exchange_calendar_endpoint
   * @summary Get Exchange Calendar Endpoint
   * @request GET:/routes/exchange/calendar
   */
  export namespace get_exchange_calendar_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetExchangeCalendarEndpointData;
  }

  /**
   * @description Get the next trading day for a specific exchange
   * @tags dbtn/module:company_discovery
   * @name get_next_trading_day_endpoint
   * @summary Get Next Trading Day Endpoint
   * @request GET:/routes/exchange/next-trading-day
   */
  export namespace get_next_trading_day_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {
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
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetNextTradingDayEndpointData;
  }

  /**
   * @description Test endpoint for company discovery module
   * @tags dbtn/module:company_discovery
   * @name test_company_discovery
   * @summary Test Company Discovery
   * @request GET:/routes/test-company-discovery
   */
  export namespace test_company_discovery {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestCompanyDiscoveryData;
  }

  /**
   * @description Migrate company cache and exchange calendars from Databutton to Supabase
   * @tags dbtn/module:company_discovery
   * @name migrate_company_cache_to_supabase
   * @summary Migrate Company Cache To Supabase
   * @request POST:/routes/company-cache/migrate
   */
  export namespace migrate_company_cache_to_supabase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Authorization */
      authorization?: string | null;
    };
    export type ResponseBody = MigrateCompanyCacheToSupabaseData;
  }

  /**
   * @description Test endpoint for migrating company cache to Supabase (no auth required)
   * @tags dbtn/module:company_discovery
   * @name test_migrate_company_cache_to_supabase
   * @summary Test Migrate Company Cache To Supabase
   * @request GET:/routes/test/migrate-company-cache
   */
  export namespace test_migrate_company_cache_to_supabase {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = TestMigrateCompanyCacheToSupabaseData;
  }

  /**
   * @description Create required tables in Supabase for test storage
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_test_storage_tables
   * @summary Migrate Test Storage Tables
   * @request POST:/routes/test-storage/migrate-tables
   */
  export namespace migrate_test_storage_tables {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateTestStorageTablesData;
  }

  /**
   * @description Migrate existing test results from Databutton storage to Supabase
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_test_results
   * @summary Migrate Test Results
   * @request POST:/routes/test-storage/migrate-test-results
   */
  export namespace migrate_test_results {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateTestResultsData;
  }

  /**
   * @description Migrate existing validation results from Databutton storage to Supabase
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_validation_results
   * @summary Migrate Validation Results
   * @request POST:/routes/test-storage/migrate-validation-results
   */
  export namespace migrate_validation_results {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateValidationResultsData;
  }

  /**
   * @description Migrate existing coverage reports from Databutton storage to Supabase
   * @tags Testing, dbtn/module:test_storage
   * @name migrate_coverage_reports
   * @summary Migrate Coverage Reports
   * @request POST:/routes/test-storage/migrate-coverage-reports
   */
  export namespace migrate_coverage_reports {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateCoverageReportsData;
  }

  /**
   * @description Get documentation on the migration process
   * @tags Testing, dbtn/module:test_migration
   * @name get_migration_docs2
   * @summary Get Migration Docs2
   * @request GET:/routes/test-migration/documentation
   */
  export namespace get_migration_docs2 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMigrationDocs2Data;
  }

  /**
   * @description Create required tables in Supabase for test storage
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_test_storage_tables_endpoint
   * @summary Migrate Test Storage Tables Endpoint
   * @request POST:/routes/test-migration/storage-tables
   */
  export namespace migrate_test_storage_tables_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateTestStorageTablesEndpointData;
  }

  /**
   * @description Migrate existing test results from Databutton storage to Supabase
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_test_results_endpoint
   * @summary Migrate Test Results Endpoint
   * @request POST:/routes/test-migration/test-results
   */
  export namespace migrate_test_results_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateTestResultsEndpointData;
  }

  /**
   * @description Migrate existing validation results from Databutton storage to Supabase
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_validation_results_endpoint
   * @summary Migrate Validation Results Endpoint
   * @request POST:/routes/test-migration/validation-results
   */
  export namespace migrate_validation_results_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateValidationResultsEndpointData;
  }

  /**
   * @description Migrate existing coverage reports from Databutton storage to Supabase
   * @tags Testing, dbtn/module:test_migration
   * @name migrate_coverage_reports_endpoint
   * @summary Migrate Coverage Reports Endpoint
   * @request POST:/routes/test-migration/coverage-reports
   */
  export namespace migrate_coverage_reports_endpoint {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MigrateCoverageReportsEndpointData;
  }

  /**
   * @description Start a new test run
   * @tags Testing, dbtn/module:test_runner
   * @name start_test_run
   * @summary Start Test Run
   * @request POST:/routes/test-runner/run
   */
  export namespace start_test_run {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = AppApisTestRunnerTestRunRequest;
    export type RequestHeaders = {};
    export type ResponseBody = StartTestRunData;
  }

  /**
   * @description Get the status of a test run
   * @tags Testing, dbtn/module:test_runner
   * @name get_test_status
   * @summary Get Test Status
   * @request GET:/routes/test-runner/status/{run_id}
   */
  export namespace get_test_status {
    export type RequestParams = {
      /** Run Id */
      runId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestStatusData;
  }

  /**
   * @description Get the detailed results of a test run
   * @tags Testing, dbtn/module:test_runner
   * @name get_test_results
   * @summary Get Test Results
   * @request GET:/routes/test-runner/results/{run_id}
   */
  export namespace get_test_results {
    export type RequestParams = {
      /** Run Id */
      runId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTestResultsData;
  }

  /**
   * @description Delete a test run and its results
   * @tags Testing, dbtn/module:test_runner
   * @name delete_test_run
   * @summary Delete Test Run
   * @request DELETE:/routes/test-runner/run/{run_id}
   */
  export namespace delete_test_run {
    export type RequestParams = {
      /** Run Id */
      runId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DeleteTestRunData;
  }

  /**
   * @description Health check endpoint for the test runner
   * @tags Testing, dbtn/module:test_runner
   * @name health_check
   * @summary Health Check
   * @request GET:/routes/test-runner/health
   */
  export namespace health_check {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = HealthCheckData;
  }

  /**
   * @description Generate a test coverage report
   * @tags Testing, dbtn/module:test_coverage
   * @name generate_coverage_report
   * @summary Generate Coverage Report
   * @request POST:/routes/test-coverage/generate
   */
  export namespace generate_coverage_report {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CoverageReportRequest;
    export type RequestHeaders = {};
    export type ResponseBody = GenerateCoverageReportData;
  }

  /**
   * @description Get a specific coverage report by ID
   * @tags Testing, dbtn/module:test_coverage
   * @name get_coverage_report
   * @summary Get Coverage Report
   * @request GET:/routes/test-coverage/report/{report_id}
   */
  export namespace get_coverage_report {
    export type RequestParams = {
      /** Report Id */
      reportId: string;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCoverageReportData;
  }

  /**
   * @description Get the latest test coverage information
   * @tags Testing, dbtn/module:test_coverage
   * @name get_latest_coverage
   * @summary Get Latest Coverage
   * @request GET:/routes/test-coverage/latest
   */
  export namespace get_latest_coverage {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetLatestCoverageData;
  }

  /**
   * @description Get features that are missing test coverage
   * @tags Testing, dbtn/module:test_coverage
   * @name get_missing_features
   * @summary Get Missing Features
   * @request GET:/routes/test-coverage/missing-features
   */
  export namespace get_missing_features {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMissingFeaturesData;
  }

  /**
   * @description Mark a feature as covered by tests
   * @tags Testing, dbtn/module:test_coverage
   * @name mark_feature_covered
   * @summary Mark Feature Covered
   * @request PUT:/routes/test-coverage/mark-covered
   */
  export namespace mark_feature_covered {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Component */
      component: string;
      /** Feature */
      feature: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = MarkFeatureCoveredData;
  }

  /**
   * @description Get a summary of test coverage for dashboard display
   * @tags Testing, dbtn/module:test_coverage
   * @name get_coverage_summary
   * @summary Get Coverage Summary
   * @request GET:/routes/test-coverage/summary
   */
  export namespace get_coverage_summary {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetCoverageSummaryData;
  }

  /**
   * @description Validate that all system components are properly configured and working
   * @tags Testing, dbtn/module:validation
   * @name validate_fixes
   * @summary Validate Fixes
   * @request POST:/routes/validation/
   */
  export namespace validate_fixes {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ValidateFixesPayload;
    export type RequestHeaders = {};
    export type ResponseBody = ValidateFixesData;
  }

  /**
   * @description Get documentation on development rules
   * @tags dbtn/module:documentation
   * @name get_development_rules
   * @summary Get Development Rules
   * @request GET:/routes/rules
   */
  export namespace get_development_rules {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetDevelopmentRulesData;
  }

  /**
   * @description Get documentation on technical constraints
   * @tags dbtn/module:documentation
   * @name get_technical_constraints
   * @summary Get Technical Constraints
   * @request GET:/routes/constraints
   */
  export namespace get_technical_constraints {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetTechnicalConstraintsData;
  }

  /**
   * @description Get documentation on how to migrate storage to Supabase
   * @tags dbtn/module:documentation
   * @name get_migration_docs22
   * @summary Get Migration Docs2
   * @request GET:/routes/migration-docs2
   * @originalName get_migration_docs2
   * @duplicate
   */
  export namespace get_migration_docs22 {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetMigrationDocs22Data;
  }

  /**
   * @description Returns comprehensive documentation about the subscription flow for users
   * @tags dbtn/module:documentation
   * @name get_subscription_documentation
   * @summary Get Subscription Documentation
   * @request GET:/routes/subscription-flow
   */
  export namespace get_subscription_documentation {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetSubscriptionDocumentationData;
  }

  /**
   * @description Creates a Stripe Checkout Session for the selected price ID and user.
   * @tags dbtn/module:stripe_api
   * @name create_checkout_session
   * @summary Create Checkout Session
   * @request POST:/routes/create-checkout-session
   */
  export namespace create_checkout_session {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = CreateCheckoutSessionRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateCheckoutSessionData;
  }

  /**
   * @description Handles incoming webhook events from Stripe.
   * @tags dbtn/module:stripe_api
   * @name stripe_webhook
   * @summary Stripe Webhook
   * @request POST:/routes/stripe-webhook
   */
  export namespace stripe_webhook {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {
      /** Stripe-Signature */
      "stripe-signature": string;
    };
    export type ResponseBody = StripeWebhookData;
  }

  /**
   * @description Admin endpoint to manually update a user's subscription tier. This is useful for fixing subscription tiers that were not properly updated. Args: user_id: The Supabase user ID tier: The subscription tier (free, pro, premium)
   * @tags Admin, dbtn/module:stripe_api
   * @name admin_fix_subscription
   * @summary Admin Fix Subscription
   * @request POST:/routes/admin/fix-subscription
   */
  export namespace admin_fix_subscription {
    export type RequestParams = {};
    export type RequestQuery = {
      /** User Id */
      user_id: string;
      /** Tier */
      tier: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = AdminFixSubscriptionData;
  }
}
